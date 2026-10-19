// EDSTAQ Settings Tab
// Student Registration Profile, 1-4-7 Spaced Repetition Reminders, and Mobile App Installation

import React, { useState, useEffect } from 'react';
import {
  Bell,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Smartphone,
  Download
} from 'lucide-react';
import {
  saveStudentSettings,
  getLocalSettings
} from '../services/apiService';

export default function Settings({
  student,
  activityLogs = [],
  onSettingsUpdated,
  onOpenInstallModal
}) {
  // Reminder settings state
  const [reminderTime, setReminderTime] = useState('19:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderSavedToast, setReminderSavedToast] = useState(false);
  const [testAlertToast, setTestAlertToast] = useState(null);

  useEffect(() => {
    if (student?.studentId) {
      const local = getLocalSettings(student.studentId);
      setReminderTime(local.preferredReminderTime || '19:00');
      setNotificationsEnabled(local.notificationsEnabled !== false);
    }
  }, [student]);

  // Handle Save 1-4-7 Preferences
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    await saveStudentSettings({
      studentId: student?.studentId,
      preferredReminderTime: reminderTime,
      notificationsEnabled
    });
    setReminderSavedToast(true);
    if (onSettingsUpdated) {
      onSettingsUpdated({ preferredReminderTime: reminderTime, notificationsEnabled });
    }
    setTimeout(() => setReminderSavedToast(false), 3000);
  };

  // Mobile in-app preview notification state
  const [mobilePreviewNotif, setMobilePreviewNotif] = useState(null);

  // Soft audio chime for notification feedback
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Handle Send Test Notification (supports 'desktop' and 'mobile')
  const handleSendTestNotification = async (mode = 'desktop') => {
    const studentName = student?.studentName || 'Student';
    const notifTitle = 'EDSTAQ Revision Reminder';
    const notifBody = `Hello ${studentName}! Your scheduled revision alert is active for ${reminderTime}.`;
    const iconUrl = `${import.meta.env.BASE_URL}edstaq-logo.png`;

    // 1. Play chime sound
    playNotificationChime();

    // 2. Trigger device vibration (Android & mobile phones)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    // 3. For mobile test mode, show realistic iOS/Android heads-up push preview banner
    if (mode === 'mobile') {
      setMobilePreviewNotif({
        title: notifTitle,
        body: notifBody,
        time: 'Just now'
      });
      setTimeout(() => setMobilePreviewNotif(null), 6000);
    }

    // 4. Dispatch native system notification (ServiceWorker showNotification or Web Notification)
    let systemNotifSuccess = false;

    // A. ServiceWorker registration (Standard for Android Chrome & iOS PWA)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.showNotification === 'function') {
          let perm = typeof Notification !== 'undefined' ? Notification.permission : 'default';
          if (perm !== 'granted' && perm !== 'denied' && typeof Notification !== 'undefined') {
            perm = await Notification.requestPermission();
          }
          if (perm === 'granted') {
            await reg.showNotification(notifTitle, {
              body: notifBody,
              icon: iconUrl,
              badge: iconUrl,
              tag: 'edstaq-test-alert',
              renotify: true,
              vibrate: [200, 100, 200]
            });
            systemNotifSuccess = true;
          }
        }
      } catch (swErr) {
        console.warn('ServiceWorker showNotification skipped:', swErr);
      }
    }

    // B. Standard Web Notification constructor fallback
    if (!systemNotifSuccess && typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        try {
          new Notification(notifTitle, {
            body: notifBody,
            icon: iconUrl
          });
          systemNotifSuccess = true;
        } catch (e) {
          console.warn('Standard Notification constructor failed:', e);
        }
      } else if (Notification.permission !== 'denied') {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification(notifTitle, {
              body: notifBody,
              icon: iconUrl
            });
            systemNotifSuccess = true;
          }
        } catch (e) {}
      }
    }

    // 5. Update App Icon Badge ('1') on Home Screen & Taskbar
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      navigator.setAppBadge(1).catch(() => {});
    }

    // Toast Feedback
    if (mode === 'mobile') {
      setTestAlertToast({
        type: 'success',
        message: systemNotifSuccess
          ? "Mobile push alert sent to your device with vibration! App icon badge set to '1'."
          : "Mobile alert banner shown on screen! App icon badge set to '1'. (On iPhone, tap Share > Add to Home Screen for background alerts)."
      });
    } else {
      if (systemNotifSuccess) {
        setTestAlertToast({
          type: 'success',
          message: "Browser desktop notification triggered! App icon badge set to '1'."
        });
      } else {
        setTestAlertToast({
          type: 'error',
          message: 'Notification permission is blocked. Please enable notifications in site settings.'
        });
      }
    }
    setTimeout(() => setTestAlertToast(null), 4500);
  };

  const handleClearBadge = () => {
    if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
    setTestAlertToast({
      type: 'success',
      message: 'App icon badge cleared from home screen / taskbar.'
    });
    setTimeout(() => setTestAlertToast(null), 3000);
  };

  return (
    <div className="settings-page" id="settings-main-view">
      <div className="section-header-block">
        <div>
          <h1 className="section-title" id="settings-page-title">
            System & Revision Preferences
          </h1>
          <span className="section-subtitle">
            View student registration credentials and configure automated revision reminders
          </span>
        </div>
      </div>

      <div className="settings-stack">
        {/* 1. STUDENT PROFILE REGISTRATION DETAILS (MOVED TO TOP, EDUCATIONAL BOARD REMOVED) */}
        <section className="settings-card" id="settings-card-profile">
          <div className="settings-card-header">
            <User size={20} color="var(--brand-navy)" />
            <div>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                Student Registration Profile
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official registration credentials from the Student Register (Read-only)
              </span>
            </div>
          </div>

          <div className="profile-spec-grid">
            <div className="profile-field">
              <span className="profile-field-label">Student ID</span>
              <span className="profile-field-val" style={{ color: 'var(--brand-navy)' }}>
                {student?.studentId || 'STD101'}
              </span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Full Name</span>
              <span className="profile-field-val">{student?.studentName || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Contact</span>
              <span className="profile-field-val">{student?.contact || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Email</span>
              <span className="profile-field-val">{student?.email || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Date of Birth</span>
              <span className="profile-field-val">{student?.dob || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Address</span>
              <span className="profile-field-val">{student?.address || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Guardian Name</span>
              <span className="profile-field-val">{student?.guardianName || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Relation</span>
              <span className="profile-field-val">{student?.guardianRelation || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Guardian Contact</span>
              <span className="profile-field-val">{student?.guardianContact || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Registered Class</span>
              <span className="profile-field-val">{student?.registeredClass || '-'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Enrollment Date</span>
              <span className="profile-field-val">{student?.date || '-'}</span>
            </div>
          </div>
        </section>

        {/* 2. REVISION REMINDERS SECTION */}
        <section className="settings-card" id="settings-card-reminders">
          <div className="settings-card-header">
            <Bell size={20} color="var(--brand-navy)" />
            <div>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                Automated Revision Reminders
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Set your daily revision study window and automated alert permissions
              </span>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="settings-input-group" style={{ maxWidth: '320px' }}>
              <label htmlFor="input-reminder-time" className="settings-label">
                Preferred Daily Reminder Time
              </label>
              <input
                type="time"
                id="input-reminder-time"
                className="settings-input"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                EDSTAQ prompts automated reminders for scheduled class revisions and topic reviews.
              </span>
            </div>

            <label className="settings-checkbox-row" htmlFor="checkbox-enable-notifications">
              <input
                type="checkbox"
                id="checkbox-enable-notifications"
                className="settings-checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                Enable browser alerts and reminder notifications
              </span>
            </label>

            {reminderSavedToast && (
              <div
                style={{
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle2 size={16} /> Revision preferences saved successfully!
              </div>
            )}

            {testAlertToast && (
              <div
                style={{
                  background: testAlertToast.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: testAlertToast.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${testAlertToast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {testAlertToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {testAlertToast.message}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn-card-primary"
                id="btn-save-revision-settings"
              >
                <Save size={15} /> Save Revision Preferences
              </button>

              <button
                type="button"
                className="btn-card-secondary"
                id="btn-send-test-alert-mobile"
                onClick={() => handleSendTestNotification('mobile')}
                style={{
                  background: 'var(--brand-blue-subtle)',
                  borderColor: 'rgba(0, 23, 137, 0.25)',
                  color: 'var(--brand-navy)',
                  fontWeight: 700
                }}
              >
                <Smartphone size={15} /> Test Mobile Alert (iPhone & Android)
              </button>

              <button
                type="button"
                className="btn-card-secondary"
                id="btn-send-test-alert"
                onClick={() => handleSendTestNotification('desktop')}
              >
                <Send size={15} /> Test Browser Alert
              </button>

              <button
                type="button"
                className="btn-card-secondary"
                id="btn-clear-app-badge"
                onClick={handleClearBadge}
                title="Clear the red '1' badge from the app icon"
              >
                <CheckCircle2 size={15} /> Clear App Badge
              </button>
            </div>
          </form>
        </section>

        {/* 3. MOBILE APP & HOME SCREEN SHORTCUT SECTION (MOVED TO BOTTOM) */}
        <section className="settings-card" id="settings-card-mobile-app" style={{ borderLeft: '4px solid var(--brand-blue-accent)' }}>
          <div className="settings-card-header">
            <Smartphone size={20} color="var(--brand-navy)" />
            <div>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                Mobile App & Home Screen Shortcut
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Install EDSTAQ as a standalone mobile application for quick access
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img
                src="/pwa-icon-192.png"
                alt="EDSTAQ App"
                style={{ width: '48px', height: '48px', borderRadius: '12px', border: '1px solid var(--border-card)' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  EDSTAQ Student Portal
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Fast access from Android or iPhone home screen with offline support
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-card-primary"
              id="btn-settings-install-app"
              onClick={onOpenInstallModal}
            >
              <Download size={15} /> Install / Convert into App
            </button>
          </div>
        </section>
      </div>

      {/* Mobile Heads-Up Notification Banner Preview */}
      {mobilePreviewNotif && (
        <div
          className="mobile-headsup-banner"
          id="mobile-headsup-banner"
          onClick={() => setMobilePreviewNotif(null)}
          role="alert"
          aria-live="assertive"
        >
          <div className="mobile-headsup-inner">
            <img
              src={`${import.meta.env.BASE_URL}edstaq-logo.png`}
              alt="EDSTAQ"
              className="mobile-headsup-icon"
            />
            <div className="mobile-headsup-content">
              <div className="mobile-headsup-header">
                <span className="mobile-headsup-appname">EDSTAQ STUDENT PORTAL</span>
                <span className="mobile-headsup-time">{mobilePreviewNotif.time}</span>
              </div>
              <div className="mobile-headsup-title">{mobilePreviewNotif.title}</div>
              <div className="mobile-headsup-body">{mobilePreviewNotif.body}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
