export const VEHICLE_TYPES = {
  CAR: { id: 'Car', name: 'Car', rate: 20, icon: 'Car' },
  BIKE: { id: 'Bike', name: 'Bike', rate: 10, icon: 'Bike' },
  BICYCLE: { id: 'Bicycle', name: 'Bicycle', rate: 5, icon: 'Bicycle' },
  BUS: { id: 'Bus', name: 'Bus', rate: 40, icon: 'Bus' }
};

export const OWNER_TYPES = {
  STUDENT: { id: 'Student', name: 'Student' },
  FACULTY: { id: 'Faculty', name: 'Faculty' },
  STAFF: { id: 'Staff', name: 'Staff' },
  VISITOR: { id: 'Visitor', name: 'Visitor' }
};

export const DEFAULT_ZONES = [
  { id: 'A', name: 'Zone A (Cars)', capacity: 400, type: 'Car' },
  { id: 'B', name: 'Zone B (Bikes)', capacity: 300, type: 'Bike' },
  { id: 'C', name: 'Zone C (Faculty)', capacity: 150, type: 'Faculty' },
  { id: 'D', name: 'Zone D (Visitors)', capacity: 150, type: 'Visitor' }
];

export const SLOT_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved'
};

export const DEFAULT_SETTINGS = {
  collegeName: 'Galgotias University',
  contactNumber: '+91 98765 43210',
  rates: {
    Car: 20,
    Bike: 10,
    Bicycle: 5,
    Bus: 40
  },
  enableReserved: true,
  reservedCount: 15 // number of slots reserved at the start of each zone if enabled
};
