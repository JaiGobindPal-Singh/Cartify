import express from "express";
import {
    createProduct,
    deleteProduct,
    updateProduct,
    getAllProducts,
    getProductsByCategory,
    getProductsByKeyword,
    getProductById,
    deleteProductImage,
    addProductImages,
} from "../controllers/product.controller.js";
import upload from '../middlewares/multerMiddleware.js'
import { authorizeAdmin, authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

//admin routes
router.post("/", authenticateUser, authorizeAdmin, upload.array('images', 5), createProduct);
router.delete("/:productId", authenticateUser, authorizeAdmin, deleteProduct);
router.put("/:productId", authenticateUser, authorizeAdmin, updateProduct);

router.delete("/images/:productId", authenticateUser, authorizeAdmin, deleteProductImage);
router.post("/images/:productId", authenticateUser, authorizeAdmin,upload.array('images', 5), addProductImages);

//client routes
router.get("/", getAllProducts);
router.get("/category", getProductsByCategory);
router.get("/keyword", getProductsByKeyword);
router.get("/:id", getProductById);

export default router;
