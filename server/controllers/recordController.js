import Record from '../models/Record.js';
import Slot from '../models/Slot.js';
import Settings from '../models/Settings.js';
import { findBestSlot } from '../utils/slotAssigner.js';
import { calcFee } from '../utils/feeCalculator.js';
import { logSystemActivity } from '../utils/logger.js';
import { SLOT_STATUSES, RECORD_STATUSES } from '../config/constants.js';
import { mockController } from '../utils/mockController.js';
import { clearParkingCaches } from '../utils/cache.js';

/**
 * @desc    Check-in vehicle (Register entry & occupy slot)
 * @route   POST /api/records/entry
 * @access  Private
 */
export const createEntry = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.createEntry(req, res, next);
  }
  try {
    const { plate, ownerName, ownerType, vehicleType, mobile, zonePreference } = req.body;

    const formattedPlate = plate.toUpperCase().trim();

    // 1. Check if vehicle is already parked (active record exists)
    const activeRecord = await Record.findOne({ plate: formattedPlate, status: RECORD_STATUSES.ACTIVE });
    if (activeRecord) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Vehicle with plate ${formattedPlate} is already parked in slot ${activeRecord.slotId}.`
      });
    }

    // 2. Find best available slot
    const slotDoc = await findBestSlot(vehicleType, zonePreference || 'Auto');
    if (!slotDoc) {
      return res.status(409).json({
        success: false,
        message: `No available slots matching preference '${zonePreference || 'Auto'}' for vehicle category '${vehicleType}'.`
      });
    }

    // 3. Create Record
    const record = await Record.create({
      plate: formattedPlate,
      ownerName,
      ownerType,
      vehicleType,
      mobile: mobile || '',
      slot: slotDoc._id,
      slotId: slotDoc.slotId,
      zone: slotDoc.zone,
      entryTime: new Date(),
      status: RECORD_STATUSES.ACTIVE,
      createdBy: req.user._id
    });

    // 4. Update Slot status to occupied
    slotDoc.status = SLOT_STATUSES.OCCUPIED;
    slotDoc.currentRecord = record._id;
    await slotDoc.save();

    // Clear caching
    await clearParkingCaches();

    // Log this event in system audit trail
    await logSystemActivity(
      'VEHICLE_ENTRY', 
      `Checked in ${record.vehicleType} plate ${record.plate} (Owner: ${record.ownerName}, Category: ${record.ownerType}) into slot ${record.slotId}.`, 
      req.user._id
    );

    res.status(201).json({
      success: true,
      record,
      slot: slotDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check-out vehicle (Register exit, calculate fee & free slot)
 * @route   POST /api/records/exit/:id
 * @access  Private
 */
export const exitRecord = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.exitRecord(req, res, next);
  }
  try {
    const { id } = req.params;
    const { fee, durationMinutes, exitTime: clientExitTime } = req.body;

    // 1. Find record, verify it is active
    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Parking record not found.'
      });
    }

    if (record.status !== RECORD_STATUSES.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: 'Record is already closed/exited.'
      });
    }

    // 2. Retrieve settings rates
    const settings = await Settings.findOne();
    const rates = settings ? settings.rates : { Car: 20, Bike: 10, Bicycle: 5, Bus: 40 };

    // 3. Compute duration and billing fee
    const exitTime = clientExitTime ? new Date(clientExitTime) : new Date();
    
    let billingFee;
    let billingDuration;

    if (typeof fee === 'number') {
      billingFee = fee;
      billingDuration = typeof durationMinutes === 'number' ? durationMinutes : calcFee(record.vehicleType, record.entryTime, exitTime, rates).durationMinutes;
    } else {
      const billing = calcFee(record.vehicleType, record.entryTime, exitTime, rates);
      billingFee = billing.fee;
      billingDuration = billing.durationMinutes;
    }

    // 4. Update Record details
    record.exitTime = exitTime;
    record.durationMinutes = billingDuration;
    record.fee = billingFee;
    record.status = RECORD_STATUSES.EXITED;
    await record.save();

    // 5. Release the Slot
    const slotDoc = await Slot.findById(record.slot);
    if (slotDoc) {
      let nextStatus = SLOT_STATUSES.AVAILABLE;
      
      const num = parseInt(slotDoc.slotId.split('-')[1]);
      if (slotDoc.zone === 'C' && num <= 2) {
        nextStatus = SLOT_STATUSES.RESERVED;
      } else if (slotDoc.zone === 'D' && num <= 1) {
        nextStatus = SLOT_STATUSES.RESERVED;
      }

      slotDoc.status = nextStatus;
      slotDoc.currentRecord = null;
      await slotDoc.save();
    }

    // Clear caching
    await clearParkingCaches();

    // Log this event in system audit trail
    const hours = Math.floor(billingDuration / 60);
    const mins = billingDuration % 60;
    const durationStr = `${hours}h ${mins}m`;
    await logSystemActivity(
      'VEHICLE_EXIT', 
      `Checked out plate ${record.plate} from slot ${record.slotId}. Fee: ₹${billingFee} collected. Duration: ${durationStr}.`, 
      req.user._id
    );

    res.status(200).json({
      success: true,
      record,
      fee: billingFee,
      duration: billingDuration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently parked vehicles
 * @route   GET /api/records/active
 * @access  Private
 */
export const getActiveRecords = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getActiveRecords(req, res, next);
  }
  try {
    const records = await Record.find({ status: RECORD_STATUSES.ACTIVE })
      .populate('slot')
      .sort({ entryTime: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search active records by plate or slotId
 * @route   GET /api/records/search
 * @access  Private
 */
export const searchRecords = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.searchRecords(req, res, next);
  }
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const regex = new RegExp(q, 'i');
    const records = await Record.find({
      status: RECORD_STATUSES.ACTIVE,
      $or: [
        { plate: regex },
        { slotId: regex }
      ]
    })
    .select('plate ownerName vehicleType ownerType slotId entryTime status')
    .populate('slot')
    .lean();

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated history logs with multi-filters
 * @route   GET /api/records
 * @access  Private
 */
export const getRecords = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getRecords(req, res, next);
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter records for student/user
    if (req.user && (req.user.role === 'user' || req.user.role === 'student')) {
      query.userId = req.user._id;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.zone) {
      query.zone = req.query.zone;
    }
    if (req.query.type) {
      query.vehicleType = req.query.type;
    }
    if (req.query.ownerType) {
      query.ownerType = req.query.ownerType;
    }
    
    if (req.query.from || req.query.to) {
      query.entryTime = {};
      if (req.query.from) {
        query.entryTime.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        const toDate = new Date(req.query.to);
        toDate.setHours(23, 59, 59, 999);
        query.entryTime.$lte = toDate;
      }
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const records = await Record.find(query)
      .select('plate ownerName vehicleType ownerType slotId entryTime exitTime durationMinutes fee status')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Record.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      records,
      totalCount,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single record detail
 * @route   GET /api/records/:id
 * @access  Private
 */
export const getRecordById = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getRecordById(req, res, next);
  }
  try {
    const record = await Record.findById(req.params.id).populate('slot');
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Parking record not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

export default { createEntry, exitRecord, getActiveRecords, searchRecords, getRecords, getRecordById };
