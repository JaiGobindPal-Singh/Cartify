import mongoose from "mongoose";

// Schema for individual items within the cart
export const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true
    },
    purchaseOptions: {
        type: [{
            optionName: String,
            optionValue: String
        }]
    },
    quantity: {
        type: Number,
        required: true,
        validate:{
            //integer validation for quantity
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value for quantity'
        },
        min: [1, 'Quantity cannot be less than 1.'],
        default: 1
    }
});


const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true, // Each user can have only one cart
    },
    items: {
        type: [cartItemSchema],
        default: [],
        validate: {
            //validator to ensure unique product variants in the cart
            validator: async function (items) {
                // Allow empty cart or non-array values to pass validation
                if (!Array.isArray(items) || items.length === 0) {
                    return true;
                }

                //extract product ids from the items array
                const productIds = items.map(item => {
                    const pid = item.product ? item.product.toString() : '' //extract product id as string

                    //extract product options as string
                    const optionArr = item.purchaseOptions || []; //default to empty array if productOptions is undefined

                    const poption = optionArr.map(opt => `${opt.optionName}:${opt.optionValue}`).sort().join('|');

                    return `${pid}-${poption}`; //combine product id and options to create a unique identifier

                });

                //check if there are any duplicates in the productIds array
                const uniqueProductIds = new Set(productIds);
                return uniqueProductIds.size === productIds.length;
            },
            message: 'Duplicate product variants are not allowed in the cart!'
        }
    },
}, {
    timestamps: true
})

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;