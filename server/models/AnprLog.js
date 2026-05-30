import mongoose from 'mongoose';

const anprLogSchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  plate: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    index: true 
  },
  confidence: { 
    type: Number, 
    required: true 
  },
  result: { 
    type: String, 
    enum: ['success', 'failed'], 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  slotNumber: { 
    type: String,
    default: '' 
  }
}, { timestamps: true });

export default mongoose.model('AnprLog', anprLogSchema);
