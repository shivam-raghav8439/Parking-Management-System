import React from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle, Info, FileText } from 'lucide-react';

export default function VehicleDetailsCard({ details }) {
  if (!details) return null;

  const isInsuranceValid = details.insuranceUpto && details.insuranceUpto !== 'N/A' && new Date(details.insuranceUpto) >= new Date();
  const isPucValid = details.pucUpto && details.pucUpto !== 'N/A' && new Date(details.pucUpto) >= new Date();
  const isBlacklistClear = details.blacklistStatus && details.blacklistStatus.toLowerCase().includes('clear');
  const hasChallans = details.challanDetails && !details.challanDetails.toLowerCase().includes('0 pending') && !details.challanDetails.toLowerCase().includes('no pending');

  const rcValid = isInsuranceValid && isPucValid && isBlacklistClear;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-lg w-full max-w-sm mx-auto animate-slide-up text-left">
      {/* Card Header: RegNo and RC validity status */}
      <div className="bg-slate-50 dark:bg-slate-950/40 px-4 py-3 flex items-center justify-between border-b border-slate-200/40 dark:border-slate-850/40">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚗</span>
          <span className="license-plate text-sm px-2 py-0.5 rounded font-mono font-bold tracking-wider bg-yellow-400 text-slate-900 border border-slate-950">
            {details.regNo}
          </span>
        </div>

        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
          rcValid 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }`}>
          <span>{rcValid ? '✅ RC Valid' : '❌ RC Alert'}</span>
        </div>
      </div>

      {/* Owner & Vehicle Details */}
      <div className="p-4 space-y-2.5 text-xs">
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 pb-3 border-b border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-350">
          <div className="col-span-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Registered Owner</span>
            <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">{details.owner}</span>
          </div>

          <div className="col-span-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Make / Model</span>
            <span className="font-semibold text-slate-800 dark:text-slate-250 mt-0.5 block truncate">
              {details.makerModel} <span className="text-slate-400 font-normal">({details.color})</span>
            </span>
          </div>

          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Fuel Type</span>
            <span className="font-semibold text-slate-800 dark:text-slate-250 mt-0.5 block">{details.fuelType}</span>
          </div>

          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Reg Authority (RTO)</span>
            <span className="font-semibold text-slate-800 dark:text-slate-250 mt-0.5 block truncate" title={details.regAuthority}>
              {details.regAuthority}
            </span>
          </div>
        </div>

        {/* Compliance Indicators */}
        <div className="space-y-2 pt-1 font-sans">
          
          {/* Insurance */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Insurance Expiry:</span>
            <span className={`font-bold flex items-center gap-1 ${isInsuranceValid ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isInsuranceValid ? '✅' : '❌'}
              <span className="text-[10px]">
                {isInsuranceValid ? `Valid till ${details.insuranceUpto}` : `Expired (${details.insuranceUpto})`}
              </span>
            </span>
          </div>

          {/* PUC */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">PUC Validity:</span>
            <span className={`font-bold flex items-center gap-1 ${isPucValid ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPucValid ? '✅' : '❌'}
              <span className="text-[10px]">
                {isPucValid ? `Valid till ${details.pucUpto}` : `Expired (${details.pucUpto})`}
              </span>
            </span>
          </div>

          {/* Challans */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Traffic Challans:</span>
            <span className={`font-bold flex items-center gap-1 ${hasChallans ? 'text-amber-500' : 'text-emerald-500'}`}>
              {hasChallans ? '⚠️' : '✅'}
              <span className="text-[10px]">
                {hasChallans ? details.challanDetails : 'No Pending Challans'}
              </span>
            </span>
          </div>

          {/* Blacklist status */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Blacklist Status:</span>
            <span className={`font-bold flex items-center gap-1 ${isBlacklistClear ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isBlacklistClear ? '✅' : '❌'}
              <span className="text-[10px]">
                {isBlacklistClear ? 'Clear' : details.blacklistStatus}
              </span>
            </span>
          </div>

          {details.financer && details.financer !== 'N/A' && (
            <div className="pt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-800/30">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Hypothecated: {details.financer}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
