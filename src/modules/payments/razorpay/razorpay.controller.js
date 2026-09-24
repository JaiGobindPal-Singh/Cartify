import { verifyWebhookSignature } from "./razorpay.service.js";

const supportedEvents = new Map([
    ["payment.captured", "SUCCESS"],
    ["payment.failed", "FAILED"],
]);

const getRawBody = (req) => {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
    return null;
};

const normalizePayment = (event, payload) => {
    const payment = payload?.payload?.payment?.entity;
    if (!payment?.order_id || !payment?.id) return null;

    return {
        paymentGateway: "RAZORPAY",
        transactionOrderId: payment.order_id,
        transactionId: payment.id,
        paymentMethod: payment.method || "UNKNOWN",
        currency: payment.currency,
        amount: Number(payment.amount) / 100,
        status: supportedEvents.get(event),
    };
};

export const razorpayWebhookController = (req, res, next) => {
    try {
        const rawBody = getRawBody(req);
        const signature = req.get("x-razorpay-signature");

        if (!rawBody || !verifyWebhookSignature(rawBody, signature)) {
            return res.status(400).json({ error: "Invalid Razorpay webhook signature" });
        }

        let payload;
        try {
            payload = JSON.parse(rawBody.toString("utf8"));
        } catch {
            return res.status(400).json({ error: "Malformed Razorpay webhook payload" });
        }

        const status = supportedEvents.get(payload.event);
        if (!status) return res.status(204).end();

        const payment = normalizePayment(payload.event, payload);
        if (!payment) return res.status(400).json({ error: "Incomplete Razorpay payment payload" });

        req.payment = payment;
        return next();
    } catch (error) {
        console.error("Razorpay webhook error:", error.message);
        return res.status(400).json({ error: "Invalid Razorpay webhook" });
    }
};