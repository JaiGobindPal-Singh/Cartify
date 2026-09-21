import mongoose from 'mongoose';

// subDocument schema for pricing tiers
const pricingTiersSchema = new mongoose.Schema({
    minQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    pricing: {
        type: [{
            currency: {
                type: String,
                required: true,
                trim: true,
                uppercase: true
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }],
        validate: [
            {
                validator: function (v) {
                    return Array.isArray(v) && v.length >= 1;
                },
                message: props => `${props.path} must have at least 1 item!`
            },
            {
                // 🌟 Custom validator to prevent duplicate currencies in the same array
                validator: function (v) {
                    const currencies = v.map(item => item.currency);
                    return currencies.length === new Set(currencies).size;
                },
                message: 'Duplicate currencies are not allowed in the pricing array!'
            }
        ]
    }
}, { _id: false });

const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxLength: 100
    },
    value: {
        type: String,
        required: true,
        maxLength: 100
    }
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    heading: {                          //section head
        type: String,
        required: true,
        maxLength: 100
    },
    content: {                              //actual paragraph content
        type: String,
        maxLength: 2000
    },
    attributes: {                           //content in tabular form for like ingredients and nutritional info
        type: [attributeSchema]
    }

}, { _id: false });

const purchaseOptionsSchema = new mongoose.Schema({
    optionName: {
        type: String,
        required: true,
        maxLength: 100
    },
    optionValues: {
        type: [{
            option: String,
            pricingChange: [{
                currency: {
                    type: String,
                    required: true,
                    uppercase: true,
                },
                priceChange: {
                    type: Number,
                    required: true,
                    default: 0
                }
            }]
        }],
        required: true,
        maxLength: 100
    }
}, { _id: false });

const defaultPricingSchema = new mongoose.Schema({
    currency: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    comparePrice: {
        type: Number,
        min: 0,
        validate: {
            validator: function (value) {
                return value >= 0 && value > this.price;
            },
            message: 'comparePrice must be greater than price and cannot be negative'
        }
    }
}, { _id: false });

const variantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        product: {              //parent product id
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            index: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            trim: true,
            default: [],
        },
        keywords: {
            type: [String],
            trim: true,
            default: [],
        },
        description: {       //short product description
            type: String,
            required: true,
            trim: true,
        },
        sections: {             //sections of description like ingredients, nutritional info, additional info etc
            type: [sectionSchema]
        },
        imageUrls: {
            type: [
                {
                    type: String,
                    trim: true,
                }
            ],
            validate: {
                validator: function (val) {
                    return val.length <= 5;
                },
                message: 'max 5 images allowed'
            }
        },
        ranking: {                  //product ranking higher is better, automatically changed based on user purchases 
            type: Number,
            default: 0,
        },
        pricing: {                  //product pricing in different currencies, with compare price for discounts
            type: [defaultPricingSchema],
            validate: [{
                // Custom validator to ensure at least one currency pricing is provided
                validator: function (v) {
                    return Array.isArray(v) && v.length >= 1;
                },
                message: props => `${props.path} must have at least 1 currency pricing!`
            },
            {
                // Custom validator to prevent duplicate currencies in the same array
                validator: function (v) {
                    const currencies = v.map(item => item.currency);
                    return currencies.length === new Set(currencies).size;
                },
                message: 'Duplicate currencies are not allowed in the pricing array!'
            }
            ]
        },

        pricingTiers: {         //different tiers of pricing based on quantity, for bulk discounts
            type: [pricingTiersSchema],
            default: []
        },

        purchaseOptions: {   //purchase options like size, color, etc. with pricing changes for each option
            type: [purchaseOptionsSchema],
            default: []
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },
        isUpcoming: {
            type: Boolean,
            default: false
        },

        isDeleted: {                                  //if isDeleted is true product will not be visible
            type: Boolean,
            default: false
        },
        availableStock: { type: Number, required: true, min: 0, default: 0, validate: {validator: Number.isInteger, message: '{VALUE} is not an integer value'}}, // Items available for sale
            reservedStock: { type: Number, required: true, min: 0, default: 0, validate: {validator: Number.isInteger, message: '{VALUE} is not an integer value'}}, // Items in pending carts/orders
    });

const ProductVariant = mongoose.model('ProductVariant', variantSchema);

export default ProductVariant;