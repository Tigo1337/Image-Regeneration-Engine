import { getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { sql } from 'drizzle-orm';

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async reportUsage(subscriptionItemId: string, quantity: number) {
    const stripe = await getUncachableStripeClient();
    return await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
      quantity,
      action: 'increment',
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  async reportMeterEvent(customerId: string, qualityTier: string, quantity: number = 1) {
    const stripe = await getUncachableStripeClient();
    
    // Map quality tier to meter event name - handle all variations
    const normalizedTier = qualityTier.toLowerCase().trim();
    let eventName = 'standard_image_generation';
    
    if (normalizedTier.includes('high') || normalizedTier.includes('2k')) {
      eventName = 'high_fidelity_image_generation';
    } else if (normalizedTier.includes('ultra') || normalizedTier.includes('4k')) {
      eventName = 'ultra_image_generation';
    }
    
    try {
      const meterEvent = await (stripe as any).billing.meterEvents.create({
        event_name: eventName,
        payload: {
          value: quantity.toString(),
          stripe_customer_id: customerId,
        },
      });
      console.log(`Reported meter event: ${eventName} for customer ${customerId}`);
      return meterEvent;
    } catch (error) {
      console.error('Error reporting meter event:', error);
      throw error;
    }
  }

  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true) {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = ${active}
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    // Use Stripe API directly to get full subscription with items
    try {
      const stripe = await getUncachableStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price']
      });
      return subscription;
    } catch (error) {
      console.error('Error fetching subscription from Stripe:', error);
      // Fallback to local database
      const result = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
      );
      return result.rows[0] || null;
    }
  }

  async getSubscriptionItems(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscription_items WHERE subscription = ${subscriptionId}`
    );
    return result.rows;
  }

  async getActiveSubscriptionForCustomer(customerId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE customer = ${customerId} AND status = 'active' LIMIT 1`
    );
    return result.rows[0] || null;
  }
}

export const stripeService = new StripeService();
