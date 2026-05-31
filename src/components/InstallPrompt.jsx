import { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Android/Chrome install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    // Show iOS instructions after 3 seconds
    if (ios && !localStorage.getItem('iosPromptDismissed')) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) localStorage.setItem('iosPromptDismissed', 'true');
  };

  if (!showPrompt || isInstalled) return null;

  return (
    // Bottom sheet popup
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'white', borderRadius: '20px 20px 0 0',
      padding: '24px', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
      animation: 'slideUpPrompt 0.3s ease',
      color: '#0f172a'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <img src="/icon-192.png" style={{ width: 56, height: 56, borderRadius: 12 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Install GU Parking App</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            Fast access · Works offline · No Play Store needed
          </div>
        </div>
      </div>

      {isIOS ? (
        <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 14, fontSize: 13, color: '#475569' }}>
          📱 To install on iPhone:<br/>
          1. Tap the <b>Share button</b> (□↑) in Safari<br/>
          2. Scroll down and tap <b>"Add to Home Screen"</b><br/>
          3. Tap <b>"Add"</b> — done! 🎉
        </div>
      ) : (
        <button onClick={handleInstall} style={{
          width: '100%', padding: '14px', background: '#1a56db',
          color: 'white', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: 'pointer'
        }}>
          📲 Install App — It's Free!
        </button>
      )}

      <button onClick={handleDismiss} style={{
        width: '100%', padding: '10px', background: 'transparent',
        border: 'none', color: '#94a3b8', fontSize: 13,
        cursor: 'pointer', marginTop: 8
      }}>
        Not now
      </button>
    </div>
  );
};

export default InstallPrompt;
