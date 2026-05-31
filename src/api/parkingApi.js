import client from './client.js';

// AUTH
export const authApi = {
  login:              (data) => client.post('/auth/login', data),
  register:           (data) => client.post('/auth/register', data),
  verifyEmail:        (token) => client.get(`/auth/verify-email?token=${token}`),
  forgotPasswordEmail:(data) => client.post('/auth/forgot-password/email', data),
  forgotPasswordOTP:  (data) => client.post('/auth/forgot-password/otp', data),
  verifyOTPReset:     (data) => client.post('/auth/verify-otp-reset', data),
  resetPassword:      (data) => client.post('/auth/reset-password', data),
  resendVerification: (data) => client.post('/auth/resend-verification', data),
};

// RECORDS
export const recordsApi = {
  entry:      (data) => client.post('/records/entry', data),
  exit:       (id)   => client.post(`/records/exit/${id}`),
  getActive:  ()     => client.get('/records/active'),
  search:     (q)    => client.get(`/records/search?q=${q}`),
  getAll:     (params) => client.get('/records', { params }),
  getById:    (id)   => client.get(`/records/${id}`),
  myParking:  ()     => client.get('/records/my-parking'),
};

// SLOTS
export const slotsApi = {
  getAll:   (zone)   => client.get('/slots', { params: { zone } }),
  getById:  (slotId) => client.get(`/slots/${slotId}`),
  update:   (slotId, data) => client.patch(`/slots/${slotId}`, data),
};

// STATS
export const statsApi = {
  getSummary: () => client.get('/stats/summary'),
  getActivity:(limit) => client.get(`/stats/activity?limit=${limit || 10}`),
};

// REPORTS
export const reportsApi = {
  getDaily:   (params) => client.get('/reports/daily', { params }),
  getHourly:  ()       => client.get('/reports/hourly'),
  getVehicleTypes: ()  => client.get('/reports/vehicle-types'),
  downloadPDF:(params) => client.get('/reports/pdf', { params, responseType: 'blob' }),
};

// SETTINGS
export const settingsApi = {
  get:    () => client.get('/settings'),
  update: (data) => client.put('/settings', data),
};

// USERS
export const usersApi = {
  getAll:   () => client.get('/users'),
  create:   (data) => client.post('/users', data),
  update:   (id, data) => client.put(`/users/${id}`, data),
  delete:   (id) => client.delete(`/users/${id}`),
};

// PASSES
export const passesApi = {
  create:   (data) => client.post('/bookings', data),
  getAll:   (params) => client.get('/bookings', { params }),
  check:    (plate) => client.get(`/bookings/check/${plate}`),
  cancel:   (id)   => client.patch(`/bookings/${id}/cancel`),
};

// AI
export const aiApi = {
  chat: (data) => client.post('/ai/chat', data),
};

// ANPR
export const anprApi = {
  recognize: (data) => client.post('/anpr/recognize', data),
  autoEntry: (data) => client.post('/anpr/auto-entry', data),
};

// VEHICLE
export const vehicleApi = {
  getDetails: (plate) => client.post('/vehicle/details', { plate }),
};

// Legacy parkingApi object mapping to prevent breaking other pages
export const parkingApi = {
  login: (data) => authApi.login(data).then(r => r.data),
  register: (data) => authApi.register(data).then(r => r.data),
  getCurrentUser: () => client.get('/auth/me').then(r => r.data),
  verifyEmail: (token) => authApi.verifyEmail(token).then(r => r.data),
  resendVerification: (data) => authApi.resendVerification(data).then(r => r.data),
  sendOtp: (data) => client.post('/auth/send-otp', data).then(r => r.data),
  verifyOtp: (data) => client.post('/auth/verify-otp', data).then(r => r.data),
  resendOtp: (data) => client.post('/auth/resend-otp', data).then(r => r.data),
  forgotPassword: (data) => client.post('/auth/forgot-password', data).then(r => r.data),
  resetPassword: (data) => authApi.resetPassword(data).then(r => r.data),
  resetPasswordOtp: (data) => client.post('/auth/reset-password-otp', data).then(r => r.data),
  refreshToken: (data) => client.post('/auth/refresh-token', data).then(r => r.data),

  getStats: () => client.get('/stats').then(r => r.data),
  getActivity: () => statsApi.getActivity().then(r => r.data),
  getSlots: () => client.get('/slots').then(r => r.data),
  getActiveRecords: () => recordsApi.getActive().then(r => r.data),
  searchRecords: (q) => recordsApi.search(q).then(r => r.data),
  createEntryRecord: (data) => recordsApi.entry(data).then(r => r.data),
  exitRecord: (id, payload) => client.post(`/records/exit/${id}`, payload).then(r => r.data),
  getRecords: (params) => recordsApi.getAll(params).then(r => r.data),
  getReportsSummary: () => reportsApi.getHourly().then(r => r.data),
  getSettings: () => settingsApi.get().then(r => r.data),
  updateSettings: (data) => settingsApi.update(data).then(r => r.data),
  getAuditLogs: (params) => client.get('/stats/logs', { params }).then(r => r.data),
  getANPRStatus: () => client.get('/anpr/status').then(r => r.data),
  recognizeANPR: (image) => anprApi.recognize({ image }).then(r => r.data),
  autoEntryANPR: (plate) => anprApi.autoEntry({ plate }).then(r => r.data),
  getRegisteredVehicles: (params) => client.get('/anpr/vehicles', { params }).then(r => r.data),
  registerVehicle: (data) => client.post('/anpr/vehicles', data).then(r => r.data),
  deleteRegisteredVehicle: (id) => client.delete(`/anpr/vehicles/${id}`).then(r => r.data),
  getVehicleDetails: (plate) => vehicleApi.getDetails(plate).then(r => r.data),
  getUsers: (params) => client.get('/users', { params }).then(r => r.data),
  blockUser: (id) => client.put(`/users/${id}/block`).then(r => r.data),
  unblockUser: (id) => client.put(`/users/${id}/unblock`).then(r => r.data),
  deleteUser: (id) => usersApi.delete(id).then(r => r.data),
  createBooking: (data) => passesApi.create(data).then(r => r.data),
  getMyBookings: () => client.get('/bookings/my').then(r => r.data),
  cancelBooking: (id) => passesApi.cancel(id).then(r => r.data),
  getAllBookings: (params) => passesApi.getAll(params).then(r => r.data),
  updateBookingStatus: (id, data) => client.put(`/bookings/${id}/status`, data).then(r => r.data),
  payBooking: (id, data) => client.post(`/bookings/${id}/pay`, data).then(r => r.data),
  createSlot: (data) => client.post('/slots', data).then(r => r.data),
  updateSlot: (id, data) => client.put(`/slots/${id}`, data).then(r => r.data),
  deleteSlot: (id) => client.delete(`/slots/${id}`).then(r => r.data)
};
