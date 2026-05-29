import client from './client';
import toast from 'react-hot-toast';
import { calculateFee } from '../utils/calcFee';
import { DEFAULT_ZONES, DEFAULT_SETTINGS, SLOT_STATUS } from '../utils/constants';
import { subDays, subHours, format, startOfDay } from 'date-fns';

// -------------------------------------------------------------
// LOCAL STORAGE SANDBOX DATABASE SEEDING
// -------------------------------------------------------------
const initMockDB = () => {
  const settings = JSON.parse(localStorage.getItem('college_parking_settings')) || DEFAULT_SETTINGS;
  if (!localStorage.getItem('college_parking_settings')) {
    localStorage.setItem('college_parking_settings', JSON.stringify(settings));
  }

  // Generate slots based on settings/capacities
  let slots = JSON.parse(localStorage.getItem('college_parking_slots'));
  if (!slots) {
    slots = [];
    DEFAULT_ZONES.forEach(zone => {
      for (let i = 1; i <= zone.capacity; i++) {
        const slotNumber = `${zone.id}-${i}`;
        let status = SLOT_STATUS.AVAILABLE;
        if (settings.enableReserved && i <= settings.reservedCount) {
          status = SLOT_STATUS.RESERVED;
        }
        slots.push({
          slotNumber,
          zoneId: zone.id,
          number: i,
          status,
          plate: null,
          ownerInitials: null
        });
      }
    });
    localStorage.setItem('college_parking_slots', JSON.stringify(slots));
  }

  // Initialize records
  let records = JSON.parse(localStorage.getItem('college_parking_records'));
  if (!records) {
    const now = new Date();
    records = [
      {
        id: 'rec_act_1',
        plate: 'MH12AB1234',
        ownerName: 'Rahul Sharma',
        vehicleType: 'Car',
        ownerType: 'Student',
        zonePreference: 'A',
        mobileNumber: '9876543211',
        slotNumber: 'A-6',
        entryTime: subHours(now, 2.5).toISOString(),
        exitTime: null,
        fee: null,
        durationMinutes: null,
        status: 'active'
      },
      {
        id: 'rec_act_2',
        plate: 'DL01XX9999',
        ownerName: 'Prof. K. Verma',
        vehicleType: 'Car',
        ownerType: 'Faculty',
        zonePreference: 'C',
        mobileNumber: '9876543212',
        slotNumber: 'C-2',
        entryTime: subHours(now, 4.5).toISOString(),
        exitTime: null,
        fee: null,
        durationMinutes: null,
        status: 'active'
      },
      {
        id: 'rec_act_3',
        plate: 'KA03XY5678',
        ownerName: 'Amit Patel',
        vehicleType: 'Bike',
        ownerType: 'Student',
        zonePreference: 'B',
        mobileNumber: '9876543213',
        slotNumber: 'B-3',
        entryTime: subHours(now, 1.2).toISOString(),
        exitTime: null,
        fee: null,
        durationMinutes: null,
        status: 'active'
      },
      {
        id: 'rec_act_4',
        plate: 'HR26AS4321',
        ownerName: 'Dr. Anjali Sen',
        vehicleType: 'Car',
        ownerType: 'Faculty',
        zonePreference: 'C',
        mobileNumber: '9876543214',
        slotNumber: 'C-3',
        entryTime: subHours(now, 6).toISOString(),
        exitTime: null,
        fee: null,
        durationMinutes: null,
        status: 'active'
      }
    ];

    const seedExited = [
      {
        id: 'rec_ex_1',
        plate: 'KA05MM1122',
        ownerName: 'Suresh Kumar',
        vehicleType: 'Bike',
        ownerType: 'Staff',
        zonePreference: 'B',
        mobileNumber: '9876543215',
        slotNumber: 'B-8',
        entryTime: subHours(now, 5).toISOString(),
        exitTime: subHours(now, 2).toISOString(),
        fee: 30,
        durationMinutes: 180,
        status: 'exited'
      },
      {
        id: 'rec_ex_2',
        plate: 'DL03CC4455',
        ownerName: 'John Smith',
        vehicleType: 'Car',
        ownerType: 'Visitor',
        zonePreference: 'D',
        mobileNumber: '9876543216',
        slotNumber: 'D-1',
        entryTime: subHours(now, 3).toISOString(),
        exitTime: subHours(now, 1).toISOString(),
        fee: 40,
        durationMinutes: 120,
        status: 'exited'
      },
      {
        id: 'rec_ex_3',
        plate: 'UP16ZZ8888',
        ownerName: 'Rohan Gupta',
        vehicleType: 'Car',
        ownerType: 'Student',
        zonePreference: 'A',
        mobileNumber: '9876543217',
        slotNumber: 'A-20',
        entryTime: subHours(now, 8).toISOString(),
        exitTime: subHours(now, 6).toISOString(),
        fee: 40,
        durationMinutes: 120,
        status: 'exited'
      },
      {
        id: 'rec_ex_4',
        plate: 'MH02YY7777',
        ownerName: 'Priya Nair',
        vehicleType: 'Car',
        ownerType: 'Staff',
        zonePreference: 'A',
        mobileNumber: '9876543218',
        slotNumber: 'A-4',
        entryTime: subHours(now, 6).toISOString(),
        exitTime: subHours(now, 3).toISOString(),
        fee: 60,
        durationMinutes: 180,
        status: 'exited'
      },
      {
        id: 'rec_ex_5',
        plate: 'KA04HH4321',
        ownerName: 'Vikram Singh',
        vehicleType: 'Bus',
        ownerType: 'Visitor',
        zonePreference: 'Auto',
        mobileNumber: '9876543219',
        slotNumber: 'D-5',
        entryTime: subHours(now, 4).toISOString(),
        exitTime: subHours(now, 2).toISOString(),
        fee: 100,
        durationMinutes: 120,
        status: 'exited'
      }
    ];

    records.push(...seedExited);
    localStorage.setItem('college_parking_records', JSON.stringify(records));

    records.filter(r => r.status === 'active').forEach(activeRec => {
      const slotIndex = slots.findIndex(s => s.slotNumber === activeRec.slotNumber);
      if (slotIndex !== -1) {
        slots[slotIndex].status = SLOT_STATUS.OCCUPIED;
        slots[slotIndex].plate = activeRec.plate;
        slots[slotIndex].ownerInitials = activeRec.ownerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      }
    });
    localStorage.setItem('college_parking_slots', JSON.stringify(slots));
  }

  // Initialize activity feed
  let activity = JSON.parse(localStorage.getItem('college_parking_activity'));
  if (!activity) {
    const now = new Date();
    activity = [
      { id: 'act_1', type: 'entry', plate: 'HR26AS4321', slotNumber: 'C-3', timestamp: subHours(now, 6).toISOString() },
      { id: 'act_2', type: 'entry', plate: 'UP16ZZ8888', slotNumber: 'A-20', timestamp: subHours(now, 8).toISOString() },
      { id: 'act_3', type: 'exit', plate: 'UP16ZZ8888', slotNumber: 'A-20', timestamp: subHours(now, 6).toISOString() },
      { id: 'act_4', type: 'entry', plate: 'DL01XX9999', slotNumber: 'C-2', timestamp: subHours(now, 4.5).toISOString() },
      { id: 'act_5', type: 'entry', plate: 'MH02YY7777', slotNumber: 'A-4', timestamp: subHours(now, 6).toISOString() },
      { id: 'act_6', type: 'exit', plate: 'MH02YY7777', slotNumber: 'A-4', timestamp: subHours(now, 3).toISOString() },
      { id: 'act_7', type: 'entry', plate: 'MH12AB1234', slotNumber: 'A-6', timestamp: subHours(now, 2.5).toISOString() },
      { id: 'act_8', type: 'entry', plate: 'KA03XY5678', slotNumber: 'B-3', timestamp: subHours(now, 1.2).toISOString() },
      { id: 'act_9', type: 'exit', plate: 'KA05MM1122', slotNumber: 'B-8', timestamp: subHours(now, 2).toISOString() },
      { id: 'act_10', type: 'exit', plate: 'DL03CC4455', slotNumber: 'D-1', timestamp: subHours(now, 1).toISOString() }
    ];
    localStorage.setItem('college_parking_activity', JSON.stringify(activity));
  }
};

