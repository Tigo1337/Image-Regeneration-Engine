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

  // Create monthly subscription price (adjust amount as needed)
  const monthlyPrice = await stripe.prices.create({
    product: subscriptionProduct.id,
    unit_amount: 2900, // $29.00/month - adjust as needed
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

  // Create metered prices for each quality tier
  const standardPrice = await stripe.prices.create({
    product: usageProduct.id,
    unit_amount: 20, // $0.20 per image
    currency: 'usd',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
    } as any,
    metadata: {
      quality: 'Standard',
    }
  });
  console.log(`Created Standard quality price: ${standardPrice.id} ($0.20/image)`);

  const highFidelityPrice = await stripe.prices.create({
    product: usageProduct.id,
    unit_amount: 35, // $0.35 per image
    currency: 'usd',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
    } as any,
    metadata: {
      quality: 'High Fidelity (2K)',
    }
  });
  console.log(`Created High Fidelity price: ${highFidelityPrice.id} ($0.35/image)`);

  const ultraPrice = await stripe.prices.create({
    product: usageProduct.id,
    unit_amount: 50, // $0.50 per image
    currency: 'usd',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
    } as any,
    metadata: {
      quality: 'Ultra (4K)',
    }
  });
  console.log(`Created Ultra quality price: ${ultraPrice.id} ($0.50/image)`);

  console.log('\n=== Stripe Products Created Successfully ===');
  console.log('Subscription Product ID:', subscriptionProduct.id);
  console.log('Monthly Price ID:', monthlyPrice.id);
  console.log('Usage Product ID:', usageProduct.id);
  console.log('Standard Quality Price ID:', standardPrice.id);
  console.log('High Fidelity Price ID:', highFidelityPrice.id);
  console.log('Ultra Quality Price ID:', ultraPrice.id);
  console.log('\nSave these IDs in environment variables or use them directly in your code.');
}

seedProducts().catch(console.error);
