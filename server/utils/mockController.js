import { subDays, subHours, format, startOfDay } from 'date-fns';
import { SLOT_STATUSES, RECORD_STATUSES, DEFAULT_RATES } from '../config/constants.js';
import { calcFee } from '../utils/feeCalculator.js';
import { logSystemActivity } from './logger.js';

// In-Memory Slot Assignation helper
const findBestMockSlot = (vehicleType, zonePreference) => {
  const slots = global.mockDb.slots;
  const freeSlots = slots.filter(s => s.status === SLOT_STATUSES.AVAILABLE || s.status === SLOT_STATUSES.RESERVED);

  if (zonePreference && zonePreference !== 'Auto') {
    const zoneSlots = freeSlots.filter(s => s.zone === zonePreference && s.vehicleTypes.includes(vehicleType));
    if (zoneSlots.length === 0) return null;
    
    // available first, then reserved
    zoneSlots.sort((a, b) => {
      if (a.status === SLOT_STATUSES.AVAILABLE && b.status === SLOT_STATUSES.RESERVED) return -1;
      if (a.status === SLOT_STATUSES.RESERVED && b.status === SLOT_STATUSES.AVAILABLE) return 1;
      return a.slotId.localeCompare(b.slotId);
    });
    return zoneSlots[0];
  }

  // Auto prioritizing
  const zonePriority = (vehicleType === 'Car' || vehicleType === 'Bus') ? ['A', 'C', 'D'] : ['B', 'C', 'D'];
  for (const zoneId of zonePriority) {
    const zoneSlots = freeSlots.filter(s => s.zone === zoneId && s.vehicleTypes.includes(vehicleType));
    if (zoneSlots.length > 0) {
      zoneSlots.sort((a, b) => {
        if (a.status === SLOT_STATUSES.AVAILABLE && b.status === SLOT_STATUSES.RESERVED) return -1;
        if (a.status === SLOT_STATUSES.RESERVED && b.status === SLOT_STATUSES.AVAILABLE) return 1;
        return a.slotId.localeCompare(b.slotId);
      });
      return zoneSlots[0];
    }
  }

  return null;
};

