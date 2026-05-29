import React from 'react';
import { X, Printer, CheckCircle, QrCode } from 'lucide-react';
import { formatDateTime, formatDuration } from '../utils/formatTime';
import phonepeScannerImg from '../assets/phonepe_scanner.jpg';

export default function ReceiptModal({
  isOpen,
  onClose,
  record,
  mode = 'entry', // 'entry' (ticket) or 'exit' (receipt)
  collegeName = 'State Institute of Technology',
  contactNumber = '+91 98765 43210'
}) {
  if (!isOpen || !record) return null;

  const isExit = mode === 'exit';

  const handlePrint = () => {
    window.print();
  };

  // Convert minutes into hours and minutes
  const hours = Math.floor((record.durationMinutes || 0) / 60);
  const minutes = (record.durationMinutes || 0) % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity no-print" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up z-10 no-print">
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="p-6 pb-0 flex flex-col items-center">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-600 dark:text-emerald-400 mb-3">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isExit ? 'Payment Receipt' : 'Parking Entry Ticket'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
            {isExit ? 'Transaction completed successfully' : 'Slot assigned successfully'}
          </p>
        </div>

        {/* Ticket Body for Preview */}
        <div className="p-6">
          <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/30 space-y-4">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">{collegeName}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">PARKING SLIP</p>
            </div>

            {/* Fields */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Plate Number:</span>
                <span className="license-plate-small">{record.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner Name:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{record.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Category:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{record.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner Category:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{record.ownerType}</span>
              </div>
              <div className="flex justify-between items-center py-1 bg-primary-50 dark:bg-primary-950/20 px-2 rounded-lg border border-primary-100/50 dark:border-primary-900/20">
                <span className="text-primary-700 dark:text-primary-400 font-semibold">Allocated Slot:</span>
                <span className="text-sm font-extrabold text-primary-800 dark:text-primary-300">{record.slotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">In Timestamp:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatDateTime(record.entryTime)}</span>
              </div>

              {isExit && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Out Timestamp:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{formatDateTime(record.exitTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parked Duration:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{formatDuration(hours, minutes)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">Amount Collected:</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">₹{record.fee}.00</span>
                  </div>
                </>
              )}
            </div>            {/* QR Code / Scanner Section */}
            <div className="flex flex-col items-center justify-center pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
              {isExit ? (
                // Payment Successful Receipt Badge
                <div className="w-full py-2 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Transaction Completed
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono uppercase">PAID VIA PHONEPE UPI</p>
                  </div>
                </div>
              ) : (
                // Entry Ticket Code
                <>
                  <div className="p-3 bg-white border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                    <QrCode className="w-20 h-20 text-slate-900" strokeWidth={1.5} />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 tracking-widest uppercase">SCAN AT CHECKPOINT</p>
                </>
              )}
            </div>
            
            <div className="text-center text-[9px] text-slate-400">
              <p>Thank you for using campus parking!</p>
              <p className="mt-0.5">Contact: {contactNumber}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Slip
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SEPARATE HTML STRUCTURE FOR WINDOWS PRINT BYPASSING POPUP BODY */}
      {/* ----------------------------------------------------------------- */}
      <div id="printable-receipt" className="hidden">
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{collegeName}</h2>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isExit ? 'Payment Receipt' : 'Entry Parking Slip'}
          </span>
        </div>
        <hr style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />
        
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 0', color: '#555' }}>Plate No:</td>
              <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>{record.plate}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0', color: '#555' }}>Owner:</td>
              <td style={{ padding: '3px 0', textAlign: 'right' }}>{record.ownerName}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0', color: '#555' }}>Vehicle:</td>
              <td style={{ padding: '3px 0', textAlign: 'right' }}>{record.vehicleType}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0', color: '#555' }}>Category:</td>
              <td style={{ padding: '3px 0', textAlign: 'right' }}>{record.ownerType}</td>
            </tr>
            <tr style={{ fontSize: '13px', fontWeight: 'bold' }}>
              <td style={{ padding: '8px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000' }}>Slot:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', borderTop: '1px dashed #000', borderBottom: '1px dashed #000' }}>{record.slotNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0 3px 0', color: '#555' }}>In Time:</td>
              <td style={{ padding: '5px 0 3px 0', textAlign: 'right' }}>{formatDateTime(record.entryTime)}</td>
            </tr>
            {isExit && (
              <>
                <tr>
                  <td style={{ padding: '3px 0', color: '#555' }}>Out Time:</td>
                  <td style={{ padding: '3px 0', textAlign: 'right' }}>{formatDateTime(record.exitTime)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#555' }}>Duration:</td>
                  <td style={{ padding: '3px 0', textAlign: 'right' }}>{formatDuration(hours, minutes)}</td>
                </tr>
                <tr style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px 0', borderTop: '1px dashed #000' }}>Total Paid:</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', borderTop: '1px dashed #000' }}>₹{record.fee}.00</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        
        <hr style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '10px' }}>
          <p style={{ margin: '2px 0' }}>Scan QR Code at checkpoint to open barrier gates</p>
          <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Support: {contactNumber}</p>
        </div>
      </div>
    </div>
  );
}
