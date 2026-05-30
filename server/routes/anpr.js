import express from 'express';
import { body } from 'express-validator';
import { 
  recognizePlate, 
  autoEntry, 
  getCameraStatus, 
  registerVehicle, 
  getRegisteredVehicles, 
  deleteRegisteredVehicle 
} from '../controllers/anprController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All ANPR routes require authentication
router.use(protect);

// Recognize license plate from base64 image
router.post(
  '/recognize',
  [
    body('image')
      .notEmpty().withMessage('Base64 image is required.')
  ],
  validate,
  recognizePlate
);

// Trigger automatic entry slot allocation
router.post(
  '/auto-entry',
  [
    body('plate')
      .trim()
      .notEmpty().withMessage('License plate is required.')
      .isAlphanumeric().withMessage('Plate number must contain alphanumeric characters only.')
      .isLength({ min: 6, max: 10 }).withMessage('Plate number must be between 6 and 10 characters.')
  ],
  validate,
  autoEntry
);

// Get camera connection status
router.get('/status', getCameraStatus);

// Registered vehicle endpoints (admin and operator)
router.get('/vehicles', getRegisteredVehicles);

router.post(
  '/vehicles',
  [
    body('plate')
      .trim()
      .notEmpty().withMessage('Plate number is required.')
      .isAlphanumeric().withMessage('Plate number must contain alphanumeric characters only.')
      .isLength({ min: 6, max: 10 }).withMessage('Plate number must be between 6 and 10 characters.'),
    body('ownerName').trim().notEmpty().withMessage('Owner name is required.'),
    body('ownerType').isIn(['Student', 'Faculty', 'Staff']).withMessage('Invalid owner type.'),
    body('vehicleType').isIn(['Car', 'Bike', 'Bicycle', 'Bus']).withMessage('Invalid vehicle type.'),
    body('mobile').optional({ checkFalsy: true }).isNumeric().withMessage('Mobile number must contain digits only.'),
    body('photo').optional({ checkFalsy: true }).isURL().withMessage('Photo must be a valid URL.')
  ],
  validate,
  registerVehicle
);

router.delete('/vehicles/:id', deleteRegisteredVehicle);

export default router;
