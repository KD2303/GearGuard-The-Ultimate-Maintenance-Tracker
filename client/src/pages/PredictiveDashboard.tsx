import React, { useState, useEffect } from "react";
import {
  getPredictiveStatus,
  simulateTelemetry,
  PredictiveEquipmentStatus,
} from "../services/predictiveService";
import {
  Gauge,
  Thermometer,
  Activity,
  AlertOctagon,
  Wrench,
  X,
  CheckCircle,
  HelpCircle,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";

const PredictiveDashboard: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<PredictiveEquipmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<PredictiveEquipmentStatus | null>(null);
  
  // Simulation sliders state
  const [simHours, setSimHours] = useState(0);
  const [simTemp, setSimTemp] = useState(25);
  const [simVib, setSimVib] = useState(0.1);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await getPredictiveStatus();
      setEquipmentList(data);
    } catch (error) {
      console.error("Failed to load predictive status:", error);
      toast.error("Failed to fetch equipment health status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const openSimulator = (asset: PredictiveEquipmentStatus) => {
    setSelectedAsset(asset);
    setSimHours(asset.operatingHours);
    setSimTemp(asset.temperatureCelsius);
    setSimVib(asset.vibrationAmplitude);
  };

  const closeSimulator = () => {
    setSelectedAsset(null);
  };

  const handleApplySimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    setSubmitting(true);
    try {
      const result = await simulateTelemetry({
        equipmentId: selectedAsset.id,
        operatingHours: simHours,
        temperatureCelsius: simTemp,
        vibrationAmplitude: simVib,
      });

      toast.success(`Simulation applied to ${selectedAsset.name}`);
      
      if (result.autoDispatched && result.dispatchedRequest) {
        const ticketNumber = result.dispatchedRequest.requestNumber;
        toast((t) => (
          <span className="flex items-start space-x-2">
            <span className="text-xl">🚨</span>
            <div>
              <p className="font-extrabold text-slate-900">Preemptive Dispatch Triggered!</p>
              <p className="text-xs text-slate-500">
                Ticket <strong className="text-indigo-600 font-bold">{ticketNumber}</strong> auto-created & assigned.
              </p>
            </div>
          </span>
        ), {
          duration: 6000,
          position: "top-center"
        });
      }

      await fetchStatus();
      closeSimulator();
    } catch (error) {
      console.error("Simulation failed:", error);
      toast.error("Telemetry simulation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score <= 40) return "text-red-500 border-red-500 bg-red-50 dark:bg-red-950/20";
    if (score <= 70) return "text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/20";
    return "text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
  };

  const getStrokeDashOffset = (score: number) => {
    // Circumference of radius 40 circle is 2 * PI * 40 ≈ 251.2
    const circumference = 251.2;
    return circumference - (score / 100) * circumference;
  };

  if (loading) {
    return <Spinner size="lg" label="Analyzing telemetry status..." centered />;
  }

  return (
    <div className="space-y-8 relative">
      
      {/* Title Panel */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-950 dark:text-white leading-tight">
            Predictive Maintenance Portal
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
            Dynamic telemetry models, real-time wear analysis, and automated work dispatch dashboard.
          </p>
        </div>
      </div>

      {/* Grid of Equipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {equipmentList.map((asset) => (
          <div
            key={asset.id}
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between"
          >
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                    {asset.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                    {asset.category} &bull; {asset.location}
                  </p>
                </div>
                <Badge
                  variant={
                    asset.riskLevel === "High Risk"
                      ? "danger"
                      : asset.riskLevel === "Needs Attention"
                      ? "warning"
                      : "success"
                  }
                  pulse={asset.riskLevel === "High Risk"}
                >
                  {asset.riskLevel}
                </Badge>
              </div>

              {/* Graphical Health score Dial */}
              <div className="flex justify-center items-center my-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="72"
                      cy="72"
                      r="40"
                      className="text-slate-100 dark:text-slate-700 stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Foreground Ring */}
                    <circle
                      cx="72"
                      cy="72"
                      r="40"
                      className={`stroke-current transition-all duration-500 ${
                        asset.healthScore <= 40
                          ? "text-red-500"
                          : asset.healthScore <= 70
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={getStrokeDashOffset(asset.healthScore)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {/* Inside dial text */}
                  <div className="absolute text-center">
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {asset.healthScore}%
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-extrabold mt-1">
                      Health
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Telemetry variables */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center">
                  <div className="flex justify-center mb-1 text-indigo-500">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Hours
                  </p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {asset.operatingHours} hrs
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Max: {asset.criticalThresholds?.maxHours || 2000}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center">
                  <div className="flex justify-center mb-1 text-rose-500">
                    <Thermometer className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Temp
                  </p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {asset.temperatureCelsius}°C
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Max: {asset.criticalThresholds?.maxTemp || 85}°C
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center">
                  <div className="flex justify-center mb-1 text-cyan-500">
                    <Activity className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Vibration
                  </p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {asset.vibrationAmplitude} mm/s
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Max: {asset.criticalThresholds?.maxVibration || 4.5}
                  </p>
                </div>
              </div>

              {/* Alert Notifications list */}
              {asset.alerts && asset.alerts.length > 0 && (
                <div className="space-y-1.5 mb-6">
                  {asset.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <span className="leading-snug">{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simulated Overrides */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <Button
                variant="secondary"
                className="w-full justify-center text-sm font-bold flex items-center bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200 dark:border-slate-750"
                onClick={() => openSimulator(asset)}
              >
                <Sliders className="h-4 w-4 mr-2" />
                Simulate Telemetry Override
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Simulator Overlay sidebar Panel */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dim backdrop */}
          <div
            onClick={closeSimulator}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Drawer container */}
          <div className="relative w-[22rem] max-w-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-in">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Telemetry Simulator
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold leading-normal">
                    Adjust real-time operating metrics for <strong className="text-slate-800 dark:text-slate-200">{selectedAsset.name}</strong> to trigger safety alarms.
                  </p>
                </div>
                <button
                  onClick={closeSimulator}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Simulation Sliders Form */}
              <form onSubmit={handleApplySimulation} className="space-y-6">
                
                {/* Hours Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">Operating Hours</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{simHours} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(2500, selectedAsset.criticalThresholds?.maxHours * 1.2)}
                    value={simHours}
                    onChange={(e) => setSimHours(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0 hrs</span>
                    <span>Max Limit: {selectedAsset.criticalThresholds?.maxHours} hrs</span>
                  </div>
                </div>

                {/* Temperature Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">Operating Temperature</span>
                    <span className="font-black text-rose-500">{simTemp}°C</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(120, selectedAsset.criticalThresholds?.maxTemp * 1.3)}
                    value={simTemp}
                    onChange={(e) => setSimTemp(Number(e.target.value))}
                    className="w-full accent-rose-500 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0°C</span>
                    <span>Critical: {selectedAsset.criticalThresholds?.maxTemp}°C</span>
                  </div>
                </div>

                {/* Vibration Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">Vibration Amplitude</span>
                    <span className="font-black text-cyan-600 dark:text-cyan-400">{simVib} mm/s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max={Math.max(6, selectedAsset.criticalThresholds?.maxVibration * 1.3)}
                    step="0.1"
                    value={simVib}
                    onChange={(e) => setSimVib(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0.1 mm/s</span>
                    <span>Danger: {selectedAsset.criticalThresholds?.maxVibration} mm/s</span>
                  </div>
                </div>

                {/* Warnings indicators */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    Expected Simulation Impact
                  </h4>
                  {simTemp >= selectedAsset.criticalThresholds?.maxTemp ||
                  simVib >= selectedAsset.criticalThresholds?.maxVibration ||
                  simHours >= selectedAsset.criticalThresholds?.maxHours ? (
                    <div className="flex items-start space-x-2 text-red-600 text-xs">
                      <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Critical Drop Warning:</strong> Telemetry values exceed safety limits. Equipment status will shift to <strong className="underline">under-maintenance</strong> and automatically trigger a preemptive work order.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2 text-emerald-600 text-xs">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Stable:</strong> Metrics are within safe operational limits. Equipment health will remain healthy.
                      </p>
                    </div>
                  )}
                </div>

              </form>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="primary"
                className="w-full justify-center py-3 font-bold"
                onClick={handleApplySimulation}
                disabled={submitting}
              >
                {submitting ? "Applying simulation..." : "Apply Telemetry simulation"}
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-center py-3 font-semibold bg-transparent text-slate-500 border-none hover:bg-slate-100"
                onClick={closeSimulator}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PredictiveDashboard;
