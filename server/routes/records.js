import express from 'express';
import { body } from 'express-validator';
import { 
  createEntry, 
  exitRecord, 
  getActiveRecords, 
  searchRecords, 
  getRecords, 
  getRecordById 
} from '../controllers/recordController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Protect all routes in this router
router.use(protect);

router.post(
  '/entry',
  [
    body('plate')
      .trim()
      .notEmpty().withMessage('License plate is required.')
      .isAlphanumeric().withMessage('Plate number must contain alphanumeric characters only.')
      .isLength({ min: 6, max: 10 }).withMessage('Plate number must be between 6 and 10 characters.'),
    body('ownerName').trim().notEmpty().withMessage('Owner name is required.'),
    body('ownerType').isIn(['Student', 'Faculty', 'Staff', 'Visitor']).withMessage('Invalid owner category.'),
    body('vehicleType').isIn(['Car', 'Bike', 'Bicycle', 'Bus']).withMessage('Invalid vehicle category.'),
    body('mobile').optional({ checkFalsy: true }).isNumeric().withMessage('Mobile number must contain digits only.'),
    body('zonePreference').optional().isIn(['Auto', 'A', 'B', 'C', 'D']).withMessage('Invalid zone preference.')
  ],
  validate,
  createEntry
);

router.post('/exit/:id', exitRecord);

router.get('/active', getActiveRecords);
router.get('/search', searchRecords);
router.get('/', getRecords);
router.get('/:id', getRecordById);

export default router;
