import {
    createCharge,
    updateCharge,
    deleteCharge,
    getAllCharges,
    getApplicableCharges,
    getCharge,
} from "../operations/charge/charge.operation.js";
import { validateMongoId, cleanMongoObject } from "../utils/mongo.utils.js";

const chargeFields = ["chargeName", "isActive", "chargeType", "chargeAmount", "policyType", "chargeExemption"];

const pickChargeFields = (body) => Object.fromEntries(
    chargeFields
        .filter((field) => body[field] !== undefined)
        .map((field) => [field, body[field]])
);

const handleChargeError = (error, res) => {
    if (error?.code === 11000) {
        return res.status(409).json({ error: "A charge with this name already exists" });
    }
    if (error?.name === "ValidationError" || error?.name === "CastError") {
        return res.status(400).json({
            error: "Invalid charge data",
            ...(error.name === "ValidationError" && {
                details: Object.values(error.errors).map(({ path, message }) => ({ path, message })),
            }),
        });
    }
    console.error("Charge error:", error);
    return res.status(500).json({ error: "Something went wrong on the server" });
};

export const addChargeController = async (req, res) => {
    try {
        const chargeData = pickChargeFields(req.body || {});
        if (!chargeData.chargeName?.trim()) {
            return res.status(400).json({ error: "Charge name is required" });
        }
        const charge = await createCharge(chargeData);
        return res.status(201).json({ success: true, charge: cleanMongoObject(charge) });
    } catch (error) {
        return handleChargeError(error, res);
    }
};

export const updateChargeController = async (req, res) => {
    try {
        const { chargeId } = req.params;
        if (!validateMongoId(chargeId)) {
            return res.status(400).json({ error: "Invalid charge id" });
        }
        const updates = pickChargeFields(req.body || {});
        if (!Object.keys(updates).length) {
            return res.status(400).json({ error: "At least one field is required" });
        }
        const charge = await updateCharge(chargeId, updates);
        if (!charge) return res.status(404).json({ error: "Charge not found" });
        return res.status(200).json({ success: true, charge: cleanMongoObject(charge) });
    } catch (error) {
        return handleChargeError(error, res);
    }
};

export const deleteChargeController = async (req, res) => {
    try {
        const { chargeId } = req.params;
        if (!validateMongoId(chargeId)) {
            return res.status(400).json({ error: "Invalid charge id" });
        }
        const charge = await deleteCharge(chargeId);
        if (!charge) return res.status(404).json({ error: "Charge not found" });
        return res.status(200).json({ success: true });
    } catch (error) {
        return handleChargeError(error, res);
    }
};

export const getChargeController = async (req, res) => {
  try {
    const { chargeId } = req.params;
    const charge = await getCharge(chargeId);
    if (!charge) return res.status(404).json({ error: "Charge not found" });
    return res.status(200).json({ success: true, charge });
  } catch (error) {
    return handleChargeError(error, res);
  }
};
export const getAllChargesController = async (req, res) => {
    try {
        const filter = req.query.includeInactive === "true" ? {} : { isActive: true };
        const charges = await getAllCharges(filter);
        return res.status(200).json({ success: true, charges });
    } catch (error) {
        return handleChargeError(error, res);
    }
};

export const getApplicableChargesController = async (req, res) => {
    try {
        const { deliveryAddress, currency, deliveryType, paymentOption, cartValue } = req.body || {};
        const numericCartValue = Number(cartValue);

        if (!deliveryAddress?.country || !deliveryAddress?.postalCode || !currency ||
            !deliveryType || !paymentOption) {
            return res.status(400).json({
                error: "deliveryAddress.country, deliveryAddress.postalCode, currency, deliveryType, paymentOption and cartValue are required",
            });
        }
        if (!Number.isFinite(numericCartValue) || numericCartValue < 0) {
            return res.status(400).json({ error: "cartValue must be a non-negative number" });
        }

        const charges = await getApplicableCharges({
            country: deliveryAddress.country,
            postalCode: deliveryAddress.postalCode,
            currency,
            deliveryType,
            paymentOption,
            cartValue: numericCartValue,
        });
        return res.status(200).json({ success: true, charges });
    } catch (error) {
        return handleChargeError(error, res);
    }
};
