import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  payBooking
} from '../controllers/bookingController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createBooking);

router.route('/my')
  .get(getMyBookings);

router.route('/:id/cancel')
  .post(cancelBooking);

router.route('/:id/pay')
  .post(payBooking);

router.route('/')
  .get(restrictTo('admin'), getAllBookings);

router.route('/:id/status')
  .put(restrictTo('admin'), updateBookingStatus);

export default router;