export const mockController = {
  // -------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------
  register: async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = global.mockDb.users.find(u => u.email === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists in memory.' });
    }

    const role = global.mockDb.users.length === 0 ? 'admin' : 'operator';
    const newUser = {
      _id: `mock_user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role,
      createdAt: new Date()
    };

    global.mockDb.users.push(newUser);
    await logSystemActivity('REGISTER', `Registered new mock account: ${name} (${email})`, newUser._id);

    return res.status(201).json({
      success: true,
      token: 'mock_jwt_token_session_xxxx',
      user: newUser
    });
  },

  login: async (req, res) => {
    const { email } = req.body;
    let user = global.mockDb.users.find(u => u.email === email.toLowerCase());
    if (!user) {
      // Auto seed user on login in sandbox mode to make sandbox experience frictionless!
      user = {
        _id: 'mock_admin_id',
        name: email.split('@')[0].toUpperCase(),
        email: email.toLowerCase(),
        role: email.toLowerCase().includes('admin') ? 'admin' : 'operator',
        createdAt: new Date()
      };
      global.mockDb.users.push(user);
    }

    await logSystemActivity('LOGIN', `Logged in operator: ${user.name} (${user.email})`, user._id);

    return res.status(200).json({
      success: true,
      token: 'mock_jwt_token_session_xxxx',
      user
    });
  },

  getMe: (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
  },

  // -------------------------------------------------------------
  // RECORDS
  // -------------------------------------------------------------
  createEntry: async (req, res) => {
    const { plate, ownerName, ownerType, vehicleType, mobile, zonePreference } = req.body;
    const formattedPlate = plate.toUpperCase().trim();

    const active = global.mockDb.records.find(r => r.plate === formattedPlate && r.status === RECORD_STATUSES.ACTIVE);
    if (active) {
      return res.status(409).json({ success: false, message: `Conflict: Vehicle is already parked in slot ${active.slotId}.` });
    }

    const slot = findBestMockSlot(vehicleType, zonePreference || 'Auto');
    if (!slot) {
      return res.status(409).json({ success: false, message: 'No available slots found.' });
    }

    const newRecord = {
      _id: `mock_rec_${Date.now()}`,
      plate: formattedPlate,
      ownerName,
      ownerType,
      vehicleType,
      mobile: mobile || '',
      slot: slot._id,
      slotId: slot.slotId,
      zone: slot.zone,
      entryTime: new Date().toISOString(),
      exitTime: null,
      durationMinutes: null,
      fee: null,
      status: 'active',
      createdBy: req.user?._id || 'mock_admin_id'
    };

    // Update slot
    slot.status = SLOT_STATUSES.OCCUPIED;
    slot.currentRecord = newRecord;

    global.mockDb.records.push(newRecord);

    await logSystemActivity('VEHICLE_ENTRY', `Checked in ${vehicleType} plate ${formattedPlate} to slot ${slot.slotId}.`, req.user?._id);

    return res.status(201).json({ success: true, record: newRecord, slot });
  },

  exitRecord: async (req, res) => {
    const { id } = req.params;
    const { fee, durationMinutes, exitTime: clientExitTime } = req.body;
    const record = global.mockDb.records.find(r => r._id === id);
    if (!record || record.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Record not found or already closed.' });
    }

    const exitTime = clientExitTime || new Date().toISOString();
    const rates = global.mockDb.settings.rates || DEFAULT_RATES;
    
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

    record.exitTime = exitTime;
    record.durationMinutes = billingDuration;
    record.fee = billingFee;
    record.status = 'exited';

    // Free Slot
    const slot = global.mockDb.slots.find(s => s.slotId === record.slotId);
    if (slot) {
      let nextStatus = SLOT_STATUSES.AVAILABLE;
      const num = parseInt(slot.slotId.split('-')[1]);
      if (slot.zone === 'C' && num <= 2) nextStatus = SLOT_STATUSES.RESERVED;
      else if (slot.zone === 'D' && num <= 1) nextStatus = SLOT_STATUSES.RESERVED;

      slot.status = nextStatus;
      slot.currentRecord = null;
    }

    const durationStr = `${Math.floor(billingDuration / 60)}h ${billingDuration % 60}m`;
    await logSystemActivity('VEHICLE_EXIT', `Checked out plate ${record.plate} from slot ${record.slotId}. Collected: ₹${billingFee}. Duration: ${durationStr}.`, req.user?._id);

    return res.status(200).json({ success: true, record, fee: billingFee, duration: billingDuration });
  },

  getActiveRecords: (req, res) => {
    const list = global.mockDb.records.filter(r => r.status === 'active');
    return res.status(200).json({ success: true, count: list.length, data: list });
  },

  searchRecords: (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, count: 0, data: [] });
    const regex = new RegExp(q, 'i');
    const list = global.mockDb.records.filter(r => r.status === 'active' && (regex.test(r.plate) || regex.test(r.slotId)));
    return res.status(200).json({ success: true, count: list.length, data: list });
  },

  getRecords: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let list = [...global.mockDb.records];

    if (req.query.status) {
      list = list.filter(r => r.status === req.query.status);
    }
    if (req.query.zone) {
      list = list.filter(r => r.zone === req.query.zone);
    }
    if (req.query.type) {
      list = list.filter(r => r.vehicleType === req.query.type);
    }
    if (req.query.ownerType) {
      list = list.filter(r => r.ownerType === req.query.ownerType);
    }

    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      list = list.filter(r => r.plate.toLowerCase().includes(q) || r.ownerName.toLowerCase().includes(q) || r.slotId.toLowerCase().includes(q));
    }

    list.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
    const paginated = list.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      records: paginated,
      totalCount: list.length,
      totalPages: Math.ceil(list.length / limit),
      currentPage: page
    });
  },

  getRecordById: (req, res) => {
    const record = global.mockDb.records.find(r => r._id === req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    return res.status(200).json({ success: true, data: record });
  },

  // -------------------------------------------------------------
  // SLOTS
  // -------------------------------------------------------------
  getSlots: (req, res) => {
    let list = [...global.mockDb.slots];
    if (req.query.zone) {
      list = list.filter(s => s.zone === req.query.zone);
    }
    return res.status(200).json({ success: true, count: list.length, data: list });
  },

  getSlotById: (req, res) => {
    const slot = global.mockDb.slots.find(s => s.slotId === req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    return res.status(200).json({ success: true, data: slot });
  },

  updateSlotStatus: async (req, res) => {
    const slot = global.mockDb.slots.find(s => s.slotId === req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });

    const oldStatus = slot.status;
    slot.status = req.body.status;

    await logSystemActivity('SLOT_UPDATE', `Changed slot ${slot.slotId} status from '${oldStatus}' to '${req.body.status}'.`, req.user?._id);

    return res.status(200).json({ success: true, data: slot });
  },

  // -------------------------------------------------------------
  // STATS
  // -------------------------------------------------------------
  getSummary: (req, res) => {
    const slots = global.mockDb.slots;
    const records = global.mockDb.records;

    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.status === SLOT_STATUSES.OCCUPIED).length;
    const reservedSlots = slots.filter(s => s.status === SLOT_STATUSES.RESERVED).length;
    const availableSlots = slots.filter(s => s.status === SLOT_STATUSES.AVAILABLE || s.status === SLOT_STATUSES.RESERVED).length;

    const today = startOfDay(new Date());
    const todayRevenue = records
      .filter(r => r.status === 'exited' && new Date(r.exitTime) >= today)
      .reduce((sum, r) => sum + (r.fee || 0), 0);

    const zoneOccupancy = {};
    ['A', 'B', 'C', 'D'].forEach(z => {
      const zoneSlots = slots.filter(s => s.zone === z);
      const zoneOccupied = zoneSlots.filter(s => s.status === SLOT_STATUSES.OCCUPIED).length;
      zoneOccupancy[z] = zoneSlots.length > 0 ? Math.round((zoneOccupied / zoneSlots.length) * 100) : 0;
    });

    return res.status(200).json({
      success: true,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      todayRevenue,
      zoneOccupancy
    });
  },

  getActivity: (req, res) => {
    const records = global.mockDb.records;
    const checkins = [...records].sort((a,b) => new Date(b.entryTime) - new Date(a.entryTime)).slice(0, 10);
    const checkouts = records.filter(r => r.status === 'exited').sort((a,b) => new Date(b.exitTime) - new Date(a.exitTime)).slice(0, 10);

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
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return res.status(200).json({ success: true, count: merged.length, data: merged });
  },

  getSystemLogs: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const list = [...global.mockDb.activityLogs];
    const paginated = list.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      logs: paginated,
      totalCount: list.length,
      totalPages: Math.ceil(list.length / limit),
      currentPage: page
    });
  },

  // -------------------------------------------------------------
  // REPORTS
  // -------------------------------------------------------------
  getReportsSummary: (req, res) => {
    const records = global.mockDb.records;
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
        let val = Math.floor(Math.random() * 5);
        if (isWeekday) {
          if (hour === 9 || hour === 10 || hour === 16 || hour === 17) {
            val = Math.floor(Math.random() * 12) + 14;
          } else {
            val = Math.floor(Math.random() * 6) + 4;
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
        A: Math.floor(Math.random() * 15) + 30,
        B: Math.floor(Math.random() * 20) + 20,
        C: Math.floor(Math.random() * 10) + 40,
        D: Math.floor(Math.random() * 15) + 15
      });
    }

    return res.status(200).json({
      success: true,
      dailyRevenue,
      vehicleDistribution,
      heatmapData,
      zoneUtilization
    });
  },

  getDaily: (req, res) => {
    const records = global.mockDb.records;
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = subDays(now, i);
      const dayStart = startOfDay(targetDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayRevenue = records
        .filter(r => r.status === 'exited' && new Date(r.exitTime) >= dayStart && new Date(r.exitTime) <= dayEnd)
        .reduce((sum, r) => sum + (r.fee || 0), 0);

      result.push({
        date: format(targetDate, 'dd MMM yyyy'),
        revenue: dayRevenue
      });
    }
    return res.status(200).json({ success: true, data: result });
  },

  getHourly: (req, res) => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = [];
    for (let hour = 8; hour <= 18; hour++) {
      daysOfWeek.forEach((day, index) => {
        heatmap.push({
          _id: { hour, dayOfWeek: index + 1 },
          count: Math.floor(Math.random() * 5)
        });
      });
    }
    return res.status(200).json({ success: true, data: heatmap });
  },

  getVehicleTypes: (req, res) => {
    const records = global.mockDb.records;
    const vehiclesCount = { Car: 0, Bike: 0, Bicycle: 0, Bus: 0 };
    const vehiclesRevenue = { Car: 0, Bike: 0, Bicycle: 0, Bus: 0 };
    
    records.forEach(r => {
      if (vehiclesCount[r.vehicleType] !== undefined) {
        vehiclesCount[r.vehicleType]++;
        if (r.status === 'exited') {
          vehiclesRevenue[r.vehicleType] += (r.fee || 0);
        }
      }
    });
    
    const summary = Object.keys(vehiclesCount).map(key => ({
      _id: key,
      count: vehiclesCount[key],
      revenue: vehiclesRevenue[key]
    }));
    
    return res.status(200).json({ success: true, data: summary });
  },

  getZoneUtilization: (req, res) => {
    const now = new Date();
    const zonesList = ['A', 'B', 'C', 'D'];
    const timeline = [];
    
    for (let i = 24; i >= 0; i--) {
      const time = subHours(now, i);
      const point = { timestamp: time.toISOString() };
      for (const z of zonesList) {
        point[z] = Math.floor(Math.random() * 30) + 10;
      }
      timeline.push(point);
    }
    return res.status(200).json({ success: true, data: timeline });
  },

  // -------------------------------------------------------------
  // SETTINGS
  // -------------------------------------------------------------
  getSettings: (req, res) => {
    return res.status(200).json({ success: true, ...global.mockDb.settings });
  },

  updateSettings: async (req, res) => {
    const { rates, collegeName, contactPhone, zones } = req.body;
    
    if (rates) global.mockDb.settings.rates = rates;
    if (collegeName) global.mockDb.settings.collegeName = collegeName;
    if (contactPhone) global.mockDb.settings.contactPhone = contactPhone;

    if (zones && Array.isArray(zones)) {
      global.mockDb.settings.zones = zones;

      // Rebuild slots
      zones.forEach(zone => {
        const existing = global.mockDb.slots.filter(s => s.zone === zone.id);
        const currentCount = existing.length;
        const target = parseInt(zone.capacity);

        if (target > currentCount) {
          for (let i = currentCount + 1; i <= target; i++) {
            const padded = String(i).padStart(2, '0');
            const slotId = `${zone.id}-${padded}`;
            global.mockDb.slots.push({
              _id: `mock_slot_${slotId}`,
              slotId,
              zone: zone.id,
              status: SLOT_STATUSES.AVAILABLE,
              vehicleTypes: zone.allowedTypes || ['Car', 'Bike', 'Bicycle', 'Bus'],
              currentRecord: null
            });
          }
        } else if (target < currentCount) {
          const toDel = existing.slice(target);
          const occupied = toDel.some(s => s.status === SLOT_STATUSES.OCCUPIED);
          if (occupied) return res.status(400).json({ success: false, message: 'Cannot decrease capacity. Slots occupied.' });
          
          const ids = toDel.map(s => s._id);
          global.mockDb.slots = global.mockDb.slots.filter(s => !ids.includes(s._id));
        }
      });
    }

    await logSystemActivity('SETTINGS_UPDATE', 'Updated settings and resized capacity limits.', req.user?._id);

    return res.status(200).json({ success: true, message: 'Settings saved', data: global.mockDb.settings });
  }
};
