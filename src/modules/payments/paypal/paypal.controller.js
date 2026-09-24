import { verifyWebhookSignature } from "./paypal.service.js";

const eventStatuses = new Map([
    ["PAYMENT.CAPTURE.COMPLETED", "SUCCESS"],
    ["PAYMENT.CAPTURE.DENIED", "FAILED"],
    ["PAYMENT.CAPTURE.DECLINED", "FAILED"],
    ["PAYMENT.CAPTURE.REVERSED", "FAILED"],
]);

const getRawBody = (req) => {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
    return null;
};

const normalizePayment = (eventType, event) => {
    const resource = event?.resource;
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    const amount = resource?.amount;
    if (!orderId || !resource?.id || !amount?.value || !amount?.currency_code) return null;

    return {
        paymentGateway: "PAYPAL",
        transactionOrderId: orderId,
        transactionId: resource.id,
        paymentMethod: "PAYPAL",
        currency: amount.currency_code,
        amount: Number(amount.value),
        status: eventStatuses.get(eventType),
    };
};

export const paypalWebhookController = async (req, res, next) => {
    try {
        const rawBody = getRawBody(req);
        if (!rawBody) return res.status(400).json({ error: "Raw PayPal webhook body is required" });

        let event;
        try {
            event = JSON.parse(rawBody.toString("utf8"));
        } catch {
            return res.status(400).json({ error: "Malformed PayPal webhook payload" });
        }

        const verified = await verifyWebhookSignature({
            headers: req.headers,
            webhookEvent: event,
        });
        if (!verified) return res.status(400).json({ error: "Invalid PayPal webhook signature" });

        if (!eventStatuses.has(event.event_type)) return res.status(204).end();

        const payment = normalizePayment(event.event_type, event);
        if (!payment) return res.status(400).json({ error: "Incomplete PayPal payment payload" });

        req.payment = payment;
        return next();
    } catch (error) {
        console.error("PayPal webhook error:", error.message);
        return res.status(400).json({ error: "Invalid PayPal webhook" });
    }
};