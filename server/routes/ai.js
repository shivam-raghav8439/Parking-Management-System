import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { protect } from '../middleware/auth.js';
import Record from '../models/Record.js';
import Slot from '../models/Slot.js';

const router = express.Router();

router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history } = req.body;

    // Get live parking data to give AI context (MongoDB vs Mock DB support)
    let totalSlots = 1000;
    let availableSlots = 800;
    let occupiedSlots = 200;
    let todayRevenueVal = 0;

    if (global.isMockDB) {
      const slots = global.mockDb.slots || [];
      const records = global.mockDb.records || [];
      totalSlots = slots.length;
      availableSlots = slots.filter(s => s.status === 'available' || s.status === 'reserved').length;
      occupiedSlots = slots.filter(s => s.status === 'occupied').length;
      todayRevenueVal = records
        .filter(r => r.status === 'exited' && new Date(r.exitTime) >= new Date(new Date().setHours(0,0,0,0)))
        .reduce((sum, r) => sum + (r.fee || 0), 0);
    } else {
      try {
        totalSlots = await Slot.countDocuments();
        availableSlots = await Slot.countDocuments({ status: 'available' });
        occupiedSlots = await Slot.countDocuments({ status: 'occupied' });
        const todayRevenue = await Record.aggregate([
          { $match: {
            status: 'exited',
            exitTime: { $gte: new Date(new Date().setHours(0,0,0,0)) }
          }},
          { $group: { _id: null, total: { $sum: '$fee' } }}
        ]);
        todayRevenueVal = todayRevenue[0]?.total || 0;
      } catch (dbError) {
        console.error("Mongoose stats lookup error for AI context:", dbError.message);
      }
    }

    const systemPrompt = `You are SmartPark AI Assistant for Galgotias University Parking Management System.

CURRENT LIVE PARKING DATA:
- Total slots: ${totalSlots}
- Available slots: ${availableSlots}
- Occupied slots: ${occupiedSlots}
- Today's revenue: ₹${todayRevenueVal}
- Current user: ${req.user.name} (${req.user.role})

YOUR JOB:
You help students, faculty and staff with parking related questions.
Always be helpful, friendly and give specific answers.
Answer in the same language the user writes in (Hindi or English).
Keep answers short and clear.

YOU CAN HELP WITH:
- How many slots are available right now
- Parking rates and fees
- How to get a monthly pass
- How ANPR gate system works
- How to register their vehicle
- General parking rules and timing
- How to pay parking fee
- Lost ticket or issues
- Contact information for parking office

PARKING RULES AT GALGOTIAS:
- Car: ₹20/hour
- Bike/Scooter: ₹10/hour
- Bicycle: ₹5/hour
- Monthly pass: Car ₹800, Bike ₹400
- Parking open: 6 AM to 10 PM
- Zones: A (Cars), B (Bikes), C (Faculty), D (Visitors)

DO NOT:
- Share other users private data
- Make up information you don't know
- Answer questions not related to parking`;

    // Check if API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      // Simulate Claude response for testing/development/sandbox ease
      const lowercaseMessage = message.toLowerCase();
      let reply = "";

      if (lowercaseMessage.includes('slot') || lowercaseMessage.includes('available') || lowercaseMessage.includes('khali') || lowercaseMessage.includes('space')) {
        reply = `Right now, there are ${availableSlots} available parking slots out of ${totalSlots} total slots. Let me know if you need help booking one or checking the zones!`;
      } else if (lowercaseMessage.includes('rate') || lowercaseMessage.includes('fee') || lowercaseMessage.includes('price') || lowercaseMessage.includes('charge')) {
        reply = `Here are the parking rates at Galgotias University:\n• Cars: ₹20/hour\n• Bikes/Scooters: ₹10/hour\n• Bicycles: ₹5/hour\n• Monthly Pass: ₹800 (Car), ₹400 (Bike)\n\nFees are calculated dynamically based on exit time.`;
      } else if (lowercaseMessage.includes('pass') || lowercaseMessage.includes('monthly')) {
        reply = `You can purchase a Monthly Parking Pass inside your user portal. Rates:\n• Cars: ₹800/month\n• Bikes: ₹400/month\n\nOnce purchased, the pass is linked to your plate for automatic gate opening!`;
      } else if (lowercaseMessage.includes('register') || lowercaseMessage.includes('vehicle') || lowercaseMessage.includes('gadi')) {
        reply = `To register your vehicle, head to the "Register Vehicle" tab in your side menu. Enter your plate number, owner info, and vehicle type. You can then use the ANPR automated gates!`;
      } else if (lowercaseMessage.includes('anpr') || lowercaseMessage.includes('gate') || lowercaseMessage.includes('camera')) {
        reply = `Galgotias University uses an ANPR (Automated Number Plate Recognition) system at all parking gates. When you approach the gate, a camera reads your license plate. If your vehicle is registered or you have a booking/pass, the gate opens automatically!`;
      } else {
        reply = `Hi ${req.user.name}! I am the SmartPark AI chatbot. (Anthropic API Key is not set, running in Simulation Mode).\n\nI can help you with:\n• Slot occupancy details (Current: ${availableSlots} free slots)\n• Parking rates (Car: ₹20/hr, Bike: ₹10/hr)\n• Monthly passes & ANPR auto-gates\n• Booking and registering vehicles\n\nAsk me anything!`;
      }

      return res.json({
        reply,
        usage: { input_tokens: 0, output_tokens: 0 }
      });
    }

    // Initialize Anthropic client
    const client = new Anthropic({ apiKey });

    // Build conversation history
    const messages = [
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages
    });

    res.json({
      reply: response.content[0].text,
      usage: response.usage
    });

  } catch (error) {
    res.status(500).json({ message: 'AI error', error: error.message });
  }
});

export default router;
