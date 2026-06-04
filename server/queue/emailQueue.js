const Bull = require('bull');
const nodemailer = require('nodemailer');

const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;

  try {
    if (!to) {
      throw new Error('Recipient email missing');
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(`[Email Queue] Message sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.error(`[Email Queue] Failed attempt ${job.attemptsMade} for ${to}:`, error.message);
    throw error;
  }
});

emailQueue.on('completed', (job) => {
  console.log(`[Email Queue] Job ${job.id} completed successfully`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[Email Queue] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

emailQueue.on('error', (error) => {
  console.error('[Email Queue] Error:', error);
});

async function scheduleEmailNotification(to, subject, html) {
  try {
    const job = await emailQueue.add(
      { to, subject, html },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    console.log(`[Email Queue] Scheduled email job ${job.id} to ${to}`);
    return job;
  } catch (error) {
    console.error('[Email Queue] Failed to schedule email:', error.message);
    throw error;
  }
}

async function cleanupFailedJobs() {
  try {
    const failed = await emailQueue.getFailed();
    console.log(`[Email Queue] Found ${failed.length} failed jobs`);
  } catch (error) {
    console.error('[Email Queue] Error checking failed jobs:', error);
  }
}

module.exports = {
  emailQueue,
  scheduleEmailNotification,
  cleanupFailedJobs,
};
