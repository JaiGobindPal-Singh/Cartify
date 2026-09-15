import mongoose from "mongoose"
const orderConditionSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: "order-conditions"
    },
    minAmount:{
        type: Number,
        default: 0,
        unique: true
    },
    availableCountries: {
        type: [String],
        default: [],            // [] means delivery available at all countries
    },
    availablePostalCodes: {
        type: [String],
        default: [],            // [] means delivery available at all locations
    }
});

const OrderCondition = mongoose.model("OrderCondition", orderConditionSchema);
export default OrderCondition;
