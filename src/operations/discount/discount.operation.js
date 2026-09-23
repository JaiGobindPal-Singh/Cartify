import Discount from "../../models/discount.model.js";
import Order from "../../models/order.model.js";

export const createDiscount = async (discountData) => {
    return Discount.create(discountData);
};

export const getDiscounts = async ({ pageNumber, pageSize }) => {
    const filter = {};
    const [discounts, discountCount] = await Promise.all([
        Discount.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        Discount.countDocuments(filter),
    ]);

    return {
        discounts,
        discountCount,
    };
};

export const updateDiscount = async (discountId, updates) => {
    return Discount.findByIdAndUpdate(
        discountId,
        { $set: updates },
        { new: true, runValidators: true }
    );
};

export const deleteDiscount = async (discountId) => {
    return Discount.findByIdAndDelete(discountId);
};

export const validateDiscount = async ({ code, cartTotal, currency, userId }) => {
    const now = new Date();
    const discount = await Discount.findOne({
        code: code.trim().toUpperCase(),
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gt: now }
    }).lean();

    if (!discount) {
        return { error: "Discount code is invalid or expired" };
    }

    const normalizedCurrency = currency.trim().toUpperCase();

    const discountValue = discount.discountValue.find(
        (value) => value.currency?.trim().toUpperCase() === normalizedCurrency
    );
    if (!discountValue) {
        return { error: "Discount code is not available in this currency" };
    }

    if (cartTotal < (discount.conditions?.minCartValue || 0)) {
        return {
            error: `Cart total must be at least ${discount.conditions.minCartValue}`
        };
    }

    if (discount.conditions?.newUserOnly) {
        const previousOrder = await Order.exists({ user: userId });
        if (previousOrder) {
            return { error: "Discount code is only available to new users" };
        }
    }

    let discountAmount = discount.discountType === "PERCENT"
        ? cartTotal * discountValue.amount / 100
        : discountValue.amount;

    if (discount.conditions?.maxDiscountAmount !== null &&
        discount.conditions?.maxDiscountAmount !== undefined) {
        discountAmount = Math.min(discountAmount, discount.conditions.maxDiscountAmount);
    }

    discountAmount = Math.min(discountAmount, cartTotal);

    return {
        code: discount.code,
        title: discount.title,
        discountType: discount.discountType,
        currency: normalizedCurrency,
        discountAmount,
        cartTotal,
        totalAfterDiscount: cartTotal - discountAmount
    };
};