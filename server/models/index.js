const { connectDatabase } = require('../config/database');
const Equipment = require('./Equipment');
const MaintenanceTeam = require('./MaintenanceTeam');
const TeamMember = require('./TeamMember');
const MaintenanceRequest = require('./MaintenanceRequest');
const Notification = require('./Notification');
const Activity = require('./Activity');
const SparePart = require('./SparePart');
const FloorPlan = require('./FloorPlan');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const Webhook = require('./Webhook');
const PreventiveSchedule = require('./PreventiveSchedule');
const ShiftHandover = require('./ShiftHandover');

const syncDatabase = async () => {
  try {
    await connectDatabase();

    // Ensure indexes (best-effort)
    try {
      await Promise.all([
        Equipment.createIndexes ? Equipment.createIndexes() : Promise.resolve(),
        MaintenanceTeam.createIndexes ? MaintenanceTeam.createIndexes() : Promise.resolve(),
        TeamMember.createIndexes ? TeamMember.createIndexes() : Promise.resolve(),
        MaintenanceRequest.createIndexes ? MaintenanceRequest.createIndexes() : Promise.resolve(),
        Notification.createIndexes ? Notification.createIndexes() : Promise.resolve(),
        Activity.createIndexes ? Activity.createIndexes() : Promise.resolve(),
        SparePart.createIndexes ? SparePart.createIndexes() : Promise.resolve(),
        FloorPlan.createIndexes ? FloorPlan.createIndexes() : Promise.resolve(),
        Supplier.createIndexes ? Supplier.createIndexes() : Promise.resolve(),
        PurchaseOrder.createIndexes ? PurchaseOrder.createIndexes() : Promise.resolve(),
        Webhook.createIndexes ? Webhook.createIndexes() : Promise.resolve(),
        PreventiveSchedule.createIndexes ? PreventiveSchedule.createIndexes() : Promise.resolve(),
        ShiftHandover.createIndexes ? ShiftHandover.createIndexes() : Promise.resolve()
      ]);
    } catch (idxErr) {
      // ignore index creation errors
    }

    console.log('✓ MongoDB connected and models are ready.');
  } catch (error) {
    console.error('✗ Unable to initialize MongoDB:', error);
    throw error;
  }
};

module.exports = {
  syncDatabase,
  Equipment,
  MaintenanceTeam,
  TeamMember,
  MaintenanceRequest,
  Notification,
  Activity,
  SparePart,
  FloorPlan,
  Supplier,
  PurchaseOrder,
  Webhook,
  PreventiveSchedule,
  ShiftHandover
};