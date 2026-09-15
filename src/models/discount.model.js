import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true // Standardizes codes like "SAVE10"
    },
    title: {
        type: String,
        trim: true
    },

    // 1. Discount Value Fields
    discountType: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['FIXED', 'PERCENT']
    },
    discountValue: {
        type: Number,
        required: true,
        min: [0, 'Discount value cannot be negative'],
        validate: {
            validator: function (value) {
                // Enforces that percentage discounts cannot exceed 100%
                if (this.discountType === 'PERCENT' && (value > 100 || value < 0)) {
                    return false;
                }
                return true;
            },
            message: 'Percentage discount cannot be greater than 100% or less than 0%'
        }
    },

    // 2. Discount Conditions
    conditions: {
        minCartValue: {
            type: Number,
            default: 0,
            min: 0
        },
        newUserOnly: {
            type: Boolean,
            default: false
        },
        currency: {
            type: String,
            trim: true,
            uppercase: true
        },
        maxDiscountAmount: {
            type: Number, // Useful cap for PERCENT discounts (e.g., 50% off up to ₹500)
            min: 0,
            default: null
        },
        usageLimitTotal: {
            type: Number, // Total times this coupon can ever be used across the store
            default: null
        },
    },

    // 3. Validity
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Pre-save hook to automatically deactivate expired coupons on save
discountSchema.pre('save', function () {
    if (this.endDate && this.endDate < new Date()) {
        this.isActive = false;
    }
});

const Discount = mongoose.model('Discount', discountSchema);
export default Discount;
