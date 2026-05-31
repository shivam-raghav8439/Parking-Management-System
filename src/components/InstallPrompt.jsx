import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [prompt, setPrompt]     = useState(null);
  const [show, setShow]         = useState(false);
  const [isIOS, setIsIOS]       = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true); return;
    }
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);
    if (ios && !localStorage.getItem('iosPromptDismissed')) {
      setTimeout(() => setShow(true), 4000);
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setShow(true), 4000);
    });
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setInstalled(true); setShow(false); }
  };

  if (!show || installed) return null;

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
      background:'white', borderRadius:'20px 20px 0 0',
      padding:24, boxShadow:'0 -8px 32px rgba(0,0,0,0.2)',
      animation:'slideUp 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
        <div style={{ width:52, height:52, borderRadius:12,
          background:'linear-gradient(135deg,#1a56db,#06b6d4)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🅿️</div>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Install GU Parking App</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Fast access · Works offline · No Play Store needed</div>
        </div>
      </div>
      {isIOS ? (
        <div style={{ background:'#f1f5f9', borderRadius:10, padding:14, fontSize:13, color:'#475569', lineHeight:1.8 }}>
          📱 Install on iPhone:<br/>
          1. Tap <b>Share (□↑)</b> in Safari<br/>
          2. Tap <b>"Add to Home Screen"</b><br/>
          3. Tap <b>"Add"</b> ✅
        </div>
      ) : (
        <button onClick={install} style={{ width:'100%', padding:14,
          background:'linear-gradient(135deg,#1a56db,#06b6d4)',
          color:'white', border:'none', borderRadius:12,
          fontSize:15, fontWeight:700, cursor:'pointer' }}>
          📲 Install App — Free!
        </button>
      )}
      <button onClick={() => { setShow(false); if(isIOS) localStorage.setItem('iosPromptDismissed','true'); }}
        style={{ width:'100%', padding:10, background:'transparent',
          border:'none', color:'#94a3b8', fontSize:13, cursor:'pointer', marginTop:8 }}>
        Not now
      </button>
      <style>{`@keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
    </div>
  );
}
