import DeliveryOption from "../../models/deliveryOption.model.js";

export const createDeliveryOption = async (deliveryOptionData) => {
    return DeliveryOption.create(deliveryOptionData);
};

export const updateDeliveryOption = async (deliveryOptionId, updates) => {
    return DeliveryOption.findByIdAndUpdate(
        deliveryOptionId,
        { $set: updates },
        { returnDocument: "after", runValidators: true }
    );
};

export const initializeDeliveryOption = async () => {
    const filter = { optionName: 'Standard Shipping' };

    const update = {
        $setOnInsert: {
            optionName: 'Standard Shipping',
            description: '',
            availableCountries: [],
            exemptedCountries: [],
            availablePostalCodes: [],
            exemptedPostalCodes: [],
            isActive: true
        }
    };
    try{
        //initialize a single deliveryOption by default to prevent failures
        await DeliveryOption.updateOne(filter, update, { upsert: true });
    }catch(e){
        console.log("error occurred during delivery option initialization");
        throw e;
    }
}
export const deleteDeliveryOption = async (deliveryOptionId) => {
    return DeliveryOption.findByIdAndDelete(deliveryOptionId);
};

export const getAllDeliveryOptions = async (filter = {}) => {
    return DeliveryOption.find(filter).sort({ optionName: 1 }).lean();
};