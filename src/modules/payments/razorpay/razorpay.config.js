import Razorpay from "razorpay";

const requiredConfig = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

export const razorpayConfig = {
    keyId: requiredConfig("RAZORPAY_KEY_ID"),
    keySecret: requiredConfig("RAZORPAY_KEY_SECRET"),
    webhookSecret: requiredConfig("RAZORPAY_WEBHOOK_SECRET"),
};

export const razorpayClient = new Razorpay({
    key_id: razorpayConfig.keyId,
    key_secret: razorpayConfig.keySecret,
});