const mongoose = require("mongoose");
const TelemetryData = require("./server/models/TelemetryData");
const Equipment = require("./server/models/Equipment");

require("dotenv").config({ path: "./server/.env" });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gearguard", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    const equipment = await Equipment.findOne({});
    if (!equipment) {
      console.log("No equipment found.");
      return;
    }

    const eqId = equipment._id;
    const now = new Date();
    const telemetryDocs = [];

    // Generate 60 minutes of data (one point per minute)
    for (let i = 0; i < 60; i++) {
      const timestamp = new Date(now.getTime() - (60 - i) * 60 * 1000);
      
      // Gradually increase temperature and vibration, spiking at the end
      const tempBase = 60 + (i * 0.2); // Starts at 60, goes up to 72
      const tempSpike = i > 50 ? (i - 50) * 3 : 0; // Spikes up to +27
      const temperature = tempBase + tempSpike + (Math.random() * 2);

      const vibBase = 1.0 + (i * 0.02);
      const vibSpike = i > 55 ? (i - 55) * 1.5 : 0;
      const vibration = vibBase + vibSpike + (Math.random() * 0.5);

      telemetryDocs.push({
        timestamp,
        metadata: { equipmentId: eqId, metricType: 'temperature' },
        value: temperature
      });

      telemetryDocs.push({
        timestamp,
        metadata: { equipmentId: eqId, metricType: 'vibration' },
        value: vibration
      });
    }

    // Assign a recent failure date to test the default query range
    equipment.lastFailureDate = now;
    await equipment.save();

    await TelemetryData.insertMany(telemetryDocs);
    console.log(`Seeded ${telemetryDocs.length} telemetry points for equipment ${eqId}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
