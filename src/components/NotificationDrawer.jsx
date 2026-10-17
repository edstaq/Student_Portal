// EDSTAQ Notification Drawer
// Displays automated revision alerts, scheduled sessions, and clearable past notifications

import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, CheckCircle, ChevronRight, ArrowRight, Trash2 } from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  revisions = [],
  clearedIds: propClearedIds,
  readIds = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearPastNotifications: propClearHandler,
  reminderTime = '19:00',
  onSelectRevision,
  onGoToSettings,
  studentId = ''
}) {
  const storageKey = `edstaq_cleared_notifs_${studentId || 'default'}`;

  // Track cleared notification IDs with support for parent-managed state
  const [internalClearedIds, setInternalClearedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const clearedIds = propClearedIds !== undefined ? propClearedIds : internalClearedIds;

  // Re-sync internal cleared IDs when student changes (fallback mode)
  useEffect(() => {
    if (propClearedIds === undefined) {
      try {
        const saved = localStorage.getItem(storageKey);
        setInternalClearedIds(saved ? JSON.parse(saved) : []);
      } catch {
        setInternalClearedIds([]);
      }
    }
  }, [storageKey, propClearedIds]);

  if (!isOpen) return null;

  // Filter out any cleared items
  const visibleRevisions = revisions.filter((r) => !clearedIds.includes(r.id));
  const unreadCount = visibleRevisions.filter((r) => !readIds.includes(r.id)).length;

  // Categorize
  const dueTodayList = visibleRevisions.filter((r) => r.isDueToday);
  const upcomingList = visibleRevisions.filter((r) => !r.isDueToday && !r.isOverdue);
  const pastList = visibleRevisions.filter((r) => !r.isDueToday && r.isOverdue);

  // Clear all past / overdue notifications (NEVER clears today or upcoming)
  const handleClearPastNotifications = () => {
    if (propClearHandler) {
      propClearHandler();
      return;
    }
    const pastIds = pastList.map((r) => r.id);
    const updated = Array.from(new Set([...clearedIds, ...pastIds]));
    setInternalClearedIds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save cleared notifications:', e);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" id="notif-drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className="notification-drawer" id="notification-drawer" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <div className="drawer-title-row">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--brand-blue-subtle)',
                color: 'var(--brand-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                Revision Alerts
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {dueTodayList.length} Due Today • {unreadCount > 0 ? `${unreadCount} Unread • ` : ''}{visibleRevisions.length} Active Reminders
              </span>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            id="btn-close-notif-drawer"
            onClick={onClose}
            aria-label="Close notifications drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reminder Sub-bar */}
        <div className="drawer-reminder-subbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span>Daily alert at: <strong>{reminderTime}</strong></span>
            <button
              type="button"
              id="btn-drawer-change-reminder"
              onClick={() => {
                onClose();
                if (onGoToSettings) onGoToSettings();
              }}
              style={{ marginLeft: '8px' }}
            >
              Change <ChevronRight size={13} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>

          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              type="button"
              id="btn-mark-all-notifications-read"
              onClick={onMarkAllAsRead}
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '3px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List of Revisions */}
        <div className="drawer-list-wrap">
          {visibleRevisions.length === 0 ? (
            <div className="empty-state-card" style={{ padding: '3rem 1.5rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--accent-emerald-subtle)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>All Caught Up!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No pending revision tasks right now. Great job keeping your study rhythm consistent!
              </p>
            </div>
          ) : (
            <>
              {/* 1. Due Today Section */}
              {dueTodayList.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#b45309',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#f59e0b'
                      }}
                    />
                    Requires Action Today ({dueTodayList.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {dueTodayList.map((rev) => (
                      <div
                        key={rev.id}
                        className="revision-milestone-card due-today"
                        id={`drawer-rev-${rev.id}`}
                      >
                        <div className="rev-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="rev-interval-badge" style={{ background: 'rgba(0, 23, 137, 0.08)', color: 'var(--brand-navy)' }}>
                              Revision
                            </span>
                            {!readIds.includes(rev.id) && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                                New
                              </span>
                            )}
                          </div>
                          <span className="rev-status-pill due-today">
                            Due Today
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                            {rev.subjectName}
                          </span>
                          <div className="rev-topic-title">{rev.topicCovered}</div>
                        </div>

                        <div className="rev-meta-sub">
                          <Calendar size={13} /> Class held: {rev.classDate}
                        </div>

                        <button
                          type="button"
                          className="btn-revise-now"
                          id={`btn-revise-drawer-${rev.id}`}
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            if (onMarkAsRead) onMarkAsRead(rev.id);
                            onClose();
                            onSelectRevision(rev.rawClass);
                          }}
                        >
                          Revise Now <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Upcoming Scheduled Revisions */}
              {upcomingList.length > 0 && (
                <div style={{ marginTop: dueTodayList.length > 0 ? '1.25rem' : 0 }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-light)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.65rem'
                    }}
                  >
                    Scheduled Revisions ({upcomingList.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {upcomingList.map((rev) => (
                      <div
                        key={rev.id}
                        className="revision-milestone-card"
                        id={`drawer-rev-${rev.id}`}
                      >
                        <div className="rev-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="rev-interval-badge" style={{ background: 'rgba(13, 148, 136, 0.08)', color: 'var(--accent-teal)' }}>
                              Revision
                            </span>
                            {!readIds.includes(rev.id) && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                                New
                              </span>
                            )}
                          </div>
                          <span className="rev-status-pill upcoming">
                            {rev.statusLabel}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                            {rev.subjectName}
                          </span>
                          <div className="rev-topic-title" style={{ fontSize: '0.88rem' }}>
                            {rev.topicCovered}
                          </div>
                        </div>

                        <div className="rev-meta-sub">
                          <Calendar size={13} /> Class: {rev.classDate} • Target: {rev.milestoneDateFormatted}
                        </div>

                        <button
                          type="button"
                          className="btn-card-secondary"
                          id={`btn-review-item-${rev.id}`}
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            if (onMarkAsRead) onMarkAsRead(rev.id);
                            onClose();
                            onSelectRevision(rev.rawClass);
                          }}
                        >
                          Review Topic Notes
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Past / Overdue Revisions with Clear Option */}
              {pastList.length > 0 && (
                <div style={{ marginTop: (dueTodayList.length > 0 || upcomingList.length > 0) ? '1.25rem' : 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.65rem'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--text-light)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Past Revisions ({pastList.length})
                    </span>

                    <button
                      type="button"
                      id="btn-clear-past-notifications"
                      onClick={handleClearPastNotifications}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'background 0.2s'
                      }}
                      title="Clear past and overdue revision alerts"
                    >
                      <Trash2 size={13} /> Clear Past Notifications
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {pastList.map((rev) => (
                      <div
                        key={rev.id}
                        className="revision-milestone-card"
                        id={`drawer-rev-${rev.id}`}
                        style={{ opacity: 0.88 }}
                      >
                        <div className="rev-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="rev-interval-badge" style={{ background: 'rgba(100, 116, 139, 0.08)', color: '#64748b' }}>
                              Revision
                            </span>
                            {!readIds.includes(rev.id) && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                                New
                              </span>
                            )}
                          </div>
                          <span className="rev-status-pill overdue">
                            {rev.statusLabel}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                            {rev.subjectName}
                          </span>
                          <div className="rev-topic-title" style={{ fontSize: '0.88rem' }}>
                            {rev.topicCovered}
                          </div>
                        </div>

                        <div className="rev-meta-sub">
                          <Calendar size={13} /> Class: {rev.classDate} • Target: {rev.milestoneDateFormatted}
                        </div>

                        <button
                          type="button"
                          className="btn-card-secondary"
                          id={`btn-review-item-${rev.id}`}
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            if (onMarkAsRead) onMarkAsRead(rev.id);
                            onClose();
                            onSelectRevision(rev.rawClass);
                          }}
                        >
                          Review Topic Notes
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
