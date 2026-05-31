import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true },  // "A-01"
  zone: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved', 'maintenance', 'booked'], default: 'available' },
  vehicleTypes: [{ type: String, enum: ['Car', 'Bike', 'Bicycle', 'Bus'] }],
  price: { type: Number, default: null }, // Optional price override
  currentRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', default: null },
}, { timestamps: true });

slotSchema.index({ status: 1, zone: 1 });

export default mongoose.model('Slot', slotSchema);
