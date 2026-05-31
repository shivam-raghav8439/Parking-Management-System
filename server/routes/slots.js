import express from 'express';
import { 
  getSlots, 
  getSlotById, 
  updateSlotStatus, 
  seedSlots,
  createSlot,
  updateSlot,
  deleteSlot
} from '../controllers/slotController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { cacheMiddleware } from '../utils/cache.js';

const router = express.Router();

router.use(protect);

router.get('/', cacheMiddleware(10), getSlots);
router.get('/:slotId', getSlotById);

router.post('/', restrictTo('admin'), createSlot);
router.put('/:slotId', restrictTo('admin'), updateSlot);
router.delete('/:slotId', restrictTo('admin'), deleteSlot);
router.patch('/:slotId', restrictTo('admin'), updateSlotStatus);
router.post('/seed', restrictTo('admin'), seedSlots);

export default router;
