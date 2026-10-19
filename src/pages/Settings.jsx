// EDSTAQ Settings Tab
// Student Registration Profile, 1-4-7 Spaced Repetition Reminders, and Mobile App Installation

import React, { useState, useEffect } from 'react';
import {
  Bell,
  User,
  CheckCircle2,
  Save,
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn-card-primary"
                id="btn-save-revision-settings"
              >
                <Save size={15} /> Save Revision Preferences
              </button>
            </div>
          </form>
        </section>

        {/* 3. MOBILE APP & HOME SCREEN SHORTCUT SECTION */}
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
    </div>
  );
}
