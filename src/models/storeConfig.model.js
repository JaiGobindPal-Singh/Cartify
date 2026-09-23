/**
 * @brief StoreConfig model
 * @description This model represents the configuration settings for the store, including supported currencies, order conditions, and payment options.
 */
import mongoose from 'mongoose';

const storeConfigSchema = new mongoose.Schema({

    _id: {                      //fixed _id for the store config document to ensure only one document exists
        type: String,
        default: "store-config",
        required: true,
    },
    //supported currencies for the store
    supportedCurrencies: {
        type: [String],
        default: ["USD"],
        required: true,
        uppercase: true,
        trim: true,
    },

    //conditions for order placement
    orderConditions: {
        minAmount: [{
            currency: {type:String, uppercase: true},
            amount: {type: Number, min: 0},
        }],
        // Allows you to define global rules or highly targeted country-specific rules
        deliveryZones: [{
            country: {
                type: String,
                required: true // e.g., "US", "IN", or "GLOBAL"
            },
            isExempted: {
                type: Boolean,
                default: false // If true, this entire country is blocked
            },
            availablePostalCodes: {
                type: [String],
                default: [], // [] means the whole country is allowed
            },
            exemptedPostalCodes: {
                type: [String],
                default: [], // Specific zip codes in THIS country to block
            }
        }]
    },

    //payment options for the store
    paymentOptions: {
        online: {
            enabled: {
                type: Boolean,
                default: true,
                required: true
            }
        },
        cod: {
            enabled: {
                type: Boolean,
                default: false,
                required: true
            },
            allowedCountries: {
                type: [{
                    type: String,
                    trim: true,
                }],
                default: [] // if empty, COD is allowed for all countries  
            }
        }
    }
});

const StoreConfig = mongoose.model("StoreConfig", storeConfigSchema);
export default StoreConfig;