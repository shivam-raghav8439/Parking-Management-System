import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
  plate: { type: String, required: true, uppercase: true, index: true },
  ownerName: { type: String, required: true },
  ownerType: { type: String, enum: ['Student', 'Faculty', 'Staff', 'Visitor'], required: true },
  vehicleType: { type: String, enum: ['Car', 'Bike', 'Bicycle', 'Bus'], required: true },
  mobile: { type: String },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  slotId: { type: String, required: true },
  zone: { type: String, required: true },
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: null },
  fee: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'exited'], default: 'active' },
  isAutoEntry: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Indexes for fast queries:
recordSchema.index({ plate: 1 });
recordSchema.index({ status: 1 });
recordSchema.index({ entryTime: -1 });
recordSchema.index({ zone: 1, status: 1 });
recordSchema.index({ plate: 1, status: 1 });
recordSchema.index({ status: 1, entryTime: -1 });
recordSchema.index({ plate: 'text', ownerName: 'text' });

export default mongoose.model('Record', recordSchema);
