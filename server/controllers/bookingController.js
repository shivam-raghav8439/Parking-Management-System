import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import { logSystemActivity } from '../utils/logger.js';

export const createBooking = async (req, res, next) => {
  const { slotId, vehicleNumber, vehicleType, bookingDate, startTime, endTime, amount } = req.body;

  if (global.isMockDB) {
    const slot = global.mockDb.slots.find(s => s._id === slotId || s.slotId === slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found in memory.' });
    }
    if (slot.status !== 'available' && slot.status !== 'reserved') {
      return res.status(400).json({ success: false, message: 'Slot is not available for booking.' });
    }

    const newBooking = {
      _id: `mock_booking_${Date.now()}`,
      userId: req.user._id,
      user: { name: req.user.name, email: req.user.email },
      slotId: slot._id,
      slotNumber: slot.slotId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      bookingDate: new Date(bookingDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      amount,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date()
    };

    global.mockDb.bookings = global.mockDb.bookings || [];
    global.mockDb.bookings.push(newBooking);

    await logSystemActivity('SLOT_UPDATE', `User ${req.user.name} created reservation for slot ${slot.slotId}`, req.user._id);

    return res.status(201).json({ success: true, booking: newBooking });
  }

  try {
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }
    if (slot.status !== 'available' && slot.status !== 'reserved') {
      return res.status(400).json({ success: false, message: 'Slot is not available for booking.' });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      slotId: slot._id,
      slotNumber: slot.slotId,
      vehicleNumber,
      vehicleType,
      bookingDate,
      startTime,
      endTime,
      amount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await logSystemActivity('SLOT_UPDATE', `User ${req.user.name} created reservation for slot ${slot.slotId}`, req.user._id);

    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  if (global.isMockDB) {
    global.mockDb.bookings = global.mockDb.bookings || [];
    const list = global.mockDb.bookings.filter(b => b.userId === req.user._id);
    return res.status(200).json({ success: true, count: list.length, bookings: list });
  }

  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  const { id } = req.params;

  if (global.isMockDB) {
    global.mockDb.bookings = global.mockDb.bookings || [];
    const booking = global.mockDb.bookings.find(b => b._id === id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    
    if (booking.userId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Not authorized to cancel this booking.' });
    }

    booking.status = 'cancelled';

    const slot = global.mockDb.slots.find(s => s._id === booking.slotId);
    if (slot && slot.status === 'booked') {
      slot.status = 'available';
    }

    await logSystemActivity('SLOT_UPDATE', `Booking ${id} cancelled.`, req.user._id);
    return res.status(200).json({ success: true, message: 'Booking cancelled successfully', booking });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Not authorized.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const slot = await Slot.findById(booking.slotId);
    if (slot && slot.status === 'booked') {
      slot.status = 'available';
      await slot.save();
    }

    await logSystemActivity('SLOT_UPDATE', `Booking ${booking._id} cancelled.`, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  if (global.isMockDB) {
    global.mockDb.bookings = global.mockDb.bookings || [];
    let list = [...global.mockDb.bookings];
    
    const { status, date } = req.query;
    if (status) {
      list = list.filter(b => b.status === status);
    }
    if (date) {
      const targetDateStr = new Date(date).toDateString();
      list = list.filter(b => new Date(b.bookingDate).toDateString() === targetDateStr);
    }
    
    return res.status(200).json({ success: true, count: list.length, bookings: list });
  }

  try {
    const { status, date } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(date);
      end.setHours(23,59,59,999);
      query.bookingDate = { $gte: start, $lte: end };
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('slotId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status update.' });
  }

  if (global.isMockDB) {
    global.mockDb.bookings = global.mockDb.bookings || [];
    const booking = global.mockDb.bookings.find(b => b._id === id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.status = status;
    const slot = global.mockDb.slots.find(s => s._id === booking.slotId);

    if (status === 'approved') {
      if (slot) slot.status = 'booked';
    } else {
      if (slot && slot.status === 'booked') {
        slot.status = 'available';
      }
    }

    await logSystemActivity('SLOT_UPDATE', `Admin updated booking ${id} status to '${status}'.`, req.user._id);
    return res.status(200).json({ success: true, message: `Booking status updated to ${status}.`, booking });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.status = status;
    await booking.save();

    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      if (status === 'approved') {
        slot.status = 'booked';
      } else {
        if (slot.status === 'booked') {
          slot.status = 'available';
        }
      }
      await slot.save();
    }

    await logSystemActivity('SLOT_UPDATE', `Admin updated booking ${booking._id} status to '${status}'.`, req.user._id);

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}.`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

export const payBooking = async (req, res, next) => {
  const { id } = req.params;
  const { paymentId, paymentStatus } = req.body;

  if (global.isMockDB) {
    global.mockDb.bookings = global.mockDb.bookings || [];
    const booking = global.mockDb.bookings.find(b => b._id === id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.paymentStatus = paymentStatus || 'paid';
    booking.paymentId = paymentId || `pay_mock_${Date.now()}`;
    
    if (booking.paymentStatus === 'paid') {
      booking.status = 'approved';
      const slot = global.mockDb.slots.find(s => s._id === booking.slotId);
      if (slot) slot.status = 'booked';
    }

    await logSystemActivity('SLOT_UPDATE', `Payment processed for Booking ${id}: ${booking.paymentStatus}`, req.user._id);
    return res.status(200).json({ success: true, message: 'Payment recorded', booking });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.paymentStatus = paymentStatus || 'paid';
    booking.paymentId = paymentId || `pay_razor_${Date.now()}`;

    if (booking.paymentStatus === 'paid') {
      booking.status = 'approved';
      const slot = await Slot.findById(booking.slotId);
      if (slot) {
        slot.status = 'booked';
        await slot.save();
      }
    }
    
    await booking.save();

    await logSystemActivity('SLOT_UPDATE', `Payment processed for Booking ${booking._id}: ${booking.paymentStatus}`, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Payment recorded',
      booking
    });
  } catch (error) {
    next(error);
  }
};
