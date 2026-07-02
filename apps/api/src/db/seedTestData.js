// apps/api/src/db/seedTestData.js
require('dotenv').config();
const db = require('./client');

async function seed() {
  try {
    const store = await db('stores').first();
    if (!store) {
      console.error('No store found. Please run seedUser.js first to create a store.');
      process.exit(1);
    }

    console.log(`Using Store: ${store.name} (${store.id})`);

    // Clean up child tables first to avoid FK constraints
    console.log('Cleaning up existing test data...');
    await db('customer_fashion_dna').del();
    await db('inventory_stock').del();
    await db('product_variants').del();
    await db('blueprint_notes').del();
    await db('shipments').del();
    await db('order_cards').del();
    await db('garment_blueprints').del();
    await db('customers').del();
    await db('products').del();

    // Create a dummy customer
    console.log('Seeding a test customer...');
    const [customer] = await db('customers').insert({
      store_id: store.id,
      full_name: 'Jane Doe',
      phone: '+919876543210',
      health_score: 85,
      health_score_reason: 'Regular buyer, high satisfaction'
    }).returning('*');

    // Create customer DNA
    await db('customer_fashion_dna').insert({
      customer_id: customer.id,
      preferred_sizes: JSON.stringify(['M']),
      preferred_colors: JSON.stringify(['blue', 'white']),
      budget_band: 'mid-range'
    });

    console.log(`Created Customer: ${customer.full_name} (ID: ${customer.id})`);

    // Create a dummy product
    console.log('Seeding a test product...');
    const [product] = await db('products').insert({
      store_id: store.id,
      name: 'Classic White Shirt',
      category: 'apparel',
      description: 'A timeless classic white cotton shirt.',
      primary_image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518'
    }).returning('*');

    // Create a variant
    const [variant] = await db('product_variants').insert({
      product_id: product.id,
      sku: 'SHIRT-WHITE-001-M',
      size: 'M',
      color: 'White',
      selling_price: 1499.00,
      mrp: 1499.00
    }).returning('*');

    // Create inventory stock
    await db('inventory_stock').insert({
      store_id: store.id,
      variant_id: variant.id,
      quantity: 25
    });

    console.log(`Created Product: ${product.name} (ID: ${product.id})`);

    // Create a boutique blueprint
    console.log('Seeding a test garment blueprint...');
    const [blueprint] = await db('garment_blueprints').insert({
      store_id: store.id,
      customer_id: customer.id,
      fabric: 'Italian Linen - Sky Blue',
      style_notes: 'Slim fit linen shirt with spread collar.',
      status: 'stitching'
    }).returning('*');

    await db('blueprint_notes').insert({
      blueprint_id: blueprint.id,
      note_text: 'Fabric pre-washed. Pattern cut matching grain.'
    });

    console.log(`Created Garment Blueprint: ${blueprint.fabric} (ID: ${blueprint.id})`);

    // Create an order card
    console.log('Seeding a test order card...');
    const [orderCard] = await db('order_cards').insert({
      store_id: store.id,
      customer_id: customer.id,
      product_id: product.id,
      blueprint_id: blueprint.id,
      status: 'confirmed',
      source: 'manual',
      advance_amount: 500.00,
      total_amount: 1499.00,
      balance_amount: 999.00
    }).returning('*');

    console.log(`Created Order Card ID: ${orderCard.id}`);

    // Create a logistics shipment
    console.log('Seeding a test shipment...');
    const [shipment] = await db('shipments').insert({
      store_id: store.id,
      order_id: orderCard.id,
      tracking_id: 'BD123456789IN',
      provider: 'bluedart',
      status: 'in_transit'
    }).returning('*');

    console.log(`Created Shipment: ${shipment.tracking_id} (ID: ${shipment.id})`);

    console.log('\n----------------------------------------');
    console.log('Test data seeded successfully!');
    console.log(`Customer ID:  ${customer.id}`);
    console.log(`Product ID:   ${product.id}`);
    console.log(`Blueprint ID: ${blueprint.id}`);
    console.log(`Order ID:     ${orderCard.id}`);
    console.log(`Shipment ID:  ${shipment.id}`);
    console.log('----------------------------------------');

  } catch (err) {
    console.error('Error seeding test data:', err);
  } finally {
    await db.destroy();
  }
}

seed();
