import express from 'express';
import { 
  getSlots, 
  getSlotById, 
  updateSlotStatus, 
  seedSlots 
} from '../controllers/slotController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Require authentication for all slots operations
router.use(protect);

router.get('/', getSlots);
router.get('/:slotId', getSlotById);

// Admin-only operations
router.patch('/:slotId', restrictTo('admin'), updateSlotStatus);
router.post('/seed', restrictTo('admin'), seedSlots);

export default router;
