import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  collegeName: { type: String, default: 'My College' },
  contactEmail: { type: String },
  contactPhone: { type: String },
  rates: {
    Car: { type: Number, default: 20 },
    Bike: { type: Number, default: 10 },
    Bicycle: { type: Number, default: 5 },
    Bus: { type: Number, default: 40 },
  },
  zones: [{
    id: String,
    name: String,
    capacity: Number,
    allowedTypes: [String],
  }],
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
