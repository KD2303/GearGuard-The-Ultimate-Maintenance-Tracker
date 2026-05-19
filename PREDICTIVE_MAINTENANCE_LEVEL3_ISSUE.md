# UI/UX & Backend: Predictive Maintenance & Automated Work Order Dispatch Engine 🚀

## 🚀 Feature Description

Implement a full-stack **Predictive Maintenance & Automated Work Order Dispatch Engine** for GearGuard. This includes updating database schemas to support machine telemetry, building an active backend algorithm that tracks risk and automatically dispatches preventive maintenance requests when an asset enters a critical state, and creating a modern predictive dashboard with a real-time telemetry simulator.

---

## 🎯 Problem Statement

Currently, GearGuard is a **reactive** maintenance tracker—users must manually log request tickets after a breakdown occurs or guess when to schedule preventive service. In real-world industrial environments:
* Running equipment to failure causes massive unplanned downtime and expensive machinery damage.
* Relying purely on calendar scheduling often results in over-servicing or under-servicing active hardware.

We need a smart, automated way to predict when a machine is reaching its critical wear limits based on telemetry data (operating hours, operating temperature, and vibration amplitude) and dynamically trigger automated work orders.

---

## 💡 Proposed Solution

We propose introducing a smart full-stack predictive pipeline:

1. **Database Schema Enhancements (`server/models/Equipment.js`):**
   * Extend the `Equipment` schema with real-time operational metrics:
     * `operatingHours`: Total operational hours (accumulating).
     * `temperatureCelsius`: Current running temperature (e.g. 20°C - 100°C).
     * `vibrationAmplitude`: Current vibration level in mm/s (e.g. 0.1 - 10.0).
     * `criticalThresholds`: Objects holding max safe operating parameters.

2. **Predictive Analytics & Health Score Engine (`server/controllers/predictiveController.js`):**
   * Create an endpoint `GET /api/predictive/status` that returns a computed **Health Score (0-100%)** and **Failure Risk Level (Low / Medium / High)** for each active equipment.
   * Health Score Formula:
     $$\text{Health} = 100 - \left( \frac{\text{operatingHours}}{\text{maxHours}} \times 30 + \frac{\text{temperatureCelsius}}{\text{maxTemp}} \times 35 + \frac{\text{vibrationAmplitude}}{\text{maxVibration}} \times 35 \right)$$

3. **Automated Preventive Dispatcher (Background Event / Trigger):**
   * When an asset's computed health score drops below **40% (High Risk)**:
     * Programmatically check if there is already an open active work request for this asset.
     * If not, automatically dispatch a `preventive` request titled `[Auto-Dispatch] Preemptive Service Required` and assign it to the default technician.

4. **Predictive Dashboard Tab (`client/src/pages/PredictiveDashboard.tsx`):**
   * Introduce a gorgeous, highly visual dashboard with gauges representing asset health, vibration logs, and telemetry anomaly histories.
   * **Telemetry Simulator Panel:** Include a slider-based interface so administrators can manually mock "cranking up" an asset's temperature or vibration. This allows them to witness the automated critical alarm trigger and real-time work order dispatch live!

---

## 🔄 Alternatives Considered

* **Alternative 1: Simple Calendar Polling:** Dispatching work orders solely based on simple dates (e.g., every 3 months). This is highly inefficient because it ignores actual machinery utilization rate, operating strains, and telemetry spikes.
* **Alternative 2: Off-the-shelf IoT Integrations:** Using third-party external integrations like AWS IoT Core. However, this is too complex for local development environments and lacks standard out-of-the-box support for offline testing.

---

## 🏷️ NSoC'26 Information

- **Level:** Level 3 (Advanced Engineering)
- **Points:** 10 Points

---

## ✅ Acceptance Criteria

- [ ] Telemetry operating variables and critical safe threshold bounds added to the Mongoose `Equipment` model.
- [ ] Predictive health status aggregation API endpoint (`GET /api/predictive/status`) fully functional and tested.
- [ ] Background automated dispatcher service tested: correctly triggers new `preventive` work order tickets without duplicates when an asset enters **High Risk** ($<40\%$).
- [ ] Premium, highly responsive "Predictive Portal" frontend page integrated into the newly designed Left Sidebar navigation.
- [ ] Graphical telemetries (visual dials, custom sensor trend graphs, failure forecasting lists).
- [ ] Real-time Admin Telemetry Simulator fully integrated with instant WS/polling-based reactive ticket triggers.
- [ ] Complete TypeScript compilation passing with `0` errors.

---

## 📌 Additional Context

* This feature utilizes the new layout's vertical vertical list capacity perfectly to add a dedicated navigation link for "Predictive Portal".
* Use standard **Lucide Icons** like `Thermometer`, `Activity`, `Gauge`, and `AlertOctagon` to keep the UI extremely premium.
* Standardize all JSON responses under the new error handling system's standard `{ success: true, data: [...] }` envelopes.
