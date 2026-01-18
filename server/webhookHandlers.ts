import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // First, let stripe-replit-sync handle the database sync
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Then handle application-specific logic for subscription events
    const stripe = await getUncachableStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      try {
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        await this.handleEvent(event);
      } catch (err: any) {
        console.warn('Webhook event construction failed (non-critical):', err.message);
      }
    }
  }

  private static async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionChange(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
    }
  }

  private static async handleSubscriptionChange(subscription: any): Promise<void> {
    try {
      const customerId = subscription.customer;
      const subscriptionId = subscription.id;

      // Find user by customer ID and update their subscription ID
      // The customer metadata should contain the userId set during checkout
      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.retrieve(customerId as string);
      
      if ((customer as any).deleted) return;
      
      const userId = (customer as any).metadata?.userId;
      if (userId) {
        await storage.updateUserStripeInfo(userId, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId
        });
        console.log(`Updated user ${userId} with subscription ${subscriptionId}`);
      }
    } catch (error) {
      console.error('Error handling subscription change:', error);
    }
  }

  private static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    try {
      const customerId = subscription.customer;
      
      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.retrieve(customerId as string);
      
      if ((customer as any).deleted) return;
      
      const userId = (customer as any).metadata?.userId;
      if (userId) {
        await storage.updateUserStripeInfo(userId, {
          stripeSubscriptionId: undefined
        });
        console.log(`Removed subscription for user ${userId}`);
      }
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }

  private static async handleCheckoutCompleted(session: any): Promise<void> {
    try {
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!customerId || !subscriptionId) return;

      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.retrieve(customerId as string);
      
      if ((customer as any).deleted) return;
      
      const userId = (customer as any).metadata?.userId;
      if (userId) {
        await storage.updateUserStripeInfo(userId, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId
        });
        console.log(`Checkout completed: Updated user ${userId} with subscription ${subscriptionId}`);
      }
    } catch (error) {
      console.error('Error handling checkout completed:', error);
    }
  }
}
