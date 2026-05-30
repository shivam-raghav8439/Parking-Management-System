import mongoose from 'mongoose';

const registeredVehicleSchema = new mongoose.Schema({
  plate: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    index: true 
  },
  ownerName: { 
    type: String, 
    required: true,
    trim: true 
  },
  ownerType: { 
    type: String, 
    enum: ['Student', 'Faculty', 'Staff'], 
    required: true 
  },
  vehicleType: { 
    type: String, 
    enum: ['Car', 'Bike', 'Bicycle', 'Bus'], 
    required: true 
  },
  mobile: { 
    type: String,
    trim: true 
  },
  photo: { 
    type: String, 
    default: '' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  registeredAt: { 
    type: Date, 
    default: Date.now 
  },
  lastSeen: { 
    type: Date, 
    default: null 
  },
  totalVisits: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

export default mongoose.model('RegisteredVehicle', registeredVehicleSchema);
