export const DEFAULT_RATES = {
  Car: 20,
  Bike: 10,
  Bicycle: 5,
  Bus: 40
};

export const DEFAULT_ZONES_CONFIG = [
  { id: 'A', name: 'Zone A (Cars/Buses)', capacity: 400, allowedTypes: ['Car', 'Bus'] },
  { id: 'B', name: 'Zone B (Bikes/Bicycles)', capacity: 300, allowedTypes: ['Bike', 'Bicycle'] },
  { id: 'C', name: 'Zone C (Faculty Only)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'], reservedCount: 25 }, // C-01 to C-25
  { id: 'D', name: 'Zone D (Visitors)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'], reservedCount: 15 }      // D-01 to D-15
];

export const SLOT_STATUSES = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
};

export const RECORD_STATUSES = {
  ACTIVE: 'active',
  EXITED: 'exited'
};
