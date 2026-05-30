import Settings from '../models/Settings.js';
import Slot from '../models/Slot.js';
import { logSystemActivity } from '../utils/logger.js';
import { SLOT_STATUSES } from '../config/constants.js';
import { mockController } from '../utils/mockController.js';
import { clearCachePattern } from '../utils/cache.js';

/**
 * @desc    Get current parking configurations
 * @route   GET /api/settings
 * @access  Private
 */
export const getSettings = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getSettings(req, res, next);
  }
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      return res.status(200).json({
        success: true,
        rates: { Car: 20, Bike: 10, Bicycle: 5, Bus: 40 },
        collegeName: 'State Institute of Technology',
        contactEmail: 'support@campusparking.edu',
        contactPhone: '+91 98765 43210',
        zones: [
          { id: 'A', name: 'Zone A (Cars/Buses)', capacity: 10, allowedTypes: ['Car', 'Bus'] },
          { id: 'B', name: 'Zone B (Bikes/Bicycles)', capacity: 10, allowedTypes: ['Bike', 'Bicycle'] },
          { id: 'C', name: 'Zone C (Faculty Only)', capacity: 5, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'] },
          { id: 'D', name: 'Zone D (Visitors)', capacity: 5, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'] }
        ]
      });
    }

    res.status(200).json({
      success: true,
      ...settings.toObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update system configuration & align Mongoose slots (Admin only)
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
export const updateSettings = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.updateSettings(req, res, next);
  }
  try {
    const { rates, collegeName, contactEmail, contactPhone, zones, enableReserved, reservedCount } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    if (rates) settings.rates = rates;
    if (collegeName) settings.collegeName = collegeName;
    if (contactEmail) settings.contactEmail = contactEmail;
    if (contactPhone) settings.contactPhone = contactPhone;
    
    // Check if zone capacities were changed and handle Mongoose Slot alignment
    if (zones && Array.isArray(zones)) {
      settings.zones = zones;

      for (const zone of zones) {
        const zoneId = zone.id;
        const targetCapacity = parseInt(zone.capacity);
        
        const existingSlots = await Slot.find({ zone: zoneId }).sort({ slotId: 1 });
        const currentCount = existingSlots.length;

        if (targetCapacity > currentCount) {
          const newSlots = [];
          for (let i = currentCount + 1; i <= targetCapacity; i++) {
            const paddedNumber = String(i).padStart(2, '0');
            const slotId = `${zoneId}-${paddedNumber}`;
            
            let status = SLOT_STATUSES.AVAILABLE;
            const resCount = parseInt(reservedCount) || (zoneId === 'C' ? 2 : zoneId === 'D' ? 1 : 0);
            if (enableReserved && i <= resCount) {
              status = SLOT_STATUSES.RESERVED;
            }

            newSlots.push({
              slotId,
              zone: zoneId,
              status,
              vehicleTypes: zone.allowedTypes || ['Car', 'Bike', 'Bicycle', 'Bus'],
              currentRecord: null
            });
          }
          await Slot.insertMany(newSlots);
        } else if (targetCapacity < currentCount) {
          const slotsToDelete = existingSlots.slice(targetCapacity);
          
          const occupied = slotsToDelete.filter(s => s.status === SLOT_STATUSES.OCCUPIED);
          if (occupied.length > 0) {
            const occupiedIds = occupied.map(s => s.slotId).join(', ');
            return res.status(400).json({
              success: false,
              message: `Cannot decrease capacity for Zone ${zoneId}. Slots are currently occupied: ${occupiedIds}.`
            });
          }

          const idsToDelete = slotsToDelete.map(s => s._id);
          await Slot.deleteMany({ _id: { $in: idsToDelete } });
        }
      }
    }

    await settings.save();

    // Clear caching (settings, slots, stats)
    await clearCachePattern('cache:/api/settings*');
    await clearCachePattern('cache:/api/slots*');
    await clearCachePattern('cache:/api/stats*');

    // Log settings change
    await logSystemActivity(
      'SETTINGS_UPDATE', 
      `Updated system settings: name = ${settings.collegeName}, helpline = ${settings.contactPhone}, rates and capacities updated.`, 
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

export default { getSettings, updateSettings };
