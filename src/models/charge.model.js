import mongoose from 'mongoose';

const chargeExemptionSchema = new mongoose.Schema({
    //* if ALL_CONDITIONS use AND else use OR for charge exemption
    matchStrategy: {
        type: String,
        enum: ['ALL_CONDITIONS', 'ANY_CONDITION'],
        default: 'ALL_CONDITIONS',
        uppercase: true
    },

    conditions: {
        postalCodes: [{ type: String, trim: true }],
        minOrderAmount: { type: Number, min: 0 },
        paymentOption: { type: String, enum: ['COD', 'ONLINE'], uppercase: true },
        deliveryType: { type: String, uppercase: true },
        currency: { type: String, uppercase: true }
    }
}, {_id: false});

const chargeSchema = new mongoose.Schema({
    chargeName: {
        type: String,
        required: true,
        unique: true
    },  
    isActive:{
        type: Boolean,
        default: true
    },
    chargeType: {
        type: String,
        required: true,
        enum: ['FIXED', 'PERCENT'],
        default: 'FIXED',
        uppercase: true
    },

    chargeAmount: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value) {
                if (this.chargeType === "PERCENT") {
                    if (value < 0 || value > 100) {
                        return false;
                    }
                }
                return true;
            },
            message: "Invalid charge amount"
        }
    },

    policyType: {                      //* policyType defines charge must apply to all orders or based on conditions
        type: String,
        enum: ['ALWAYS_APPLY', 'CONDITIONAL'],
        default: 'CONDITIONAL',
        uppercase: true
    },

    chargeExemption: chargeExemptionSchema
});



const Charge = mongoose.model('Charge', chargeSchema);


export default Charge;