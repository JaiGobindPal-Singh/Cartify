import {
    createDiscount,
    getDiscounts,
    updateDiscount,
    deleteDiscount,
    validateDiscount,
} from "../operations/discount/discount.operation.js";
import { validateMongoId, cleanMongoObject } from "../utils/mongo.utils.js";

const discountFields = [
    "code",
    "title",
    "discountType",
    "discountValue",
    "conditions",
    "startDate",
    "endDate",
    "isActive",
];

const pickDiscountFields = (body) => Object.fromEntries(
    discountFields
        .filter((field) => body[field] !== undefined)
        .map((field) => [field, body[field]])
);

const handleDiscountError = (error, res) => {
    if (error?.code === 11000) {
        return res.status(409).json({ error: "A discount with this code already exists" });
    }

    if (error?.name === "ValidationError") {
        return res.status(400).json({
            error: "Invalid discount data",
            details: Object.values(error.errors).map(({ path, message }) => ({ path, message })),
        });
    }

    if (error?.name === "CastError") {
        return res.status(400).json({ error: "Invalid discount data" });
    }

    console.error("Discount error:", error);
    return res.status(500).json({ error: "Something went wrong on the server" });
};

export const addDiscountCodeController = async (req, res) => {
    try {
        const discountData = pickDiscountFields(req.body || {});
        if (!discountData.code?.trim()) {
            return res.status(400).json({ error: "Discount code is required" });
        }

        const discount = await createDiscount(discountData);
        return res.status(201).json({
            success: true,
            discount: cleanMongoObject(discount),
        });
    } catch (error) {
        return handleDiscountError(error, res);
    }
};

export const getDiscountsController = async (req, res) => {
    try {
        const pageNumber = req.query.pn
            ? Math.max(parseInt(req.query.pn, 10), 1) || 1
            : 1;
        const pageSize = req.query.ps
            ? Math.max(parseInt(req.query.ps, 10), 1) || 10
            : 10;

        const { discounts, discountCount } = await getDiscounts({ pageNumber, pageSize });
        const totalPages = Math.ceil(discountCount / pageSize);

        return res.status(200).json({
            success: true,
            discounts: discounts.map((discount) => ({
                ...discount,
                id: discount._id,
                _id: undefined,
                __v: undefined,
            })),
            totalPages,
            currentPage: pageNumber,
            hasNextPage: pageNumber < totalPages,
            hasPrevPage: pageNumber > 1,
        });
    } catch (error) {
        return handleDiscountError(error, res);
    }
};

export const validateDiscountController = async (req, res) => {
    try {
        const { code, cartTotal, currency } = req.body || {};
        const numericCartTotal = Number(cartTotal);

        if (!code?.trim() || !currency?.trim()) {
            return res.status(400).json({ error: "code, cartTotal and currency are required" });
        }
        if (!Number.isFinite(numericCartTotal) || numericCartTotal < 0) {
            return res.status(400).json({ error: "cartTotal must be a non-negative number" });
        }

        const result = await validateDiscount({
            code,
            cartTotal: numericCartTotal,
            currency,
            userId: req.user.id,
        });
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        return res.status(200).json({ success: true, discount: result });
    } catch (error) {
        return handleDiscountError(error, res);
    }
};

export const updateDiscountController = async (req, res) => {
    try {
        const { discountId } = req.params;
        if (!validateMongoId(discountId)) {
            return res.status(400).json({ error: "Invalid discount id" });
        }

        const updates = pickDiscountFields(req.body || {});
        if (!Object.keys(updates).length) {
            return res.status(400).json({ error: "At least one field is required" });
        }

        const discount = await updateDiscount(discountId, updates);
        if (!discount) {
            return res.status(404).json({ error: "Discount not found" });
        }

        return res.status(200).json({ success: true, discount: cleanMongoObject(discount) });
    } catch (error) {
        return handleDiscountError(error, res);
    }
};

export const deleteDiscountController = async (req, res) => {
    try {
        const { discountId } = req.params;
        if (!validateMongoId(discountId)) {
            return res.status(400).json({ error: "Invalid discount id" });
        }

        const discount = await deleteDiscount(discountId);
        if (!discount) {
            return res.status(404).json({ error: "Discount not found" });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return handleDiscountError(error, res);
    }
};