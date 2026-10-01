import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { updateUserDetails } from "../controllers/user.controller.js";
const router = express.Router();

router.patch('/',authenticateUser, updateUserDetails);

export default router;