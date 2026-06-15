const cron = require('node-cron');
const { Equipment } = require('../models');
const NotificationService = require('../services/notificationService');

const startWarrantyChecker = () => {
  // Runs daily at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Find equipment with warranty expiring within 30 days that hasn't been notified
      const expiringEquipment = await Equipment.find({
        warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow },
        warrantyNotified: { $ne: true },
        status: { $ne: 'Scrapped' }
      });

      for (const equip of expiringEquipment) {
        const daysLeft = Math.ceil((new Date(equip.warrantyExpiry) - now) / (1000 * 60 * 60 * 24));

        await NotificationService.createAndEmit({
          title: '⏰ Warranty Expiring Soon',
          message: `Equipment "${equip.name}" (${equip.serialNumber || 'N/A'}) warranty expires in ${daysLeft} day(s) on ${new Date(equip.warrantyExpiry).toLocaleDateString()}.`,
          type: 'equipment_status',
          link: '/equipment',
          relatedEquipmentId: equip._id,
        });

        equip.warrantyNotified = true;
        await equip.save();
      }

      // Also check already-expired warranties
      const expiredEquipment = await Equipment.find({
        warrantyExpiry: { $lt: now },
        warrantyExpiredNotified: { $ne: true },
        status: { $ne: 'Scrapped' }
      });

      for (const equip of expiredEquipment) {
        await NotificationService.createAndEmit({
          title: '🚨 Warranty Expired',
          message: `Equipment "${equip.name}" (${equip.serialNumber || 'N/A'}) warranty has expired as of ${new Date(equip.warrantyExpiry).toLocaleDateString()}. Future repairs will not be covered.`,
          type: 'equipment_status',
          link: '/equipment',
          relatedEquipmentId: equip._id,
        });

        equip.warrantyExpiredNotified = true;
        await equip.save();
      }

      const total = expiringEquipment.length + expiredEquipment.length;
      if (total > 0) {
        console.log(`Warranty checker: notified for ${total} equipment item(s).`);
      }
    } catch (error) {
      console.error('Warranty checker error:', error.message);
    }
  });

  console.log('Warranty expiration checker cron job started.');
};

module.exports = { startWarrantyChecker };
