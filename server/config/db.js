import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Auto seed slots if empty
    const { default: Slot } = await import('../models/Slot.js');
    const { default: Settings } = await import('../models/Settings.js');

    const count = await Slot.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding slots...');
      const slots = [];
      // Zone A — Cars
      for (let i = 1; i <= 10; i++)
        slots.push({ slotId: `A-${String(i).padStart(2,'0')}`, zone: 'A', vehicleTypes: ['Car','Bus'], status: 'available' });
      // Zone B — Bikes
      for (let i = 1; i <= 10; i++)
        slots.push({ slotId: `B-${String(i).padStart(2,'0')}`, zone: 'B', vehicleTypes: ['Bike','Bicycle'], status: 'available' });
      // Zone C — Faculty
      for (let i = 1; i <= 5; i++)
        slots.push({ slotId: `C-${String(i).padStart(2,'0')}`, zone: 'C', vehicleTypes: ['Car','Bike','Bicycle','Bus'], status: i <= 2 ? 'reserved' : 'available' });
      // Zone D — Visitors
      for (let i = 1; i <= 5; i++)
        slots.push({ slotId: `D-${String(i).padStart(2,'0')}`, zone: 'D', vehicleTypes: ['Car','Bike','Bicycle','Bus'], status: i === 1 ? 'reserved' : 'available' });

      await Slot.insertMany(slots);
      console.log('✅ 30 slots seeded');
    }

    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        collegeName: 'Galgotias University',
        rates: { Car: 20, Bike: 10, Bicycle: 5, Bus: 40 }
      });
      console.log('✅ Default settings created');
    }
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
