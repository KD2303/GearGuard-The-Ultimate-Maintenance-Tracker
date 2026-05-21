const mongoose = require('mongoose');
const SparePart = require('./server/models/SparePart');

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gearguard');
    await SparePart.create({
      name: 'Air Filter X-200',
      sku: 'AFX-200',
      quantityInStock: 2,
      unitCost: 15.00,
      minReorderThreshold: 10,
      reorderStatus: 'low-stock',
      location: 'Shelf B-2'
    });
    console.log('Low stock part seeded successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
seed();
