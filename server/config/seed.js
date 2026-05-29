import Slot from '../models/Slot.js';
import Settings from '../models/Settings.js';

export const seedDatabase = async () => {
  try {
    const slotCount = await Slot.countDocuments();
    if (slotCount === 0) {
      console.log('Seeding 1000 initial parking slots...');
      const slotsToSeed = [];

      const zonesConfig = [
        { id: 'A', name: 'Zone A (Cars/Buses)', capacity: 400, allowedTypes: ['Car', 'Bus'], reservedCount: 0 },
        { id: 'B', name: 'Zone B (Bikes/Bicycles)', capacity: 300, allowedTypes: ['Bike', 'Bicycle'], reservedCount: 0 },
        { id: 'C', name: 'Zone C (Faculty)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'], reservedCount: 25 },
        { id: 'D', name: 'Zone D (Visitors)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'], reservedCount: 15 }
      ];

      zonesConfig.forEach(zone => {
        for (let i = 1; i <= zone.capacity; i++) {
          const paddedNumber = String(i).padStart(3, '0');
          const slotId = `${zone.id}-${paddedNumber}`;
          
          let status = 'available';
          if (zone.reservedCount && i <= zone.reservedCount) {
            status = 'reserved';
          }

          slotsToSeed.push({
            slotId,
            zone: zone.id,
            status,
            vehicleTypes: zone.allowedTypes,
            currentRecord: null
          });
        }
      });

      await Slot.insertMany(slotsToSeed);
      console.log(`Successfully seeded ${slotsToSeed.length} slots.`);
    } else {
      console.log('Slots collection already populated. Skipping slots seeding.');
    }

    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      console.log('Seeding default Settings document...');
      await Settings.create({
        collegeName: 'Galgotias University',
        contactEmail: 'support@galgotias.edu',
        contactPhone: '+91 98765 43210',
        rates: {
          Car: 20,
          Bike: 10,
          Bicycle: 5,
          Bus: 40
        },
        zones: [
          { id: 'A', name: 'Zone A (Cars/Buses)', capacity: 400, allowedTypes: ['Car', 'Bus'] },
          { id: 'B', name: 'Zone B (Bikes/Bicycles)', capacity: 300, allowedTypes: ['Bike', 'Bicycle'] },
          { id: 'C', name: 'Zone C (Faculty Only)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'] },
          { id: 'D', name: 'Zone D (Visitors)', capacity: 150, allowedTypes: ['Car', 'Bike', 'Bicycle', 'Bus'] }
        ]
      });
      console.log('Successfully seeded system settings.');
    } else {
      console.log('Settings already exist. Skipping settings seeding.');
    }
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
  }
};

export default seedDatabase;
