import express from 'express';
import { getSummary, getActivity, getSystemLogs } from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';
import { cacheMiddleware } from '../utils/cache.js';

const router = express.Router();

router.use(protect);

// Handle GET /summary and GET / for compatibility
router.get('/summary', cacheMiddleware(30), getSummary);
router.get('/', cacheMiddleware(30), getSummary);

// Activity logs
router.get('/activity', cacheMiddleware(30), getActivity);

// Audit logs
router.get('/logs', getSystemLogs);

export default router;
