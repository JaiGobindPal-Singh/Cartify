import express from 'express';
import {authenticateUser} from '../middlewares/authMiddleware.js'
import { addToCart, clearCart, removeFromCart, updateQuantity, getCart, createCart, addMultipleProductsToCart } from '../controllers/cart.controller.js';
const router = express.Router();


router.post('/', authenticateUser, addToCart);
router.post('/items', authenticateUser, addMultipleProductsToCart);
router.delete('/', authenticateUser, clearCart);
router.patch('/:itemId', authenticateUser, updateQuantity);
router.get('/', authenticateUser, getCart);

router.delete('/:itemId', authenticateUser, removeFromCart);
router.post('/create', authenticateUser, createCart);

export default router
