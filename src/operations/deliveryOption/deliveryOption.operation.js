import DeliveryOption from "../../models/deliveryOption.model.js";

export const createDeliveryOption = async (deliveryOptionData) => {
    return DeliveryOption.create(deliveryOptionData);
};

export const updateDeliveryOption = async (deliveryOptionId, updates) => {
    return DeliveryOption.findByIdAndUpdate(
        deliveryOptionId,
        { $set: updates },
        { new: true, runValidators: true }
    );
};

export const deleteDeliveryOption = async (deliveryOptionId) => {
    return DeliveryOption.findByIdAndDelete(deliveryOptionId);
};

export const getAllDeliveryOptions = async (filter = {}) => {
    return DeliveryOption.find(filter).sort({ optionName: 1 }).lean();
};