import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, DollarSign, Clock, MapPin, User } from 'lucide-react';
import { formatDateTime, formatDuration } from '../utils/formatTime';
import phonepeScannerImg from '../assets/phonepe_scanner.jpg';
import toast from 'react-hot-toast';

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  onConfirm,
  record,
  feeBreakdown,
  isLoading,
  collegeName = 'State Institute of Technology',
  contactNumber = '+91 98765 43210'
}) {
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPaid(false); // Reset to unpaid state when modal opens
    }
  }, [isOpen]);

  if (!isOpen || !record || !feeBreakdown) return null;

  const handlePaidCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsPaid(checked);
    if (checked) {
      toast.success(`Payment of ₹${feeBreakdown.fee}.00 verified successfully!`, {
        id: 'payment-success-toast', // prevent duplicate toast notices
        icon: '✅',
        duration: 3000
      });
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!isPaid) {
      toast.error('Error: Please complete the payment before checkout! Checkout cannot be done without payment.');
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up z-10 overflow-hidden">
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="p-6 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Collect Fee & Verify Checkout
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scan PhonePe QR code to collect parking fee before opening exit gates.
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
          
          {/* Fee Calculation Overview */}
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850 space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-wide">Vehicle Plate</span>
              <span className="license-plate">{record.plate}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Owner / Driver</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {record.ownerName}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Allocated Slot</span>
                <span className="font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 animate-bounce-slow" />
                  {record.slotNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Time Parked</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                  {formatDuration(feeBreakdown.durationHours, feeBreakdown.durationMinutes)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Entry Timestamp</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 block">
                  {formatDateTime(record.entryTime)}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-sm">
              <span className="font-extrabold text-slate-900 dark:text-white">Amount Due:</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-450">₹{feeBreakdown.fee}.00</span>
            </div>
          </div>

          {/* PhonePe QR Scanner */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-100/50 dark:border-rose-900/30 mb-3">
              UPI Merchant Scanner
            </span>
            
            {/* Scanner Frame */}
            <div className={`relative p-2 bg-white border rounded-2xl shadow-sm flex items-center justify-center w-36 h-48 overflow-hidden transition-all duration-300 ${
              isPaid ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
            }`}>
              {!isPaid && <div className="animate-scan"></div>}
              
              <div className={`absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 z-10 transition-colors ${isPaid ? 'border-emerald-500' : 'border-slate-900'}`}></div>
              <div className={`absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 z-10 transition-colors ${isPaid ? 'border-emerald-500' : 'border-slate-900'}`}></div>
              <div className={`absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 z-10 transition-colors ${isPaid ? 'border-emerald-500' : 'border-slate-900'}`}></div>
              <div className={`absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 z-10 transition-colors ${isPaid ? 'border-emerald-500' : 'border-slate-900'}`}></div>
              
              <img 
                src={phonepeScannerImg} 
                alt="PhonePe Accepted Here" 
                className="w-full h-full object-contain" 
              />
            </div>
            
            {isPaid ? (
              <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest mt-3 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Payment Successful: ₹{feeBreakdown.fee}.00
              </p>
            ) : (
              <p className="text-[10px] font-black text-rose-650 dark:text-rose-450 uppercase tracking-widest mt-3">
                Scan & Pay: ₹{feeBreakdown.fee}.00
              </p>
            )}
          </div>

          {/* Payment Checkbox Validation / Success Banner */}
          {isPaid ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 select-none animate-fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  Payment verified successfully!
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsPaid(false)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 select-none">
              <input 
                type="checkbox"
                id="confirmPaidCheck"
                checked={isPaid}
                onChange={handlePaidCheckboxChange}
                className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 outline-none cursor-pointer"
              />
              <label htmlFor="confirmPaidCheck" className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 leading-normal cursor-pointer">
                I verify that the driver has successfully scanned the QR code and paid the due fee of ₹{feeBreakdown.fee}.00.
              </label>
            </div>
          )}

          {/* Checkout Submit Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-350 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            {isPaid && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all bg-primary-600 hover:bg-primary-700 active:bg-primary-800 cursor-pointer animate-fade-in"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Checkout
                  </>
                )}
              </button>
            )}
          </div>
          
        </form>
      </div>
    </div>
  );
}
