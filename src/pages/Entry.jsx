import React, { useState, useEffect } from 'react';
import { useCreateEntry, useActiveRecords } from '../hooks/useRecords';
import { VEHICLE_TYPES, OWNER_TYPES, DEFAULT_SETTINGS } from '../utils/constants';
import { parkingApi } from '../api/parkingApi';
import ReceiptModal from '../components/ReceiptModal';
import Badge from '../components/Badge';
import VehicleDetailsCard from '../components/VehicleDetailsCard';
import { Loader } from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '../utils/formatTime';

export default function Entry() {
  const [plate, setPlate] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [ownerType, setOwnerType] = useState('Student');
  const [zonePreference, setZonePreference] = useState('Auto');
  const [mobileNumber, setMobileNumber] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  
  // Custom settings state to display live price rates
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Vahan details and loading states
  const [vahanDetails, setVahanDetails] = useState(null);
  const [isLoadingVahan, setIsLoadingVahan] = useState(false);

  const { data: activeRecords, isLoading: listLoading } = useActiveRecords();
  const createEntryMutation = useCreateEntry();

  // Load Settings for Rates
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await parkingApi.getSettings();
        if (data) setSettings(data);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  // Trigger Vahan lookup automatically on 10 characters
  useEffect(() => {
    const fetchVahanData = async () => {
      if (plate.length === 10) {
        setIsLoadingVahan(true);
        try {
          const res = await parkingApi.getVehicleDetails(plate);
          if (res?.success && res?.data) {
            setVahanDetails(res.data);
            
            // Auto populate owner name if not entered yet
            if (res.data.owner && res.data.owner !== 'N/A') {
              setOwnerName(res.data.owner);
            }
            
            // Auto select vehicle type
            const vClass = res.data.vehicleClass.toLowerCase();
            if (vClass.includes('two wheeler') || vClass.includes('bike') || vClass.includes('motorcycle') || vClass.includes('scooter')) {
              setVehicleType('Bike');
            } else if (vClass.includes('bus') || vClass.includes('heavy')) {
              setVehicleType('Bus');
            } else if (vClass.includes('cycle') || vClass.includes('bicycle')) {
              setVehicleType('Bicycle');
            } else {
              setVehicleType('Car');
            }
          }
        } catch (err) {
          console.warn("Vahan auto lookup failed:", err.message);
        } finally {
          setIsLoadingVahan(false);
        }
      } else {
        setVahanDetails(null);
      }
    };
    fetchVahanData();
  }, [plate]);

  const handlePlateChange = (e) => {
    // Live filter: capitalize, strip non-alphanumeric, max length 10
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    setPlate(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!plate || plate.length < 8) {
      alert('Please enter a valid license plate number (at least 8 characters).');
      return;
    }
    if (!ownerName.trim()) {
      alert('Please enter the owner name.');
      return;
    }

    // Apply Vahan compliance verification checks on manual Entry submission
    if (vahanDetails) {
      // 1. Blacklist check (BLOCK)
      const isBlacklisted = vahanDetails.blacklistStatus && !vahanDetails.blacklistStatus.toLowerCase().includes('clear');
      if (isBlacklisted) {
        alert(`❌ ACCESS BLOCKED: Vehicle with plate ${plate} is blacklisted (${vahanDetails.blacklistStatus})! Entry is prohibited.`);
        return;
      }

      // 2. Insurance / PUC validity (Operator Override prompt)
      const isInsuranceExpired = vahanDetails.insuranceUpto && vahanDetails.insuranceUpto !== 'N/A' && new Date(vahanDetails.insuranceUpto) < new Date();
      const isPucExpired = vahanDetails.pucUpto && vahanDetails.pucUpto !== 'N/A' && new Date(vahanDetails.pucUpto) < new Date();

      if (isInsuranceExpired || isPucExpired) {
        const reason = isInsuranceExpired && isPucExpired 
          ? 'Insurance & PUC are expired' 
          : isInsuranceExpired 
            ? 'Insurance is expired' 
            : 'PUC is expired';
        
        const confirmOverride = window.confirm(`⚠️ COMPLIANCE ALERT: ${reason}!\nDo you have authorized operator permission to override this warning and allow entry manually?`);
        if (!confirmOverride) {
          toast.error("Entry registration cancelled due to compliance failures.");
          return;
        }
      }

      // 3. Pending Challans warning notice
      const hasChallans = vahanDetails.challanDetails && !vahanDetails.challanDetails.toLowerCase().includes('0 pending') && !vahanDetails.challanDetails.toLowerCase().includes('no pending');
      if (hasChallans) {
        toast.error(`⚠️ Warning: Outstanding challans pending (${vahanDetails.challanDetails}).`);
      }
    }

    createEntryMutation.mutate({
      plate,
      ownerName,
      vehicleType,
      ownerType,
      zonePreference,
      mobileNumber
    }, {
      onSuccess: (data) => {
        setActiveTicket(data);
        setIsTicketModalOpen(true);
        // Reset form
        setPlate('');
        setOwnerName('');
        setMobileNumber('');
        setVehicleType('Car');
        setOwnerType('Student');
        setZonePreference('Auto');
        setVahanDetails(null);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Entry Checkpoint Desk
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Issue entry slips and allocate parking slots for arriving vehicles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Entry Registration Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span>Vehicle Check-In Registration</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* License Plate Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                  Plate Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={plate}
                    onChange={handlePlateChange}
                    placeholder="e.g. MH12AB1234"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white font-mono uppercase tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:focus:ring-offset-slate-900"
                  />
                  <div className="absolute right-3 top-3.5 text-[10px] text-slate-400 font-semibold font-mono uppercase">
                    {plate.length}/10
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Must be alphanumeric, e.g. GA02X8877</p>
                
                {isLoadingVahan && (
                  <div className="mt-2 text-[10px] text-primary-500 font-semibold flex items-center gap-1.5 animate-pulse">
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching Government Vahan RC profile...</span>
                  </div>
                )}

                {vahanDetails && (
                  <div className="mt-4 pt-1 w-full max-w-sm">
                    <VehicleDetailsCard details={vahanDetails} />
                  </div>
                )}
              </div>

              {/* Owner Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                  Vehicle Category & Rate
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {Object.values(VEHICLE_TYPES).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (₹{settings.rates[t.id] ?? t.rate}/hr)
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-650 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/10 dark:border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Active Rate: ₹{settings.rates[vehicleType] ?? (VEHICLE_TYPES[vehicleType.toUpperCase()]?.rate || 10)} / hour</span>
                </div>
              </div>

              {/* Owner Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                  Owner Category
                </label>
                <select
                  value={ownerType}
                  onChange={(e) => setOwnerType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {Object.values(OWNER_TYPES).map(ot => (
                    <option key={ot.id} value={ot.id}>{ot.name}</option>
                  ))}
                </select>
              </div>

              {/* Zone Preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                  Zone Preference
                </label>
                <select
                  value={zonePreference}
                  onChange={(e) => setZonePreference(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="Auto">Auto Allocator (Recommended)</option>
                  <option value="A">Zone A - Cars</option>
                  <option value="B">Zone B - Bikes</option>
                  <option value="C">Zone C - Faculty Only</option>
                  <option value="D">Zone D - Visitors / General</option>
                </select>
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={createEntryMutation.isLoading}
                className="px-6 py-3 bg-primary-700 hover:bg-primary-850 active:bg-primary-900 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-primary-500/20 transition-all duration-200 flex items-center gap-2"
              >
                {createEntryMutation.isLoading && <Loader className="w-4 h-4 animate-spin" />}
                Generate Entry Ticket & Allocate Slot
              </button>
            </div>
          </form>
        </div>

        {/* Live Active Parked Sidebar */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Active Vehicles</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">Live feeds (30s refresh)</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-450">
              {activeRecords?.length ?? 0} Parked
            </span>
          </div>

          <div className="space-y-4 max-h-[390px] overflow-y-auto pr-1">
            {listLoading ? (
              <div className="py-12 flex justify-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400 mr-2"></div>
                Loading active list...
              </div>
            ) : activeRecords && activeRecords.length > 0 ? (
              [...activeRecords].reverse().slice(0, 15).map((rec) => (
                <div 
                  key={rec.id} 
                  className="p-3 bg-slate-50/75 dark:bg-slate-850/40 rounded-xl border border-slate-200/30 dark:border-slate-800/30 flex justify-between items-center hover:border-primary-500/30 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="license-plate-small block w-fit text-[9px] px-1 py-0">{rec.plate}</span>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {rec.ownerName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">In: {formatRelativeTime(rec.entryTime)}</p>
                  </div>
                  <div className="text-right flex flex-col gap-1.5 items-end">
                    <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400 font-mono">
                      {rec.slotNumber}
                    </span>
                    <Badge type={rec.vehicleType}>{rec.vehicleType}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-slate-450">
                No vehicles currently parked on campus.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Entry Ticket Slip Modal */}
      <ReceiptModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        record={activeTicket}
        mode="entry"
        collegeName={settings.collegeName}
        contactNumber={settings.contactNumber}
      />
    </div>
  );
}
