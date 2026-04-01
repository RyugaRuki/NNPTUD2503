const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/inventories", require("./routes/inventory.routes"));
app.use("/api/messages", require("./routes/message.routes"));

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Inventory API is running" });
});

// ─── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ─── DB + Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/inventory_db";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

module.exports = app;