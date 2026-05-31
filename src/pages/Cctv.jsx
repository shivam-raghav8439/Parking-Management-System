import React, { useState, useEffect, useRef } from 'react';

const CAMERA_FEEDS = [
  { id: 'cam1', label: 'Gate A — Main Entry', zone: 'A', status: 'online' },
  { id: 'cam2', label: 'Zone B — Bike Section', zone: 'B', status: 'online' },
  { id: 'cam3', label: 'Zone C — Faculty Lot', zone: 'C', status: 'online' },
  { id: 'cam4', label: 'Zone D — Visitor Parking', zone: 'D', status: 'offline' },
  { id: 'cam5', label: 'Exit Gate — South', zone: 'EXIT', status: 'online' },
  { id: 'cam6', label: 'Overflow Lot — East', zone: 'E', status: 'online' },
];

const scanlines = `
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes blink-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes flicker {
    0%, 100% { opacity: 1; } 8% { opacity: 0.92; }
    15% { opacity: 0.97; } 30% { opacity: 1; }
    50% { opacity: 0.95; } 70% { opacity: 1; }
    88% { opacity: 0.93; } 95% { opacity: 1; }
  }
`;

function CctvFeed({ cam, selected, onClick }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Draw animated "camera feed" on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const colors = {
      A: '#1a56db', B: '#059669', C: '#7c3aed', D: '#dc2626', EXIT: '#d97706', E: '#0891b2'
    };
    const zoneColor = colors[cam.zone] || '#334155';

    const draw = () => {
      if (!canvas) return;
      ctx.fillStyle = cam.status === 'offline' ? '#111' : '#0a0f1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (cam.status === 'offline') {
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ OFFLINE', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#475569';
        ctx.fillText('No signal detected', canvas.width / 2, canvas.height / 2 + 14);
        return;
      }

      // Simulated "parking lot" grid
      ctx.strokeStyle = `${zoneColor}22`;
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Parking slot rectangles
      const slots = [
        [10, 20, 40, 60], [60, 20, 40, 60], [110, 20, 40, 60],
        [10, 100, 40, 60], [60, 100, 40, 60], [110, 100, 40, 60],
        [160, 20, 40, 60], [160, 100, 40, 60],
      ];
      slots.forEach(([x, y, w, h], i) => {
        const occupied = (i + frame) % 3 === 0;
        ctx.fillStyle = occupied ? `${zoneColor}55` : '#1e293b';
        ctx.strokeStyle = zoneColor;
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        if (occupied) {
          ctx.fillStyle = zoneColor;
          ctx.font = '9px monospace';
          ctx.fillText('●', x + w / 2 - 4, y + h / 2 + 4);
        }
      });

      // Moving vehicle dot
      const vx = (frame * 2) % (canvas.width + 20) - 10;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(vx, canvas.height - 20, 4, 0, Math.PI * 2);
      ctx.fill();

      // Timestamp overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(4, canvas.height - 22, 130, 18);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      const now = new Date();
      ctx.fillText(`${now.toLocaleTimeString()} · REC`, 8, canvas.height - 9);

      // Zone label
      ctx.fillStyle = zoneColor;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`ZONE ${cam.zone}`, canvas.width - 6, 14);

      frame++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [cam]);

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: `2px solid ${selected ? '#1a56db' : '#1e293b'}`,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        background: '#0a0f1a',
        transition: 'border-color 0.2s',
        boxShadow: selected ? '0 0 16px rgba(26,86,219,0.4)' : 'none'
      }}
    >
      <canvas ref={canvasRef} width={220} height={165} style={{ display: 'block', width: '100%' }} />

      {/* Camera label bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.8)', padding: '6px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ color: '#e2e8f0', fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
          {cam.label}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase',
          color: cam.status === 'online' ? '#4ade80' : '#f87171',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: cam.status === 'online' ? '#4ade80' : '#f87171',
            animation: cam.status === 'online' ? 'blink-dot 1.5s infinite' : 'none'
          }} />
          {cam.status === 'online' ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}

export default function Cctv() {
  const [selectedCam, setSelectedCam] = useState(CAMERA_FEEDS[0].id);
  const mainCanvasRef = useRef(null);
  const mainAnimRef = useRef(null);
  const frame = useRef(0);

  const cam = CAMERA_FEEDS.find(c => c.id === selectedCam);

  // Main camera canvas
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const colors = {
      A: '#1a56db', B: '#059669', C: '#7c3aed', D: '#dc2626', EXIT: '#d97706', E: '#0891b2'
    };
    const zoneColor = colors[cam.zone] || '#334155';

    const draw = () => {
      if (!canvas) return;
      ctx.fillStyle = cam.status === 'offline' ? '#0a0a0a' : '#050a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (cam.status === 'offline') {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ SIGNAL LOST', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '15px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Camera feed unavailable', canvas.width / 2, canvas.height / 2 + 20);
        mainAnimRef.current = requestAnimationFrame(draw);
        return;
      }

      // Grid
      ctx.strokeStyle = `${zoneColor}18`;
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Slot rectangles — larger for main view
      const slots = [
        [30, 40, 80, 120], [130, 40, 80, 120], [230, 40, 80, 120], [330, 40, 80, 120],
        [30, 200, 80, 120], [130, 200, 80, 120], [230, 200, 80, 120], [330, 200, 80, 120],
        [440, 60, 80, 120], [440, 210, 80, 120],
      ];
      slots.forEach(([x, y, w, h], i) => {
        const occupied = (i + Math.floor(frame.current / 60)) % 3 === 0;
        ctx.fillStyle = occupied ? `${zoneColor}40` : '#0f172a';
        ctx.strokeStyle = occupied ? zoneColor : `${zoneColor}50`;
        ctx.lineWidth = occupied ? 2 : 1;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        if (occupied) {
          // Car silhouette
          ctx.fillStyle = `${zoneColor}bb`;
          ctx.fillRect(x + 10, y + 20, w - 20, h - 40);
          ctx.fillStyle = zoneColor;
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('OCCUPIED', x + w / 2, y + h - 12);
        } else {
          ctx.fillStyle = '#334155';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('VACANT', x + w / 2, y + h / 2 + 4);
        }
      });

      // Road / aisle down middle
      ctx.fillStyle = '#0c1524';
      ctx.fillRect(0, 170, canvas.width, 30);
      ctx.strokeStyle = `${zoneColor}40`;
      ctx.setLineDash([20, 15]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 185); ctx.lineTo(canvas.width, 185); ctx.stroke();
      ctx.setLineDash([]);

      // Moving vehicle on road
      const vx = (frame.current * 1.5) % (canvas.width + 80) - 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(vx, 174, 36, 22);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(vx + 4, 177, 28, 14);

      // Main feed timestamp
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, canvas.height - 30, 220, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`⏺  REC  ${new Date().toLocaleTimeString()}`, 12, canvas.height - 10);

      // Zone tag top right
      ctx.fillStyle = zoneColor;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`ZONE ${cam.zone}`, canvas.width - 12, 22);

      // CAM ID
      ctx.fillStyle = '#475569';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cam.label, 10, 18);

      frame.current++;
      mainAnimRef.current = requestAnimationFrame(draw);
    };

    mainAnimRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(mainAnimRef.current);
  }, [cam]);

  const onlineCount = CAMERA_FEEDS.filter(c => c.status === 'online').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{scanlines}</style>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            🎥 CCTV Surveillance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live feeds from all parking zones — real-time monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500" style={{ animation: 'blink-dot 1.5s infinite' }} />
            {onlineCount} / {CAMERA_FEEDS.length} Cameras Live
          </span>
        </div>
      </div>

      {/* Main feed + thumbnail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Feed */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl relative">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🎥</span>
              <span className="text-sm font-bold text-white">{cam.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" style={{ animation: 'blink-dot 1s infinite' }} />
              <span className="text-xs text-red-400 font-bold font-mono">LIVE</span>
            </div>
          </div>
          <canvas
            ref={mainCanvasRef}
            width={640}
            height={400}
            style={{
              display: 'block',
              width: '100%',
              background: '#050a14',
              animation: cam.status === 'online' ? 'flicker 8s infinite' : 'none'
            }}
          />
        </div>

        {/* Thumbnail Grid */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Cameras</p>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {CAMERA_FEEDS.map(c => (
              <CctvFeed
                key={c.id}
                cam={c}
                selected={selectedCam === c.id}
                onClick={() => setSelectedCam(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 uppercase tracking-wider">Camera Status Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 text-left">Camera ID</th>
                <th className="pb-3 text-left">Location</th>
                <th className="pb-3 text-left">Zone</th>
                <th className="pb-3 text-left">Status</th>
                <th className="pb-3 text-left">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {CAMERA_FEEDS.map(c => (
                <tr
                  key={c.id}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selectedCam === c.id ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                  onClick={() => setSelectedCam(c.id)}
                >
                  <td className="py-3 font-mono text-xs text-slate-400">{c.id.toUpperCase()}</td>
                  <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">{c.label}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Zone {c.zone}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${c.status === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ animation: c.status === 'online' ? 'blink-dot 1.5s infinite' : 'none' }} />
                      {c.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-slate-400 font-mono">{c.status === 'online' ? '1080p · 30fps' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
