import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true,
        unique: true // Use unique if a product exists in only one warehouse
    },
    availableStock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, required: true, min: 0, default: 0 }, // Items in pending carts/orders
}, { timestamps: true });

// Index for quick stock checks during checkout
inventorySchema.index({ productId: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;