const { SparePart } = require("../models");
const { logActivity } = require("../utils/logActivity");

// Get all parts in inventory with filtering/search support
exports.getAllParts = async (req, res) => {
  try {
    const { search, lowStock } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    let parts = await SparePart.find(query).sort({ createdAt: -1 });

    if (lowStock === "true") {
      parts = parts.filter(part => part.quantityInStock <= part.minReorderThreshold);
    }

    res.json(parts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single part details
exports.getPartById = async (req, res) => {
  try {
    const part = await SparePart.findById(req.params.id);
    if (!part) return res.status(404).json({ error: "Spare part not found" });
    res.json(part);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new spare part
exports.createPart = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.quantityInStock !== undefined && payload.minReorderThreshold !== undefined) {
      payload.reorderStatus = payload.quantityInStock <= payload.minReorderThreshold ? 'low-stock' : 'ok';
    }
    const part = await SparePart.create(payload);
    
    // Log Activity
    await logActivity({
      type: "inventory_updated",
      title: "New Spare Part Added",
      description: `Added "${part.name}" (SKU: ${part.sku}) to storage location ${part.location || "N/A"}`,
      userName: req.user?.name || "System",
      metadata: { sku: part.sku, initialStock: part.quantityInStock },
      entityType: "inventory",
      entityId: String(part._id)
    });

    res.status(201).json(part);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a spare part
exports.updatePart = async (req, res) => {
  try {
    const prevPart = await SparePart.findById(req.params.id);
    if (!prevPart) return res.status(404).json({ error: "Spare part not found" });

    const payload = { ...req.body };
    const quantity = payload.quantityInStock !== undefined ? payload.quantityInStock : prevPart.quantityInStock;
    const threshold = payload.minReorderThreshold !== undefined ? payload.minReorderThreshold : prevPart.minReorderThreshold;
    
    if (quantity > threshold) {
      payload.reorderStatus = 'ok';
    } else if (prevPart.reorderStatus === 'ok') {
      payload.reorderStatus = 'low-stock';
    }

    const part = await SparePart.findByIdAndUpdate(req.params.id, payload, { new: true });

    // Log Activity if stock count changed
    if (prevPart.quantityInStock !== part.quantityInStock) {
      await logActivity({
        type: "inventory_updated",
        title: "Spare Part Stock Updated",
        description: `Stock level for "${part.name}" changed from ${prevPart.quantityInStock} to ${part.quantityInStock}`,
        userName: req.user?.name || "System",
        metadata: { from: prevPart.quantityInStock, to: part.quantityInStock, sku: part.sku },
        entityType: "inventory",
        entityId: String(part._id)
      });
    }

    res.json(part);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a spare part
exports.deletePart = async (req, res) => {
  try {
    const part = await SparePart.findByIdAndDelete(req.params.id);
    if (!part) return res.status(404).json({ error: "Spare part not found" });

    // Log Activity
    await logActivity({
      type: "inventory_updated",
      title: "Spare Part Deleted",
      description: `Deleted "${part.name}" (SKU: ${part.sku}) from inventory`,
      userName: req.user?.name || "System",
      metadata: { sku: part.sku },
      entityType: "inventory",
      entityId: String(part._id)
    });

    res.json({ message: "Spare part deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reorder spare part manual procurement trigger
exports.reorderPart = async (req, res) => {
  try {
    const { reorderQuantity } = req.body;
    if (!reorderQuantity || reorderQuantity <= 0) {
      return res.status(400).json({ error: "Reorder quantity must be greater than zero." });
    }

    const part = await SparePart.findById(req.params.id);
    if (!part) return res.status(404).json({ error: "Spare part not found." });

    const NotificationService = require("../services/notificationService");
    
    // Dispatch procurement email
    if (part.supplierEmail) {
      await NotificationService.sendOnDemandReorderEmail(part, reorderQuantity);
    }

    // Update status to 'reordered'
    part.reorderStatus = "reordered";
    await part.save();

    // Log activity
    await logActivity({
      type: "inventory_updated",
      title: "Spare Part Reordered",
      description: `Dispatched reorder request for ${reorderQuantity} units of "${part.name}" (SKU: ${part.sku}) to supplier ${part.supplierEmail || "N/A"}`,
      userName: req.user?.name || "System",
      metadata: { sku: part.sku, reorderQuantity },
      entityType: "inventory",
      entityId: String(part._id)
    });

    res.json(part);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
