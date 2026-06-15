const cron = require('node-cron');
const TeamMember = require('../models/TeamMember');

const startCertificationChecker = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('⏱️  [Cron] Running certification expiry checker...');
    try {
      const now = new Date();
      // Find team members with at least one certification that is expired and still marked valid
      const membersToUpdate = await TeamMember.find({
        certifications: {
          $elemMatch: {
            isValid: true,
            expiresAt: { $lt: now }
          }
        }
      });

      let updatedCount = 0;

      for (const member of membersToUpdate) {
        let changed = false;
        
        member.certifications.forEach(cert => {
          if (cert.isValid && new Date(cert.expiresAt) < now) {
            cert.isValid = false;
            changed = true;
          }
        });

        if (changed) {
          await member.save();
          updatedCount++;
        }
      }

      console.log(`✅ [Cron] Certification expiry check completed. Invalidated certs for ${updatedCount} technicians.`);
    } catch (error) {
      console.error('❌ [Cron] Error running certification checker:', error);
    }
  });

  console.log('⏱️  [Cron] Certification expiry checker scheduled (Runs daily at midnight).');
};

module.exports = { startCertificationChecker };
