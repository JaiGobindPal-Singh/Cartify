import express from "express";
import { razorpayWebhookController } from "./razorpay.controller.js";
import { paymentResultController } from "../../../controllers/order.controller.js";

const router = express.Router();

router.post(
	"/webhook",
	express.raw({ type: "application/json" }),
	razorpayWebhookController,
	paymentResultController
);

export default router;