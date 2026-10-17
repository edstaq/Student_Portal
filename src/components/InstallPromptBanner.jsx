// EDSTAQ Smart Mobile Install Banner
// Floating prompt on mobile browsers guiding parents & students to install with 1 tap

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';

export default function InstallPromptBanner({ onOpenInstallModal, onTriggerNativeInstall, hasNativePrompt }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already in standalone app mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // Check if user previously dismissed banner in this session
    const dismissed = sessionStorage.getItem('EDSTAQ_INSTALL_BANNER_DISMISSED');
    if (!dismissed) {
      // Show after a gentle 1.5 second delay so page content renders smoothly first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('EDSTAQ_INSTALL_BANNER_DISMISSED', 'true');
  };

  const handleClickBanner = () => {
    if (hasNativePrompt && onTriggerNativeInstall) {
      onTriggerNativeInstall();
    } else {
      onOpenInstallModal();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="mobile-install-banner"
      id="mobile-install-banner"
      onClick={handleClickBanner}
      role="banner"
      aria-label="Install EDSTAQ App on Phone"
    >
      <div className="banner-left-content">
        <img
          src={`${import.meta.env.BASE_URL}pwa-icon-192.png`}
          alt="EDSTAQ App"
          className="install-banner-app-icon"
        />
        <div className="install-banner-text">
          <div className="banner-top-tag">
            <Sparkles size={12} color="#f59e0b" /> Easy Access
          </div>
          <span className="banner-headline">Add EDSTAQ to your Home Screen</span>
          <span className="banner-subtext">Open daily classes & notes in 1 tap</span>
        </div>
      </div>

      <div className="banner-right-actions">
        <button
          type="button"
          className="btn-install-banner-cta"
          id="btn-install-banner-cta"
          onClick={(e) => {
            e.stopPropagation();
            handleClickBanner();
          }}
        >
          <Download size={14} /> Install
        </button>

        <button
          type="button"
          className="btn-close-banner"
          id="btn-close-install-banner"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
