import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Force Creating Stripe products and prices...');
  
  const stripe = await getUncachableStripeClient();

  // 1. Create the subscription product
  const subscriptionProduct = await stripe.products.create({
    name: 'RoomReimagine Pro',
    description: 'Monthly subscription for RoomReimagine AI - includes access to all design features',
    metadata: {
      type: 'subscription',
    }
  });
  console.log(`Created subscription product: ${subscriptionProduct.id}`);

  // Create monthly subscription price ($29/month)
  const monthlyPrice = await stripe.prices.create({
    product: subscriptionProduct.id,
    unit_amount: 2900, // $29.00/month
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      type: 'subscription',
    }
  });
  console.log(`Created monthly price: ${monthlyPrice.id} ($29.00/month)`);

  // 2. Create usage-based product for image generation
  const usageProduct = await stripe.products.create({
    name: 'RoomReimagine Image Generation',
    description: 'Pay-per-use image generation credits',
    metadata: {
      type: 'usage',
    }
  });
  console.log(`Created usage product: ${usageProduct.id}`);

  // 3. Find or Create Billing Meters for each quality tier
  console.log('\nConfiguring billing meters...');
  
  const getOrCreateMeter = async (name: string, eventName: string) => {
    try {
      // Check for existing meters first
      const meters = await (stripe as any).billing.meters.list({ limit: 100 });
      const existing = meters.data.find((m: any) => m.event_name === eventName && m.status === 'active');
      
      if (existing) {
        console.log(`Found existing meter: ${existing.id} for ${eventName}`);
        return existing;
      }

      const meter = await (stripe as any).billing.meters.create({
        display_name: name,
        event_name: eventName,
        default_aggregation: { formula: 'sum' },
        customer_mapping: {
          type: 'by_id',
          event_payload_key: 'stripe_customer_id',
        },
      });
      console.log(`Created new meter: ${meter.id} for ${eventName}`);
      return meter;
    } catch (error: any) {
      console.error(`Error configuring meter for ${eventName}:`, error.message);
      throw error;
    }
  };

  const standardMeter = await getOrCreateMeter('Standard Quality Images', 'standard_image_generation');
  const highFidelityMeter = await getOrCreateMeter('High Fidelity (2K) Images', 'high_fidelity_image_generation');
  const ultraMeter = await getOrCreateMeter('Ultra (4K) Images', 'ultra_image_generation');

  // 4. Create metered prices linked to meters
  console.log('\nCreating metered prices...');
  
  const standardPrice = await stripe.prices.create({
    product: usageProduct.id,
    currency: 'usd',
    billing_scheme: 'per_unit',
    unit_amount: 20, // $0.20 per image
    recurring: {
      interval: 'month',
      usage_type: 'metered',
      meter: standardMeter.id,
    } as any,
    metadata: {
      quality: 'Standard',
      meter_event_name: 'standard_image_generation',
    }
  });
  console.log(`Created Standard quality price: ${standardPrice.id} ($0.20/image)`);

  const highFidelityPrice = await stripe.prices.create({
    product: usageProduct.id,
    currency: 'usd',
    billing_scheme: 'per_unit',
    unit_amount: 35, // $0.35 per image
    recurring: {
      interval: 'month',
      usage_type: 'metered',
      meter: highFidelityMeter.id,
    } as any,
    metadata: {
      quality: 'High Fidelity (2K)',
      meter_event_name: 'high_fidelity_image_generation',
    }
  });
  console.log(`Created High Fidelity price: ${highFidelityPrice.id} ($0.35/image)`);

  const ultraPrice = await stripe.prices.create({
    product: usageProduct.id,
    currency: 'usd',
    billing_scheme: 'per_unit',
    unit_amount: 50, // $0.50 per image
    recurring: {
      interval: 'month',
      usage_type: 'metered',
      meter: ultraMeter.id,
    } as any,
    metadata: {
      quality: 'Ultra (4K)',
      meter_event_name: 'ultra_image_generation',
    }
  });
  console.log(`Created Ultra quality price: ${ultraPrice.id} ($0.50/image)`);

  console.log('\n=== Stripe Products Created Successfully ===');
}

seedProducts().catch(console.error);
