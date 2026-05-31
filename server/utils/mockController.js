import { subDays, subHours, format, startOfDay } from 'date-fns';
import { SLOT_STATUSES, RECORD_STATUSES, DEFAULT_RATES } from '../config/constants.js';
import { calcFee } from '../utils/feeCalculator.js';
import { logSystemActivity } from './logger.js';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

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
    const { name, email, password, role: bodyRole, mobile } = req.body;
    const userExists = global.mockDb.users.find(u => u.email === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists in memory.' });
    }

    // Validate password rules in mock
    if (password && (password.length < 8 || !/[0-9]/.test(password) || !/[A-Z]/.test(password))) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.'
      });
    }

    const role = global.mockDb.users.length === 0 ? 'admin' : (bodyRole || 'user');
    
    const emailVerifyToken = `mock_verify_token_${Date.now()}`;
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = {
      _id: `mock_user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password,
      role,
      status: 'active',
      isEmailVerified: false,
      emailVerifyToken,
      emailVerifyExpires,
      mobile: mobile || null,
      isMobileVerified: false,
      otpAttempts: 0,
      createdAt: new Date()
    };

    global.mockDb.users.push(newUser);
    await logSystemActivity('REGISTER', `Registered new mock account: ${name} (${email})`, newUser._id);

    if (mobile) {
      const otp = '123456';
      newUser.mobileOtp = otp; // store plain OTP for sandbox comparison ease
      newUser.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      console.log(`\n======================================`);
      console.log(`[MOCK OTP SENDER] Mobile: ${mobile}, OTP Code: ${otp}`);
      console.log(`======================================\n`);

      return res.status(201).json({
        success: true,
        step: 'verify-otp',
        message: 'OTP sent to mobile (Simulation)',
        email: newUser.email,
        mobile: newUser.mobile
      });
    }

    console.log(`\n======================================`);
    console.log(`[MOCK EMAIL VERIFIER] To: ${email}`);
    console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
    console.log(`======================================\n`);

    return res.status(201).json({
      success: true,
      step: 'verify-email',
      message: 'Check your email to verify account (Simulation)',
      email: newUser.email
    });
  },

  login: async (req, res) => {
    const { email, password, mobile, otp } = req.body;
    let user;

    if (mobile && otp) {
      user = global.mockDb.users.find(u => u.mobile === mobile);
      if (!user) {
        return res.status(404).json({ success: false, message: 'No registered user matches this mobile number in memory.' });
      }
      if (user.mobileOtp !== otp) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 3) {
          user.mobileOtp = null;
          user.mobileOtpExpires = null;
          user.otpAttempts = 0;
          return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Mobile verification locked for 30 minutes.' });
        }
        return res.status(400).json({ success: false, message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.` });
      }
      user.isMobileVerified = true;
      user.mobileOtp = null;
      user.mobileOtpExpires = null;
      user.otpAttempts = 0;
    } else {
      user = global.mockDb.users.find(u => u.email === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      if (user.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by admin.'
      });
    }

    if (user.isEmailVerified === false) {
      const emailVerifyToken = `mock_verify_token_${Date.now()}`;
      user.emailVerifyToken = emailVerifyToken;
      user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      console.log(`\n======================================`);
      console.log(`[MOCK EMAIL VERIFIER - RESEND] To: ${user.email}`);
      console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
      console.log(`======================================\n`);

      return res.status(403).json({
        success: false,
        step: 'verify-email',
        message: 'Please verify your email first. A new verification link has been sent to your email.',
        email: user.email
      });
    }

    await logSystemActivity('LOGIN', `Logged in mock user: ${user.name} (${user.email})`, user._id);

    const token = `mock_token_${user._id}`;
    const refreshToken = `mock_refresh_${user._id}`;

    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return res.status(200).json({
      success: true,
      token,
      refreshToken,
      user
    });
  },

  getMe: (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
  },

  verifyEmail: async (req, res) => {
    const { token } = req.query;
    const user = global.mockDb.users.find(u => u.emailVerifyToken === token);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token in memory.' });
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;

    const tokenJwt = `mock_token_${user._id}`;
    const refreshToken = `mock_refresh_${user._id}`;
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return res.status(200).json({
      success: true,
      message: 'Email verification successful.',
      token: tokenJwt,
      refreshToken,
      user
    });
  },

  resendVerification: async (req, res) => {
    const { email } = req.body;
    const user = global.mockDb.users.find(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }

    const emailVerifyToken = `mock_verify_token_${Date.now()}`;
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log(`\n======================================`);
    console.log(`[MOCK EMAIL VERIFIER - RESEND] To: ${email}`);
    console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
    console.log(`======================================\n`);

    return res.status(200).json({ success: true, message: 'Verification link resent to your email.' });
  },

  sendOtp: async (req, res) => {
    const { mobile } = req.body;
    const user = global.mockDb.users.find(u => u.mobile === mobile);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user matches this mobile number in memory.' });
    }

    const otp = '123456';
    user.mobileOtp = otp;
    user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`\n======================================`);
    console.log(`[MOCK OTP SENDER] Mobile: ${mobile}, OTP Code: ${otp}`);
    console.log(`======================================\n`);

    return res.status(200).json({ success: true, message: 'OTP sent to mobile successfully.' });
  },

  verifyOtp: async (req, res) => {
    const { mobile, otp } = req.body;
    const user = global.mockDb.users.find(u => u.mobile === mobile);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }

    if (user.mobileOtp !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 3) {
        user.mobileOtp = null;
        user.mobileOtpExpires = null;
        user.otpAttempts = 0;
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Mobile verification locked for 30 minutes.' });
      }
      return res.status(400).json({ success: false, message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.` });
    }

    user.isMobileVerified = true;
    user.mobileOtp = null;
    user.mobileOtpExpires = null;
    user.otpAttempts = 0;

    const emailVerifyToken = `mock_verify_token_${Date.now()}`;
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log(`\n======================================`);
    console.log(`[MOCK EMAIL VERIFIER - OTP COMPLETED] To: ${user.email}`);
    console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
    console.log(`======================================\n`);

    return res.status(200).json({
      success: true,
      message: 'Mobile OTP verified. Verification link sent to your registered email.',
      email: user.email
    });
  },

  resendOtp: async (req, res) => {
    const { mobile } = req.body;
    const user = global.mockDb.users.find(u => u.mobile === mobile);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }

    const otp = '123456';
    user.mobileOtp = otp;
    user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`\n======================================`);
    console.log(`[MOCK OTP SENDER - RESEND] Mobile: ${mobile}, OTP Code: ${otp}`);
    console.log(`======================================\n`);

    return res.status(200).json({ success: true, message: 'New OTP sent to mobile.' });
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    const user = global.mockDb.users.find(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }

    const resetToken = `mock_reset_token_${Date.now()}`;
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    let resetOtp = null;
    if (user.isMobileVerified && user.mobile) {
      resetOtp = '123456';
      user.passwordResetOtp = resetOtp;
      user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      console.log(`\n======================================`);
      console.log(`[MOCK PASSWORD RESET OTP] Mobile: ${user.mobile}, OTP Code: ${resetOtp}`);
      console.log(`======================================\n`);
    }

    console.log(`\n======================================`);
    console.log(`[MOCK PASSWORD RESET EMAIL] To: ${email}`);
    console.log(`Reset Link: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`======================================\n`);

    return res.status(200).json({
      success: true,
      message: 'Reset link sent to your email (Simulation)',
      mobileVerified: !!(user.isMobileVerified && user.mobile)
    });
  },

  resetPassword: async (req, res) => {
    const { token, newPassword } = req.body;
    const user = global.mockDb.users.find(u => u.passwordResetToken === token);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token in memory.' });
    }

    // Password rules validation
    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  },

  resetPasswordOtp: async (req, res) => {
    const { mobile, otp, newPassword } = req.body;
    const user = global.mockDb.users.find(u => u.mobile === mobile);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }

    if (user.passwordResetOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid reset OTP.' });
    }

    // Password rules validation
    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  },

  refreshToken: async (req, res) => {
    const { refreshToken } = req.body;
    const user = global.mockDb.users.find(u => u.refreshToken === refreshToken);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const newAccessToken = `mock_token_${user._id}`;
    return res.status(200).json({ success: true, accessToken: newAccessToken });
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

    if (req.user && (req.user.role === 'user' || req.user.role === 'student')) {
      list = list.filter(r => r.userId === req.user._id);
    }

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
    
    const isStudent = req.user && (req.user.role === 'user' || req.user.role === 'student');
    if (isStudent) {
      list = list.map(s => {
        if (s.status === 'occupied') {
          const copy = { ...s };
          copy.plate = null;
          copy.ownerInitials = null;
          copy.currentRecord = null;
          copy.status = 'booked';
          return copy;
        }
        return s;
      });
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
    const users = global.mockDb.users || [];
    const bookings = global.mockDb.bookings || [];

    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.status === SLOT_STATUSES.OCCUPIED).length;
    const reservedSlots = slots.filter(s => s.status === SLOT_STATUSES.RESERVED).length;
    const bookedSlots = slots.filter(s => s.status === 'booked').length;
    const availableSlots = slots.filter(s => s.status === SLOT_STATUSES.AVAILABLE || s.status === SLOT_STATUSES.RESERVED).length;

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const blockedUsers = users.filter(u => u.status === 'blocked').length;

    const totalBookings = bookings.length;
    
    // Earnings calculation
    const bookingEarnings = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    const manualRevenue = records
      .filter(r => r.status === 'exited')
      .reduce((sum, r) => sum + (r.fee || 0), 0);
    const totalEarnings = manualRevenue + bookingEarnings;

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

    const anprToday = records
      .filter(r => r.isAutoEntry === true && new Date(r.entryTime) >= today).length;

    return res.status(200).json({
      success: true,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      bookedSlots,
      totalUsers,
      activeUsers,
      blockedUsers,
      totalBookings,
      totalEarnings,
      todayRevenue,
      zoneOccupancy,
      anprToday
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
  },

  // -------------------------------------------------------------
  // ANPR
  // -------------------------------------------------------------
  recognize: async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: 'Image base64 data required' });
      }

      let plate = 'MH12AB1234';
      let confidence = 92;

      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        let processedBuffer = imageBuffer;
        try {
          processedBuffer = await sharp(imageBuffer).grayscale().resize(800).toBuffer();
        } catch (e) {}

        const ocrResult = await Tesseract.recognize(processedBuffer, 'eng');
        const text = ocrResult.data.text || "";
        confidence = ocrResult.data.confidence || 0;

        const cleanedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const matches = cleanedText.match(/[A-Z0-9]{6,10}/);
        plate = matches ? matches[0] : cleanedText.substring(0, 10);
      } catch (err) {
        console.warn("Tesseract OCR failed in Mock Sandbox mode, using mock plate values:", err.message);
        const whitelisted = global.mockDb.registeredVehicles || [];
        if (whitelisted.length > 0) {
          if (Math.random() > 0.4) {
            const randVehicle = whitelisted[Math.floor(Math.random() * whitelisted.length)];
            plate = randVehicle.plate;
          } else {
            plate = 'KA05BB' + Math.floor(1000 + Math.random() * 9000);
          }
        }
        confidence = Math.floor(Math.random() * 20) + 80;
      }

      return res.status(200).json({
        success: true,
        plate: plate || 'UNKNOWN',
        confidence,
        rawText: "Simulated Sandbox OCR result"
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  autoEntry: async (req, res) => {
    try {
      const { plate } = req.body;
      const formattedPlate = plate.toUpperCase().trim();

      const vehicle = global.mockDb.registeredVehicles.find(v => v.plate === formattedPlate && v.isActive);
      if (!vehicle) {
        global.mockDb.anprLogs.unshift({
          _id: `mock_anpr_log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          plate: formattedPlate,
          confidence: 95,
          result: 'failed',
          message: 'Vehicle not registered in system registry.',
          slotNumber: ''
        });

        return res.status(200).json({ success: false, message: 'Vehicle not registered' });
      }

      const active = global.mockDb.records.find(r => r.plate === formattedPlate && r.status === 'active');
      if (active) {
        global.mockDb.anprLogs.unshift({
          _id: `mock_anpr_log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          plate: formattedPlate,
          confidence: 95,
          result: 'failed',
          message: `Denied auto-entry: Vehicle already parked in slot ${active.slotId}.`,
          slotNumber: ''
        });

        return res.status(409).json({ success: false, message: `Vehicle already parked in slot ${active.slotId}.` });
      }

      const slots = global.mockDb.slots;
      const freeSlots = slots.filter(s => s.status === SLOT_STATUSES.AVAILABLE || s.status === SLOT_STATUSES.RESERVED);
      
      let slot = null;
      const zonePriority = (vehicle.vehicleType === 'Car' || vehicle.vehicleType === 'Bus') ? ['A', 'C', 'D'] : ['B', 'C', 'D'];
      for (const zoneId of zonePriority) {
        const zoneSlots = freeSlots.filter(s => s.zone === zoneId && s.vehicleTypes.includes(vehicle.vehicleType));
        if (zoneSlots.length > 0) {
          zoneSlots.sort((a, b) => {
            if (a.status === SLOT_STATUSES.AVAILABLE && b.status === SLOT_STATUSES.RESERVED) return -1;
            if (a.status === SLOT_STATUSES.RESERVED && b.status === SLOT_STATUSES.AVAILABLE) return 1;
            return a.slotId.localeCompare(b.slotId);
          });
          slot = zoneSlots[0];
          break;
        }
      }

      if (!slot) {
        return res.status(409).json({ success: false, message: 'No available slots found.' });
      }

      const newRecord = {
        _id: `mock_rec_${Date.now()}`,
        plate: formattedPlate,
        ownerName: vehicle.ownerName,
        ownerType: vehicle.ownerType,
        vehicleType: vehicle.vehicleType,
        mobile: vehicle.mobile || '',
        slot: slot._id,
        slotId: slot.slotId,
        zone: slot.zone,
        entryTime: new Date().toISOString(),
        exitTime: null,
        durationMinutes: null,
        fee: null,
        status: 'active',
        isAutoEntry: true,
        createdBy: req.user?._id || 'mock_admin_id'
      };

      slot.status = SLOT_STATUSES.OCCUPIED;
      slot.currentRecord = newRecord;

      global.mockDb.records.push(newRecord);

      vehicle.totalVisits += 1;
      vehicle.lastSeen = new Date().toISOString();

      global.mockDb.anprLogs.unshift({
        _id: `mock_anpr_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        plate: formattedPlate,
        confidence: 95,
        result: 'success',
        message: `Auto-entry success. Gate opened, assigned slot: ${slot.slotId}`,
        slotNumber: slot.slotId
      });

      await logSystemActivity('VEHICLE_ENTRY', `ANPR Auto-Entry checked in ${vehicle.vehicleType} plate ${formattedPlate} to slot ${slot.slotId}.`, req.user?._id);

      return res.status(200).json({
        success: true,
        slot: slot.slotId,
        message: `Auto-entry success! Allocated slot: ${slot.slotId}`,
        record: newRecord
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getCameraStatus: (req, res) => {
    return res.status(200).json({
      success: true,
      cameraConnected: true,
      status: 'Online',
      details: 'Mock camera interface running (Simulated Gate Cam)'
    });
  },

  registerVehicle: async (req, res) => {
    try {
      const { plate, ownerName, ownerType, vehicleType, mobile, photo } = req.body;
      const formattedPlate = plate.toUpperCase().trim();

      const existing = global.mockDb.registeredVehicles.find(v => v.plate === formattedPlate);
      if (existing) {
        return res.status(400).json({ success: false, message: `Plate ${formattedPlate} is already registered under ${existing.ownerName}` });
      }

      const newVehicle = {
        _id: `mock_reg_${Date.now()}`,
        plate: formattedPlate,
        ownerName,
        ownerType,
        vehicleType,
        mobile: mobile || '',
        photo: photo || '',
        isActive: true,
        registeredAt: new Date().toISOString(),
        lastSeen: null,
        totalVisits: 0
      };

      global.mockDb.registeredVehicles.push(newVehicle);

      await logSystemActivity(
        'SETTINGS_UPDATE',
        `Registered vehicle ${formattedPlate} for auto-entry (Owner: ${ownerName}, Category: ${ownerType}).`,
        req.user?._id
      );

      return res.status(201).json({ success: true, message: 'Vehicle pre-registered successfully', data: newVehicle });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getRegisteredVehicles: (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let list = [...global.mockDb.registeredVehicles];

      if (req.query.search) {
        const q = req.query.search.toLowerCase();
        list = list.filter(v => v.plate.toLowerCase().includes(q) || v.ownerName.toLowerCase().includes(q) || v.mobile.includes(q));
      }
      if (req.query.ownerType) {
        list = list.filter(v => v.ownerType === req.query.ownerType);
      }
      if (req.query.vehicleType) {
        list = list.filter(v => v.vehicleType === req.query.vehicleType);
      }

      list.sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt));

      const paginated = list.slice(skip, skip + limit);
      const logs = [...global.mockDb.anprLogs].slice(0, 10);

      return res.status(200).json({
        success: true,
        vehicles: paginated,
        recentLogs: logs,
        totalCount: list.length,
        totalPages: Math.ceil(list.length / limit),
        currentPage: page
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteRegisteredVehicle: async (req, res) => {
    try {
      const { id } = req.params;
      const idx = global.mockDb.registeredVehicles.findIndex(v => v._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Registered vehicle not found' });
      }

      const vehicle = global.mockDb.registeredVehicles[idx];
      global.mockDb.registeredVehicles.splice(idx, 1);

      await logSystemActivity(
        'SETTINGS_UPDATE',
        `Deregistered vehicle ${vehicle.plate} (Owner: ${vehicle.ownerName}).`,
        req.user?._id
      );

      return res.status(200).json({ success: true, message: 'Vehicle removed from pre-registration database.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getVehicleDetails: (req, res) => {
    try {
      const { plate } = req.body;
      if (!plate) {
        return res.status(400).json({ success: false, message: 'License registration plate is required.' });
      }

      const formattedPlate = plate.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');

      // Return mock data depending on registration plate suffix/keywords
      let vehicleDetails = {
        owner: 'Arjun Sharma',
        regNo: formattedPlate,
        vehicleClass: 'Motor Car (LMV)',
        makerModel: 'Maruti Swift Dzire',
        fuelType: 'Petrol',
        color: 'White',
        regAuthority: 'MH-12 Pune RTO',
        regDate: '12 Mar 2021',
        insuranceUpto: '12 Mar 2027',
        pucUpto: '05 Jan 2027',
        financer: 'HDFC Bank Ltd.',
        blacklistStatus: 'Clear',
        challanDetails: '1 pending (₹500)'
      };

      if (formattedPlate.includes('BLACK') || formattedPlate.endsWith('8')) {
        vehicleDetails = {
          owner: 'Rajesh Malhotra',
          regNo: formattedPlate,
          vehicleClass: 'SUV (LMV)',
          makerModel: 'Mahindra Thar',
          fuelType: 'Diesel',
          color: 'Red',
          regAuthority: 'HR-26 Gurgaon RTO',
          regDate: '04 Apr 2022',
          insuranceUpto: '12 Aug 2026',
          pucUpto: '30 Nov 2026',
          financer: 'Kotak Mahindra',
          blacklistStatus: 'Blacklisted (Stolen alert)',
          challanDetails: '4 pending (₹3000)'
        };
      } else if (formattedPlate.endsWith('9') || formattedPlate.includes('EXPIRED')) {
        vehicleDetails = {
          owner: 'Prof. K. Verma',
          regNo: formattedPlate,
          vehicleClass: 'Sedan (LMV)',
          makerModel: 'Honda Civic',
          fuelType: 'Diesel',
          color: 'Grey',
          regAuthority: 'DL-01 New Delhi RTO',
          regDate: '15 Jun 2018',
          insuranceUpto: '15 Dec 2025', // Expired
          pucUpto: '10 Jan 2026', // Expired
          financer: 'SBI Car Loans',
          blacklistStatus: 'Clear',
          challanDetails: '0 pending'
        };
      } else if (!formattedPlate.endsWith('4') && !formattedPlate.includes('MH12AB1234')) {
        // Generic fallback profile
        vehicleDetails = {
          owner: 'Amit Patel',
          regNo: formattedPlate,
          vehicleClass: 'Hatchback (LMV)',
          makerModel: 'Hyundai i20',
          fuelType: 'Petrol',
          color: 'Silver',
          regAuthority: 'KA-03 Bangalore RTO',
          regDate: '10 May 2020',
          insuranceUpto: '25 May 2028',
          pucUpto: '18 Dec 2027',
          financer: 'Self Owned',
          blacklistStatus: 'Clear',
          challanDetails: '0 pending'
        };
      }

      return res.status(200).json({
        success: true,
        data: vehicleDetails
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
