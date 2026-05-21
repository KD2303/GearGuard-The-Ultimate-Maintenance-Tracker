const mongoose = require('mongoose');
const SparePart = require('./server/models/SparePart');

async function fix() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gearguard');
    await SparePart.updateOne(
      { sku: 'AFX-200' },
      { $set: { supplierEmail: 'supplier@example.com' } }
    );
    console.log('Supplier email added!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
