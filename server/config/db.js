import mongoose from 'mongoose';
import { seedDatabase } from './seed.js';
import { seedMockDb } from '../utils/mockDb.js';

export const connectDB = async () => {
  try {
    // Timeout in 2000ms if no local database is running, allowing quick fallback
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.isMockDB = false;
    
    // Trigger initial database seeding checks
    await seedDatabase();
  } catch (error) {
    console.warn(`\n⚠️  [DATABASE WARNING] MongoDB connection failed: ${error.message}`);
    console.warn(`🔌 Fallback initialized: Campus Parking REST Server is running in In-Memory Sandbox Mode.`);
    console.warn(`💡 Note: Authentication, Check-ins, Check-outs, Map Grids, and Charts are fully functional. Data resets on server restart.\n`);
    
    global.isMockDB = true;
    seedMockDb();
  }
};

export default connectDB;
