const TelemetryData = require("../models/TelemetryData");
const AlertRule = require("../models/AlertRule");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const NotificationService = require("./notificationService");
const Equipment = require("../models/Equipment");

class TelemetryService {
  constructor() {
    // Lightweight in-memory queue fallback for initial rollout
    // In production, this would be replaced with BullMQ + Redis
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 100;
  }

  async enqueuePayload(payloads) {
    if (Array.isArray(payloads)) {
      this.queue.push(...payloads);
    } else {
      this.queue.push(payloads);
    }
    
    // Trigger processing asynchronously if not already running
    if (!this.isProcessing) {
      this.processQueue().catch(err => console.error("Error processing telemetry queue:", err));
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;

    try {
      // Dequeue a batch
      const batch = this.queue.splice(0, this.batchSize);

      // 1. Bulk insert into MongoDB Time Series collection
      const docs = batch.map(item => ({
        timestamp: item.timestamp || new Date(),
        metadata: {
          equipmentId: item.equipmentId,
          metricType: item.metricType,
          sensorId: item.sensorId || "default"
        },
        value: item.value
      }));

      await TelemetryData.insertMany(docs);

      // 2. Evaluate Alert Rules
      await this.evaluateRules(docs);
      
    } catch (error) {
      console.error("Telemetry processing error:", error);
    } finally {
      // Continue processing if there's more
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      } else {
        this.isProcessing = false;
      }
    }
  }

  async evaluateRules(telemetryBatch) {
    // Group by equipment ID to fetch rules efficiently
    const equipmentIds = [...new Set(telemetryBatch.map(d => d.metadata.equipmentId.toString()))];
    
    // Get all active rules for these equipments
    const activeRules = await AlertRule.find({ 
      equipmentId: { $in: equipmentIds },
      isActive: true 
    });

    if (activeRules.length === 0) return;

    for (const dataPoint of telemetryBatch) {
      const eqId = dataPoint.metadata.equipmentId.toString();
      const rules = activeRules.filter(r => r.equipmentId.toString() === eqId && r.metricType === dataPoint.metadata.metricType);
      
      for (const rule of rules) {
        let isBreached = false;
        
        switch (rule.condition) {
          case ">": isBreached = dataPoint.value > rule.threshold; break;
          case "<": isBreached = dataPoint.value < rule.threshold; break;
          case ">=": isBreached = dataPoint.value >= rule.threshold; break;
          case "<=": isBreached = dataPoint.value <= rule.threshold; break;
          case "==": isBreached = dataPoint.value === rule.threshold; break;
          case "!=": isBreached = dataPoint.value !== rule.threshold; break;
        }

        if (isBreached) {
          await this.triggerAlert(rule, dataPoint);
        }
      }
    }
  }

  async triggerAlert(rule, dataPoint) {
    try {
      const equipment = await Equipment.findById(rule.equipmentId);
      if (!equipment) return;

      const title = `Automated Alert: ${equipment.name} ${rule.metricType} anomaly`;
      const description = `Rule "${rule.name}" breached. ${rule.metricType} recorded at ${dataPoint.value} (Threshold: ${rule.condition} ${rule.threshold}).`;

      // Check if we recently created a request for this rule to avoid spamming
      // (Simple debounce: no requests for this rule within the last 1 hour)
      const recentRequest = await MaintenanceRequest.findOne({
        equipment: rule.equipmentId,
        title: title,
        createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }
      });

      if (recentRequest) return; // Debounced

      if (rule.actions.createMaintenanceRequest) {
        const request = await MaintenanceRequest.create({
          title,
          description,
          equipment: rule.equipmentId,
          priority: rule.actions.priority,
          stage: "Reported",
          createdBy: rule.createdBy // Might be system admin
        });

        if (rule.actions.sendNotification) {
          await NotificationService.createNotification({
            userId: rule.createdBy, // Could also send to admins/managers
            type: "system",
            message: `Automated Request Created: ${title}`,
            relatedId: request._id,
            relatedModel: "MaintenanceRequest"
          });
        }
      }
    } catch (error) {
      console.error("Error triggering alert:", error);
    }
  }
}

module.exports = new TelemetryService();
