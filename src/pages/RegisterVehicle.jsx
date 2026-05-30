import React, { useState, useEffect } from 'react';
import { parkingApi } from '../api/parkingApi';
import { useDebounce } from '../hooks/useDebounce';
import Badge from '../components/Badge';
import { 
  FileSpreadsheet, 
  UserPlus, 
  Trash2, 
  Search, 
  ShieldCheck,
  User,
  Activity,
  Layers,
  Phone,
  Car
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterVehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('All');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');

  // Register Form States
  const [plate, setPlate] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerType, setOwnerType] = useState('Student');
  const [vehicleType, setVehicleType] = useState('Car');
  const [mobile, setMobile] = useState('');
  const [photo, setPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch list
  const fetchRegisteredVehicles = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await parkingApi.getRegisteredVehicles({
        page,
        limit: 10,
        search: debouncedSearch,
        ownerType: ownerTypeFilter,
        vehicleType: vehicleTypeFilter
      });
      if (data) {
        setVehicles(data.vehicles || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      }
    } catch (err) {
      console.error("Failed to load pre-registrations whitelist:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredVehicles(1);
  }, [debouncedSearch, ownerTypeFilter, vehicleTypeFilter]);

  // Form Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!plate || plate.length < 6) {
      alert('Please enter a valid license plate number (6 to 10 alphanumeric characters).');
      return;
    }
    if (!ownerName.trim()) {
      alert('Owner name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await parkingApi.registerVehicle({
        plate,
        ownerName,
        ownerType,
        vehicleType,
        mobile,
        photo
      });

      toast.success(`Vehicle ${plate.toUpperCase()} registered successfully!`);
      // Reset Form
      setPlate('');
      setOwnerName('');
      setMobile('');
      setPhoto('');
      setOwnerType('Student');
      setVehicleType('Car');

      // Refresh whitelists
      fetchRegisteredVehicles(1);
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDelete = async (id, vehiclePlate) => {
    if (!confirm(`Are you sure you want to deregister vehicle with plate ${vehiclePlate}?`)) return;

    try {
      await parkingApi.deleteRegisteredVehicle(id);
      toast.success(`Deregistered plate ${vehiclePlate} successfully.`);
      fetchRegisteredVehicles(currentPage);
    } catch (err) {
      console.error(err);
    }
  };

  // Format date helper
  const formatTime = (timeStr) => {
    if (!timeStr) return '--';
    return new Date(timeStr).toLocaleDateString() + ' ' + new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Whitelist stats
  const totalVehicles = totalCount;
  const facultyCount = vehicles.filter(v => v.ownerType === 'Faculty').length; // Local/Paged subset or derive
  const studentCount = vehicles.filter(v => v.ownerType === 'Student').length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title block */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Auto-Gate Registry whitelist
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pre-register vehicles to authorize ticketless auto-entry slot allocation and gate open loops.
        </p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Registered</p>
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalVehicles} Vehicles</h4>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 dark:bg-violet-500/20 text-violet-650 dark:text-violet-400 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Faculty List</p>
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Faculty Whitelist</h4>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Gate Status</p>
            <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Active</h4>
          </div>
        </div>

      </div>

      {/* Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Pre-Registration Form */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-500" />
            <span>Add Vehicle Pre-Registration</span>
          </h3>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* License Plate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                License Plate Number
              </label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10))}
                placeholder="e.g. MH12AB1234"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white font-mono uppercase tracking-widest focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Capitalized alphanumeric, no spaces.</p>
            </div>

            {/* Owner Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                Owner Full Name
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Aditya Verma"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            {/* Owner Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                Owner Category
              </label>
              <select
                value={ownerType}
                onChange={(e) => setOwnerType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Bus">Bus</option>
              </select>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                Mobile Number (Optional)
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            {/* Photo URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                Photo URL (Optional)
              </label>
              <input
                type="url"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="e.g. http://example.com/car.jpg"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 px-5 py-3 bg-primary-600 hover:bg-primary-750 active:bg-primary-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md shadow-primary-500/10 cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Register Whitelist Vehicle'}
            </button>
          </form>
        </div>

        {/* Registry Whitelist Directory */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Deregistration Registry lookup</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Whitelist directory of auto-entry vehicles</p>
            </div>
            
            <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
              {totalCount} Pre-Registered
            </span>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search owner or plate..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <select
                value={ownerTypeFilter}
                onChange={(e) => setOwnerTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-700 dark:text-slate-300 dark:bg-slate-900 outline-none"
              >
                <option value="All">All Owner Types</option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-700 dark:text-slate-300 dark:bg-slate-900 outline-none"
              >
                <option value="All">All Vehicle Categories</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Bus">Bus</option>
              </select>
            </div>
          </div>

          {/* Whitelist Table */}
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="pb-3">License Plate</th>
                  <th className="pb-3">Owner Details</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Telemetry</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {isLoading || search !== debouncedSearch ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-450">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-455 mx-auto"></div>
                    </td>
                  </tr>
                ) : vehicles && vehicles.length > 0 ? (
                  vehicles.map((v) => (
                    <tr key={v._id || v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3">
                        <span className="license-plate-small">{v.plate}</span>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{v.ownerName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          {v.mobile || 'No Mobile'}
                        </div>
                      </td>
                      <td className="py-3 space-y-1">
                        <div className="font-bold text-slate-500 dark:text-slate-400">{v.ownerType}</div>
                        <Badge type={v.vehicleType}>{v.vehicleType}</Badge>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-450 space-y-0.5">
                        <div>Visits: <span className="font-bold text-primary-500">{v.totalVisits}</span></div>
                        <div>Last Seen: <span className="text-slate-400">{formatTime(v.lastSeen)}</span></div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDelete(v._id || v.id, v.plate)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                          title="Remove registration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-450">
                      No matching whitelisted vehicles in registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 text-xs">
              <span className="text-slate-450">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => fetchRegisteredVehicles(currentPage - 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => fetchRegisteredVehicles(currentPage + 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
