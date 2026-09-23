import {
    createDeliveryOption,
    updateDeliveryOption,
    deleteDeliveryOption,
    getAllDeliveryOptions,
} from "../operations/deliveryOption/deliveryOption.operation.js";
import { validateMongoId, cleanMongoObject } from "../utils/mongo.utils.js";

const deliveryOptionFields = [
    "optionName",
    "description",
    "availableCountries",
    "exemptedCountries",
    "availablePostalCodes",
    "exemptedPostalCodes",
    "isActive",
];

const pickDeliveryOptionFields = (body) => Object.fromEntries(
    deliveryOptionFields
        .filter((field) => body[field] !== undefined)
        .map((field) => [field, body[field]])
);

const handleDeliveryOptionError = (error, res) => {
    if (error?.code === 11000) {
        const duplicateField = Object.keys(error.keyValue || {})[0] || "field";
        return res.status(409).json({
            error: `A delivery option with this ${duplicateField} already exists`,
        });
    }

    if (error?.name === "ValidationError") {
        return res.status(400).json({
            error: "Invalid delivery option data",
            details: Object.values(error.errors).map(({ path, message }) => ({ path, message })),
        });
    }

    if (error?.name === "CastError") {
        return res.status(400).json({ error: "Invalid delivery option data" });
    }

    console.error("Delivery option error:", error);
    return res.status(500).json({ error: "Something went wrong on the server" });
};

export const createDeliveryOptionController = async (req, res) => {
    try {
        const deliveryOptionData = pickDeliveryOptionFields(req.body || {});

        if (!deliveryOptionData.optionName?.trim()) {
            return res.status(400).json({ error: "Delivery option name is required" });
        }
    
        const deliveryOption = await createDeliveryOption(deliveryOptionData);
        return res.status(201).json({ success: true, deliveryOption: cleanMongoObject(deliveryOption) });
    } catch (error) {
        return handleDeliveryOptionError(error, res);
    }
};

export const updateDeliveryOptionController = async (req, res) => {
    try {
        const { deliveryOptionId } = req.params;

        if (!validateMongoId(deliveryOptionId)) {
            return res.status(400).json({ error: "Invalid delivery option id" });
        }

        const updates = pickDeliveryOptionFields(req.body || {});
        if (!Object.keys(updates).length) {
            return res.status(400).json({ error: "At least one field is required" });
        }

        const deliveryOption = await updateDeliveryOption(deliveryOptionId, updates);
        if (!deliveryOption) {
            return res.status(404).json({ error: "Delivery option not found" });
        }

        return res.status(200).json({ success: true, deliveryOption: cleanMongoObject(deliveryOption) });
    } catch (error) {
        return handleDeliveryOptionError(error, res);
    }
};

export const deleteDeliveryOptionController = async (req, res) => {
    try {
        const { deliveryOptionId } = req.params;

        if (!validateMongoId(deliveryOptionId)) {
            return res.status(400).json({ error: "Invalid delivery option id" });
        }

        const deliveryOption = await deleteDeliveryOption(deliveryOptionId);
        if (!deliveryOption) {
            return res.status(404).json({ error: "Delivery option not found" });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return handleDeliveryOptionError(error, res);
    }
};

export const getAllDeliveryOptionsController = async (req, res) => {
    try {
        const filter = req.query.includeInactive === "true" ? {} : { isActive: true };
        const deliveryOptions = (await getAllDeliveryOptions(filter));

        return res.status(200).json({ success: true, deliveryOptions });
    } catch (error) {
        return handleDeliveryOptionError(error, res);
    }
};