import express from 'express';
import { authenticateUser, authorizeAdmin } from '../middlewares/authMiddleware.js';
import { updateStoreConfigController,  getStoreConfigController } from '../controllers/storeConfig.controller.js';

const router = express.Router();

router.post('/', authenticateUser, authorizeAdmin, updateStoreConfigController);
router.get('/', getStoreConfigController)
export default router;