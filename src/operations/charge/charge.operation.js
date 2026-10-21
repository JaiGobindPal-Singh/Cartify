import Charge from "../../models/charge.model.js";

export const createCharge = async (chargeData) => {
    return Charge.create(chargeData);
};

export const updateCharge = async (chargeId, updates) => {
    return Charge.findByIdAndUpdate(
        chargeId,
        { $set: updates },
        { returnDocument: "after", runValidators: true }
    );
};

export const deleteCharge = async (chargeId) => {
    return Charge.findByIdAndDelete(chargeId);
};

export const getAllCharges = async (filter = {}) => {
    return Charge.find(filter).select("chargeName isActive chargeType chargeAmount").lean();
};

const normalize = (value) => typeof value === "string" ? value.trim().toUpperCase() : value;

//this method will match the conditions with charge conditions
const matchesCondition = (condition, matchStrategy, order) => {
    const checks = [];

    if (condition.postalCodes?.length) {
        checks.push(condition.postalCodes.map(normalize).includes(normalize(order.postalCode)));
    }
    if (condition.countries?.length) {
        checks.push(condition.countries.map(normalize).includes(normalize(order.country)));
    }
    if (condition.minOrderAmount !== undefined && condition.minOrderAmount !== null) {
        checks.push(order.cartValue >= condition.minOrderAmount);
    }
    if (condition.paymentOption) {
        checks.push(normalize(condition.paymentOption) === normalize(order.paymentOption));
    }
    if (condition.deliveryType) {
        checks.push(normalize(condition.deliveryType) === normalize(order.deliveryType));
    }
    if (condition.currency) {
        checks.push(normalize(condition.currency) === normalize(order.currency));
    }

    if (!checks.length) return false;  //return false if charge conditions not met
    return matchStrategy === "ANY_CONDITION"                //matching conditions based on match strategy
        ? checks.some(Boolean)
        : checks.every(Boolean);
};

export const getApplicableCharges = async (order) => {
    const charges = await Charge.find({ isActive: true }).sort({ chargeName: 1 }).lean();

    return charges
        .filter((charge) => {
            if (charge.policyType === "ALWAYS_APPLY") return true;
            return !matchesCondition(
                charge.chargeExemption?.conditions || {},
                charge.chargeExemption?.matchStrategy,
                order
            );
        })
        .map((charge) => ({
            chargeName: charge.chargeName,
            chargeAmount: charge.chargeType === "PERCENT"
                ? order.cartValue * charge.chargeAmount / 100
                : charge.chargeAmount,
        }));
};

export const getCharge = async (chargeId) => {
  return Charge.findById(chargeId).lean();

}
