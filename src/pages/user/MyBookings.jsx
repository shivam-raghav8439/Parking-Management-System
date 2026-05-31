import React, { useState, useEffect } from 'react';
import { parkingApi } from '../../api/parkingApi';
import toast from 'react-hot-toast';
import { 
  CalendarCheck, 
  Car, 
  Bike, 
  Clock, 
  Calendar, 
  CreditCard, 
  XSquare, 
  Loader, 
  AlertTriangle,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Payment Sim modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await parkingApi.getMyBookings();
      if (res && res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      toast.error('Failed to retrieve your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    try {
      const res = await parkingApi.cancelBooking(id);
      if (res && res.success) {
        toast.success('Reservation cancelled successfully.');
        fetchMyBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  const handleOpenPayment = (booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handleSimulatePayment = async () => {
    if (!selectedBooking) return;
    setPaymentLoading(true);
    try {
      const transactionId = `pay_sim_${Date.now()}`;
      const res = await parkingApi.payBooking(selectedBooking._id || selectedBooking.id, { transactionId });
      if (res && res.success) {
        toast.success('Simulated payment processed successfully.');
        setShowPaymentModal(false);
        fetchMyBookings();
      }
    } catch (err) {
      toast.error('Simulated checkout failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          My Parking Bookings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Review, pay due fees, or cancel active reservations.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="w-8 h-8 text-primary-650 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold font-mono">Loading reservation logs...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-md">
          <CalendarCheck className="w-12 h-12 text-slate-400 dark:text-slate-655" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No bookings created yet.</h3>
          <p className="text-xs text-slate-500 max-w-xs text-center leading-relaxed font-semibold">Reserve your spot in advance to avoid campus parking delays.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const bookingDateFormatted = b.bookingDate 
              ? format(new Date(b.bookingDate), 'dd MMM yyyy')
              : 'Today';
            const startFormatted = b.startTime 
              ? format(new Date(b.startTime), 'hh:mm a')
              : '--';
            const endFormatted = b.endTime 
              ? format(new Date(b.endTime), 'hh:mm a')
              : '--';
            
            const isPendingPayment = b.paymentStatus !== 'paid';
            const isCancellable = b.status === 'pending' || b.status === 'approved';

            return (
              <div 
                key={b._id || b.id} 
                className="glass-panel p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-lg transition-all"
              >
                {/* Details Section */}
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${
                    b.vehicleType?.toLowerCase() === 'bike'
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                      : 'bg-primary-50 border-primary-100 text-primary-750 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-900/30'
                  }`}>
                    {b.vehicleType?.toLowerCase() === 'bike' ? <Bike className="w-5.5 h-5.5" /> : <Car className="w-5.5 h-5.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono uppercase tracking-wide leading-none">{b.vehicleNumber}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded leading-none">
                        Slot {b.slotId || b.slotNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {bookingDateFormatted}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-450 dark:text-slate-500">
                        <Clock className="w-3 h-3" />
                        {startFormatted} - {endFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Payment Block */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 gap-3">
                  <div className="text-left sm:text-right leading-none">
                    <span className="text-lg font-black text-slate-900 dark:text-white block">₹{b.amount}</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* Status indicator */}
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border leading-none ${
                        b.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : b.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-955/20 dark:text-rose-450'
                          : b.status === 'cancelled'
                          ? 'bg-slate-55 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-405 dark:border-slate-850'
                          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/20 dark:text-amber-450 animate-pulse'
                      }`}>
                        {b.status || 'Pending'}
                      </span>
                      {/* Payment Status indicator */}
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border leading-none ${
                        b.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/20 dark:text-amber-450'
                      }`}>
                        {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>

                  {/* Booking Control Actions */}
                  <div className="flex gap-2">
                    {isPendingPayment && b.status !== 'cancelled' && b.status !== 'rejected' && (
                      <button
                        onClick={() => handleOpenPayment(b)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-750 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Due
                      </button>
                    )}
                    {isCancellable && (
                      <button
                        onClick={() => handleCancelBooking(b._id || b.id)}
                        className="px-3 py-1.5 bg-rose-55 border border-rose-200 hover:bg-rose-100 text-rose-700 dark:bg-rose-955/25 dark:text-rose-400 dark:border-rose-900/30 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <XSquare className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Checkout simulator modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-6 rounded-2xl shadow-2xl relative animate-scale-up space-y-5">
            
            {/* Modal Header */}
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

            {/* Bill summary details */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-3 font-semibold text-xs text-slate-655 dark:text-slate-355">
              <div className="flex justify-between">
                <span>Receipt Number</span>
                <span className="font-mono text-[10px] text-slate-500 uppercase">{selectedBooking._id || selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Plate</span>
                <span className="font-mono uppercase text-slate-900 dark:text-white">{selectedBooking.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Parking Slot</span>
                <span className="font-mono text-slate-900 dark:text-white">Slot {selectedBooking.slotId || selectedBooking.slotNumber}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase">Prepaid Fee</span>
                <span className="text-base font-black text-slate-900 dark:text-white">₹{selectedBooking.amount}</span>
              </div>
            </div>

            {/* Sandbox details */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl text-[10px] text-amber-700 dark:text-amber-450 leading-relaxed font-semibold flex gap-2">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-500" />
              <p>This is a simulated Razorpay payment gateway checkout interface. No real credentials are required, and no real currency is processed.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-1/3 py-2.5 border border-slate-205 dark:border-slate-850 hover:bg-slate-50 text-slate-550 dark:text-slate-350 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
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
