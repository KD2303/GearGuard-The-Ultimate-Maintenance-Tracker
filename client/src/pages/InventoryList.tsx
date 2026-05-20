import React, { useState, useEffect } from "react";
import { SparePart } from "../types";
import { inventoryService } from "../services/inventoryService";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  MapPin, 
  IndianRupee, 
  Package, 
  Edit3, 
  Trash2,
  Mail
} from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

const InventoryList: React.FC = () => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);

  // Reorder Modal states
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderingPart, setReorderingPart] = useState<SparePart | null>(null);
  const [reorderQuantity, setReorderQuantity] = useState(10);
  const [reorderLoading, setReorderLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    quantityInStock: 0,
    unitCost: 0,
    minReorderThreshold: 0,
    supplierEmail: "",
    location: ""
  });

  const { notifications } = useNotifications();

  const loadParts = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAll(
        searchQuery || undefined,
        showLowStockOnly ? true : undefined
      );
      setParts(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [searchQuery, showLowStockOnly]);

  // Reload inventory whenever a notification triggers a potential update
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest.type && (latest.type === 'system' || latest.type === 'request_completed')) {
        loadParts();
      }
    }
  }, [notifications]);

  // Open modal for Create
  const handleAddClick = () => {
    setEditingPart(null);
    setFormData({
      name: "",
      sku: "",
      quantityInStock: 0,
      unitCost: 0,
      minReorderThreshold: 0,
      supplierEmail: "",
      location: ""
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleEditClick = (part: SparePart) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      sku: part.sku,
      quantityInStock: part.quantityInStock,
      unitCost: part.unitCost,
      minReorderThreshold: part.minReorderThreshold,
      supplierEmail: part.supplierEmail || "",
      location: part.location || ""
    });
    setIsModalOpen(true);
  };

  // Delete part
  const handleDeleteClick = async (part: SparePart) => {
    if (!part._id && !part.id) return;
    if (window.confirm(`Are you sure you want to delete spare part "${part.name}"?`)) {
      try {
        await inventoryService.delete((part._id || part.id)!);
        loadParts();
      } catch (err) {
        console.error("Failed to delete part:", err);
      }
    }
  };

  // Submit modal form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await inventoryService.update((editingPart._id || editingPart.id)!, formData);
      } else {
        await inventoryService.create(formData);
      }
      setIsModalOpen(false);
      loadParts();
    } catch (err) {
      console.error("Failed to save spare part:", err);
    }
  };

  // Reorder click
  const handleReorderClick = (part: SparePart) => {
    setReorderingPart(part);
    setReorderQuantity(part.minReorderThreshold ? part.minReorderThreshold * 2 : 10);
    setIsReorderModalOpen(true);
  };

  // Reorder submit
  const handleReorderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderingPart || !reorderingPart._id) return;
    try {
      setReorderLoading(true);
      await inventoryService.reorder(reorderingPart._id, reorderQuantity);
      setIsReorderModalOpen(false);
      loadParts();
    } catch (err) {
      console.error("Failed to reorder part:", err);
    } finally {
      setReorderLoading(false);
    }
  };

  // Metrics calculations
  const totalPartsCount = parts.length;
  const lowStockPartsCount = parts.filter(p => p.quantityInStock <= p.minReorderThreshold).length;
  const totalValuation = parts.reduce((sum, p) => sum + (p.quantityInStock * p.unitCost), 0);

  if (loading && parts.length === 0) {
    return (
      <Spinner
        size="lg"
        label="Loading spare parts inventory..."
        centered
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Smart Inventory Manager
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time tracking of physical parts, consumption meters, and auto-replenishment warnings.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAddClick} className="shadow-lg shadow-teal-500/20 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Spare Part
          </Button>
        </div>
      </div>

      {/* Modern High-End Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Unique Parts */}
        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-slate-500 dark:text-white transition-transform duration-300 group-hover:scale-110">
            <Package className="h-16 w-16" />
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Spare Items
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 leading-none">
            {totalPartsCount}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-semibold">
            Across all storage bins & shelves
          </p>
        </div>

        {/* Low Stock Warnings */}
        <div className={`relative bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 ${
          lowStockPartsCount > 0 
            ? "border-rose-200 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/20 to-white dark:from-rose-950/5 dark:to-slate-800" 
            : "border-slate-200 dark:border-slate-700"
        }`}>
          {lowStockPartsCount > 0 && (
            <span className="absolute top-4 right-4 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}
          <div className="absolute top-0 right-0 p-8 opacity-10 text-rose-500 transition-transform duration-300 group-hover:scale-110">
            <AlertTriangle className="h-16 w-16" />
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Low Stock Alerts
          </p>
          <h3 className={`text-3xl font-extrabold mt-2 leading-none ${
            lowStockPartsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-white"
          }`}>
            {lowStockPartsCount}
          </h3>
          <p className="text-xs mt-3 font-semibold text-slate-500 dark:text-slate-400">
            {lowStockPartsCount > 0 ? "⚠️ Parts requiring reorder immediately" : "✓ All inventories healthy"}
          </p>
        </div>

        {/* Valuation */}
        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-emerald-500 transition-transform duration-300 group-hover:scale-110">
            <IndianRupee className="h-16 w-16" />
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Inventory Value
          </p>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 leading-none">
            ₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-semibold">
            Based on average unit acquisition costs
          </p>
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:text-white"
          />
        </div>

        {/* Low Stock Toggle */}
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-200 ${
            showLowStockOnly 
              ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Low Stock Only
        </button>
      </div>

      {/* State-of-the-Art Spare Parts Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {parts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No matching spare parts found in active inventory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                  <th className="px-6 py-4">Item details</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Storage location</th>
                  <th className="px-6 py-4">Stock level / Threshold</th>
                  <th className="px-6 py-4">Unit cost</th>
                  <th className="px-6 py-4">Valuation</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
                {parts.map((part) => {
                  const isLowStock = part.quantityInStock <= part.minReorderThreshold;
                  // Calculate stock progress percentage (cap at 100)
                  const percent = Math.min(100, (part.quantityInStock / (part.minReorderThreshold * 2 || 10)) * 100);

                  return (
                    <tr 
                      key={part._id || part.id}
                      className={`hover:bg-slate-50/40 dark:hover:bg-slate-750/30 transition-colors ${
                        isLowStock ? "bg-rose-50/5 dark:bg-rose-950/2" : ""
                      }`}
                    >
                      {/* Name & Alerts */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">
                              {part.name}
                            </p>
                            {part.reorderStatus === "reordered" ? (
                              <div className="flex items-center text-xs text-teal-600 dark:text-teal-400 font-bold mt-1">
                                <Mail className="h-3.5 w-3.5 mr-1 animate-pulse" />
                                Awaiting Shipment
                              </div>
                            ) : isLowStock ? (
                              <div className="flex items-center text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">
                                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                Reorder Required
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4.5 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {part.sku}
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4.5 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                          <span className="font-medium">{part.location || "N/A"}</span>
                        </div>
                      </td>

                      {/* Stock Level Bar */}
                      <td className="px-6 py-4.5">
                        <div className="w-48">
                          <div className="flex justify-between items-center text-xs font-semibold mb-1">
                            <span className={isLowStock ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                              {part.quantityInStock} in stock
                            </span>
                            <span className="text-slate-400">
                              Min: {part.minReorderThreshold}
                            </span>
                          </div>
                          {/* Progress bar wrapper */}
                          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-slate-800/40">
                            <div 
                              style={{ width: `${percent}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLowStock 
                                  ? "bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse" 
                                  : "bg-gradient-to-r from-teal-500 to-emerald-500"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4.5 text-slate-700 dark:text-slate-300 font-semibold">
                        ₹{part.unitCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Valuation */}
                      <td className="px-6 py-4.5 text-slate-800 dark:text-slate-200 font-bold">
                        ₹{(part.quantityInStock * part.unitCost).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex justify-end space-x-1.5">
                          {isLowStock && part.reorderStatus !== "reordered" && (
                            <button
                              onClick={() => handleReorderClick(part)}
                              className="p-2 text-amber-600 hover:text-teal-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition duration-200 animate-bounce"
                              title="One-Click Reorder"
                            >
                              <Mail className="h-4.5 w-4.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(part)}
                            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition duration-200"
                            title="Edit Spare Part"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(part)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition duration-200"
                            title="Delete Spare Part"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Spare Part Modal Form */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPart ? "Edit Spare Part details" : "Add New Spare Part"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Part name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Hydraulic Cylinder Seal Set"
              />
            </div>

            {/* SKU & Storage Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  SKU Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white font-mono"
                  placeholder="e.g. HYD-SEAL-01"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white"
                  placeholder="e.g. Shelf B-12"
                />
              </div>
            </div>

            {/* Qty, Unit Cost, Reorder Threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quantity in stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantityInStock}
                  onChange={(e) => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Unit Cost (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Reorder limit *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.minReorderThreshold}
                  onChange={(e) => setFormData({ ...formData, minReorderThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Supplier Procurement Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Supplier / Procurement Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.supplierEmail}
                  onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white"
                  placeholder="procurement@supplier.com"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Trigger email notification drafts to this supplier once stock falls below safety levels.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md">
                {editingPart ? "Save details" : "Add Part"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manual Reorder Overlay Modal */}
      {isReorderModalOpen && reorderingPart && (
        <Modal
          isOpen={isReorderModalOpen}
          onClose={() => setIsReorderModalOpen(false)}
          title={`Procure replenishment: ${reorderingPart.name}`}
          size="md"
        >
          <form onSubmit={handleReorderSubmit} className="space-y-5">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">SKU:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{reorderingPart.sku}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Current Stock:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{reorderingPart.quantityInStock} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{reorderingPart.supplierEmail || "No email set"}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Reorder Quantity (units) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Total estimated cost: <span className="font-bold text-slate-700 dark:text-slate-350">₹{(reorderQuantity * reorderingPart.unitCost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button type="button" variant="secondary" onClick={() => setIsReorderModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={reorderLoading || !reorderingPart.supplierEmail}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md flex items-center"
              >
                {reorderLoading ? (
                  <>Sending Order...</>
                ) : (
                  <>Send Reorder Request</>
                )}
              </Button>
            </div>
            {!reorderingPart.supplierEmail && (
              <p className="text-xs text-rose-500 font-semibold text-center mt-2">
                ⚠️ Supplier email must be configured to dispatch this order.
              </p>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InventoryList;
