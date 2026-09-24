import express from "express";
import {
    addChargeController,
    updateChargeController,
    deleteChargeController,
    getAllChargesController,
    getApplicableChargesController,
} from "../controllers/charge.controller.js";
import { authenticateUser, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateUser, authorizeAdmin, getAllChargesController);
router.post("/applicable", getApplicableChargesController);
router.post("/", authenticateUser, authorizeAdmin, addChargeController);
router.put("/:chargeId", authenticateUser, authorizeAdmin, updateChargeController);
router.delete("/:chargeId", authenticateUser, authorizeAdmin, deleteChargeController);

export default router;