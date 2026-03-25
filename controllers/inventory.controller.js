const Inventory = require("../models/inventory.model");

// ─── Helper ────────────────────────────────────────────────────────────────
const validateQuantity = (quantity) => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("quantity must be a positive number");
  }
  return qty;
};

// ─── GET ALL ───────────────────────────────────────────────────────────────
/**
 * GET /api/inventories
 */
const getAllInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find()
      .populate("product", "name price description category createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inventories.length,
      data: inventories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET BY ID ─────────────────────────────────────────────────────────────
/**
 * GET /api/inventories/:id
 */
const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id).populate(
      "product",
      "name price description category createdAt"
    );

    if (!inventory) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });
    }

    res.status(200).json({ success: true, data: inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET BY PRODUCT ────────────────────────────────────────────────────────
/**
 * GET /api/inventories/product/:productId
 */
const getInventoryByProduct = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({
      product: req.params.productId,
    }).populate("product", "name price description category createdAt");

    if (!inventory) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found for this product" });
    }

    res.status(200).json({ success: true, data: inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADD STOCK ─────────────────────────────────────────────────────────────
/**
 * POST /api/inventories/add-stock
 * Body: { product: ObjectID, quantity: number }
 */
const addStock = async (req, res) => {
  try {
    const { product, quantity } = req.body;
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "product is required" });
    }

    const qty = validateQuantity(quantity);

    const inventory = await Inventory.findOneAndUpdate(
      { product },
      { $inc: { stock: qty } },
      { new: true, runValidators: true }
    ).populate("product", "name price");

    if (!inventory) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found for this product" });
    }

    res.status(200).json({
      success: true,
      message: `Added ${qty} units to stock`,
      data: inventory,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── REMOVE STOCK ──────────────────────────────────────────────────────────
/**
 * POST /api/inventories/remove-stock
 * Body: { product: ObjectID, quantity: number }
 */
const removeStock = async (req, res) => {
  try {
    const { product, quantity } = req.body;
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "product is required" });
    }

    const qty = validateQuantity(quantity);

    // Check available stock before decrementing
    const current = await Inventory.findOne({ product });
    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found for this product" });
    }
    if (current.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${current.stock}, requested: ${qty}`,
      });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { product },
      { $inc: { stock: -qty } },
      { new: true, runValidators: true }
    ).populate("product", "name price");

    res.status(200).json({
      success: true,
      message: `Removed ${qty} units from stock`,
      data: inventory,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── RESERVATION ───────────────────────────────────────────────────────────
/**
 * POST /api/inventories/reservation
 * Body: { product: ObjectID, quantity: number }
 * Decrements stock and increments reserved
 */
const reservation = async (req, res) => {
  try {
    const { product, quantity } = req.body;
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "product is required" });
    }

    const qty = validateQuantity(quantity);

    // Check available (unreserved) stock
    const current = await Inventory.findOne({ product });
    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found for this product" });
    }

    const availableStock = current.stock; // stock already represents available units
    if (availableStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock to reserve. Available: ${availableStock}, requested: ${qty}`,
      });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { product },
      { $inc: { stock: -qty, reserved: qty } },
      { new: true, runValidators: true }
    ).populate("product", "name price");

    res.status(200).json({
      success: true,
      message: `Reserved ${qty} units`,
      data: inventory,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── SOLD ──────────────────────────────────────────────────────────────────
/**
 * POST /api/inventories/sold
 * Body: { product: ObjectID, quantity: number }
 * Decrements reserved and increments soldCount
 */
const sold = async (req, res) => {
  try {
    const { product, quantity } = req.body;
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "product is required" });
    }

    const qty = validateQuantity(quantity);

    // Check reserved units
    const current = await Inventory.findOne({ product });
    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found for this product" });
    }
    if (current.reserved < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient reserved units. Reserved: ${current.reserved}, requested: ${qty}`,
      });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { product },
      { $inc: { reserved: -qty, soldCount: qty } },
      { new: true, runValidators: true }
    ).populate("product", "name price");

    res.status(200).json({
      success: true,
      message: `Sold ${qty} units`,
      data: inventory,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllInventories,
  getInventoryById,
  getInventoryByProduct,
  addStock,
  removeStock,
  reservation,
  sold,
};