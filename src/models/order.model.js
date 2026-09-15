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
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    charges: {
        type: [chargeSchema],
        default: []
    },
    totalBill: {
        type: Number,
        required: true
    },
    billingAddress: {
        type: addressSchema,
        required: true
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
        currency: {
            type: String,
            required: true,
            uppercase: true
        },
        amount: {
            type: Number,
            required: true
        }
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
    },

    billing: billingSchema,

    deliveryDetails: {
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


const Order = mongoose.model('Order', orderSchema);

export default Order;