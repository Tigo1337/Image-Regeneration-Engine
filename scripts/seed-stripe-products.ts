import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Creating Stripe products and prices...');
  
  const stripe = await getUncachableStripeClient();

  // Check if products already exist
  const existingProducts = await stripe.products.search({ query: "name:'RoomReimagine Pro'" });
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation');
    return;
  }

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

  // 3. Create Billing Meters for each quality tier (required by Stripe API 2025+)
  console.log('\nCreating billing meters...');
  
  const standardMeter = await (stripe as any).billing.meters.create({
    display_name: 'Standard Quality Images',
    event_name: 'standard_image_generation',
    default_aggregation: { formula: 'sum' },
    customer_mapping: {
      type: 'by_id',
      event_payload_key: 'stripe_customer_id',
    },
  });
  console.log(`Created Standard meter: ${standardMeter.id}`);

  const highFidelityMeter = await (stripe as any).billing.meters.create({
    display_name: 'High Fidelity (2K) Images',
    event_name: 'high_fidelity_image_generation',
    default_aggregation: { formula: 'sum' },
    customer_mapping: {
      type: 'by_id',
      event_payload_key: 'stripe_customer_id',
    },
  });
  console.log(`Created High Fidelity meter: ${highFidelityMeter.id}`);

  const ultraMeter = await (stripe as any).billing.meters.create({
    display_name: 'Ultra (4K) Images',
    event_name: 'ultra_image_generation',
    default_aggregation: { formula: 'sum' },
    customer_mapping: {
      type: 'by_id',
      event_payload_key: 'stripe_customer_id',
    },
  });
  console.log(`Created Ultra meter: ${ultraMeter.id}`);

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
  console.log('');
  console.log('SUBSCRIPTION PRODUCT:');
  console.log('  Product ID:', subscriptionProduct.id);
  console.log('  Monthly Price ID:', monthlyPrice.id);
  console.log('');
  console.log('USAGE PRODUCT:');
  console.log('  Product ID:', usageProduct.id);
  console.log('');
  console.log('METERS:');
  console.log('  Standard Meter ID:', standardMeter.id);
  console.log('  High Fidelity Meter ID:', highFidelityMeter.id);
  console.log('  Ultra Meter ID:', ultraMeter.id);
  console.log('');
  console.log('METERED PRICES:');
  console.log('  Standard Quality Price ID:', standardPrice.id);
  console.log('  High Fidelity Price ID:', highFidelityPrice.id);
  console.log('  Ultra Quality Price ID:', ultraPrice.id);
  console.log('');
  console.log('The products are now synced to your Stripe account.');
  console.log('Users can subscribe via the pricing page in the app.');
}

seedProducts().catch(console.error);
