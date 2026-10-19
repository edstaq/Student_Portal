// EDSTAQ Student Dashboard Page
// Student Hero Card, 4 KPI Metrics, 1-4-7 Spaced Repetition Banner, and Recent Classes

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  School,
  UserCheck,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Video,
  FileText
} from 'lucide-react';
import { formatMinimalSessionDate } from '../services/apiService';

export default function Dashboard({
  student,
  allocations = [],
  classes = [],
  logs = [],
  files = [],
  revisions = [],
  cumulativeStudyTimeSec = 0,
  onOpenSessionModal,
  onOpenNotifications,
  onOpenDocumentModal,
  onNavigateTab,
  onMarkAsRead
}) {
  // Date parsing helper (must be defined before KPI calculations)
  const parseDateObj = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const hyphenParts = trimmed.split('-');
    if (hyphenParts.length === 3) {
      if (hyphenParts[0].length === 4) {
        return new Date(parseInt(hyphenParts[0], 10), parseInt(hyphenParts[1], 10) - 1, parseInt(hyphenParts[2], 10));
      }
      return new Date(parseInt(hyphenParts[2], 10), parseInt(hyphenParts[1], 10) - 1, parseInt(hyphenParts[0], 10));
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  };

  const isSameCalendarDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayMidnight = new Date(todayMidnight);
  yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

  const getDayLabel = (d) => {
    if (isSameCalendarDay(d, todayMidnight)) return 'Today';
    if (isSameCalendarDay(d, yesterdayMidnight)) return 'Yesterday';
    if (isSameCalendarDay(d, tomorrowMidnight)) return 'Tomorrow';
    return null;
  };

  // KPI Calculations
  // 1. Listening & Focus Rate
  const validRatings = logs.filter((l) => typeof l.rating === 'number');
  const avgRating = validRatings.length > 0
    ? (validRatings.reduce((acc, curr) => acc + curr.rating, 0) / validRatings.length).toFixed(1)
    : '5.0';
  const focusPercentage = Math.round((parseFloat(avgRating) / 5) * 100);

  // 2. Sessions Completed — only count sessions where date <= today (exclude upcoming/future)
  const completedClasses = classes.filter((c) => {
    if (!c.status || c.status.toLowerCase() !== 'completed') return false;
    const d = parseDateObj(c.date || c.classDate || c.scheduledDate);
    if (!d) return true; // no date = treat as past
    return d <= todayMidnight;
  });
  // Total scheduled = only sessions with date <= today (non-future)
  const pastOrTodayClasses = classes.filter((c) => {
    const d = parseDateObj(c.date || c.classDate || c.scheduledDate);
    if (!d) return true;
    return d <= todayMidnight;
  });
  const totalClassesCount = pastOrTodayClasses.length || 1;
  const sessionsCompletedCount = completedClasses.length;
  const sessionsProgressPercent = Math.min(100, Math.round((sessionsCompletedCount / totalClassesCount) * 100));

  // 3. Active Study Time = total learning time / no of sessions for learning
  // Parse HH:MM time strings and compute duration in minutes between startedTime and endedTime
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const clean = timeStr.trim();
    // Handle HH:MM or HH:MM:SS (24h or 12h with AM/PM)
    const match = clean.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[4];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    return h * 60 + m;
  };

  // Compute per-session learning minutes (startedTime -> endedTime) for completed sessions
  const sessionLearningMinutes = completedClasses
    .map((c) => {
      const start = parseTimeToMinutes(c.startedTime || c.startTime || '');
      const end = parseTimeToMinutes(c.endedTime || c.endTime || '');
      if (start === null || end === null) return null;
      let diff = end - start;
      if (diff < 0) diff += 24 * 60; // handle midnight crossover
      return diff > 0 ? diff : null;
    })
    .filter((v) => v !== null);

  const totalLearningMinutes = sessionLearningMinutes.reduce((acc, v) => acc + v, 0);
  const learningSessions = sessionLearningMinutes.length;
  // Average minutes per session; fall back to cumulativeStudyTimeSec-based total if no time data
  const avgMinutesPerSession = learningSessions > 0
    ? Math.round(totalLearningMinutes / learningSessions)
    : Math.floor(cumulativeStudyTimeSec / 60);
  const studyMinutes = learningSessions > 0 ? totalLearningMinutes : Math.floor(cumulativeStudyTimeSec / 60);
  const studyHours = (studyMinutes / 60).toFixed(1);

  // 4. Attendance Rate = total present / total marking (rows with Present or Absent status)
  const totalMarking = logs.filter((l) => {
    const s = String(l.status || l.Status || l.Attendance || '').trim().toLowerCase();
    return s === 'present' || s === 'absent';
  }).length;
  const presentCount = logs.filter((l) => {
    const s = String(l.status || l.Status || l.Attendance || '').trim().toLowerCase();
    return s === 'present';
  }).length;
  const attendanceRate = totalMarking > 0 ? Math.round((presentCount / totalMarking) * 100) : 0;

  // Most urgent revision for the 1-4-7 alert banner
  const primaryRevision = revisions.find((r) => r.isDueToday) || revisions[0];

  // Filter ONLY sessions from Yesterday, Today, and Tomorrow (no separate categories)
  const threeDayClasses = useMemo(() => {
    return classes
      .filter((c) => {
        const d = parseDateObj(c.date || c.classDate || c.scheduledDate);
        if (!d) return false;
        return (
          isSameCalendarDay(d, yesterdayMidnight) ||
          isSameCalendarDay(d, todayMidnight) ||
          isSameCalendarDay(d, tomorrowMidnight)
        );
      })
      .sort((a, b) => {
        const da = parseDateObj(a.date || a.classDate || a.scheduledDate)?.getTime() || 0;
        const db = parseDateObj(b.date || b.classDate || b.scheduledDate)?.getTime() || 0;
        return da - db;
      });
  }, [classes, yesterdayMidnight, todayMidnight, tomorrowMidnight]);

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="dashboard-page" id="dashboard-main-view">
      {/* 1. STUDENT HERO CARD */}
      <section className="student-hero-card" id="student-hero-banner" style={{ position: 'relative' }}>
        {/* Top-Right Active Status Badge (No dot, sleek compact text) */}
        <div className="active-batch-badge hero-top-badge" id="hero-batch-badge">
          <span>Active</span>
        </div>

        <div className="hero-left-col">
          <div className="student-avatar-box" id="hero-avatar-box">
            {student?.studentName ? student.studentName.charAt(0) : 'S'}
          </div>

          <div className="hero-info-wrapper">
            <div className="hero-tags-row">
              <span className="hero-pill class-pill">
                {student?.registeredClass || 'Class 6'}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontWeight: 600
                }}
              >
                ID: {student?.studentId || 'STD101'}
              </span>
            </div>

            <h1 className="student-hero-title" id="student-profile-heading">
              {student?.studentName || 'Student Name'}
            </h1>

            <div className="hero-guardian-line">
              <UserCheck size={14} />
              <span>
                Guardian: <strong>{student?.guardianName || 'Guardian'}</strong> ({student?.guardianRelation || 'Parent'}) • {student?.guardianContact || student?.contact}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-right-col">
          <div className="hero-date-box">
            <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            <span>Today: {todayFormatted}</span>
          </div>

          <div className="hero-quick-actions">
            <button
              type="button"
              className="hero-action-btn"
              id="hero-btn-view-classes"
              onClick={() => onNavigateTab('classes')}
            >
              <BookOpen size={14} /> View All Classes
            </button>
            <button
              type="button"
              className="hero-action-btn"
              id="hero-btn-view-reports"
              onClick={() => onNavigateTab('reports')}
            >
              <Award size={14} /> Academic Standing
            </button>
          </div>
        </div>
      </section>

      {/* 2. KPI CARDS */}
      <section className="kpi-grid" id="kpi-metrics-grid" aria-label="Key Performance Indicators">
        {/* KPI 1: Listening & Focus Rate */}
        <div className="kpi-card" id="kpi-card-listening">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap amber">
              <Star size={24} />
            </div>
            <span className="kpi-badge amber">
              {focusPercentage}% Focus
            </span>
          </div>

          <div className="kpi-content-box">
            <span className="kpi-title">Listening & Focus Rate</span>
            <div className="kpi-value-row">
              <span className="kpi-value amber-highlight">{avgRating}</span>
              <span className="kpi-unit">/ 5.0</span>
            </div>
            <div className="kpi-stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Math.round(parseFloat(avgRating)) ? '#f59e0b' : 'none'}
                  color={s <= Math.round(parseFloat(avgRating)) ? '#f59e0b' : '#cbd5e1'}
                />
              ))}
            </div>
          </div>

          <div className="kpi-progress-track">
            <div
              className="kpi-progress-fill amber"
              style={{ width: `${focusPercentage}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Sessions Completed */}
        <div className="kpi-card" id="kpi-card-sessions">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap navy">
              <CheckCircle2 size={24} />
            </div>
            <span className="kpi-badge navy">
              Verified Log
            </span>
          </div>

          <div className="kpi-content-box">
            <span className="kpi-title">Sessions Completed</span>
            <div className="kpi-value-row">
              <span className="kpi-value navy-highlight">{sessionsCompletedCount}</span>
              <span className="kpi-unit">/ {totalClassesCount}</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
              Excludes upcoming
            </span>
          </div>

          <div className="kpi-progress-track">
            <div
              className="kpi-progress-fill navy"
              style={{ width: `${sessionsProgressPercent}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Active Study Time */}
        <div className="kpi-card" id="kpi-card-studytime">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap emerald">
              <Clock size={24} />
            </div>
            <span className="kpi-badge emerald">
              Tracked Live
            </span>
          </div>

          <div className="kpi-content-box">
            <span className="kpi-title">Active Study Time</span>
            <div className="kpi-value-row">
              <span className="kpi-value emerald-highlight">{learningSessions > 0 ? avgMinutesPerSession : studyMinutes}</span>
              <span className="kpi-unit">Mins</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
              {learningSessions > 0 ? `Avg per session (${studyHours}h)` : `Total ${studyHours} hrs`}
            </span>
          </div>

          <div className="kpi-progress-track">
            <div
              className="kpi-progress-fill emerald"
              style={{ width: `${Math.min(100, (studyMinutes / 60) * 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Attendance Rate */}
        <div className="kpi-card" id="kpi-card-attendance">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap purple">
              <Award size={24} />
            </div>
            <span className="kpi-badge purple">
              Consistent
            </span>
          </div>

          <div className="kpi-content-box">
            <span className="kpi-title">Attendance Rate</span>
            <div className="kpi-value-row">
              <span className="kpi-value purple-highlight">{attendanceRate}%</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
              {presentCount}/{totalMarking} marked present
            </span>
          </div>

          <div className="kpi-progress-track">
            <div
              className="kpi-progress-fill purple"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </section>

      {/* 3. REVISION BANNER ALERT */}
      {primaryRevision && (
        <section
          className="revision-alert-banner"
          id="banner-spaced-repetition-alert"
          aria-label="Revision Alert"
        >
          <div className="banner-left">
            <div className="banner-icon-box">
              <AlertTriangle size={26} />
            </div>

            <div className="banner-text-box">
              <div className="banner-header-row">
                <span className="banner-badge">
                  {primaryRevision.status || 'Due Today'}
                </span>
                <span className="banner-interval-label">Today Revision Session</span>
              </div>
              <h2 className="banner-title">
                {primaryRevision.subjectName}: {primaryRevision.topicCovered}
              </h2>
              <span className="banner-topic">
                Class Date: {formatMinimalSessionDate(primaryRevision.classDate)}
              </span>
            </div>
          </div>

          <div className="banner-actions">
            <button
              type="button"
              className="btn-revise-now"
              id="btn-revise-now-banner"
              onClick={() => {
                if (onMarkAsRead && primaryRevision?.id) {
                  onMarkAsRead(primaryRevision.id);
                }
                onOpenSessionModal(primaryRevision.rawClass);
              }}
            >
              <Sparkles size={16} /> Revise Now
            </button>

            <button
              type="button"
              className="btn-view-all-revisions"
              id="btn-view-all-revisions-banner"
              onClick={onOpenNotifications}
            >
              View All ({revisions.length})
            </button>
          </div>
        </section>
      )}

      {/* 4. RECENT & UPCOMING SESSIONS (YESTERDAY, TODAY, TOMORROW) */}
      <section style={{ marginTop: '2.5rem' }}>
        <div className="section-header-block">
          <div>
            <h2 className="section-title">Classroom Schedule & Notes</h2>
            <span className="section-subtitle">
              Sessions for yesterday, today, and tomorrow
            </span>
          </div>

          <button
            type="button"
            className="btn-card-secondary"
            id="btn-view-all-classes-dash"
            onClick={() => onNavigateTab('classes')}
          >
            All Classes ({classes.length}) <ArrowRight size={14} />
          </button>
        </div>

        <div className="sessions-grid">
          {threeDayClasses.map((cls) => {
            const rawStatus = String(cls.status || '').trim().toLowerCase();
            const isCompleted = rawStatus === 'completed';
            const isCancelled = rawStatus.includes('cancel');
            const isRescheduled = rawStatus.includes('reschedul');
            const isUpcoming = !rawStatus || rawStatus === 'upcoming';
            const displayStatus = isCompleted
              ? 'Completed'
              : isCancelled
              ? 'Cancelled'
              : isRescheduled
              ? 'Rescheduled'
              : 'Upcoming';

            const cardDateObj = parseDateObj(cls.date || cls.classDate || cls.scheduledDate);
            const relativeDayLabel = cardDateObj ? getDayLabel(cardDateObj) : null;

            const learnFiles = files.filter(
              (f) => f.sessionId === cls.sessionId && f.type === 'Learn Docs'
            );

            const displayTopic =
              cls.topicCovered ||
              cls.chapterName ||
              (isCancelled ? 'Class Cancelled' : 'Class Session');

            const instructorDisplay =
              cls.teacherName || cls.teacherId || cls.teacherID || 'Assigned Instructor';

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
                id={`dash-class-${cls.sessionId}`}
              >
                <div>
                  <div className="session-card-top">
                    <span className="subject-badge">{cls.subjectName || cls.subject || 'MATHS'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {relativeDayLabel && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background:
                              relativeDayLabel === 'Today'
                                ? 'rgba(59, 130, 246, 0.12)'
                                : 'rgba(100, 116, 139, 0.1)',
                            color: relativeDayLabel === 'Today' ? '#2563eb' : '#475569'
                          }}
                        >
                          {relativeDayLabel}
                        </span>
                      )}
                      <span
                        className={`status-badge ${
                          isCompleted
                            ? 'completed'
                            : isUpcoming
                            ? 'upcoming'
                            : isCancelled
                            ? 'cancelled'
                            : isRescheduled
                            ? 'rescheduled'
                            : 'neutral'
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </div>
                  </div>

                  <h3 className="session-topic-title" style={{ marginTop: '0.75rem' }}>
                    {displayTopic}
                  </h3>
                </div>

                <div className="session-meta-list">
                  <div className="session-meta-item">
                    <Calendar size={14} />{' '}
                    <span>
                      Date: <strong>{formatMinimalSessionDate(cls.date || cls.classDate)}</strong>
                    </span>
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
                    <UserCheck size={14} /> Teacher:{' '}
                    <strong style={{ color: 'var(--brand-navy)' }}>{instructorDisplay}</strong>
                  </div>
                </div>

                <div className="session-card-bottom">
                  <button
                    type="button"
                    className="btn-card-secondary"
                    id={`btn-dash-details-${cls.sessionId}`}
                    onClick={() => onOpenSessionModal(cls)}
                  >
                    {isCompleted ? 'Details & Rating' : 'Session Details'}
                  </button>

                  {isUpcoming && cls.classLink && (
                    <a
                      href={cls.classLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-join-meet"
                      id={`btn-dash-join-${cls.sessionId}`}
                    >
                      <Video size={14} /> Join Google Meet
                    </a>
                  )}

                  {isCompleted && learnFiles.length > 0 && (
                    <button
                      type="button"
                      className="btn-card-primary"
                      id={`btn-dash-study-notes-${cls.sessionId}`}
                      onClick={() => onOpenDocumentModal(learnFiles[0], cls)}
                    >
                      <FileText size={14} /> Study Notes ({learnFiles.length})
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {threeDayClasses.length === 0 && (
            <div
              className="empty-state-card"
              style={{
                gridColumn: '1 / -1',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'white',
                borderRadius: '16px',
                border: '1px dashed var(--border-color, #e2e8f0)'
              }}
            >
              <Calendar size={36} color="var(--text-light, #94a3b8)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                No Sessions for Yesterday, Today, or Tomorrow
              </h3>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  maxWidth: '420px',
                  margin: '0 auto 1.25rem'
                }}
              >
                There are no classes scheduled across yesterday, today, and tomorrow. You can explore your complete curriculum schedule anytime.
              </p>
              <button
                type="button"
                className="btn-card-primary"
                onClick={() => onNavigateTab('classes')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
              >
                <BookOpen size={14} /> View All Curriculum Classes
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
