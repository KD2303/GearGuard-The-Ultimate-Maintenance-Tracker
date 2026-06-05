const KeyRotationJob = require('../models/KeyRotationJob');
const MaintenanceRequest = require('../models/MaintenanceRequest');

let activeInterval = null;
let isProcessing = false;

/**
 * The main worker loop that processes a batch of documents.
 */
async function processBatch() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const job = await KeyRotationJob.findOne({ status: 'running' });
    if (!job) {
      isProcessing = false;
      return;
    }

    const { targetVersion, lastProcessedId } = job;
    const batchSize = 100;
    
    // Query condition: We want to process MaintenanceRequests where _id > lastProcessedId
    const query = {};
    if (lastProcessedId) {
      query._id = { $gt: lastProcessedId };
    }

    const requests = await MaintenanceRequest.find(query).sort({ _id: 1 }).limit(batchSize);

    if (requests.length === 0) {
      // Reached the end
      job.status = 'completed';
      await job.save();
      console.log(`[KeyRotation] Job ${job.jobName} completed. Migrated ${job.migratedDocuments} of ${job.totalDocuments} total documents.`);
      isProcessing = false;
      return;
    }

    let batchMigrated = 0;
    let newLastId = job.lastProcessedId;

    for (const req of requests) {
      newLastId = req._id;
      try {
        // Fetch raw document to see if it needs migration
        const rawDoc = await MaintenanceRequest.collection.findOne({ _id: req._id }, { projection: { notes: 1 } });
        
        if (rawDoc && rawDoc.notes && rawDoc.notes.startsWith('enc:v')) {
          if (!rawDoc.notes.startsWith(`enc:${targetVersion}:`)) {
            // It needs migration.
            // req.notes is already decrypted by Mongoose getters.
            // By marking it modified and saving, Mongoose setter will re-encrypt with the new primary key.
            req.markModified('notes');
            await req.save();
            batchMigrated++;
          }
        }
      } catch (err) {
        if (err.name === 'VersionError') {
          // Document was modified concurrently. MongooseOCC handled it.
          // Since the concurrent save will encrypt it with the new key anyway, we just ignore.
        } else {
          console.error(`[KeyRotation] Error processing request ${req._id}:`, err);
        }
      }
    }

    // Update job progress
    job.lastProcessedId = newLastId;
    job.processedDocuments += requests.length;
    job.migratedDocuments += batchMigrated;
    
    // Recalculate totalDocuments dynamically just in case it grew significantly, or keep it static?
    // We'll keep it as initially set, but maybe cap processedDocuments at totalDocuments for UI sanity.
    
    await job.save();

  } catch (error) {
    console.error('[KeyRotation] Worker error:', error);
    // Pause job on catastrophic error
    try {
      await KeyRotationJob.updateMany({ status: 'running' }, { status: 'error', errorMessage: error.message });
    } catch (e) {
      // Ignore
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Start the background loop
 */
function startWorker() {
  if (activeInterval) return;
  console.log('[KeyRotation] Worker started');
  activeInterval = setInterval(processBatch, 2000);
}

/**
 * Stop the background loop
 */
function stopWorker() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
    console.log('[KeyRotation] Worker stopped');
  }
}

module.exports = {
  startWorker,
  stopWorker,
  processBatch
};
