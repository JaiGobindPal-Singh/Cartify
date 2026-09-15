import mongoose from 'mongoose';

const paymentOptionsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: "payment-options"
    },
    online: {
        enabled:{
            type: Boolean,
            default: true,
            required: true
        }
    },
    cod: {
        enabled:{
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
})

const PaymentOptions = mongoose.model("PaymentOption", paymentOptionsSchema);
export default PaymentOptions;
