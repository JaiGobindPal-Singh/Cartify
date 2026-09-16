import mongoose from "mongoose";

const deliveryOptionsSchema = new mongoose.Schema({
    optionName: {
        type: String,
        required: true,
        unique: true
    }, 
    description: {
        type: String,
        maxLength: 200
    },
    availableCountries: {
        type: [String],                     // [ ] mean available at all locations 
        default: [],    
        required: true,
    },
    availablePostalCodes:{
        type: [String],                     // [ ] mean available at all locations 
        default: [],    
        required: true,
    }
});
const DeliveryOptions = mongoose.model('DeliveryOption', deliveryOptionsSchema);
export default DeliveryOptions;