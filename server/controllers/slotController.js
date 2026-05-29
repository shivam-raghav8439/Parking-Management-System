import Slot from '../models/Slot.js';
import { logSystemActivity } from '../utils/logger.js';
import { SLOT_STATUSES, DEFAULT_ZONES_CONFIG } from '../config/constants.js';
import { mockController } from '../utils/mockController.js';

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

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${seeded.length} slots.`,
      count: seeded.length
    });
  } catch (error) {
    next(error);
  }
};

export default { getSlots, getSlotById, updateSlotStatus, seedSlots };
