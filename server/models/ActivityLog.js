import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['LOGIN', 'REGISTER', 'VEHICLE_ENTRY', 'VEHICLE_EXIT', 'SETTINGS_UPDATE', 'SLOT_UPDATE'],
    index: true
  },
  details: {
    type: String,
    required: true
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model('ActivityLog', activityLogSchema);
