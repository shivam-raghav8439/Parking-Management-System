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

  // Initialize registered vehicles whitelist in sandbox
  let regVehicles = JSON.parse(localStorage.getItem('college_parking_registered_vehicles'));
  if (!regVehicles) {
    regVehicles = [
      {
        id: 'mock_reg_1',
        plate: 'MH12AB1234',
        ownerName: 'Aditya Verma',
        ownerType: 'Student',
        vehicleType: 'Car',
        mobile: '9876543210',
        photo: '',
        isActive: true,
        registeredAt: new Date().toISOString(),
        lastSeen: null,
        totalVisits: 0
      },
      {
        id: 'mock_reg_2',
        plate: 'DL01XX9999',
        ownerName: 'Dr. Shailesh Kumar',
        ownerType: 'Faculty',
        vehicleType: 'Car',
        mobile: '9876543212',
        photo: '',
        isActive: true,
        registeredAt: new Date().toISOString(),
        lastSeen: null,
        totalVisits: 0
      }
    ];
    localStorage.setItem('college_parking_registered_vehicles', JSON.stringify(regVehicles));
  }

  // Initialize ANPR scanning logs in sandbox
  let anprLogs = JSON.parse(localStorage.getItem('college_parking_anpr_logs'));
  if (!anprLogs) {
    anprLogs = [
      {
        id: 'log_1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        plate: 'MH12AB1234',
        confidence: 94,
        result: 'success',
        message: 'Auto entry check-in successful. Allocated slot: A-6',
        slotNumber: 'A-6'
      }
    ];
    localStorage.setItem('college_parking_anpr_logs', JSON.stringify(anprLogs));
  }

  // Initialize users in sandbox
  let users = JSON.parse(localStorage.getItem('college_parking_users'));
  if (!users) {
    users = [
      { _id: 'mock_admin_id', name: 'Admin User', email: 'admin@campus.edu', password: 'Password123', role: 'admin', isEmailVerified: true, status: 'active', createdAt: new Date().toISOString() },
      { _id: 'mock_operator_id', name: 'Operator User', email: 'operator@campus.edu', password: 'Password123', role: 'operator', isEmailVerified: true, status: 'active', createdAt: new Date().toISOString() },
      { _id: 'mock_user_id', name: 'Rahul Sharma', email: 'user@campus.edu', password: 'Password123', role: 'user', isEmailVerified: true, status: 'active', createdAt: new Date().toISOString() }
    ];
    localStorage.setItem('college_parking_users', JSON.stringify(users));
  }

  // Initialize bookings in sandbox
  let bookings = JSON.parse(localStorage.getItem('college_parking_bookings'));
  if (!bookings) {
    bookings = [];
    localStorage.setItem('college_parking_bookings', JSON.stringify(bookings));
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
  login: ({ email, password, mobile, otp }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    let user;

    if (mobile && otp) {
      user = users.find(u => u.mobile === mobile);
      if (!user) {
        const err = new Error('No user registered with this mobile number.');
        err.response = { status: 404, data: { message: 'No user registered with this mobile number.' } };
        throw err;
      }
      if (user.mobileOtp !== otp) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 3) {
          user.mobileOtp = null;
          user.mobileOtpExpires = null;
          user.otpAttempts = 0;
          const idx = users.findIndex(u => u._id === user._id);
          if (idx !== -1) {
            users[idx] = user;
            localStorage.setItem('college_parking_users', JSON.stringify(users));
          }
          const err = new Error('Too many incorrect attempts. Mobile verification locked for 30 minutes.');
          err.response = { status: 400, data: { message: 'Too many incorrect attempts. Mobile verification locked for 30 minutes.' } };
          throw err;
        }
        const idx = users.findIndex(u => u._id === user._id);
        if (idx !== -1) {
          users[idx] = user;
          localStorage.setItem('college_parking_users', JSON.stringify(users));
        }
        const err = new Error(`Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`);
        err.response = { status: 400, data: { message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.` } };
        throw err;
      }
      user.isMobileVerified = true;
      user.mobileOtp = null;
      user.mobileOtpExpires = null;
      user.otpAttempts = 0;
    } else {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      user = users.find(u => u.email === cleanEmail);
      if (!user) {
        const err = new Error('Invalid email or password.');
        err.response = { status: 401, data: { message: 'Invalid email or password.' } };
        throw err;
      }
      if (user.password !== password) {
        const err = new Error('Invalid email or password.');
        err.response = { status: 401, data: { message: 'Invalid email or password.' } };
        throw err;
      }
    }

    if (user.status === 'blocked') {
      const err = new Error('Your account has been blocked by admin.');
      err.response = { status: 403, data: { message: 'Your account has been blocked by admin.' } };
      throw err;
    }
    if (user.isEmailVerified === false) {
      const emailVerifyToken = `mock_verify_token_${Date.now()}`;
      user.emailVerifyToken = emailVerifyToken;
      user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const idx = users.findIndex(u => u._id === user._id);
      if (idx !== -1) {
        users[idx] = user;
        localStorage.setItem('college_parking_users', JSON.stringify(users));
      }
      
      console.log(`\n======================================`);
      console.log(`[MOCK EMAIL VERIFIER - RESEND] To: ${user.email}`);
      console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
      console.log(`======================================\n`);

      const err = new Error('Please verify your email first. A new verification link has been sent to your email.');
      err.response = { status: 403, data: { message: 'Please verify your email first. A new verification link has been sent to your email.', email: user.email } };
      throw err;
    }
    const mockToken = `mock_token_${user._id || user.id}`;
    const mockRefreshToken = `mock_refresh_${user._id || user.id}`;
    user.refreshToken = mockRefreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const idx = users.findIndex(u => u._id === user._id);
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem('college_parking_users', JSON.stringify(users));
    }
    
    localStorage.setItem('token', mockToken);
    localStorage.setItem('refreshToken', mockRefreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return { success: true, token: mockToken, refreshToken: mockRefreshToken, user };
  },

  register: ({ name, email, role, mobile, password }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (users.some(u => u.email === cleanEmail)) {
      throw new Error('User already exists');
    }
    const computedRole = users.length === 0 ? 'admin' : (role || 'user');
    const emailVerifyToken = `mock_verify_token_${Date.now()}`;
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const user = {
      _id: `mock_user_${Date.now()}`,
      name,
      email: cleanEmail,
      role: computedRole,
      password: password || 'Password123',
      status: 'active',
      isEmailVerified: false,
      emailVerifyToken,
      emailVerifyExpires,
      mobile: mobile || null,
      isMobileVerified: false,
      otpAttempts: 0,
      createdAt: new Date().toISOString()
    };

    if (mobile) {
      const otp = '123456';
      user.mobileOtp = otp;
      user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      users.push(user);
      localStorage.setItem('college_parking_users', JSON.stringify(users));
      
      console.log(`\n======================================`);
      console.log(`[MOCK OTP SENDER] Mobile: ${mobile}, OTP Code: ${otp}`);
      console.log(`======================================\n`);

      return {
        success: true,
        step: 'verify-otp',
        message: 'OTP sent to mobile (Simulation)',
        email: user.email,
        mobile: user.mobile
      };
    }

    users.push(user);
    localStorage.setItem('college_parking_users', JSON.stringify(users));
    
    console.log(`\n======================================`);
    console.log(`[MOCK EMAIL VERIFIER] To: ${email}`);
    console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
    console.log(`======================================\n`);

    return {
      success: true,
      step: 'verify-email',
      message: 'Check your email to verify account (Simulation)',
      email: user.email
    };
  },

  verifyEmail: (token) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const user = users.find(u => u.emailVerifyToken === token);
    if (!user) {
      throw new Error('Invalid or expired verification token in memory.');
    }
    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    
    const mockToken = `mock_token_${user._id}`;
    const mockRefreshToken = `mock_refresh_${user._id}`;
    user.refreshToken = mockRefreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    localStorage.setItem('college_parking_users', JSON.stringify(users));
    localStorage.setItem('token', mockToken);
    localStorage.setItem('refreshToken', mockRefreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, message: 'Email verification successful.', token: mockToken, refreshToken: mockRefreshToken, user };
  },

  resendVerification: ({ email }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const user = users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('User not found in memory.');
    }
    const emailVerifyToken = `mock_verify_token_${Date.now()}`;
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    localStorage.setItem('college_parking_users', JSON.stringify(users));
    
    console.log(`\n======================================`);
    console.log(`[MOCK EMAIL VERIFIER - RESEND] To: ${email}`);
    console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
    console.log(`======================================\n`);
    
    return { success: true, message: 'Verification link resent to your email.' };
  },

  sendOtp: ({ mobile }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const user = users.find(u => u.mobile === mobile);
    if (!user) {
      throw new Error('No registered user matches this mobile number in memory.');
    }
    const otp = '123456';
    user.mobileOtp = otp;
    user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    localStorage.setItem('college_parking_users', JSON.stringify(users));
    
    console.log(`\n======================================`);
    console.log(`[MOCK OTP SENDER] Mobile: ${mobile}, OTP Code: ${otp}`);
    console.log(`======================================\n`);
    
    return { success: true, message: 'OTP sent to mobile successfully.' };
  },

  verifyOtp: ({ mobile, otp }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const user = users.find(u => u.mobile === mobile);
    if (!user) {
      throw new Error('User not found in memory.');
    }
    if (user.mobileOtp !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 3) {
        user.mobileOtp = null;
        user.mobileOtpExpires = null;
        user.otpAttempts = 0;
        localStorage.setItem('college_parking_users', JSON.stringify(users));
        throw new Error('Too many incorrect attempts. Mobile verification locked for 30 minutes.');
      }
      localStorage.setItem('college_parking_users', JSON.stringify(users));
      throw new Error(`Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`);
    }
    user.isMobileVerified = true;
    user.mobileOtp = null;
    user.mobileOtpExpires = null;
    user.otpAttempts = 0;

    const emailVerifyToken = `mock_verify_token_${Date.now()}`;
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    localStorage.setItem('college_parking_users', JSON.stringify(users));

    console.log(`\n======================================`);
    console.log(`[MOCK EMAIL VERIFIER - OTP COMPLETED] To: ${user.email}`);
    console.log(`Verification Link: http://localhost:5173/verify-email?token=${emailVerifyToken}`);
    console.log(`======================================\n`);

    return {
      success: true,
      message: 'Mobile OTP verified. Verification link sent to your registered email.',
      email: user.email
    };
  },

  resendOtp: ({ mobile }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const user = users.find(u => u.mobile === mobile);
    if (!user) {
      throw new Error('User not found in memory.');
    }
    const otp = '123456';
    user.mobileOtp = otp;
    user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    localStorage.setItem('college_parking_users', JSON.stringify(users));

    console.log(`\n======================================`);
    console.log(`[MOCK OTP SENDER - RESEND] Mobile: ${mobile}, OTP Code: ${otp}`);
    console.log(`======================================\n`);
    
    return { success: true, message: 'New OTP sent to mobile.' };
  },

  forgotPassword: ({ email }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const user = users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('User not found in memory.');
    }
    const resetToken = `mock_reset_token_${Date.now()}`;
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    let resetOtp = null;
    if (user.isMobileVerified && user.mobile) {
      resetOtp = '123456';
      user.passwordResetOtp = resetOtp;
      user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      console.log(`\n======================================`);
      console.log(`[MOCK PASSWORD RESET OTP] Mobile: ${user.mobile}, OTP Code: ${resetOtp}`);
      console.log(`======================================\n`);
    }

    localStorage.setItem('college_parking_users', JSON.stringify(users));

    console.log(`\n======================================`);
    console.log(`[MOCK PASSWORD RESET EMAIL] To: ${email}`);
    console.log(`Reset Link: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`======================================\n`);

    return {
      success: true,
      message: 'Reset link sent to your email (Simulation)',
      mobileVerified: !!(user.isMobileVerified && user.mobile)
    };
  },

  resetPassword: ({ token, newPassword }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const user = users.find(u => u.passwordResetToken === token);
    if (!user) {
      throw new Error('Invalid or expired reset token in memory.');
    }
    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      throw new Error('Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.');
    }
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;

    localStorage.setItem('college_parking_users', JSON.stringify(users));
    return { success: true, message: 'Password reset successful' };
  },

  resetPasswordOtp: ({ mobile, otp, newPassword }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const user = users.find(u => u.mobile === mobile);
    if (!user) {
      throw new Error('User not found in memory.');
    }
    if (user.passwordResetOtp !== otp) {
      throw new Error('Invalid reset OTP.');
    }
    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      throw new Error('Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.');
    }
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;

    localStorage.setItem('college_parking_users', JSON.stringify(users));
    return { success: true, message: 'Password reset successful' };
  },

  refreshToken: ({ refreshToken }) => {
    let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
    const user = users.find(u => u.refreshToken === refreshToken);
    if (!user) {
      throw new Error('Invalid or expired refresh token.');
    }
    const mockToken = `mock_token_${user._id}`;
    localStorage.setItem('token', mockToken);
    return { success: true, accessToken: mockToken };
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

    const anprToday = records
      .filter(r => r.isAutoEntry === true && new Date(r.entryTime) >= today).length;

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      todayRevenue,
      zoneOccupancy,
      anprToday
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

  verifyEmail: (token) =>
    handleApiCall(() => client.get(`/auth/verify-email?token=${token}`), () => mockApi.verifyEmail(token)),

  resendVerification: (data) =>
    handleApiCall(() => client.post('/auth/resend-verification', data), () => mockApi.resendVerification(data)),

  sendOtp: (data) =>
    handleApiCall(() => client.post('/auth/send-otp', data), () => mockApi.sendOtp(data)),

  verifyOtp: (data) =>
    handleApiCall(() => client.post('/auth/verify-otp', data), () => mockApi.verifyOtp(data)),

  resendOtp: (data) =>
    handleApiCall(() => client.post('/auth/resend-otp', data), () => mockApi.resendOtp(data)),

  forgotPassword: (data) =>
    handleApiCall(() => client.post('/auth/forgot-password', data), () => mockApi.forgotPassword(data)),

  resetPassword: (data) =>
    handleApiCall(() => client.post('/auth/reset-password', data), () => mockApi.resetPassword(data)),

  resetPasswordOtp: (data) =>
    handleApiCall(() => client.post('/auth/reset-password-otp', data), () => mockApi.resetPasswordOtp(data)),

  refreshToken: (data) =>
    handleApiCall(() => client.post('/auth/refresh-token', data), () => mockApi.refreshToken(data)),

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
    handleApiCall(() => client.get('/stats/logs', { params }), () => mockApi.getAuditLogs(params)),

  getANPRStatus: () =>
    handleApiCall(() => client.get('/anpr/status'), mockApi.getANPRStatus),

  recognizeANPR: (image) =>
    handleApiCall(() => client.post('/anpr/recognize', { image }), () => mockApi.recognizeANPR(image)),

  autoEntryANPR: (plate) =>
    handleApiCall(() => client.post('/anpr/auto-entry', { plate }), () => mockApi.autoEntryANPR(plate)),

  getRegisteredVehicles: (params) =>
    handleApiCall(() => client.get('/anpr/vehicles', { params }), () => mockApi.getRegisteredVehicles(params)),

  registerVehicle: (data) =>
    handleApiCall(() => client.post('/anpr/vehicles', data), () => mockApi.registerVehicle(data)),

  deleteRegisteredVehicle: (id) =>
    handleApiCall(() => client.delete(`/anpr/vehicles/${id}`), () => mockApi.deleteRegisteredVehicle(id)),

  getVehicleDetails: (plate) =>
    handleApiCall(() => client.post('/vehicle/details', { plate }), () => mockApi.getVehicleDetails(plate)),

  getUsers: (params) =>
    handleApiCall(() => client.get('/users', { params }), () => mockApi.getUsers(params)),
  blockUser: (id) =>
    handleApiCall(() => client.put(`/users/${id}/block`), () => mockApi.blockUser(id)),
  unblockUser: (id) =>
    handleApiCall(() => client.put(`/users/${id}/unblock`), () => mockApi.unblockUser(id)),
  deleteUser: (id) =>
    handleApiCall(() => client.delete(`/users/${id}`), () => mockApi.deleteUser(id)),

  createBooking: (data) =>
    handleApiCall(() => client.post('/bookings', data), () => mockApi.createBooking(data)),
  getMyBookings: () =>
    handleApiCall(() => client.get('/bookings/my'), () => mockApi.getMyBookings()),
  cancelBooking: (id) =>
    handleApiCall(() => client.post(`/bookings/${id}/cancel`), () => mockApi.cancelBooking(id)),
  getAllBookings: (params) =>
    handleApiCall(() => client.get('/bookings', { params }), () => mockApi.getAllBookings(params)),
  updateBookingStatus: (id, data) =>
    handleApiCall(() => client.put(`/bookings/${id}/status`, data), () => mockApi.updateBookingStatus(id, data)),
  payBooking: (id, data) =>
    handleApiCall(() => client.post(`/bookings/${id}/pay`, data), () => mockApi.payBooking(id, data)),

  createSlot: (data) =>
    handleApiCall(() => client.post('/slots', data), () => mockApi.createSlot(data)),
  updateSlot: (id, data) =>
    handleApiCall(() => client.put(`/slots/${id}`, data), () => mockApi.updateSlot(id, data)),
  deleteSlot: (id) =>
    handleApiCall(() => client.delete(`/slots/${id}`), () => mockApi.deleteSlot(id))
};

// Append missing mock functions to mockApi object
mockApi.getANPRStatus = () => {
  return {
    success: true,
    cameraConnected: true,
    status: 'Online',
    details: 'Mock camera active (Local Storage Sandbox Mode)'
  };
};

mockApi.recognizeANPR = (image) => {
  const list = JSON.parse(localStorage.getItem('college_parking_registered_vehicles')) || [];
  let plate = 'MH12AB1234';
  if (list.length > 0) {
    if (Math.random() > 0.3) {
      plate = list[Math.floor(Math.random() * list.length)].plate;
    } else {
      plate = 'KA05KB' + Math.floor(1000 + Math.random() * 9000);
    }
  }
  return {
    success: true,
    plate,
    confidence: Math.floor(Math.random() * 15) + 82
  };
};

mockApi.autoEntryANPR = (plate) => {
  const formattedPlate = plate.toUpperCase().trim();
  const list = JSON.parse(localStorage.getItem('college_parking_registered_vehicles')) || [];
  const vehicle = list.find(v => v.plate === formattedPlate && v.isActive);

  let logs = JSON.parse(localStorage.getItem('college_parking_anpr_logs')) || [];

  if (!vehicle) {
    logs.unshift({
      id: `mock_anpr_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      plate: formattedPlate,
      confidence: 90,
      result: 'failed',
      message: 'Vehicle not registered in pre-registration whitelist',
      slotNumber: ''
    });
    localStorage.setItem('college_parking_anpr_logs', JSON.stringify(logs.slice(0, 50)));

    return { success: false, message: 'Vehicle not registered' };
  }

  const records = JSON.parse(localStorage.getItem('college_parking_records')) || [];
  const active = records.find(r => r.plate === formattedPlate && r.status === 'active');
  if (active) {
    logs.unshift({
      id: `mock_anpr_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      plate: formattedPlate,
      confidence: 90,
      result: 'failed',
      message: `Denied auto-entry: Vehicle already parked in slot ${active.slotNumber}`,
      slotNumber: ''
    });
    localStorage.setItem('college_parking_anpr_logs', JSON.stringify(logs.slice(0, 50)));
    return { success: false, message: `Vehicle already inside: Slot ${active.slotNumber}` };
  }

  const slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
  let targetZone = 'A';
  if (vehicle.vehicleType === 'Car') targetZone = 'A';
  else if (vehicle.vehicleType === 'Bike') targetZone = 'B';
  else if (vehicle.ownerType === 'Faculty') targetZone = 'C';
  else targetZone = 'D';

  const freeSlot = slots.find(s => 
    s.zoneId === targetZone && 
    (s.status === 'available' || s.status === 'reserved')
  );

  if (!freeSlot) {
    return { success: false, message: `No available slots in Zone ${targetZone}` };
  }

  freeSlot.status = 'occupied';
  freeSlot.plate = formattedPlate;
  freeSlot.ownerInitials = vehicle.ownerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const newRecord = {
    id: `rec_${Date.now()}`,
    plate: formattedPlate,
    ownerName: vehicle.ownerName,
    vehicleType: vehicle.vehicleType,
    ownerType: vehicle.ownerType,
    zonePreference: 'Auto',
    mobileNumber: vehicle.mobile || '',
    slotNumber: freeSlot.slotNumber,
    entryTime: new Date().toISOString(),
    exitTime: null,
    fee: null,
    durationMinutes: null,
    status: 'active',
    isAutoEntry: true
  };

  records.push(newRecord);

  let activity = JSON.parse(localStorage.getItem('college_parking_activity')) || [];
  activity.unshift({
    id: `act_${Date.now()}`,
    type: 'entry',
    plate: formattedPlate,
    slotNumber: freeSlot.slotNumber,
    timestamp: newRecord.entryTime
  });

  vehicle.totalVisits += 1;
  vehicle.lastSeen = newRecord.entryTime;

  logs.unshift({
    id: `mock_anpr_log_${Date.now()}`,
    timestamp: newRecord.entryTime,
    plate: formattedPlate,
    confidence: 95,
    result: 'success',
    message: `Auto entry check-in successful. Allocated slot: ${freeSlot.slotNumber}`,
    slotNumber: freeSlot.slotNumber
  });

  localStorage.setItem('college_parking_records', JSON.stringify(records));
  localStorage.setItem('college_parking_slots', JSON.stringify(slots));
  localStorage.setItem('college_parking_activity', JSON.stringify(activity.slice(0, 50)));
  localStorage.setItem('college_parking_registered_vehicles', JSON.stringify(list));
  localStorage.setItem('college_parking_anpr_logs', JSON.stringify(logs.slice(0, 50)));

  return {
    success: true,
    slot: freeSlot.slotNumber,
    message: 'Gate Opened. Auto-entry complete.',
    record: newRecord
  };
};

mockApi.getRegisteredVehicles = (params = {}) => {
  let list = JSON.parse(localStorage.getItem('college_parking_registered_vehicles')) || [];
  const logs = JSON.parse(localStorage.getItem('college_parking_anpr_logs')) || [];

  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(v => v.plate.toLowerCase().includes(q) || v.ownerName.toLowerCase().includes(q) || (v.mobile && v.mobile.includes(q)));
  }
  if (params.ownerType && params.ownerType !== 'All') {
    list = list.filter(v => v.ownerType === params.ownerType);
  }
  if (params.vehicleType && params.vehicleType !== 'All') {
    list = list.filter(v => v.vehicleType === params.vehicleType);
  }

  list.sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt));

  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const totalCount = list.length;
  const paginated = list.slice((page - 1) * limit, page * limit);

  return {
    success: true,
    vehicles: paginated,
    recentLogs: logs,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  };
};

mockApi.registerVehicle = (data) => {
  const list = JSON.parse(localStorage.getItem('college_parking_registered_vehicles')) || [];
  const plate = data.plate.toUpperCase().trim();

  if (list.some(v => v.plate === plate)) {
    throw new Error(`Plate ${plate} is already registered.`);
  }

  const newVehicle = {
    id: `mock_reg_${Date.now()}`,
    plate,
    ownerName: data.ownerName,
    ownerType: data.ownerType,
    vehicleType: data.vehicleType,
    mobile: data.mobile || '',
    photo: data.photo || '',
    isActive: true,
    registeredAt: new Date().toISOString(),
    lastSeen: null,
    totalVisits: 0
  };

  list.push(newVehicle);
  localStorage.setItem('college_parking_registered_vehicles', JSON.stringify(list));
  return newVehicle;
};

mockApi.deleteRegisteredVehicle = (id) => {
  let list = JSON.parse(localStorage.getItem('college_parking_registered_vehicles')) || [];
  const index = list.findIndex(v => v.id === id);
  if (index === -1) {
    throw new Error('Vehicle registration record not found.');
  }
  list.splice(index, 1);
  localStorage.setItem('college_parking_registered_vehicles', JSON.stringify(list));
  return { success: true };
};

mockApi.getVehicleDetails = (plate) => {
  const formattedPlate = plate.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');

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

  return {
    success: true,
    data: vehicleDetails
  };
};

mockApi.getUsers = (params = {}) => {
  let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
  if (params.search) {
    const q = params.search.toLowerCase();
    users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  return { success: true, count: users.length, users };
};

mockApi.blockUser = (id) => {
  let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
  const user = users.find(u => u._id === id);
  if (!user) throw new Error('User not found');
  user.status = 'blocked';
  localStorage.setItem('college_parking_users', JSON.stringify(users));
  
  // Update local session if currently logged in user is blocked
  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (currentUser && (currentUser._id === id || currentUser.id === id)) {
    currentUser.status = 'blocked';
    localStorage.setItem('user', JSON.stringify(currentUser));
  }
  return { success: true, message: 'User blocked successfully', user };
};

mockApi.unblockUser = (id) => {
  let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
  const user = users.find(u => u._id === id);
  if (!user) throw new Error('User not found');
  user.status = 'active';
  localStorage.setItem('college_parking_users', JSON.stringify(users));
  return { success: true, message: 'User unblocked successfully', user };
};

mockApi.deleteUser = (id) => {
  let users = JSON.parse(localStorage.getItem('college_parking_users')) || [];
  users = users.filter(u => u._id !== id);
  localStorage.setItem('college_parking_users', JSON.stringify(users));
  return { success: true, message: 'User deleted successfully' };
};

mockApi.createSlot = (data) => {
  let slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
  const slotNumber = data.slotNumber || `${data.zoneId || data.zone}-${data.number}`;
  if (slots.some(s => s.slotNumber === slotNumber)) {
    throw new Error(`Slot ${slotNumber} already exists`);
  }
  const newSlot = {
    slotNumber,
    zoneId: data.zoneId || data.zone || 'A',
    number: parseInt(data.number) || (slots.length + 1),
    status: data.status || 'available',
    plate: null,
    ownerInitials: null,
    price: data.price ? parseFloat(data.price) : null
  };
  slots.push(newSlot);
  localStorage.setItem('college_parking_slots', JSON.stringify(slots));
  return { success: true, slot: newSlot };
};

mockApi.updateSlot = (id, data) => {
  let slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
  const slot = slots.find(s => s.slotNumber === id);
  if (!slot) throw new Error('Slot not found');
  if (data.status) slot.status = data.status;
  if (data.price !== undefined) slot.price = data.price ? parseFloat(data.price) : null;
  if (data.zoneId) slot.zoneId = data.zoneId;
  if (data.zone) slot.zoneId = data.zone;
  localStorage.setItem('college_parking_slots', JSON.stringify(slots));
  return { success: true, slot };
};

mockApi.deleteSlot = (id) => {
  let slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
  slots = slots.filter(s => s.slotNumber !== id);
  localStorage.setItem('college_parking_slots', JSON.stringify(slots));
  return { success: true, message: 'Slot deleted successfully' };
};

mockApi.createBooking = (data) => {
  let bookings = JSON.parse(localStorage.getItem('college_parking_bookings')) || [];
  const currentUser = JSON.parse(localStorage.getItem('user')) || { _id: 'mock_user_id', name: 'Guest' };
  const newBooking = {
    _id: `booking_${Date.now()}`,
    userId: currentUser._id || currentUser.id,
    user: currentUser,
    slotId: data.slotId || data.slotNumber,
    vehicleNumber: data.vehicleNumber.toUpperCase(),
    vehicleType: data.vehicleType || 'Car',
    bookingDate: data.bookingDate || new Date().toISOString(),
    startTime: data.startTime,
    endTime: data.endTime,
    amount: data.amount || 50,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString()
  };
  bookings.push(newBooking);
  localStorage.setItem('college_parking_bookings', JSON.stringify(bookings));
  return { success: true, booking: newBooking };
};

mockApi.getMyBookings = () => {
  const bookings = JSON.parse(localStorage.getItem('college_parking_bookings')) || [];
  const currentUser = JSON.parse(localStorage.getItem('user')) || { _id: 'mock_user_id' };
  const my = bookings.filter(b => b.userId === (currentUser._id || currentUser.id));
  return { success: true, bookings: my };
};

mockApi.cancelBooking = (id) => {
  let bookings = JSON.parse(localStorage.getItem('college_parking_bookings')) || [];
  const booking = bookings.find(b => b._id === id);
  if (!booking) throw new Error('Booking not found');
  booking.status = 'cancelled';
  localStorage.setItem('college_parking_bookings', JSON.stringify(bookings));
  return { success: true, booking };
};

mockApi.getAllBookings = (params = {}) => {
  let bookings = JSON.parse(localStorage.getItem('college_parking_bookings')) || [];
  if (params.status) {
    bookings = bookings.filter(b => b.status === params.status);
  }
  return { success: true, bookings };
};

mockApi.updateBookingStatus = (id, data) => {
  let bookings = JSON.parse(localStorage.getItem('college_parking_bookings')) || [];
  const booking = bookings.find(b => b._id === id);
  if (!booking) throw new Error('Booking not found');
  booking.status = data.status;
  
  if (data.status === 'approved') {
    let slots = JSON.parse(localStorage.getItem('college_parking_slots')) || [];
    const slot = slots.find(s => s.slotNumber === booking.slotId);
    if (slot) {
      slot.status = 'booked';
      localStorage.setItem('college_parking_slots', JSON.stringify(slots));
    }
  }
  localStorage.setItem('college_parking_bookings', JSON.stringify(bookings));
  return { success: true, booking };
};

mockApi.payBooking = (id, data) => {
  let bookings = JSON.parse(localStorage.getItem('college_parking_bookings')) || [];
  const booking = bookings.find(b => b._id === id);
  if (!booking) throw new Error('Booking not found');
  booking.paymentStatus = 'paid';
  booking.transactionId = data.transactionId || `pay_${Date.now()}`;
  localStorage.setItem('college_parking_bookings', JSON.stringify(bookings));
  return { success: true, booking };
};
