import Slot from '../models/Slot.js';
import { logSystemActivity } from '../utils/logger.js';
import { SLOT_STATUSES, DEFAULT_ZONES_CONFIG } from '../config/constants.js';
import { mockController } from '../utils/mockController.js';
import { clearParkingCaches } from '../utils/cache.js';

/**
 * @desc    Get all slots (optional zone filter)
 * @route   GET /api/slots
 * @access  Private
 */
export const getSlots = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getSlots(req, res, next);
  }
  try {
    const filter = {};
    if (req.query.zone) {
      filter.zone = req.query.zone;
    }

    const slots = await Slot.find(filter).sort({ slotId: 1 }).populate('currentRecord');
    
    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single slot detail with active record
 * @route   GET /api/slots/:slotId
 * @access  Private
 */
export const getSlotById = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getSlotById(req, res, next);
  }
  try {
    const slot = await Slot.findOne({ slotId: req.params.slotId }).populate('currentRecord');
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: `Slot ${req.params.slotId} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update slot status (Admin only)
 * @route   PATCH /api/slots/:slotId
 * @access  Private/Admin
 */
export const updateSlotStatus = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.updateSlotStatus(req, res, next);
  }
  try {
    const { status } = req.body;
    
    if (!status || !['available', 'reserved', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Choose from: available, reserved, maintenance.'
      });
    }

    const slot = await Slot.findOne({ slotId: req.params.slotId });
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: `Slot ${req.params.slotId} not found.`
      });
    }

    if (slot.status === SLOT_STATUSES.OCCUPIED && status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of an occupied slot. Checkout the vehicle first.'
      });
    }

    const oldStatus = slot.status;
    slot.status = status;
    await slot.save();

    // Clear caching
    await clearParkingCaches();

    // Log slot status changes
    await logSystemActivity(
      'SLOT_UPDATE', 
      `Changed slot ${slot.slotId} status from '${oldStatus}' to '${status}'.`, 
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Seed slots manually (Admin only)
 * @route   POST /api/slots/seed
 * @access  Private/Admin
 */
export const seedSlots = async (req, res, next) => {
  if (global.isMockDB) {
    return res.status(400).json({
      success: false,
      message: 'Slots collection is already seeded (Sandbox Mode).'
    });
  }
  try {
    const slotCount = await Slot.countDocuments();
    if (slotCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Slots collection is already seeded.'
      });
    }

    const slotsToSeed = [];
    DEFAULT_ZONES_CONFIG.forEach(zone => {
      for (let i = 1; i <= zone.capacity; i++) {
        const paddedNumber = String(i).padStart(2, '0');
        const slotId = `${zone.id}-${paddedNumber}`;
        
        let status = SLOT_STATUSES.AVAILABLE;
        if (zone.reservedCount && i <= zone.reservedCount) {
          status = SLOT_STATUSES.RESERVED;
        }

        slotsToSeed.push({
          slotId,
          zone: zone.id,
          status,
          vehicleTypes: zone.allowedTypes,
          currentRecord: null
        });
      }
    });

    const seeded = await Slot.insertMany(slotsToSeed);

    // Clear caching
    await clearParkingCaches();

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${seeded.length} slots.`,
      count: seeded.length
    });
  } catch (error) {
    next(error);
  }
};

export const createSlot = async (req, res, next) => {
  const { slotId, zone, status, vehicleTypes, price } = req.body;

  if (global.isMockDB) {
    const existing = global.mockDb.slots.find(s => s.slotId === slotId);
    if (existing) {
      return res.status(400).json({ success: false, message: `Slot ${slotId} already exists.` });
    }

    const newSlot = {
      _id: `mock_slot_${slotId}`,
      slotId,
      zone,
      status: status || 'available',
      vehicleTypes: vehicleTypes || ['Car', 'Bike'],
      price: price || null,
      currentRecord: null
    };

    global.mockDb.slots.push(newSlot);
    await logSystemActivity('SLOT_UPDATE', `Admin created slot ${slotId} in Zone ${zone}`, req.user?._id);
    return res.status(201).json({ success: true, data: newSlot });
  }

  try {
    const existing = await Slot.findOne({ slotId });
    if (existing) {
      return res.status(400).json({ success: false, message: `Slot ${slotId} already exists.` });
    }

    const slot = await Slot.create({
      slotId,
      zone,
      status: status || 'available',
      vehicleTypes: vehicleTypes || ['Car', 'Bike'],
      price: price || null
    });

    await clearParkingCaches();
    await logSystemActivity('SLOT_UPDATE', `Admin created slot ${slotId} in Zone ${zone}`, req.user._id);

    res.status(201).json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

export const updateSlot = async (req, res, next) => {
  const { zone, status, vehicleTypes, price } = req.body;

  if (global.isMockDB) {
    const slot = global.mockDb.slots.find(s => s.slotId === req.params.slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: `Slot ${req.params.slotId} not found.` });
    }

    if (zone) slot.zone = zone;
    if (status) slot.status = status;
    if (vehicleTypes) slot.vehicleTypes = vehicleTypes;
    if (price !== undefined) slot.price = price;

    await logSystemActivity('SLOT_UPDATE', `Admin updated details of slot ${req.params.slotId}`, req.user?._id);
    return res.status(200).json({ success: true, data: slot });
  }

  try {
    const slot = await Slot.findOne({ slotId: req.params.slotId });
    if (!slot) {
      return res.status(404).json({ success: false, message: `Slot ${req.params.slotId} not found.` });
    }

    if (zone) slot.zone = zone;
    if (status) slot.status = status;
    if (vehicleTypes) slot.vehicleTypes = vehicleTypes;
    if (price !== undefined) slot.price = price;

    await slot.save();
    await clearParkingCaches();
    await logSystemActivity('SLOT_UPDATE', `Admin updated details of slot ${req.params.slotId}`, req.user._id);

    res.status(200).json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSlot = async (req, res, next) => {
  if (global.isMockDB) {
    const index = global.mockDb.slots.findIndex(s => s.slotId === req.params.slotId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: `Slot ${req.params.slotId} not found.` });
    }
    
    global.mockDb.slots.splice(index, 1);
    await logSystemActivity('SLOT_UPDATE', `Admin deleted slot ${req.params.slotId}`, req.user?._id);
    return res.status(200).json({ success: true, message: 'Slot deleted successfully' });
  }

  try {
    const slot = await Slot.findOne({ slotId: req.params.slotId });
    if (!slot) {
      return res.status(404).json({ success: false, message: `Slot ${req.params.slotId} not found.` });
    }

    await Slot.deleteOne({ slotId: req.params.slotId });
    await clearParkingCaches();
    await logSystemActivity('SLOT_UPDATE', `Admin deleted slot ${req.params.slotId}`, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Slot deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default { getSlots, getSlotById, updateSlotStatus, seedSlots, createSlot, updateSlot, deleteSlot };
