// EDSTAQ Classes Tab
// Dynamic Status Filter Pills (Completed, Upcoming, Cancelled, Rescheduled, etc.)
// Search, Responsive Sessions Grid with Study Notes, Cancellation Reasons, and Meet links
// High-Contrast Elevated Cards and Shimmer Skeleton Loading State

import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Clock,
  UserCheck,
  Video,
  FileText,
  Star,
  BookOpen,
  AlertCircle,
  XCircle,
  Hash
} from 'lucide-react';
import { formatMinimalSessionDate } from '../services/apiService';

export default function Classes({
  classes = [],
  logs = [],
  files = [],
  onOpenSessionModal,
  onOpenDocumentModal,
  isLoading = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Status resolution helper: (blank) = Upcoming, Completed, Cancelled, Rescheduled
  const resolveStatus = (statusStr) => {
    const s = String(statusStr || '').trim().toLowerCase();
    if (!s) return 'Upcoming';
    if (s === 'completed') return 'Completed';
    if (s.includes('cancel')) return 'Cancelled';
    if (s.includes('reschedul')) return 'Rescheduled';
    if (s === 'upcoming') return 'Upcoming';
    return statusStr.trim();
  };

  // Compute status counts dynamically from all classes
  const { statusCounts, filterTabs } = useMemo(() => {
    const counts = {};

    classes.forEach((cls) => {
      const normalized = resolveStatus(cls.status);
      counts[normalized] = (counts[normalized] || 0) + 1;
    });

    // Priority ordering specified by user:
    // 1. All Classes
    // 2. Completed
    // 3. Upcoming (including blank)
    // 4. Cancelled
    // 5. Rescheduled
    // 6. Any other dynamic statuses found in the dataset
    const orderedKeys = ['Completed', 'Upcoming', 'Cancelled', 'Rescheduled'];

    const otherStatuses = Object.keys(counts)
      .filter((s) => !orderedKeys.some((p) => p.toLowerCase() === s.toLowerCase()))
      .sort();

    const tabs = [
      { id: 'all', label: 'All Classes', count: classes.length },
      ...orderedKeys
        .filter((k) => (counts[k] || 0) > 0)
        .map((k) => ({
          id: k.toLowerCase(),
          label: k,
          count: counts[k] || 0
        })),
      ...otherStatuses.map((s) => ({
        id: s.toLowerCase(),
        label: s,
        count: counts[s] || 0
      }))
    ];

    return { statusCounts: counts, filterTabs: tabs };
  }, [classes]);

  // Filter classes by status and search query
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const resolved = resolveStatus(cls.status);

      // Status filter
      if (statusFilter !== 'all') {
        if (resolved.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const idMatch = String(cls.sessionId || cls.sessionID || '').toLowerCase().includes(q);
        const topicMatch = (cls.topicCovered || '').toLowerCase().includes(q);
        const subjectMatch =
          (cls.subjectName || '').toLowerCase().includes(q) ||
          (cls.subjectLabel || '').toLowerCase().includes(q) ||
          (cls.subject || '').toLowerCase().includes(q);
        const teacherMatch =
          (cls.teacherName || '').toLowerCase().includes(q) ||
          (cls.teacherId || '').toLowerCase().includes(q) ||
          (cls.teacherID || '').toLowerCase().includes(q);
        const noteMatch = (cls.note || '').toLowerCase().includes(q);
        const statusMatch = resolved.toLowerCase().includes(q);
        return idMatch || topicMatch || subjectMatch || teacherMatch || noteMatch || statusMatch;
      }

      return true;
    });
  }, [classes, statusFilter, searchTerm]);

  // Helper to parse date strings (e.g. DD/MM/YYYY or YYYY-MM-DD) into timestamp
  const parseDateValue = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    const trimmed = dateStr.trim();
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    const parsed = Date.parse(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Sort descending: from latest date to older date
  const sortedClasses = useMemo(() => {
    return [...filteredClasses].sort((a, b) => {
      const timeA = parseDateValue(a.date || a.classDate);
      const timeB = parseDateValue(b.date || b.classDate);
      return timeB - timeA;
    });
  }, [filteredClasses]);

  // Status badge styling helper: Completed, Cancelled, Rescheduled, (blank) = Upcoming
  const getBadgeMeta = (statusStr) => {
    const s = resolveStatus(statusStr).toLowerCase();
    if (s === 'completed') {
      return { className: 'completed', label: 'Completed' };
    }
    if (s === 'upcoming') {
      return { className: 'upcoming', label: 'Upcoming' };
    }
    if (s === 'cancelled' || s === 'canceled') {
      return { className: 'cancelled', label: 'Cancelled' };
    }
    if (s.includes('reschedul')) {
      return { className: 'rescheduled', label: 'Rescheduled' };
    }
    return { className: 'neutral', label: statusStr || 'Upcoming' };
  };

  // ── LOADING STATE ──
  if (isLoading) {
    return (
      <div className="classes-page" id="classes-main-view">
        <div className="section-header-block">
          <div>
            <h1 className="section-title" id="classes-page-title">
              Curriculum & Class Sessions
            </h1>
            <span className="section-subtitle">
              Browse daily live classes, verified listening records, and syllabus notes
            </span>
          </div>
        </div>

        {/* Syncing Banner */}
        <div className="classes-loading-banner" id="classes-loading-sync-banner">
          <div className="loading-spinner-circle" />
          <div className="loading-banner-text">
            <h3>Syncing Curriculum records...</h3>
            <p>Fetching latest verified class records, instructor allocations, and learning documents</p>
          </div>
        </div>

        {/* Shimmer Skeleton Grid */}
        <div className="sessions-grid" id="classes-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="session-card skeleton-card">
              <div className="skeleton-shimmer-bar skeleton-line-badge" />
              <div className="skeleton-shimmer-bar skeleton-line-title" />
              <div className="skeleton-meta-box">
                <div className="skeleton-shimmer-bar skeleton-line-meta" />
                <div className="skeleton-shimmer-bar skeleton-line-meta" style={{ width: '55%' }} />
                <div className="skeleton-shimmer-bar skeleton-line-meta" style={{ width: '65%' }} />
              </div>
              <div className="skeleton-footer">
                <div className="skeleton-shimmer-bar skeleton-line-btn" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="classes-page" id="classes-main-view">
      <div className="section-header-block">
        <div>
          <h1 className="section-title" id="classes-page-title">
            Curriculum & Class Sessions
          </h1>
          <span className="section-subtitle">
            Browse daily live classes, verified listening records, and syllabus notes
          </span>
        </div>
      </div>

      {/* Filter and Search Bar - Distinct Elevated Panel */}
      <div className="filter-bar" id="classes-filter-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            id="input-classes-search"
            placeholder="Search by topic, subject, instructor, reason, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dynamic Status Filter Pills */}
        <div className="filter-pills-row" id="classes-status-pills">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`filter-pill-btn ${isActive ? 'active' : ''} ${tab.id === 'cancelled' ? 'pill-cancelled' : ''}`}
                id={`filter-pill-${tab.id}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label} <span className="pill-count">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions Grid */}
      {sortedClasses.length > 0 ? (
        <div className="sessions-grid" id="classes-sessions-grid">
          {sortedClasses.map((cls) => {
            const rawStatus = String(cls.status || '').trim().toLowerCase();
            const isCompleted = rawStatus === 'completed';
            const isUpcoming = rawStatus === 'upcoming';
            const isCancelled = rawStatus === 'cancelled' || rawStatus === 'canceled';
            const badgeMeta = getBadgeMeta(cls.status);

            // Find log rating for completed classes
            const sessionLog = logs.find((l) => l.sessionId === cls.sessionId);
            const rating = sessionLog ? sessionLog.rating : null;

            // Learn Docs for this session (Session proofs are strictly HIDDEN)
            const learnFiles = files.filter(
              (f) => f.sessionId === cls.sessionId && f.type === 'Learn Docs'
            );

            // Display actual date
            const displayDate =
              cls.date && cls.date.toLowerCase() !== 'upcoming'
                ? cls.date
                : cls.scheduledDate || cls.classDate || '17/10/2026';

            // Resolve teacher display (shows name if available, or teacher ID if available, else fallback)
            const instructorDisplay =
              cls.teacherName ||
              cls.teacherId ||
              cls.teacherID ||
              cls['Teacher ID'] ||
              cls['Teacher Name'] ||
              'Assigned Instructor';

            const displayTopic =
              cls.topicCovered ||
              cls.chapterName ||
              (isCancelled ? 'Class Cancelled' : 'Class Session');

            const cardTypeClass = isCancelled
              ? 'session-card--cancelled'
              : isCompleted
              ? 'session-card--completed'
              : isUpcoming
              ? 'session-card--upcoming'
              : '';

            return (
              <div
                key={cls.sessionId}
                className={`session-card ${cardTypeClass}`}
                id={`session-card-${cls.sessionId}`}
              >
                <div>
                  <div className="session-card-top">
                    <span className="subject-badge">{cls.subjectName || cls.subject || 'MATHS'}</span>
                    <span className={`status-badge ${badgeMeta.className}`}>
                      {badgeMeta.label}
                    </span>
                  </div>

                  <h3 className="session-topic-title" style={{ marginTop: '0.85rem' }}>
                    {displayTopic}
                  </h3>
                </div>

                {/* Grouped Information Panel */}
                <div className="session-meta-list">
                  <div className="session-meta-item">
                    <Calendar size={14} /> <span>Date: <strong>{formatMinimalSessionDate(displayDate)}</strong></span>
                  </div>
                  <div className="session-meta-item">
                    <Clock size={14} />{' '}
                    <span>
                      {isCompleted ? (
                        <>
                          Time:{' '}
                          <strong>
                            {cls.startedTime || cls.started || cls.startTime || '08:45 PM'} -{' '}
                            {cls.endedTime || cls.ended || cls.endTime || '10:00 PM'}
                          </strong>
                        </>
                      ) : (
                        <>
                          Time:{' '}
                          <strong>
                            {cls.startTime || '08:45 PM'} - {cls.endTime || '10:00 PM'}
                          </strong>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="session-meta-item">
                    <UserCheck size={14} />{' '}
                    <span>
                      Teacher:{' '}
                      <strong style={{ color: 'var(--brand-navy)' }}>{instructorDisplay}</strong>
                    </span>
                  </div>

                  {/* Teacher Star Rating (if completed) */}
                  {isCompleted && rating !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Focus Score:
                      </span>
                      <div className="session-rating-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            fill={s <= rating ? '#f59e0b' : 'none'}
                            color={s <= rating ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                        ({rating}/5)
                      </span>
                    </div>
                  )}
                </div>

                <div className="session-card-bottom">
                  <button
                    type="button"
                    className="btn-card-secondary"
                    id={`btn-class-details-${cls.sessionId}`}
                    onClick={() => onOpenSessionModal(cls)}
                  >
                    Details
                  </button>

                  {/* Study notes for completed classes */}
                  {isCompleted && learnFiles.length > 0 && (
                    <button
                      type="button"
                      className="btn-card-primary"
                      id={`btn-study-notes-${cls.sessionId}`}
                      onClick={() => onOpenDocumentModal(learnFiles[0], cls)}
                    >
                      <FileText size={14} /> Study Notes ({learnFiles.length})
                    </button>
                  )}

                  {/* Join meet for upcoming classes */}
                  {isUpcoming && cls.classLink && (
                    <a
                      href={cls.classLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-join-meet"
                      id={`btn-join-meet-${cls.sessionId}`}
                    >
                      <Video size={14} /> Join Google Meet
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-card" id="classes-empty-state">
          <div className="empty-state-icon">
            <BookOpen size={30} />
          </div>
          <h2 className="empty-state-title">No matching classes found</h2>
          <p className="empty-state-desc">
            Try adjusting your search criteria or reset the filter pill above to view all curriculum records.
          </p>
          <button
            type="button"
            className="btn-card-secondary"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
