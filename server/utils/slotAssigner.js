import Slot from '../models/Slot.js';
import { SLOT_STATUSES } from '../config/constants.js';

/**
 * Finds the best available parking slot based on vehicle category and zone preference.
 * @param {string} vehicleType - Car, Bike, Bicycle, Bus
 * @param {string} zonePreference - Auto, A, B, C, D
 * @returns {Promise<object|null>} Mongoose Slot document or null
 */
export async function findBestSlot(vehicleType, zonePreference) {
  // Query all slots that can accommodate this vehicle type and are free (available or reserved)
  const candidateSlots = await Slot.find({
    status: { $in: [SLOT_STATUSES.AVAILABLE, SLOT_STATUSES.RESERVED] },
    vehicleTypes: vehicleType
  });

  if (candidateSlots.length === 0) {
    return null;
  }

  // Case 1: Specific Zone Preference requested (and not 'Auto')
  if (zonePreference && zonePreference !== 'Auto') {
    const zoneSlots = candidateSlots.filter(s => s.zone === zonePreference);
    if (zoneSlots.length === 0) return null;

    // Prefer general 'available' slots over 'reserved' slots in that zone
    zoneSlots.sort((a, b) => {
      if (a.status === SLOT_STATUSES.AVAILABLE && b.status === SLOT_STATUSES.RESERVED) return -1;
      if (a.status === SLOT_STATUSES.RESERVED && b.status === SLOT_STATUSES.AVAILABLE) return 1;
      return a.slotId.localeCompare(b.slotId); // Fallback to slot number ordering
    });

    return zoneSlots[0];
  }

  // Case 2: Auto allocation (Zone preference is 'Auto' or undefined)
  // Define Zone priority list based on vehicle type
  // Cars/Buses -> Zone A first, then Zone C (Faculty), then Zone D (Visitors)
  // Bikes/Bicycles -> Zone B first, then Zone C, then Zone D
  const zonePriority = (vehicleType === 'Car' || vehicleType === 'Bus') 
    ? ['A', 'C', 'D'] 
    : ['B', 'C', 'D'];

  // Search through zones in order of priority
  for (const zoneId of zonePriority) {
    const zoneSlots = candidateSlots.filter(s => s.zone === zoneId);
    if (zoneSlots.length > 0) {
      // Within the prioritized zone, choose 'available' status first, then 'reserved' status
      zoneSlots.sort((a, b) => {
        if (a.status === SLOT_STATUSES.AVAILABLE && b.status === SLOT_STATUSES.RESERVED) return -1;
        if (a.status === SLOT_STATUSES.RESERVED && b.status === SLOT_STATUSES.AVAILABLE) return 1;
        return a.slotId.localeCompare(b.slotId);
      });
      return zoneSlots[0];
    }
  }

  return null;
}
