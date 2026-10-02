const requiredConfig = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const environment = (process.env.PAYPAL_ENVIRONMENT || "sandbox").toLowerCase();

export const paypalConfig = {
    clientId: requiredConfig("PAYPAL_CLIENT_ID"),
    clientSecret: requiredConfig("PAYPAL_SECRET"),
    webhookId: requiredConfig("PAYPAL_WEBHOOK_ID"),
    environment,
    baseUrl: environment === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
};