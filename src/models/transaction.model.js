import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        // User who made the payment
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        //order id
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        // payment gateway details
        paymentGateway: {
            type: String,
            required: true,
        },
        transactionOrderId: {
            type: String,
            required: true,
            unique: true,
        },
        transactionId: {
            type: String,
            default: null,
        },
        refundId: {                 //IF ORDER IS REFUNDED
            type: String,
            default: null
        },
        currency: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: [
                "PENDING",
                "SUCCESS",
                "FAILED",
                "REFUNDED",
            ],
            uppercase: true,
            default: "PENDING",
        },

        refundedAmount: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Inside your Transaction schema file
transactionSchema.index(
    { status: 1, createdAt: -1 },
    {
        partialFilterExpression: {
            status: 'PENDING'
        }
    }
);

export default mongoose.model('Transaction', transactionSchema);