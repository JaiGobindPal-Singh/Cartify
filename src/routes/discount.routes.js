import express from "express";
import {
    addDiscountCodeController,
    getDiscountsController,
    validateDiscountController,
    updateDiscountController,
    deleteDiscountController,
} from "../controllers/discount.controller.js";
import { authenticateUser, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateUser, authorizeAdmin, getDiscountsController);
router.post("/", authenticateUser, authorizeAdmin, addDiscountCodeController);
router.post("/validate", authenticateUser, validateDiscountController);
router.put("/:discountId", authenticateUser, authorizeAdmin, updateDiscountController);
router.delete("/:discountId", authenticateUser, authorizeAdmin, deleteDiscountController);

export default router;