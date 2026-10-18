import express from "express";
import { authenticateUser, authorizeAdmin } from "../middlewares/authMiddleware.js";
import {
    createOrderController,
    updateOrderStatusByAdminController,
    getUserOrdersController,
    getOrderDetailsController,
    getAllOrdersByAdminController,
  abortOrderOnDismiss,
    updateOrderDeliveryDetails
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", authenticateUser, createOrderController);
router.get("/", authenticateUser, getUserOrdersController);
router.get("/all", authenticateUser, authorizeAdmin, getAllOrdersByAdminController);
router.patch("/:orderId", authenticateUser, authorizeAdmin, updateOrderStatusByAdminController);
router.patch("/delivery/:orderId", authenticateUser, authorizeAdmin, updateOrderDeliveryDetails);
router.get("/:orderId", authenticateUser, getOrderDetailsController);
router.post("/:orderId/dismiss",authenticateUser, abortOrderOnDismiss);
export default router;
