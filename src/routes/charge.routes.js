import express from "express";
import {
    addChargeController,
    updateChargeController,
    deleteChargeController,
    getAllChargesController,
  getApplicableChargesController,
    getChargeController
} from "../controllers/charge.controller.js";
import { authenticateUser, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateUser, authorizeAdmin, getAllChargesController);
router.get("/:chargeId", authenticateUser, authorizeAdmin, getChargeController);
router.post("/applicable", getApplicableChargesController);
router.post("/", authenticateUser, authorizeAdmin, addChargeController);
router.put("/:chargeId", authenticateUser, authorizeAdmin, updateChargeController);
router.delete("/:chargeId", authenticateUser, authorizeAdmin, deleteChargeController);

export default router;
