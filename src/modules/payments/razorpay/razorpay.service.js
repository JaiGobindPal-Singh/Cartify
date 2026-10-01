import crypto from "node:crypto";
import { razorpayClient, razorpayConfig } from "./razorpay.config.js";

const toPaise = (amount) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("Razorpay amount must be a positive number");
    }
    return Math.round(numericAmount * 100);
};

//create razorpay order
export const createOrder = async ({ amount, currency, receipt, notes } = {}) => {
    if (!currency?.trim()) throw new Error("Razorpay currency is required");
    if (!receipt?.trim()) throw new Error("Razorpay receipt is required");

    const response = await razorpayClient.orders.create({
        amount: toPaise(amount),
        currency: currency.trim().toUpperCase(),
        receipt: receipt.trim(),
        ...(notes && { notes }),
    });
    return {...response, keyId: razorpayConfig?.keyId};
};

export const verifyWebhookSignature = (rawBody, signature) => {
    if (!Buffer.isBuffer(rawBody) || !signature) return false;

    const expectedSignature = crypto
        .createHmac("sha256", razorpayConfig.webhookSecret)
        .update(rawBody)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
};