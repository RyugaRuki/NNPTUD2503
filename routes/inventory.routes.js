const express = require("express");
const router = express.Router();
const {
  getAllInventories,
  getInventoryById,
  getInventoryByProduct,
  addStock,
  removeStock,
  reservation,
  sold,
} = require("../controllers/inventory.controller");

// ─── READ ──────────────────────────────────────────────────────────────────
router.get("/", getAllInventories);
router.get("/:id", getInventoryById);
router.get("/product/:productId", getInventoryByProduct);

// ─── WRITE ─────────────────────────────────────────────────────────────────
router.post("/add-stock", addStock);
router.post("/remove-stock", removeStock);
router.post("/reservation", reservation);
router.post("/sold", sold);

module.exports = router;