import React, { useState, useEffect } from 'react';
import { parkingApi } from '../../api/parkingApi';
import toast from 'react-hot-toast';
import { 
  CalendarRange, 
  Car, 
  Bike, 
  MapPin, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Loader, 
  CreditCard,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BookSlot() {
  const [slots, setSlots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const navigate = useNavigate();

  // Booking Form State
  const [vehicleType, setVehicleType] = useState('Car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [duration, setDuration] = useState('2'); // hours

  // Payment Sim modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const slotsList = await parkingApi.getSlots();
        const settingsData = await parkingApi.getSettings();
        setSlots(slotsList || []);
        setSettings(settingsData);
      } catch (err) {
        toast.error('Failed to load slots map or rates settings.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter slots based on zone mapping to vehicle types
  // Zone A: Car, Zone B: Bike, Zone C: Faculty, Zone D: Visitor
  const availableSlots = slots.filter(s => {
    const isAvail = s.status === 'available';
    const zone = (s.zone || s.zoneId || 'A').toUpperCase();
    if (vehicleType === 'Car') return isAvail && (zone === 'A' || zone === 'C' || zone === 'D');
    if (vehicleType === 'Bike') return isAvail && (zone === 'B' || zone === 'C' || zone === 'D');
    return isAvail;
  });

  const getSlotPrice = (slotId) => {
    const slotObj = slots.find(s => s.slotNumber === slotId);
    if (slotObj && slotObj.price) return slotObj.price;
    if (settings && settings.rates) {
      return settings.rates[vehicleType] || (vehicleType === 'Bike' ? 10 : 20);
    }
    return vehicleType === 'Bike' ? 10 : 20;
  };

  const calculatedAmount = (() => {
    if (!selectedSlotId) return 0;
    const rate = getSlotPrice(selectedSlotId);
    return rate * parseInt(duration);
  })();

  const handleBook = async (e) => {
    e.preventDefault();
    if (!vehicleNumber) {
      toast.error('Please enter vehicle number plate.');
      return;
    }
    if (!selectedSlotId) {
      toast.error('Please select an available parking slot.');
      return;
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + parseInt(duration) * 60 * 60 * 1000);

    const payload = {
      slotId: selectedSlotId,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      vehicleType,
      bookingDate: startTime.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      amount: calculatedAmount
    };

    setBookingLoading(true);
    try {
      const res = await parkingApi.createBooking(payload);
      if (res && res.success) {
        const booking = res.booking || res.data;
        setCreatedBooking(booking);
        toast.success('Reservation request submitted.');
        setShowPaymentModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit booking reservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!createdBooking) return;
    setPaymentLoading(true);
    try {
      const transactionId = `pay_sim_${Date.now()}`;
      const res = await parkingApi.payBooking(createdBooking._id || createdBooking.id, { transactionId });
      if (res && res.success) {
        toast.success('Payment completed successfully (Sandbox Simulation).');
        setShowPaymentModal(false);
        navigate('/my-bookings');
      }
    } catch (err) {
      toast.error('Payment simulation failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Book Parking Space
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Reserve an available space, calculate rates, and prepay fees.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader className="w-8 h-8 text-primary-605 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold font-mono">Loading parking metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-3 glass-panel p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <form onSubmit={handleBook} className="space-y-5">
              
              {/* Vehicle Type Choice */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Vehicle Category</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleType('Car');
                      setSelectedSlotId('');
                    }}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      vehicleType === 'Car'
                        ? 'bg-primary-50 border-primary-500 text-primary-750 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-800'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                    }`}
                  >
                    <Car className="w-4.5 h-4.5" />
                    Four Wheeler (Car)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleType('Bike');
                      setSelectedSlotId('');
                    }}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      vehicleType === 'Bike'
                        ? 'bg-primary-50 border-primary-500 text-primary-750 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-800'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                    }`}
                  >
                    <Bike className="w-4.5 h-4.5" />
                    Two Wheeler (Bike)
                  </button>
                </div>
              </div>

              {/* Vehicle Plate Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Vehicle Registration Plate</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <FileText className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH12AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white uppercase font-mono tracking-wider focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Slot selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Select Parking Space</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-450 dark:text-slate-500">
                    <MapPin className="w-4.5 h-4.5" />
                  </span>
                  <select
                    required
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 text-slate-950 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-550 dark:text-slate-400">-- Choose available spot --</option>
                    {availableSlots.map(s => {
                      const cost = getSlotPrice(s.slotNumber);
                      return (
                        <option key={s.slotNumber} value={s.slotNumber} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                          Slot {s.slotNumber} (₹{cost}/hr)
                        </option>
                      );
                    })}
                  </select>
                </div>
                {availableSlots.length === 0 && (
                  <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    No slots are currently vacant in this vehicle's category.
                  </p>
                )}
              </div>

              {/* Duration choice */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Reservation Duration (Hours)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-450 dark:text-slate-500">
                    <Clock className="w-4.5 h-4.5" />
                  </span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 text-slate-950 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 6, 8, 12, 24].map(h => (
                      <option key={h} value={h} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                        {h} {h === 1 ? 'Hour' : 'Hours'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={bookingLoading || availableSlots.length === 0 || !selectedSlotId}
                className="w-full mt-3 py-3 bg-primary-750 hover:bg-primary-850 active:bg-primary-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {bookingLoading ? <Loader className="w-4.5 h-4.5 animate-spin" /> : <CalendarRange className="w-4.5 h-4.5" />}
                Confirm Booking Reservation
              </button>
            </form>
          </div>

          {/* Pricing summary */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md h-fit space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">Reservation Summary</h3>
              
              <div className="mt-5 space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Vehicle Category</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-205 flex items-center gap-1.5">
                    {vehicleType === 'Car' ? <Car className="w-4 h-4 text-slate-400" /> : <Bike className="w-4 h-4 text-slate-400" />}
                    {vehicleType}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Allocated Parking Spot</span>
                  <span className="font-extrabold text-slate-805 dark:text-slate-200 font-mono uppercase">
                    {selectedSlotId ? `Slot ${selectedSlotId}` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Hours Reserved</span>
                  <span className="font-extrabold text-slate-805 dark:text-slate-200">
                    {duration} Hours
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Slot Hourly Rate</span>
                  <span className="font-extrabold text-slate-805 dark:text-slate-200">
                    ₹{selectedSlotId ? getSlotPrice(selectedSlotId) : '--'}/hr
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-105 dark:border-slate-800/80 mt-5 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Total</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{calculatedAmount}
                </span>
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex items-start gap-2.5 text-[10px] text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-indigo-500 mt-0.5" />
                <p>Reservations require approval by the admin. The booking remains in "pending" status until approved. If rejected, simulated refund is initiated.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Razorpay payment modal */}
      {showPaymentModal && createdBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-6 rounded-2xl shadow-2xl relative animate-scale-up space-y-5">
            
            {/* Logo and title */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                Payment Terminal
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Campus Online Gateway (Razorpay Simulator)
              </p>
            </div>

            {/* Receipt invoice detail */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-3 font-semibold text-xs text-slate-650 dark:text-slate-350">
              <div className="flex justify-between">
                <span>Receipt Number</span>
                <span className="font-mono text-[10px] text-slate-500 uppercase">{createdBooking._id || createdBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Plate</span>
                <span className="font-mono uppercase text-slate-900 dark:text-white">{createdBooking.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Parking Slot</span>
                <span className="font-mono text-slate-900 dark:text-white">Slot {createdBooking.slotId}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase">Prepaid Fee</span>
                <span className="text-base font-black text-slate-900 dark:text-white">₹{createdBooking.amount}</span>
              </div>
            </div>

            {/* Notice information */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl text-[10px] text-amber-700 dark:text-amber-450 leading-relaxed font-semibold flex gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-500" />
              <p>This is a simulated Razorpay payment gateway checkout interface. No real credentials are required, and no real currency is processed.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  navigate('/my-bookings');
                }}
                className="w-1/3 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-slate-550 dark:text-slate-350 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Pay Later
              </button>
              <button
                onClick={handleSimulatePayment}
                disabled={paymentLoading}
                className="w-2/3 py-2.5 bg-primary-750 hover:bg-primary-850 active:bg-primary-900 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {paymentLoading ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Authorize Payment
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