initMockDB();

// Warning flag
let isSandboxModeNotificationShown = false;
const notifySandbox = () => {
  if (!isSandboxModeNotificationShown) {
    toast.success('Connected to Local Storage Sandbox (Backend offline)', {
      icon: '💾',
      duration: 4000
    });
    isSandboxModeNotificationShown = true;
  }
};

const handleApiCall = async (apiPromise, mockFunc) => {
  try {
    const res = await apiPromise();
    return res.data;
  } catch (error) {
    if (!error.response || error.code === 'ERR_NETWORK') {
      notifySandbox();
      return mockFunc();
    }
    throw error;
  }
};

// -------------------------------------------------------------
// LOCAL STORAGE API FALLBACK IMPLEMENTATION
// -------------------------------------------------------------
const mockApi = {
  login: ({ email, password }) => {
    const mockUser = {
      id: 'mock_operator_id',
      name: email.split('@')[0].toUpperCase(),
      email: email.toLowerCase(),
      role: email.toLowerCase().includes('admin') ? 'admin' : 'operator'
    };
    const mockToken = 'mock_jwt_jsonwebtoken_token_session_xxxx';
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    return { success: true, token: mockToken, user: mockUser };
  },

  register: ({ name, email }) => {
    const mockUser = {
      id: `mock_operator_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: 'operator'
    };
    const mockToken = 'mock_jwt_jsonwebtoken_token_session_xxxx';
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    return { success: true, token: mockToken, user: mockUser };
  },

  getCurrentUser: () => {
    const stored = localStorage.getItem('user');
    if (stored) return { success: true, user: JSON.parse(stored) };
    return { success: false, message: 'No session cached' };
  },

  getStats: () => {
    const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
    const slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
    
    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.status === SLOT_STATUS.OCCUPIED).length;
    const availableSlots = slots.filter(s => s.status === SLOT_STATUS.AVAILABLE || s.status === SLOT_STATUS.RESERVED).length;

    const today = startOfDay(new Date());
    const todayRevenue = records
      .filter(r => r.status === 'exited' && new Date(r.exitTime) >= today)
      .reduce((sum, r) => sum + (r.fee || 0), 0);

    const zoneOccupancy = {};
    DEFAULT_ZONES.forEach(z => {
      const zoneSlots = slots.filter(s => s.zoneId === z.id);
      const zoneOccupied = zoneSlots.filter(s => s.status === SLOT_STATUS.OCCUPIED).length;
      zoneOccupancy[z.id] = zoneSlots.length > 0 ? Math.round((zoneOccupied / zoneSlots.length) * 100) : 0;
    });

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      todayRevenue,
      zoneOccupancy
    };
  },

  getActivity: () => {
    const activity = JSON.parse(localStorage.getItem('college_parking_activity')) || [];
    return [...activity]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  },

  getSlots: () => {
    const list = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
    return {
      success: true,
      data: list.map(s => ({
        slotId: s.slotNumber,
        zone: s.zoneId,
        status: s.status,
        plate: s.plate,
        ownerInitials: s.ownerInitials
      }))
    };
  },

  getActiveRecords: () => {
    const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
    return {
      success: true,
      data: records.filter(r => r.status === 'active')
    };
  },

  searchRecords: (q) => {
    const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
    const query = q.toLowerCase();
    const list = records.filter(r => 
      r.status === 'active' && 
      (r.plate.toLowerCase().includes(query) || r.slotNumber.toLowerCase().includes(query))
    );
    return { success: true, data: list };
  },

  createEntryRecord: (data) => {
    const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
    let slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
    let activity = JSON.parse(localStorage.getItem('college_parking_activity')) || [];

    let targetZone = data.zonePreference;
    if (targetZone === 'Auto') {
      if (data.vehicleType === 'Car') targetZone = 'A';
      else if (data.vehicleType === 'Bike') targetZone = 'B';
      else if (data.ownerType === 'Faculty') targetZone = 'C';
      else targetZone = 'D';
    }

    const freeSlot = slots.find(s => 
      s.zoneId === targetZone && 
      (s.status === SLOT_STATUS.AVAILABLE || s.status === SLOT_STATUS.RESERVED)
    );

    if (!freeSlot) {
      throw new Error(`No available slot found in Zone ${targetZone}`);
    }

    freeSlot.status = SLOT_STATUS.OCCUPIED;
    freeSlot.plate = data.plate.toUpperCase();
    freeSlot.ownerInitials = data.ownerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newRecord = {
      id: `rec_${Date.now()}`,
      plate: data.plate.toUpperCase(),
      ownerName: data.ownerName,
      vehicleType: data.vehicleType,
      ownerType: data.ownerType,
      zonePreference: data.zonePreference,
      mobileNumber: data.mobileNumber || '',
      slotNumber: freeSlot.slotNumber,
      entryTime: new Date().toISOString(),
      exitTime: null,
      fee: null,
      durationMinutes: null,
      status: 'active'
    };

    const newActivity = {
      id: `act_${Date.now()}`,
      type: 'entry',
      plate: newRecord.plate,
      slotNumber: newRecord.slotNumber,
      timestamp: newRecord.entryTime
    };

    records.push(newRecord);
    activity.unshift(newActivity);

    localStorage.setItem('college_parking_records', JSON.stringify(records));
    localStorage.setItem('college_parking_slots', JSON.stringify(slots));
    localStorage.setItem('college_parking_activity', JSON.stringify(activity.slice(0, 50)));

    return newRecord;
  },

  exitRecord: (id, payload = {}) => {
    const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
    let slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
    const settings = JSON.parse(localStorage.getItem('college_parking_settings')) || DEFAULT_SETTINGS;
    let activity = JSON.parse(localStorage.getItem('college_parking_activity')) || [];

    const recordIndex = records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      throw new Error('Parking record not found.');
    }

    const record = records[recordIndex];
    const exitTime = payload.exitTime || new Date().toISOString();
    
    let fee = payload.fee;
    let totalMinutes = payload.durationMinutes;

    if (fee === undefined || fee === null) {
      const rate = settings.rates[record.vehicleType] || 10;
      const calc = calculateFee(record.entryTime, exitTime, rate);
      fee = calc.fee;
      totalMinutes = calc.totalMinutes;
    }

    record.exitTime = exitTime;
    record.fee = fee;
    record.durationMinutes = totalMinutes;
    record.status = 'exited';

    const slotIndex = slots.findIndex(s => s.slotNumber === record.slotNumber);
    if (slotIndex !== -1) {
      const slot = slots[slotIndex];
      slot.plate = null;
      slot.ownerInitials = null;
      if (settings.enableReserved && slot.number <= settings.reservedCount) {
        slot.status = SLOT_STATUS.RESERVED;
      } else {
        slot.status = SLOT_STATUS.AVAILABLE;
      }
    }

    const newActivity = {
      id: `act_${Date.now()}`,
      type: 'exit',
      plate: record.plate,
      slotNumber: record.slotNumber,
      timestamp: exitTime
    };

    activity.unshift(newActivity);

    localStorage.setItem('college_parking_records', JSON.stringify(records));
    localStorage.setItem('college_parking_slots', JSON.stringify(slots));
    localStorage.setItem('college_parking_activity', JSON.stringify(activity.slice(0, 50)));

    return record;
  },

  getRecords: (params = {}) => {
    const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
    let filtered = [...records];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.plate.toLowerCase().includes(q) || 
        r.ownerName.toLowerCase().includes(q) ||
        r.slotNumber.toLowerCase().includes(q)
      );
    }

    if (params.status) {
      filtered = filtered.filter(r => r.status === params.status);
    }

    if (params.zone && params.zone !== 'All') {
      filtered = filtered.filter(r => r.slotNumber.startsWith(params.zone));
    }

    if (params.vehicleType && params.vehicleType !== 'All') {
      filtered = filtered.filter(r => r.vehicleType === params.vehicleType);
    }

    if (params.ownerType && params.ownerType !== 'All') {
      filtered = filtered.filter(r => r.ownerType === params.ownerType);
    }

    if (params.startDate) {
      const start = new Date(params.startDate);
      filtered = filtered.filter(r => new Date(r.entryTime) >= start);
    }

    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.entryTime) <= end);
    }

    filtered.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const totalCount = filtered.length;
    const paginatedRecords = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      records: paginatedRecords,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  },

  getReportsSummary: () => {
    const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
    const now = new Date();
    
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = subDays(now, i);
      const dayStart = startOfDay(targetDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayRevenue = records
        .filter(r => r.status === 'exited' && new Date(r.exitTime) >= dayStart && new Date(r.exitTime) <= dayEnd)
        .reduce((sum, r) => sum + (r.fee || 0), 0);

      dailyRevenue.push({
        date: format(targetDate, 'dd MMM'),
        revenue: dayRevenue
      });
    }

    const vehiclesCount = { Car: 0, Bike: 0, Bicycle: 0, Bus: 0 };
    records.forEach(r => {
      if (vehiclesCount[r.vehicleType] !== undefined) {
        vehiclesCount[r.vehicleType]++;
      }
    });
    const vehicleDistribution = Object.keys(vehiclesCount).map(key => ({
      name: key,
      value: vehiclesCount[key]
    }));

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmapData = [];
    
    for (let hour = 8; hour <= 18; hour++) {
      const hourStr = `${hour === 12 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`;
      daysOfWeek.forEach(day => {
        const isWeekday = day !== 'Sat' && day !== 'Sun';
        let val = Math.floor(Math.random() * 8);
        if (isWeekday) {
          if (hour === 9 || hour === 10 || hour === 16 || hour === 17) {
            val = Math.floor(Math.random() * 15) + 18;
          } else {
            val = Math.floor(Math.random() * 10) + 8;
          }
        }
        heatmapData.push({ hour: hourStr, day, count: val });
      });
    }

    const zoneUtilization = [];
    for (let i = 5; i >= 0; i--) {
      const time = subHours(now, i);
      const label = format(time, 'hh a');
      zoneUtilization.push({
        time: label,
        A: Math.floor(Math.random() * 20) + 50,
        B: Math.floor(Math.random() * 30) + 40,
        C: Math.floor(Math.random() * 15) + 60,
        D: Math.floor(Math.random() * 25) + 30
      });
    }

    return {
      success: true,
      dailyRevenue,
      vehicleDistribution,
      heatmapData,
      zoneUtilization
    };
  },

  getSettings: () => {
    return JSON.parse(localStorage.getItem('college_parking_settings')) || DEFAULT_SETTINGS;
  },

  updateSettings: (data) => {
    const current = JSON.parse(localStorage.getItem('college_parking_settings')) || DEFAULT_SETTINGS;
    const updated = { ...current, ...data };
    localStorage.setItem('college_parking_settings', JSON.stringify(updated));
    return updated;
  },

  getAuditLogs: (params = {}) => {
    const now = new Date();
    const logs = [
      { id: 'log_1', action: 'LOGIN', details: 'Logged in operator: ADMIN (admin@campus.edu)', timestamp: subHours(now, 1).toISOString(), operator: { name: 'Admin User' } },
      { id: 'log_2', action: 'VEHICLE_ENTRY', details: 'Checked in Car MH12AB1234 (Owner: Rahul Sharma, Category: Student) into slot A-6.', timestamp: subHours(now, 2.5).toISOString(), operator: { name: 'Admin User' } },
      { id: 'log_3', action: 'SETTINGS_UPDATE', details: 'Updated system settings: changed Car rate to ₹20/hr, updated helpline support phone.', timestamp: subDays(now, 1).toISOString(), operator: { name: 'Admin User' } },
      { id: 'log_4', action: 'REGISTER', details: 'Registered new account: Admin User (admin@campus.edu) as role admin', timestamp: subDays(now, 2).toISOString(), operator: { name: 'Admin User' } }
    ];
    return {
      success: true,
      logs,
      totalCount: logs.length,
      totalPages: 1,
      currentPage: 1
    };
  }
};

// -------------------------------------------------------------
// FIELD MAPPING UTILITIES FOR BACKEND COMPATIBILITY
// -------------------------------------------------------------
const mapRecord = (r) => {
  if (!r) return r;
  return {
    ...r,
    id: r._id || r.id,
    slotNumber: r.slotId || r.slotNumber,
    mobileNumber: r.mobile || r.mobileNumber
  };
};

const mapSlot = (s) => {
  if (!s) return s;
  const currentRecord = s.currentRecord;
  return {
    ...s,
    slotNumber: s.slotId || s.slotNumber,
    zoneId: s.zone || s.zoneId,
    plate: currentRecord ? currentRecord.plate : (s.plate || ''),
    ownerInitials: currentRecord 
      ? currentRecord.ownerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : (s.ownerInitials || '')
  };
};

// -------------------------------------------------------------
// EXPORTED API WRAPPERS
// -------------------------------------------------------------
export const parkingApi = {
  login: (data) => 
    handleApiCall(() => client.post('/auth/login', data), () => mockApi.login(data)),

  register: (data) => 
    handleApiCall(() => client.post('/auth/register', data), () => mockApi.register(data)),

  getCurrentUser: () => 
    handleApiCall(() => client.get('/auth/me'), mockApi.getCurrentUser),

  getStats: () => 
    handleApiCall(() => client.get('/stats'), mockApi.getStats),

  getActivity: async () => {
    const res = await handleApiCall(() => client.get('/stats/activity'), mockApi.getActivity);
    const list = res?.data || res || [];
    return Array.isArray(list) ? list : [];
  },

  getSlots: async () => {
    const res = await handleApiCall(() => client.get('/slots'), mockApi.getSlots);
    const list = res?.data || res || [];
    return Array.isArray(list) ? list.map(mapSlot) : [];
  },

  getActiveRecords: async () => {
    const res = await handleApiCall(() => client.get('/records/active'), mockApi.getActiveRecords);
    const list = res?.data || res || [];
    return Array.isArray(list) ? list.map(mapRecord) : [];
  },

  searchRecords: async (q) => {
    const res = await handleApiCall(() => client.get(`/records/search?q=${q}`), () => mockApi.searchRecords(q));
    const list = res?.data || res || [];
    return Array.isArray(list) ? list.map(mapRecord) : [];
  },

  createEntryRecord: async (data) => {
    const res = await handleApiCall(() => client.post('/records/entry', data), () => mockApi.createEntryRecord(data));
    const record = res?.record || res;
    return mapRecord(record);
  },

  exitRecord: async ({ id, fee, durationMinutes, exitTime }) => {
    const res = await handleApiCall(() => client.post(`/records/exit/${id}`, { fee, durationMinutes, exitTime }), () => mockApi.exitRecord(id, { fee, durationMinutes, exitTime }));
    const record = res?.record || res;
    const mapped = mapRecord(record);
    if (res?.fee !== undefined) mapped.fee = res.fee;
    return mapped;
  },

  getRecords: async (params) => {
    const res = await handleApiCall(() => client.get('/records', { params }), () => mockApi.getRecords(params));
    if (res && Array.isArray(res.records)) {
      res.records = res.records.map(mapRecord);
    }
    return res;
  },

  getReportsSummary: () => 
    handleApiCall(() => client.get('/reports/summary'), mockApi.getReportsSummary),

  getSettings: () => 
    handleApiCall(() => client.get('/settings'), mockApi.getSettings),

  updateSettings: (data) => 
    handleApiCall(() => client.put('/settings', data), () => mockApi.updateSettings(data)),

  getAuditLogs: (params) =>
    handleApiCall(() => client.get('/stats/logs', { params }), () => mockApi.getAuditLogs(params))
};
