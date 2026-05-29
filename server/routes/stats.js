import express from 'express';
import { getSummary, getActivity, getSystemLogs } from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Handle GET /summary and GET / for compatibility
router.get('/summary', getSummary);
router.get('/', getSummary);

// Activity logs
router.get('/activity', getActivity);

// Audit logs
router.get('/logs', getSystemLogs);

export default router;
