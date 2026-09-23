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
    discountValue: [{
        currency: String,
        amount: {
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
        }
    }],

    // 2. Discount Conditions
    conditions: {
        minCartValue: {
            type: Number,
            default: 0,
            min: 0
        },
        newUserOnly: {    //todo will be implemented later after orders
            type: Boolean,
            default: false
        },
        maxDiscountAmount: {
            type: Number, // Useful cap for PERCENT discounts (e.g., 50% off up to ₹500)
            min: 0,
            default: null
        },
        usageLimitTotal: {
            type: Number, // Total times this coupon can ever be used across the store
            default: null,
            min: 0
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
        required: true,
        validate: {
            validator: function (value) {
                // On document saves, `this` is the document. On updates with
                // runValidators enabled, `this` is the query.
                if (this instanceof mongoose.Query) {
                    const update = this.getUpdate() || {};
                    const startDate = update.$set?.startDate ?? update.startDate;

                    // For a partial update, startDate is not available here;
                    // MongoDB keeps the existing value, so validate endDate
                    // only when both dates are supplied in the update.
                    return !startDate || new Date(value) > new Date(startDate);
                }

                return !this.startDate || value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Pre-save hook to automatically deactivate expired coupons on save but require cron job to check for expired coupons and deactivate them
discountSchema.pre('save', function () {
    if (this.endDate && this.endDate < new Date()) {
        this.isActive = false;
    }
});

const Discount = mongoose.model('Discount', discountSchema);
export default Discount;
