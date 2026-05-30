import React, { useState, useEffect, useRef } from 'react';
import { parkingApi } from '../api/parkingApi';
import Badge from '../components/Badge';
import VehicleDetailsCard from '../components/VehicleDetailsCard';
import { 
  Camera, 
  RefreshCw, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play, 
  Square,
  Upload,
  LogOut,
  Clock,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Anpr() {
  const [cameraStatus, setCameraStatus] = useState({ online: false, details: 'Initializing...' });
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [detectedPlate, setDetectedPlate] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(null);
  
  // Gate overlay animations
  const [gateState, setGateState] = useState(null); // 'open' | 'reject' | null
  const [allocatedSlot, setAllocatedSlot] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Vahan details and compliance alerts states
  const [vahanDetails, setVahanDetails] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null); // { plate, reason }

  // Manual operators compliance triggers
  const handleApproveEntry = async () => {
    if (!pendingApproval) return;
    const { plate } = pendingApproval;
    setPendingApproval(null);
    setIsScanning(true);
    setOcrProgress('Manual approval granted. Allocating slot...');
    try {
      const entryRes = await parkingApi.autoEntryANPR(plate);
      if (entryRes.success) {
        setGateState('open');
        setAllocatedSlot(entryRes.slot);
        setFeedbackMessage(entryRes.message || 'Auto-entry success.');
        toast.success(`Entry Authorized by Operator! Slot: ${entryRes.slot}`);
      } else {
        setGateState('reject');
        setFeedbackMessage(entryRes.message);
        toast.error(`Auto-Entry Denied: ${entryRes.message}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to register entry.");
    } finally {
      setIsScanning(false);
      setOcrProgress('');
      fetchStatusAndLogs();
    }
  };

  const handleDenyEntry = () => {
    if (!pendingApproval) return;
    setGateState('reject');
    setFeedbackMessage('Entry Denied: Operator rejected compliance alerts.');
    toast.error('Entry Denied by Operator due to compliance failures.');
    setPendingApproval(null);
    fetchStatusAndLogs();
  };

  // Auto scan configuration
  const [isAutoMode, setIsAutoMode] = useState(false);
  const autoScanIntervalRef = useRef(null);

  // Logs list
  const [anprLogs, setAnprLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Webcam elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [usingUploadedFile, setUsingUploadedFile] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Load Status and logs on mount
  const fetchStatusAndLogs = async () => {
    try {
      const statusRes = await parkingApi.getANPRStatus();
      setCameraStatus({
        online: statusRes?.cameraConnected ?? true,
        details: statusRes?.details ?? 'Sandbox Camera Active'
      });

      setIsLogsLoading(true);
      const data = await parkingApi.getRegisteredVehicles({ page: 1, limit: 10 });
      if (data?.recentLogs) {
        setAnprLogs(data.recentLogs);
      }
    } catch (err) {
      console.error("Failed to load ANPR details:", err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();
    startWebcam();

    return () => {
      stopWebcam();
      stopAutoScan();
    };
  }, []);

  // Web camera handlers
  const startWebcam = async () => {
    setUsingUploadedFile(false);
    setPreviewImage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'environment' } 
        });
        setWebcamStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        toast.error("Webcam media streams not supported in this browser. Fallback to image upload testing.");
      }
    } catch (err) {
      console.warn("Could not access system webcam device:", err.message);
      toast.error("Local camera access denied or offline. Upload license plate photos for testing.");
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  };

  // Auto scan timer loops
  const toggleAutoMode = () => {
    const nextAuto = !isAutoMode;
    setIsAutoMode(nextAuto);
    if (nextAuto) {
      toast.success("ANPR Automation Mode activated (every 2.5s)");
      autoScanIntervalRef.current = setInterval(() => {
        captureAndRecognize();
      }, 2500);
    } else {
      stopAutoScan();
    }
  };

  const stopAutoScan = () => {
    setIsAutoMode(false);
    if (autoScanIntervalRef.current) {
      clearInterval(autoScanIntervalRef.current);
      autoScanIntervalRef.current = null;
    }
  };

  // Image Upload handler for local file simulation
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUsingUploadedFile(true);
    stopWebcam();

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
      toast.success("Demo plate image uploaded. Press 'Scan Plate' to test.");
    };
    reader.readAsDataURL(file);
  };

  // Core capture and recognize loop
  const captureAndRecognize = async () => {
    let base64Image = null;

    if (usingUploadedFile && previewImage) {
      base64Image = previewImage;
    } else if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Draw video frame to hidden canvas
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      base64Image = canvas.toDataURL('image/jpeg');
    }

    if (!base64Image) {
      toast.error("No active video feed or uploaded image to scan.");
      stopAutoScan();
      return;
    }

    setIsScanning(true);
    setOcrProgress('Running Tesseract OCR...');
    setOcrConfidence(null);
    setVahanDetails(null);
    setPendingApproval(null);

    try {
      const ocrRes = await parkingApi.recognizeANPR(base64Image);
      if (ocrRes && ocrRes.plate) {
        const plate = ocrRes.plate.toUpperCase().trim();
        setDetectedPlate(plate);
        setOcrConfidence(ocrRes.confidence);
        
        // Fetch Vahan Government RC details
        setOcrProgress('Fetching India Vahan RC details...');
        let vahanData = null;
        try {
          const vahanRes = await parkingApi.getVehicleDetails(plate);
          if (vahanRes?.success && vahanRes?.data) {
            vahanData = vahanRes.data;
            setVahanDetails(vahanData);
          }
        } catch (err) {
          console.warn("Vahan API lookup failed:", err.message);
        }

        // Apply alert enforcement checks
        if (vahanData) {
          // 1. Blacklist check (Hard Block)
          const isBlacklisted = vahanData.blacklistStatus && !vahanData.blacklistStatus.toLowerCase().includes('clear');
          if (isBlacklisted) {
            setGateState('reject');
            setFeedbackMessage(`BLOCKED: Blacklisted Vehicle (${vahanData.blacklistStatus})`);
            toast.error(`❌ AUTO-BLOCK: Stolen/Blacklisted vehicle detected (${vahanData.blacklistStatus})! Gate remains closed.`);
            
            // Record failed ANPR event log internally via fallback or controller
            setIsScanning(false);
            setOcrProgress('');
            fetchStatusAndLogs();
            return;
          }

          // 2. Insurance / PUC validity check (Warning override prompt)
          const isInsuranceExpired = vahanData.insuranceUpto && vahanData.insuranceUpto !== 'N/A' && new Date(vahanData.insuranceUpto) < new Date();
          const isPucExpired = vahanData.pucUpto && vahanData.pucUpto !== 'N/A' && new Date(vahanData.pucUpto) < new Date();

          if (isInsuranceExpired || isPucExpired) {
            stopAutoScan(); // Break the automated capture loop
            setPendingApproval({
              plate,
              reason: isInsuranceExpired && isPucExpired 
                ? 'Expired Insurance & Expired Pollution Certificate (PUC)'
                : isInsuranceExpired 
                  ? 'Expired Vehicle Insurance'
                  : 'Expired Pollution Certificate (PUC)'
            });
            setIsScanning(false);
            setOcrProgress('Compliance Alert: Verification Required.');
            return;
          }

          // 3. Pending Challans check (Notice warning, allow entry)
          const hasChallans = vahanData.challanDetails && !vahanData.challanDetails.toLowerCase().includes('0 pending') && !vahanData.challanDetails.toLowerCase().includes('no pending');
          if (hasChallans) {
            toast.error(`⚠️ Notice: Outstanding traffic challans pending (${vahanData.challanDetails})!`);
          }
        }

        setOcrProgress('Verifying pre-registration whitelist...');
        // Trigger Auto Entry loop
        const entryRes = await parkingApi.autoEntryANPR(plate);
        if (entryRes.success) {
          setGateState('open');
          setAllocatedSlot(entryRes.slot);
          setFeedbackMessage(entryRes.message || 'Auto-entry success.');
          toast.success(`Entry Authorized! Slot: ${entryRes.slot}`);
        } else {
          setGateState('reject');
          setAllocatedSlot('');
          setFeedbackMessage(entryRes.message || 'Access Denied: Vehicle not registered.');
          toast.error(`Auto-Entry Denied: ${entryRes.message || 'Vehicle not registered'}`);
        }
      } else {
        toast.error("OCR process finished but could not identify characters.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "ANPR Recognition process failed.");
    } finally {
      setIsScanning(false);
      setOcrProgress('');
      fetchStatusAndLogs(); // Reload logs feed
      
      // Reset gate animation frames after 4 seconds
      setTimeout(() => {
        setGateState(null);
      }, 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">

      {/* COMPLIANCE WARNING OVERLAY MODAL */}
      {pendingApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-in text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white">Compliance Alerts</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Vahan Verification Warning</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-650 dark:text-slate-400">
                Vehicle plate <span className="font-bold text-slate-900 dark:text-white">{pendingApproval.plate}</span> failed compliance verification:
              </p>
              <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pendingApproval.reason}</span>
              </div>
              <p className="text-[11px] text-slate-450 leading-relaxed">
                As gate controller, please verify documents manually. You can override the warnings to allocate a parking slot, or refuse gate entry.
              </p>
            </div>

            {vahanDetails && (
              <div className="pt-1">
                <VehicleDetailsCard details={vahanDetails} />
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/50 justify-end">
              <button
                type="button"
                onClick={handleDenyEntry}
                className="px-3.5 py-2 bg-rose-650 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl text-xs cursor-pointer transition"
              >
                Deny Entry
              </button>
              <button
                type="button"
                onClick={handleApproveEntry}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs cursor-pointer transition"
              >
                Allow Entry (Override)
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* SUCCESS FLASH OVERLAY */}
      {gateState === 'open' && (
        <div className="absolute inset-0 bg-emerald-500/25 pointer-events-none border-[12px] border-emerald-500 rounded-3xl animate-pulse z-50 flex items-center justify-center">
          <div className="bg-emerald-600/90 text-white px-8 py-5 rounded-2xl shadow-2xl backdrop-blur-sm border border-emerald-400 text-center animate-bounce">
            <CheckCircle className="w-16 h-16 mx-auto mb-2 text-white" />
            <h2 className="text-3xl font-black uppercase tracking-wider">Gate Open</h2>
            <p className="text-sm font-semibold opacity-90 mt-1">Simulated Slot Allocated: {allocatedSlot}</p>
          </div>
        </div>
      )}

      {/* REJECT FLASH OVERLAY */}
      {gateState === 'reject' && (
        <div className="absolute inset-0 bg-rose-500/25 pointer-events-none border-[12px] border-rose-500 rounded-3xl animate-pulse z-50 flex items-center justify-center">
          <div className="bg-rose-600/90 text-white px-8 py-5 rounded-2xl shadow-2xl backdrop-blur-sm border border-rose-400 text-center animate-bounce">
            <XCircle className="w-16 h-16 mx-auto mb-2 text-white" />
            <h2 className="text-3xl font-black uppercase tracking-wider">Access Denied</h2>
            <p className="text-sm font-semibold opacity-90 mt-1">{feedbackMessage}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Automatic Number Plate Recognition (ANPR)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gate camera OCR scanner for automated checks and ticketless parking.
          </p>
        </div>
        
        {/* Camera Connection Badge */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
            cameraStatus.online 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30' 
              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${cameraStatus.online ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span>Gate Camera: {cameraStatus.online ? 'Online' : 'Offline'}</span>
          </div>

          <button
            onClick={fetchStatusAndLogs}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition"
            title="Refresh logs & status"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Camera Feed */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-500" />
              <span>Gate Entrance Video Feed</span>
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={startWebcam}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  !usingUploadedFile ? 'bg-primary-500 text-white border-transparent' : 'border-slate-200 text-slate-500 dark:border-slate-800'
                }`}
              >
                Webcam Live
              </button>
              <label className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition ${
                usingUploadedFile ? 'bg-primary-500 text-white border-transparent' : 'border-slate-200 text-slate-500 dark:border-slate-800'
              }`}>
                <Upload className="w-3 h-3 inline mr-1" />
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          {/* Viewfinder box */}
          <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
            
            {usingUploadedFile && previewImage ? (
              <img src={previewImage} alt="Simulated Plate" className="w-full h-full object-contain" />
            ) : webcamStream ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover scale-x-[-1]" 
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6 text-slate-500 animate-pulse" />
                </div>
                <p className="text-xs text-slate-500 font-medium">Camera media stream offline</p>
                <p className="text-[10px] text-slate-600 max-w-[320px]">Permit browser camera access or upload an image file of a vehicle license plate for sandboxed OCR validation.</p>
              </div>
            )}

            {/* Laser scanning beam overlay */}
            {(isScanning || isAutoMode) && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="animate-scan"></div>
                <div className="absolute inset-0 border-2 border-primary-500/25 bg-primary-500/5"></div>
              </div>
            )}

            {/* Canvas helper for frames extraction */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Trigger Scan Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
              <button
                onClick={captureAndRecognize}
                disabled={isScanning}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-750 active:bg-primary-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-md shadow-primary-500/10 transition flex items-center gap-2 cursor-pointer"
              >
                <Cpu className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Processing OCR...' : 'Scan Plate'}
              </button>

              <button
                onClick={toggleAutoMode}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition flex items-center gap-2 cursor-pointer ${
                  isAutoMode 
                    ? 'bg-rose-500 text-white border-transparent hover:bg-rose-600' 
                    : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                {isAutoMode ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-white" />
                    Stop Auto
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-700 dark:fill-slate-300" />
                    Auto Gate Loop
                  </>
                )}
              </button>
            </div>

            {/* Progress details */}
            {ocrProgress && (
              <div className="text-xs text-primary-500 font-semibold font-mono animate-pulse">
                ⚙️ {ocrProgress}
              </div>
            )}
          </div>

        </div>

        {/* OCR Result Terminal */}
        <div className="space-y-6">
          
          <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between h-full">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">OCR Gate Reader Output</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Plate recognition diagnostics logs</p>
            </div>

            <div className="space-y-6 text-center py-6 flex flex-col items-center justify-center">
              
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Detected License Plate</p>
              
              {/* License Plate Style */}
              <div className="license-plate text-3xl px-6 py-2.5 border-4 my-2 font-mono font-black bg-yellow-400 border-slate-950 text-slate-950 shadow-md tracking-wider">
                {detectedPlate || 'NO SCAN'}
              </div>

              {ocrConfidence !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-36 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        ocrConfidence > 85 ? 'bg-emerald-500' : ocrConfidence > 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} 
                      style={{ width: `${ocrConfidence}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{ocrConfidence}% Match</span>
                </div>
              )}
            </div>

            {/* Real Vehicle RC Status Panel */}
            {vahanDetails && (
              <div className="mt-2 mb-4 px-4 w-full">
                <VehicleDetailsCard details={vahanDetails} />
              </div>
            )}

            {/* Diagnostic Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-2 mt-4 text-slate-650 dark:text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-400">OCR Module:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-250">Tesseract.js</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Engine Type:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-250">English LSTM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Decision Path:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-250">Auto Whitelist</span>
              </div>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1">
                <span className="text-slate-400">Gate Controller Alert:</span>
                <span className={`font-bold flex items-center gap-1.5 ${
                  gateState === 'open' ? 'text-emerald-500' : gateState === 'reject' ? 'text-rose-500' : 'text-slate-400'
                }`}>
                  {gateState === 'open' && (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      AUTHORIZED SLOT {allocatedSlot}
                    </>
                  )}
                  {gateState === 'reject' && (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      REJECTED: UNREGISTERED
                    </>
                  )}
                  {!gateState && 'GATE LOOP WAITING'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ANPR Audit Logs Feed */}
      <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">ANPR Capture Event Logs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recent plate scanner decisions history</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Scan Time</th>
                <th className="pb-3">License Plate</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3">Verdict</th>
                <th className="pb-3">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLogsLoading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400 mx-auto"></div>
                  </td>
                </tr>
              ) : anprLogs && anprLogs.length > 0 ? (
                anprLogs.map((log) => (
                  <tr key={log.id || log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 font-mono text-xs text-slate-400 dark:text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="license-plate-small">{log.plate}</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-650 dark:text-slate-350">
                      {log.confidence}%
                    </td>
                    <td className="py-3">
                      {log.result === 'success' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 text-[10px] font-bold uppercase">
                          Auto-Entry
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-[10px] font-bold uppercase">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-450 text-xs font-semibold">
                      {log.message}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-450">
                    No license plates scanned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
