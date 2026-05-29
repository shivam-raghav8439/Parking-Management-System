import React, { useState } from 'react';
import { useSlots } from '../hooks/useSlots';
import { useExitRecord } from '../hooks/useRecords';
import { calculateFee } from '../utils/calcFee';
import { formatDateTime, formatDuration } from '../utils/formatTime';
import { DEFAULT_SETTINGS, SLOT_STATUS } from '../utils/constants';
import { parkingApi } from '../api/parkingApi';
import SlotGrid from '../components/SlotGrid';
import { SlotGridSkeleton } from '../components/Loader';
import Badge from '../components/Badge';
import ConfirmModal from '../components/ConfirmModal';
import ReceiptModal from '../components/ReceiptModal';
import { Info, User, Clock, ShieldAlert, Key, LogOut } from 'lucide-react';

export default function ParkingMap() {
  const [activeZone, setActiveZone] = useState('A');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotDetails, setSlotDetails] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [finalizedRecord, setFinalizedRecord] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const { data: slots, isLoading: slotsLoading } = useSlots();
  const exitMutation = useExitRecord();

  // Load Settings for Rates
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await parkingApi.getSettings();
        if (data) setSettings(data);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  // Fetch full details of record occupying selected slot
  const handleSlotClick = async (slot) => {
    setSelectedSlot(slot);
    if (slot.status === SLOT_STATUS.OCCUPIED) {
      try {
        const records = await parkingApi.getActiveRecords();
        const detail = records.find(r => r.slotNumber === slot.slotNumber);
        setSlotDetails(detail || null);
      } catch (err) {
        setSlotDetails(null);
      }
    } else {
      setSlotDetails(null);
    }
  };

  const handleCheckoutFromMap = () => {
    if (!slotDetails) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmExit = () => {
    if (!slotDetails) return;
    exitMutation.mutate(slotDetails.id, {
      onSuccess: (data) => {
        setIsConfirmOpen(false);
        setSelectedSlot(null);
        setSlotDetails(null);
        // Show checkout receipt
        setFinalizedRecord(data);
        setIsReceiptOpen(true);
      }
    });
  };

  const filteredSlots = slots ? slots.filter(s => s.zoneId === activeZone) : [];

  // Zone metadata
  const zonesInfo = [
    { id: 'A', label: 'Zone A', desc: 'Cars Only' },
    { id: 'B', label: 'Zone B', desc: 'Bikes Only' },
    { id: 'C', label: 'Zone C', desc: 'Faculty' },
    { id: 'D', label: 'Zone D', desc: 'Visitors' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Interactive Floor Grid Map
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Visual status layout of parking spaces. Click occupied slots to view credentials.
        </p>
      </div>

      {/* Legend Block */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-400">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-400">
            <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600"></span>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-400">
            <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-600"></span>
            <span>Reserved Slots</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
          Auto-updates every 20 seconds
        </div>
      </div>

      {/* Main Layout: Grid Map & Side Inspector Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Map Grid Container */}
        <div className="xl:col-span-3 space-y-6">
          {/* Zone Selector Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-px">
            {zonesInfo.map((zone) => {
              const zoneTotal = slots ? slots.filter(s => s.zoneId === zone.id).length : 0;
              const zoneOccupied = slots ? slots.filter(s => s.zoneId === zone.id && s.status === 'occupied').length : 0;
              const isSelected = activeZone === zone.id;

              return (
                <button
                  key={zone.id}
                  onClick={() => {
                    setActiveZone(zone.id);
                    setSelectedSlot(null);
                    setSlotDetails(null);
                  }}
                  className={`px-5 py-3 border-b-2 font-bold text-sm tracking-wide transition-all whitespace-nowrap outline-none flex items-center gap-2 ${
                    isSelected
                      ? 'border-primary-600 text-primary-750 dark:text-primary-400 font-extrabold bg-primary-50/20'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{zone.label}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-2 py-0.5 rounded-full">
                    {zoneOccupied}/{zoneTotal} Filled
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slots Cards */}
          {slotsLoading ? (
            <SlotGridSkeleton />
          ) : (
            <SlotGrid 
              slots={filteredSlots} 
              onSlotClick={handleSlotClick} 
            />
          )}
        </div>

        {/* Side Inspector Panel */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 min-h-[300px]">
          {selectedSlot ? (
            <div className="space-y-5">
              <div className="pb-3 border-b border-slate-105 dark:border-slate-800/50">
                <span className="text-[10px] text-primary-650 dark:text-primary-450 font-extrabold uppercase tracking-widest block">Slot Inspector</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">Slot {selectedSlot.slotNumber}</h3>
              </div>

              {selectedSlot.status === SLOT_STATUS.OCCUPIED && slotDetails ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center py-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/20 dark:border-slate-800/30 rounded-xl">
                    <span className="license-plate text-base">{slotDetails.plate}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-slate-450 shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold leading-none">Owner Name</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{slotDetails.ownerName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Key className="w-4 h-4 text-slate-450 shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold leading-none">Metadata</p>
                        <div className="flex gap-1.5 mt-1">
                          <Badge type={slotDetails.vehicleType}>{slotDetails.vehicleType}</Badge>
                          <Badge type={slotDetails.ownerType}>{slotDetails.ownerType}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-slate-450 shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold leading-none">In Timestamp</p>
                        <p className="font-mono text-slate-700 dark:text-slate-300 mt-1">{formatDateTime(slotDetails.entryTime)}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex justify-between items-center text-xs font-bold bg-primary-50 dark:bg-primary-950/20 p-2 rounded-lg text-primary-750 dark:text-primary-400">
                        <span>Running Fee:</span>
                        <span>₹{calculateFee(slotDetails.entryTime, new Date(), settings.rates[slotDetails.vehicleType] || 10).fee}.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    onClick={handleCheckoutFromMap}
                    className="w-full mt-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Process Checkout
                  </button>
                </div>
              ) : selectedSlot.status === SLOT_STATUS.RESERVED ? (
                <div className="text-center py-8 space-y-3 animate-fade-in">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full w-fit mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Reserved Slot</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed px-4">
                      Reserved for faculty, disabled, or staff vehicles (slots 1 to {settings.reservedCount} initialized).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3 animate-fade-in">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/15 text-emerald-500 rounded-full w-fit mx-auto">
                    <Info className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">Slot is Empty</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed">
                      Available for auto allocation or incoming {activeZone === 'A' ? 'cars' : activeZone === 'B' ? 'bikes' : activeZone === 'C' ? 'faculty' : 'visitors'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-450">
              Select any slot from the map grid to inspect parking logs.
            </div>
          )}
        </div>

      </div>

      {/* Exit Confirmation Dialog */}
      {slotDetails && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          title="Confirm Checkout from Map"
          message={`Are you sure you want to release slot ${slotDetails.slotNumber} and check out vehicle ${slotDetails.plate}?`}
          onConfirm={handleConfirmExit}
          onCancel={() => setIsConfirmOpen(false)}
          isLoading={exitMutation.isLoading}
          confirmText="Confirm & Collect Fee"
          cancelText="Cancel"
          type="warning"
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
