const express = require("express");
const router = express.Router();
const Product = require("../models/product.model");

// ─── CREATE PRODUCT (triggers auto inventory creation via post-save hook) ───
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: "Product created and inventory initialized",
      data: product,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── GET ALL PRODUCTS ──────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET PRODUCT BY ID ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;