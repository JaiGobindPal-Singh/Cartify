import { paypalConfig } from "./paypal.config.js";

const paypalRequest = async (path, options = {}) => {
    const response = await fetch(`${paypalConfig.baseUrl}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`PayPal API request failed with status ${response.status}`);
    }
    return body;
};

const getAccessToken = async () => {
    const credentials = Buffer
        .from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`)
        .toString("base64");
    const response = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
        throw new Error(`PayPal access token request failed with status ${response.status}`);
    }
    return body.access_token;
};

export const createOrder = async ({ amount, currency, referenceId } = {}) => {
    console.log(amount, currency);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("PayPal amount must be a positive number");
    }
    if (!currency?.trim()) throw new Error("PayPal currency is required");
    if (!referenceId?.trim()) throw new Error("PayPal referenceId is required");

    const accessToken = await getAccessToken();
    return paypalRequest("/v2/checkout/orders", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Prefer: "return=representation",
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
                reference_id: referenceId.trim(),
                amount: {
                    currency_code: currency.trim().toUpperCase(),
                    value: numericAmount.toFixed(2),
                },
            }],
        }),
    });
};

export const verifyWebhookSignature = async ({ headers, webhookEvent }) => {
    const accessToken = await getAccessToken();
    return paypalRequest("/v1/notifications/verify-webhook-signature", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
            auth_algo: headers["paypal-auth-algo"],
            cert_url: headers["paypal-cert-url"],
            transmission_id: headers["paypal-transmission-id"],
            transmission_sig: headers["paypal-transmission-sig"],
            transmission_time: headers["paypal-transmission-time"],
            webhook_id: paypalConfig.webhookId,
            webhook_event: webhookEvent,
        }),
    }).then((result) => result.verification_status === "SUCCESS");
};