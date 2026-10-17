// EDSTAQ Mobile App Installation & Home Screen Shortcut Component
// Handles one-click PWA prompt for Android/Chrome + visual guided setup for iOS Safari

import React, { useState, useEffect } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  CheckCircle,
  Smartphone,
  X,
  ArrowDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function InstallAppModal({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess
}) {
  const [platform, setPlatform] = useState('android'); // 'android' | 'ios' | 'desktop'
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone/installed mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  if (!isOpen) return null;

  // Trigger native browser install prompt for Android/Chrome/Edge
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (onInstallSuccess) onInstallSuccess();
          onClose();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else {
      // If deferredPrompt is unavailable (already triggered or not yet fired)
      alert(
        'To install EDSTAQ:\n1. Tap the three dots (⋮) in your browser menu.\n2. Tap "Install app" or "Add to Home screen".'
      );
    }
  };

  return (
    <div className="modal-overlay" id="install-app-modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        id="install-app-modal-card"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-blue-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                Install EDSTAQ Mobile App
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                One-tap home screen shortcut for students and parents
              </span>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            id="btn-close-install-modal"
            onClick={onClose}
            aria-label="Close install modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: '1.25rem' }}>
          {isStandalone ? (
            <div
              style={{
                background: 'var(--accent-emerald-subtle)',
                border: '1px solid #a7f3d0',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <CheckCircle size={40} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem', color: '#065f46', margin: 0 }}>
                Already Installed!
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#047857' }}>
                You are currently using the installed EDSTAQ App. You can access it anytime directly from your phone's home screen.
              </p>
            </div>
          ) : (
            <>
              {/* App Preview Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)'
                }}
              >
                <img
                  src="/pwa-icon-192.png"
                  alt="EDSTAQ App Icon"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    boxShadow: '0 4px 12px rgba(0, 23, 137, 0.15)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--brand-navy)' }}>
                      EDSTAQ
                    </span>
                    <span
                      style={{
                        background: '#ecfdf5',
                        color: '#047857',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px'
                      }}
                    >
                      Official Web App
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Daily Classes • Revision Alerts • Progress Reports
                  </div>
                </div>
              </div>

              {/* Android / Chrome One-Tap Install */}
              {platform === 'android' || deferredPrompt ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div
                    style={{
                      background: 'var(--brand-blue-subtle)',
                      border: '1px solid var(--brand-blue-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      fontSize: '0.86rem',
                      color: 'var(--brand-navy)',
                      lineHeight: 1.5
                    }}
                  >
                    🚀 <strong>Instant One-Tap Install:</strong> Click the button below to add EDSTAQ to your Android home screen just like a Play Store app. No manual setup needed!
                  </div>

                  <button
                    type="button"
                    className="btn-card-primary"
                    id="btn-pwa-one-tap-install"
                    style={{
                      padding: '0.85rem 1.5rem',
                      fontSize: '1rem',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 6px 20px rgba(0, 23, 137, 0.25)'
                    }}
                    onClick={handleNativeInstall}
                  >
                    <Download size={18} /> Install App on Phone
                  </button>
                </div>
              ) : null}

              {/* iOS Safari Guided Steps */}
              {platform === 'ios' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    background: '#fffdf7',
                    border: '1px solid #fef3c7',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}
                  id="ios-install-guide"
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                    📱 iPhone / iPad Safari Setup (3 Simple Steps):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.86rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#fef3c7',
                          color: '#b45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        1
                      </div>
                      <div>
                        Tap the <strong>Share</strong> button <Share size={15} style={{ verticalAlign: 'middle', color: '#0284c7' }} /> at the bottom of your Safari screen.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#fef3c7',
                          color: '#b45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        2
                      </div>
                      <div>
                        Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={15} style={{ verticalAlign: 'middle', color: '#10b981' }} />.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#fef3c7',
                          color: '#b45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        3
                      </div>
                      <div>
                        Tap <strong>"Add"</strong> in the top-right corner. Done!
                      </div>
                    </div>
                  </div>

                  {/* Pulsing visual reminder */}
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '0.5rem',
                      color: '#b45309',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <ArrowDown size={14} className="pulse-arrow" /> Safari Share button is at the bottom of your screen
                  </div>
                </div>
              )}

              {/* Desktop / Laptop Guide */}
              {platform === 'desktop' && !deferredPrompt && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    fontSize: '0.86rem',
                    color: 'var(--text-body)',
                    lineHeight: 1.5
                  }}
                >
                  <p>
                    <strong>Using Chrome or Edge on Computer?</strong><br />
                    Click the <strong>Install</strong> icon in your browser URL address bar (top right) to install EDSTAQ as a standalone desktop app.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-card-secondary"
            id="btn-dismiss-install-modal"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
