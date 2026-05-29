import express from 'express';
import { 
  getSummary, 
  getDaily, 
  getHourly, 
  getVehicleTypes, 
  getZoneUtilization 
} from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Consolidated reports summary for frontend queries
router.get('/summary', getSummary);

// Individual detailed report metrics
router.get('/daily', getDaily);
router.get('/hourly', getHourly);
router.get('/vehicle-types', getVehicleTypes);
router.get('/zone-utilization', getZoneUtilization);

export default router;
