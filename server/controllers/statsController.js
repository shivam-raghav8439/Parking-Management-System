import Slot from '../models/Slot.js';
import Record from '../models/Record.js';
import ActivityLog from '../models/ActivityLog.js';
import { startOfDay, subDays } from 'date-fns';
import { SLOT_STATUSES, RECORD_STATUSES } from '../config/constants.js';
import { mockController } from '../utils/mockController.js';

/**
 * @desc    Get dashboard telemetry metrics and zone loads
 * @route   GET /api/stats/summary
 * @access  Private
 */
export const getSummary = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getSummary(req, res, next);
  }
  try {
    const totalSlots = await Slot.countDocuments();
    const occupiedSlots = await Slot.countDocuments({ status: SLOT_STATUSES.OCCUPIED });
    const reservedSlots = await Slot.countDocuments({ status: SLOT_STATUSES.RESERVED });
    const availableSlots = await Slot.countDocuments({ 
      status: { $in: [SLOT_STATUSES.AVAILABLE, SLOT_STATUSES.RESERVED] } 
    });

    const todayStart = startOfDay(new Date());
    const weekStart = startOfDay(subDays(new Date(), 7));

    const todayRevResult = await Record.aggregate([
      {
        $match: {
          status: RECORD_STATUSES.EXITED,
          exitTime: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fee' }
        }
      }
    ]);
    const todayRevenue = todayRevResult.length > 0 ? todayRevResult[0].total : 0;

    const weekRevResult = await Record.aggregate([
      {
        $match: {
          status: RECORD_STATUSES.EXITED,
          exitTime: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fee' }
        }
      }
    ]);
    const weekRevenue = weekRevResult.length > 0 ? weekRevResult[0].total : 0;

    const zoneOccupancy = {};
    const zonesList = ['A', 'B', 'C', 'D'];
    
    for (const z of zonesList) {
      const zoneTotal = await Slot.countDocuments({ zone: z });
      const zoneOccupied = await Slot.countDocuments({ zone: z, status: SLOT_STATUSES.OCCUPIED });
      zoneOccupancy[z] = zoneTotal > 0 ? Math.round((zoneOccupied / zoneTotal) * 100) : 0;
    }

    res.status(200).json({
      success: true,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      todayRevenue,
      weekRevenue,
      zoneOccupancy
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live incoming & outgoing activity streams
 * @route   GET /api/stats/activity
 * @access  Private
 */
export const getActivity = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getActivity(req, res, next);
  }
  try {
    const limit = parseInt(req.query.limit) || 10;

    const checkins = await Record.find()
      .sort({ entryTime: -1 })
      .limit(limit);

    const checkouts = await Record.find({ status: RECORD_STATUSES.EXITED })
      .sort({ exitTime: -1 })
      .limit(limit);

    const checkinActivities = checkins.map(c => ({
      id: `${c._id}_entry`,
      type: 'entry',
      plate: c.plate,
      slotNumber: c.slotId,
      timestamp: c.entryTime
    }));

    const checkoutActivities = checkouts.map(c => ({
      id: `${c._id}_exit`,
      type: 'exit',
      plate: c.plate,
      slotNumber: c.slotId,
      timestamp: c.exitTime
    }));

    const merged = [...checkinActivities, ...checkoutActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      count: merged.length,
      data: merged
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system-wide audit activity logs
 * @route   GET /api/stats/logs
 * @access  Private
 */
export const getSystemLogs = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getSystemLogs(req, res, next);
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .populate('operator', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await ActivityLog.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      logs,
      totalCount,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

export default { getSummary, getActivity, getSystemLogs };
