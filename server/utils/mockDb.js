import { subDays, subHours, format, startOfDay } from 'date-fns';
import { SLOT_STATUSES, RECORD_STATUSES, DEFAULT_RATES } from '../config/constants.js';

// Global mock database nodes
global.mockDb = {
  users: [],
  slots: [],
  records: [],
  registeredVehicles: [],
  anprLogs: [],
  settings: {
    rates: DEFAULT_RATES,
    collegeName: 'Galgotias University',
    contactEmail: 'support@galgotias.edu',
    contactPhone: '+91 98765 43210',
    zones: [
      { id: 'A', name: 'Zone A (Cars/Buses)', capacity: 400, allowedTypes: ['Car', 'Bus'] },
      { id: 'B', name: 'Zone B (Bikes/Bicycles)', capacity: 300, allowedTypes: ['Bike', 'Bicycle'] },
      { id: 'C', name: 'Zone C (Faculty Only)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'] },
      { id: 'D', name: 'Zone D (Visitors)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'] }
    ]
  },
  activityLogs: []
};

/**
 * Seeds the global mock database with initial slots and logs
 */
export function seedMockDb() {
  // 1. Seed Slots
  if (global.mockDb.slots.length === 0) {
    const zones = [
      { id: 'A', capacity: 400, allowedTypes: ['Car', 'Bus'], reservedCount: 0 },
      { id: 'B', capacity: 300, allowedTypes: ['Bike', 'Bicycle'], reservedCount: 0 },
      { id: 'C', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'], reservedCount: 25 },
      { id: 'D', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'], reservedCount: 15 }
    ];

    zones.forEach(zone => {
      for (let i = 1; i <= zone.capacity; i++) {
        const paddedNumber = String(i).padStart(3, '0');
        const slotId = `${zone.id}-${paddedNumber}`;
        
        let status = SLOT_STATUSES.AVAILABLE;
        if (zone.reservedCount && i <= zone.reservedCount) {
          status = SLOT_STATUSES.RESERVED;
        }

        global.mockDb.slots.push({
          _id: `mock_slot_${slotId}`,
          slotId,
          zone: zone.id,
          status,
          vehicleTypes: zone.allowedTypes,
          currentRecord: null
        });
      }
    });
  }

  // 2. Seed Default User if empty
  if (global.mockDb.users.length === 0) {
    global.mockDb.users.push({
      _id: 'mock_admin_id',
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      role: 'admin',
      createdAt: new Date()
    });
  }
  
  // 3. Seed default log
  if (global.mockDb.activityLogs.length === 0) {
    global.mockDb.activityLogs.push({
      _id: 'mock_log_1',
      action: 'REGISTER',
      details: 'Root System initialized. Default admin seeded: admin@campus.edu',
      operator: { _id: 'mock_admin_id', name: 'Campus Admin', email: 'admin@campus.edu', role: 'admin' },
      timestamp: new Date()
    });
  }

  // 4. Seed Registered Vehicles if empty
  if (global.mockDb.registeredVehicles.length === 0) {
    global.mockDb.registeredVehicles.push(
      {
        _id: 'mock_reg_1',
        plate: 'MH12AB1234',
        ownerName: 'Aditya Verma',
        ownerType: 'Student',
        vehicleType: 'Car',
        mobile: '9876543210',
        photo: '',
        isActive: true,
        registeredAt: new Date(),
        lastSeen: null,
        totalVisits: 0
      },
      {
        _id: 'mock_reg_2',
        plate: 'DL01XX9999',
        ownerName: 'Dr. Shailesh Kumar',
        ownerType: 'Faculty',
        vehicleType: 'Car',
        mobile: '9876543212',
        photo: '',
        isActive: true,
        registeredAt: new Date(),
        lastSeen: null,
        totalVisits: 0
      }
    );
  }
}
