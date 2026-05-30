import React, { useState, useEffect } from 'react';
import { useActiveRecords, useSearchRecords, useExitRecord } from '../hooks/useRecords';
import { useDebounce } from '../hooks/useDebounce';
import { calculateFee } from '../utils/calcFee';
import { formatDateTime, formatDuration } from '../utils/formatTime';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { parkingApi } from '../api/parkingApi';
import PaymentCheckoutModal from '../components/PaymentCheckoutModal';
import ReceiptModal from '../components/ReceiptModal';
import Badge from '../components/Badge';
import { Search, LogOut, Clock, DollarSign, User, MapPin } from 'lucide-react';

export default function Exit() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [finalizedRecord, setFinalizedRecord] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Queries and mutations
  const { data: activeList, isLoading: activeLoading } = useActiveRecords();
  const { data: searchResults, isLoading: searchLoading } = useSearchRecords(debouncedSearchQuery);
  const exitMutation = useExitRecord();

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

  // Update current time for live running fee calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Determine which list of vehicles to show (search results or all active list)
  const displayList = searchQuery.trim() !== '' ? (searchResults || []) : (activeList || []);
  const isLoading = searchQuery.trim() !== '' ? (searchLoading || searchQuery !== debouncedSearchQuery) : activeLoading;

  const handleSelectVehicle = (record) => {
    setSelectedRecord(record);
    setIsConfirmOpen(true);
  };

  const handleConfirmExit = () => {
    if (!selectedRecord) return;
    
    const feeBreakdown = getSelectedFeeBreakdown();
    if (!feeBreakdown) return;

    exitMutation.mutate({
      id: selectedRecord.id,
      fee: feeBreakdown.fee,
      durationMinutes: feeBreakdown.totalMinutes,
      exitTime: currentTime.toISOString()
    }, {
      onSuccess: (data) => {
        setIsConfirmOpen(false);
        setSelectedRecord(null);
        // Save the finished record and show receipt
        setFinalizedRecord(data);
        setIsReceiptOpen(true);
      }
    });
  };

  const getSelectedFeeBreakdown = () => {
    if (!selectedRecord) return null;
    const rate = settings.rates[selectedRecord.vehicleType] || 10;
    return calculateFee(selectedRecord.entryTime, currentTime, rate);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Exit Checkpoint & Billing
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search parked vehicles, calculate final duration fees, and checkout vehicles.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by license plate or slot number (e.g. MH12, A-6)..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none shadow-sm transition-all"
        />
      </div>

      {/* Parked Grid Display */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span>Loading vehicle records...</span>
        </div>
      ) : displayList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayList.map((rec) => {
            const rate = settings.rates[rec.vehicleType] || 10;
            const feeBreakdown = calculateFee(rec.entryTime, currentTime, rate);

            return (
              <div 
                key={rec.id} 
                onClick={() => handleSelectVehicle(rec)}
                className="glass-card bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-primary-500/50 select-none group"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="license-plate">{rec.plate}</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-650 dark:group-hover:text-primary-400 mt-2 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      {rec.ownerName}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge type={rec.vehicleType}>{rec.vehicleType}</Badge>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold font-mono">
                      <MapPin className="w-3.5 h-3.5" />
                      {rec.slotNumber}
                    </div>
                  </div>
                </div>

                <hr className="my-4 border-slate-100 dark:border-slate-800/50" />

                {/* Running Time & Estimated Rates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duration Parked</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{formatDuration(feeBreakdown.durationHours, feeBreakdown.durationMinutes)}</span>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Fee</span>
                    <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-slate-900 dark:text-white">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>₹{feeBreakdown.fee}.00</span>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/20 text-right">
                  <span className="text-[10px] font-bold text-primary-650 dark:text-primary-400 group-hover:underline flex items-center justify-end gap-1">
                    <LogOut className="w-3.5 h-3.5" />
                    Process Checkout
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card py-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-center">
          <p className="text-slate-450 font-medium text-sm">
            {searchQuery.trim() !== '' ? 'No matching active parking record found.' : 'All parking spaces are empty.'}
          </p>
        </div>
      )}

      {/* Exit Confirmation & Payment Verification Dialog */}
      {selectedRecord && (
        <PaymentCheckoutModal
          isOpen={isConfirmOpen}
          record={selectedRecord}
          feeBreakdown={getSelectedFeeBreakdown()}
          isLoading={exitMutation.isLoading}
          onConfirm={handleConfirmExit}
          onClose={() => {
            setIsConfirmOpen(false);
            setSelectedRecord(null);
          }}
          collegeName={settings.collegeName}
          contactNumber={settings.contactNumber}
        />
      )}

      {/* Printable Receipt Modal */}
      {finalizedRecord && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setFinalizedRecord(null);
          }}
          record={finalizedRecord}
          mode="exit"
          collegeName={settings.collegeName}
          contactNumber={settings.contactNumber}
        />
      )}
    </div>
  );
}
