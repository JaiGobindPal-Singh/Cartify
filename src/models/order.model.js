import mongoose from 'mongoose';
import { statusEnum } from '../constants/orderStatuses.js';

const chargeSchema = new mongoose.Schema({
    chargeName: {
        type: String,
        required: true,
    },
    chargeAmount: {
        type: Number,
        required: true
    }
}, { _id: false });

const addressSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        streetAddress: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        city: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        state: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        postalCode: {
            type: String,
            trim: true,
            required: true,
        },
        country: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        }
    }, { _id: false });

const billingSchema = new mongoose.Schema({
    paymentMode: {
        type: String,
        enum: ["COD", "ONLINE"],
        default: "ONLINE",
        required: true,
        trim: true,
        uppercase: true
    },
    currency: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    charges: {
        type: [chargeSchema],
        default: []
    },
    totalBill: {
        type: Number,
        required: true,
        min: 0
    },
    billingAddress: {
        type: addressSchema,
        required: true
    }
}, { _id: false });

const deliveryDetailsSchema = new mongoose.Schema({
    deliveryAddress: {
        type: addressSchema,
        required: true,
    },
    //type of delivery standard, express, same-day, etc. based on delivery options available
    deliveryType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryOption',
        required: true
    },
    //below if using external delivery partners
    deliveryPartner: {
        type: String,
        trim: true,
        default: ""
    },
    trackingId: {
        type: String,
        trim: true,
        default: ""
    }
}, { _id: false });


// Schema for individual items records within the order
export const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true
    },
    purchasePrice: {
        amount: {
            type: Number,
            required: true,
            min: 0
        }
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
        validate: {
            //integer validation for quantity
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value for quantity'
        },
        min: [1, 'Quantity cannot be less than 1.'],
        default: 1
    }
}, { _id: false });


const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: statusEnum,
        uppercase: true,
        trim: true,
        required: true,
        default: 'PAYMENT_PENDING'
    },
    statusHistory: [{
        status: {
            type: String,
            required: true,
            enum: statusEnum,
            uppercase: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],

    items: {
        type: [cartItemSchema],
        required: true,
        validate: {
            //validator to ensure unique product variants in the cart
            validator: async function (items) {
                // check if items is an array and has at least one item
                if (!Array.isArray(items) || items.length === 0) {
                    return false;
                }

                //extract products from array and create unique identifier for uniqueness
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

    billing: {
        type: billingSchema,
        required: true
    },

    deliveryDetails: {
        type: deliveryDetailsSchema,
        required: true
    },

    cancellationReason: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    returnReason: {
        type: String,
        trim: true,
        maxLength: 1000
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        default: null
    }
}, {
    timestamps: true
});

// Add this right below your schema definition, before mongoose.model('Order', orderSchema)
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
