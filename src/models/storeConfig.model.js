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
        unique: true
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
        minAmount: {
            type: Number,
            default: 0,
        },
        availableCountries: {
            type: [String],
            default: [],            // [] means delivery available at all countries
        },
        availablePostalCodes: {
            type: [String],
            default: [],            // [] means delivery available at all locations
        }
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
            },
            allowedPostalCodes: {
                type: [{
                    type: String,
                    trim: true,
                }],
                default: [] // if empty, COD is allowed for all postal codes  //for optional cod at certain locations, we can add postal codes here
            },
        }
    }
});

const StoreConfig = mongoose.model("StoreConfig", storeConfigSchema);
export default StoreConfig;