import express from 'express';
import { getVehicleDetails } from '../controllers/vehicleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Enforce route protection
router.use(protect);

router.post('/details', getVehicleDetails);

export default router;
