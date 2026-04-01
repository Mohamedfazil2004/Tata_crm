import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS to show specific instructions if browser prompt is unavailable
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(ios && !isStandalone);

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if user has already dismissed it this session
      const dismissed = sessionStorage.getItem('pwa_dismissed');
      if (!dismissed && !isStandalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If app is already installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      console.log('PWA was installed');
    });

    // Special case for DSE Dashboard login: trigger visible immediately if we have prompt
    if (deferredPrompt && !isStandalone) {
        setIsVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        // Fallback for cases where prompt is lost or not yet captured
        if (isIOS) {
             // iOS instruction logic handled in render
             return;
        }
        return;
    };
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  if (!isVisible && !isIOS) return null;
  // If it's iOS and not standalone, we might want to show instructions, but the user asked for "Install" button behavior.
  // Chrome on Android gives the real deferredPrompt.
  
  if (!isVisible) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: 400, textAlign: 'center', padding: '32px 24px' }}>
        <button className="modal-close" onClick={handleDismiss} style={{ position: 'absolute', top: 16, right: 16 }}>
           <X size={20} />
        </button>

        <div style={{ 
            width: 80, height: 80, background: 'var(--tata-blue-50)', 
            borderRadius: 24, display: 'inline-flex', alignItems: 'center', 
            justifyContent: 'center', marginBottom: 20,
            boxShadow: '0 8px 16px rgba(0, 58, 143, 0.1)'
        }}>
           <img src="/icons/icon-192.png" alt="DSE App" style={{ width: 56, height: 56 }} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--grey-900)', marginBottom: 12 }}>
            Install DSE CRM App
        </h3>
        
        <p style={{ color: 'var(--grey-500)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 24 }}>
            Install this application on your device for a faster, app-like experience and direct access to your leads.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isIOS ? (
                <div style={{ background: 'var(--grey-50)', padding: 16, borderRadius: 16, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Share size={16} color="var(--tata-blue)" /> Steps for iOS:
                    </div>
                    <ol style={{ paddingLeft: 20, fontSize: '0.8rem', color: 'var(--grey-600)', margin: 0 }}>
                        <li style={{ marginBottom: 4 }}>Tap the <b>Share</b> button in Safari.</li>
                        <li>Select <b>'Add to Home Screen'</b>.</li>
                    </ol>
                </div>
            ) : (
                <button className="btn btn-primary btn-lg" onClick={handleInstallClick} style={{ width: '100%', borderRadius: 14 }}>
                    <Download size={20} /> Install Now
                </button>
            )}
            
            <button className="btn btn-secondary" onClick={handleDismiss} style={{ border: 'none', color: 'var(--grey-400)' }}>
                Maybe Later
            </button>
        </div>

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--grey-400)', fontWeight: 600 }}>
                <CheckCircle size={14} color="var(--green-500)" /> Faster Load
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--grey-400)', fontWeight: 600 }}>
                <Smartphone size={14} color="var(--green-500)" /> App Icon
            </div>
        </div>
      </div>
    </div>
  );
}
