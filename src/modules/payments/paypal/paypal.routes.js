import express from "express";
import { paypalWebhookController } from "./paypal.controller.js";
import { paymentResultController } from "../../../controllers/order.controller.js";

const router = express.Router();

router.post(
	"/webhook",
	express.raw({ type: "application/json" }),
	paypalWebhookController,
	paymentResultController
);

export default router;