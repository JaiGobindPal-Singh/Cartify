import express from "express";
import {
    createDeliveryOptionController,
    updateDeliveryOptionController,
    deleteDeliveryOptionController,
    getAllDeliveryOptionsController,
} from "../controllers/deliveryOption.controller.js";
import { authenticateUser, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllDeliveryOptionsController);
router.post("/", authenticateUser, authorizeAdmin, createDeliveryOptionController);
router.put("/:deliveryOptionId", authenticateUser, authorizeAdmin, updateDeliveryOptionController);
router.delete("/:deliveryOptionId", authenticateUser, authorizeAdmin, deleteDeliveryOptionController);

export default router;