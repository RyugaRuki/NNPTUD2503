const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Auto-create Inventory when a new Product is created ───────────────────
productSchema.post("save", async function (doc, next) {
  // Only run on first save (new document)
  if (!this.wasNew) return next();

  try {
    const Inventory = require("./inventory.model");
    await Inventory.create({ product: doc._id });
  } catch (err) {
    // If inventory already exists (unique constraint), silently ignore
    if (err.code !== 11000) {
      console.error("Failed to create inventory for product:", err.message);
    }
  }
  next();
});

// Mark document as new before first save
productSchema.pre("save", function (next) {
  this.wasNew = this.isNew;
  next();
});

module.exports = mongoose.model("Product", productSchema);