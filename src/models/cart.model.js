import mongoose from "mongoose";

// Schema for individual items within the cart
export const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true
    },
    productOptions: {
        type: [{
            optionName: String,
            optionValue: String
        }]
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1.'],
        default: 1
    }
}, { _id: false });


const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: {
        type: [cartItemSchema],
        default: []
    },
}, {
    timestamps: true
})

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;