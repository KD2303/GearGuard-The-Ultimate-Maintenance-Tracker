const KeyRotationJob = require('../models/KeyRotationJob');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { startWorker } = require('../jobs/keyRotationWorker');

exports.getStatus = async (req, res) => {
  try {
    let job = await KeyRotationJob.findOne().sort({ createdAt: -1 });
    if (!job) {
      return res.json({ status: 'idle', totalDocuments: 0, processedDocuments: 0, migratedDocuments: 0 });
    }
    
    // Auto start worker if there's a running job
    if (job.status === 'running') {
      startWorker();
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.startRotation = async (req, res) => {
  try {
    const primaryVersion = process.env.PRIMARY_ENCRYPTION_VERSION || 'v1';
    
    let job = await KeyRotationJob.findOne({ status: { $in: ['running', 'paused'] } });
    if (job) {
      return res.status(400).json({ error: `A job is already ${job.status}.` });
    }

    const totalDocuments = await MaintenanceRequest.countDocuments({ notes: { $exists: true, $ne: null } });

    job = new KeyRotationJob({
      targetVersion: primaryVersion,
      status: 'running',
      totalDocuments,
      processedDocuments: 0,
      migratedDocuments: 0,
      lastProcessedId: null
    });

    await job.save();
    
    startWorker();

    res.json({ message: 'Key rotation started successfully', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.pauseRotation = async (req, res) => {
  try {
    const job = await KeyRotationJob.findOne({ status: 'running' });
    if (!job) {
      return res.status(400).json({ error: 'No running job found to pause.' });
    }

    job.status = 'paused';
    await job.save();

    res.json({ message: 'Key rotation paused successfully', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resumeRotation = async (req, res) => {
  try {
    const job = await KeyRotationJob.findOne({ status: 'paused' });
    if (!job) {
      return res.status(400).json({ error: 'No paused job found to resume.' });
    }

    job.status = 'running';
    await job.save();

    startWorker();

    res.json({ message: 'Key rotation resumed successfully', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
