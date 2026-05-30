import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { cacheMiddleware } from '../utils/cache.js';

const router = express.Router();

router.use(protect);

router.get('/', cacheMiddleware(300), getSettings);
router.put('/', restrictTo('admin'), updateSettings);

export default router;
