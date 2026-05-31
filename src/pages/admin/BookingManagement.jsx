import React, { useState, useEffect } from 'react';
import { parkingApi } from '../../api/parkingApi';
import toast from 'react-hot-toast';
import { 
  CalendarCheck, 
  Search, 
  Check, 
  X, 
  Info, 
  Clock, 
  Car, 
  Bike,
  CreditCard,
  SlidersHorizontal,
  Loader,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await parkingApi.getAllBookings();
      if (res && res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change this booking status to "${status}"?`)) {
      return;
    }
    try {
      const res = await parkingApi.updateBookingStatus(id, { status });
      if (res && res.success) {
        toast.success(`Booking ${status} successfully.`);
        fetchBookings();
      }
    } catch (err) {
      toast.error('Failed to update booking status.');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const bStatus = (b.status || '').toLowerCase();
    const bPlate = (b.vehicleNumber || '').toLowerCase();
    const bUser = (b.user?.name || b.name || '').toLowerCase();
    const bSlot = (b.slotId || b.slotNumber || '').toLowerCase();

    const matchesStatus = statusFilter === 'All' || bStatus === statusFilter.toLowerCase();
    const matchesSearch = bPlate.includes(searchTerm.toLowerCase()) || 
                          bUser.includes(searchTerm.toLowerCase()) ||
                          bSlot.includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Parking Reservations Inspector
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Review, approve, reject, and monitor user booking requests.
        </p>
      </div>

      {/* Control Console panel */}
      <div className="glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-2xl overflow-hidden">
        
        {/* Filters Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-3 top-3 text-slate-400">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by name, vehicle plate, or slot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-450" />
              Filter:
            </span>
            <div className="flex bg-slate-100/70 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto border border-slate-200/40 dark:border-slate-800">
              {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Database List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-mono">Quering Reservations Registry...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CalendarCheck className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No reservations found.</p>
              <p className="text-xs text-slate-450 dark:text-slate-550 text-center max-w-xs font-semibold">Verify filters or invite members to book slot.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">
                  <th className="py-4 px-6">Member Info</th>
                  <th className="py-4 px-6">Vehicle & Slot</th>
                  <th className="py-4 px-6">Reservation Period</th>
                  <th className="py-4 px-6">Billing Info</th>
                  <th className="py-4 px-6">Access Approval</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredBookings.map((b) => {
                  const isPending = b.status === 'pending';
                  const bookingDateFormatted = b.bookingDate 
                    ? format(new Date(b.bookingDate), 'dd MMM yyyy')
                    : 'Today';
                  const startFormatted = b.startTime 
                    ? format(new Date(b.startTime), 'hh:mm a')
                    : '--';
                  const endFormatted = b.endTime 
                    ? format(new Date(b.endTime), 'hh:mm a')
                    : '--';

                  return (
                    <tr key={b._id || b.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-all">
                      
                      {/* Member Info */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {b.user?.name || b.name || 'Anonymous User'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {b.user?.email || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Vehicle & Slot */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                            {b.vehicleType?.toLowerCase() === 'bike' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-slate-850 dark:text-slate-100 font-mono tracking-tight uppercase">
                              {b.vehicleNumber}
                            </p>
                            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">
                              Slot: {b.slotId || b.slotNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Period */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-350 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{bookingDateFormatted}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{startFormatted} - {endFormatted}</span>
                          </div>
                        </div>
                      </td>

                      {/* Billing */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-extrabold text-slate-850 dark:text-white">
                            ₹{b.amount}
                          </p>
                          <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border leading-none inline-block mt-1 ${
                            b.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/20 dark:text-amber-400'
                          }`}>
                            {b.paymentStatus || 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border leading-none ${
                          b.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-450 dark:border-emerald-900/35'
                            : b.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/25 dark:text-rose-450 dark:border-rose-900/35'
                            : b.status === 'cancelled'
                            ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-405 dark:border-slate-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/25 dark:text-amber-450 dark:border-amber-900/35 animate-pulse'
                        }`}>
                          {b.status || 'Pending'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b._id || b.id, 'approved')}
                                className="p-1.5 bg-emerald-50 border border-emerald-250 text-emerald-750 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer dark:bg-emerald-950/25 dark:text-emerald-400"
                                title="Approve Reservation"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b._id || b.id, 'rejected')}
                                className="p-1.5 bg-rose-55 border border-rose-250 text-rose-755 hover:bg-rose-100 rounded-xl transition-all cursor-pointer dark:bg-rose-955/25 dark:text-rose-400"
                                title="Reject Reservation"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Processed</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
