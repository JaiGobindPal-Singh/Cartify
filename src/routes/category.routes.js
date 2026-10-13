import express from "express";
import {
    getAllCategories,
    createCategory,
    deleteCategory,
    getChildCategories,
  updateCategory,
    getCategoryById
} from "../controllers/category.controller.js";
import { authenticateUser, authorizeAdmin } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";
const router = express.Router();

router.get("/", getAllCategories);
router.get("/:categoryId", getCategoryById);
router.get("/child/:categoryId", getChildCategories);
router.put("/:categoryId",authenticateUser, authorizeAdmin, upload.single("icon"), updateCategory);
router.post("/",authenticateUser, authorizeAdmin, upload.single("icon"), createCategory);
router.delete("/:categoryId",authenticateUser, authorizeAdmin, deleteCategory);

export default router;
