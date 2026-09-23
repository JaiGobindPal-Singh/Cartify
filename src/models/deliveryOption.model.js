import mongoose from "mongoose";

const deliveryOptionsSchema = new mongoose.Schema(
    {
        optionName: {
            type: String,
            required: [true, 'Delivery option name is required.'],
            unique: true,
            trim: true,
            maxLength: [50, 'Option name cannot exceed 50 characters.']
        },
        description: {
            type: String,
            trim: true,
            maxLength: [100, 'Description cannot exceed 100 characters.']
        },
        availableCountries: {
            type: [String],
            default: [],
            uppercase: true
        },
        exemptedCountries: {
            type: [String],
            default: [],
            uppercase: true
        },
        availablePostalCodes: {
            type: [String],
            default: []
        },
        exemptedPostalCodes: {
            type: [String],
            default: []
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }
);
const DeliveryOptions = mongoose.model('DeliveryOption', deliveryOptionsSchema);
export default DeliveryOptions;