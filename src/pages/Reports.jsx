// EDSTAQ Reports & Academic Progress Tab
// Scorecard overview, Session Listening Chart, Instructor Observations, and Printable Report Card

import React from 'react';
import {
  Printer,
  Star,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export default function Reports({
  student,
  classes = [],
  logs = [],
  cumulativeStudyTimeSec = 0
}) {
  // Date parsing helper matching Dashboard logic
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
        return new Date(parseInt(hyphenParts[0], 10), parseInt(hyphenParts[1], 10) - 1, parseInt(hyphenParts[0], 10));
      }
      return new Date(parseInt(hyphenParts[2], 10), parseInt(hyphenParts[1], 10) - 1, parseInt(hyphenParts[0], 10));
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  };

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const clean = timeStr.trim();
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

  // Format date cleanly as "DD Mon YYYY" (e.g. 30 Sep 2026)
  const formatDatePretty = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
    const trimmed = dateStr.trim();
    const dObj = parseDateObj(trimmed);
    if (!dObj || isNaN(dObj.getTime())) return trimmed;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dObj.getMonth()];
    return `${dObj.getDate()} ${month} ${dObj.getFullYear()}`;
  };

  // 1. Attention Index = Dashboard's Listening & Focus Rate
  const validRatings = logs.filter((l) => typeof l.rating === 'number');
  const avgRating = validRatings.length > 0
    ? (validRatings.reduce((acc, curr) => acc + curr.rating, 0) / validRatings.length).toFixed(1)
    : '5.0';
  const focusPercentage = Math.round((parseFloat(avgRating) / 5) * 100);

  // 2. Curriculum Completion = Dashboard's Sessions Completed (date <= today)
  const completedClasses = classes.filter((c) => {
    if (!c.status || c.status.toLowerCase() !== 'completed') return false;
    const d = parseDateObj(c.date || c.classDate || c.scheduledDate);
    if (!d) return true;
    return d <= todayMidnight;
  });
  const pastOrTodayClasses = classes.filter((c) => {
    const d = parseDateObj(c.date || c.classDate || c.scheduledDate);
    if (!d) return true;
    return d <= todayMidnight;
  });
  const totalClassesCount = pastOrTodayClasses.length || 1;
  const sessionsCompletedCount = completedClasses.length;
  const sessionsProgressPercent = Math.min(100, Math.round((sessionsCompletedCount / totalClassesCount) * 100));

  // 3. Revision & Self Study = Dashboard's Active Study Time (total learning time / no of sessions for learning)
  const sessionLearningMinutes = completedClasses
    .map((c) => {
      const start = parseTimeToMinutes(c.startedTime || c.startTime || '');
      const end = parseTimeToMinutes(c.endedTime || c.endTime || '');
      if (start === null || end === null) return null;
      let diff = end - start;
      if (diff < 0) diff += 24 * 60;
      return diff > 0 ? diff : null;
    })
    .filter((v) => v !== null);

  const totalLearningMinutes = sessionLearningMinutes.reduce((acc, v) => acc + v, 0);
  const learningSessions = sessionLearningMinutes.length;
  const avgMinutesPerSession = learningSessions > 0
    ? Math.round(totalLearningMinutes / learningSessions)
    : Math.floor(cumulativeStudyTimeSec / 60);

  // 4. Academic Standing
  const numericRating = parseFloat(avgRating);
  const standingLabel = numericRating >= 4.5 ? 'Mastery Level' : numericRating >= 3.5 ? 'Proficient' : 'Developing';

  // Filter logs with non-empty comments for Instructor Feedback
  const observationLogs = logs.filter((item) => {
    const comment = (item.comment || item.Comment || '').trim();
    return comment.length > 0;
  });

  const handlePrint = () => {
    window.print();
  };

  // Robust class lookup helper for log items
  const findClassForLog = (item) => {
    const rawSid = String(item.sessionId || item.sessionID || item['Session ID'] || '').trim().toLowerCase();
    if (!rawSid) return null;
    return (
      classes.find((c) => {
        const cSid = String(c.sessionId || c.sessionID || c['Session ID'] || '').trim().toLowerCase();
        return cSid && cSid === rawSid;
      }) || null
    );
  };

  return (
    <div className="reports-page" id="reports-main-view">
      {/* Header with Print Button */}
      <div className="section-header-block">
        <div>
          <h1 className="section-title" id="reports-page-title">
            Academic Performance & Report Card
          </h1>
          <span className="section-subtitle">
            Comprehensive audit of attention scores, tutor observations, and study velocity
          </span>
        </div>

        <button
          type="button"
          className="btn-card-primary btn-print-hide"
          id="btn-print-report-card"
          onClick={handlePrint}
        >
          <Printer size={16} /> Print / Save Report Card
        </button>
      </div>

      {/* 1. Scorecard Overview Grid (Synced with Dashboard KPIs) */}
      <div className="scorecard-grid" id="reports-scorecard-grid">
        <div className="scorecard-item">
          <span className="scorecard-label">Attention Index</span>
          <div className="scorecard-value">
            {avgRating} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
          <span className="scorecard-sub">{focusPercentage}% focus efficiency</span>
        </div>

        <div className="scorecard-item">
          <span className="scorecard-label">Curriculum Completion</span>
          <div className="scorecard-value">{sessionsProgressPercent}%</div>
          <span className="scorecard-sub">{sessionsCompletedCount} of {totalClassesCount} sessions completed</span>
        </div>

        <div className="scorecard-item">
          <span className="scorecard-label">Revision & Self Study</span>
          <div className="scorecard-value">
            {avgMinutesPerSession} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Mins</span>
          </div>
          <span className="scorecard-sub">Avg per learning session</span>
        </div>

        <div className="scorecard-item">
          <span className="scorecard-label">Academic Standing</span>
          <div className="scorecard-value" style={{ fontSize: '1.45rem', color: '#10b981' }}>
            {standingLabel}
          </div>
          <span className="scorecard-sub">Neurostack pedagogy standard</span>
        </div>
      </div>

      {/* 2. Session Listening & Focus Index */}
      <div className="chart-card-box" id="reports-listening-chart-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
              Session Listening & Focus Index
            </h2>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Rated live at conclusion of each session by certified instructor
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }} />
              High (Rating 4-5)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }} />
              Moderate (Rating &lt; 4)
            </span>
          </div>
        </div>

        <div className="chart-bars-list" style={{ marginTop: '1.25rem' }}>
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No session focus logs available yet.
            </p>
          ) : (
            logs.map((item, idx) => {
              const relatedClass = findClassForLog(item);
              const subjectLabel = relatedClass?.subjectLabel || relatedClass?.subjectName || relatedClass?.subject || `Session ${item.sessionId || item.sessionID || idx + 1}`;
              const sessionDate = relatedClass?.date || relatedClass?.classDate || item.date || item.timestamp || 'Recent';
              const formattedDate = formatDatePretty(sessionDate);
              const topicName = `${subjectLabel} • ${formattedDate}`;
              const rawRating = typeof item.rating === 'number' ? item.rating : (Number(item.Rating) || Number(item.rating) || 5);
              const ratingValue = Number.isFinite(rawRating) ? rawRating : 5;
              const percentage = Math.min(100, Math.round((ratingValue / 5) * 100));
              const isHigh = ratingValue >= 4;

              return (
                <div key={item.logId || idx} className="chart-bar-row">
                  <div className="chart-bar-header">
                    <span className="chart-bar-title" title={topicName}>
                      {topicName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isHigh ? '#047857' : '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <Star size={13} fill={isHigh ? '#10b981' : '#f59e0b'} color="none" />
                      {ratingValue} / 5
                    </span>
                  </div>

                  <div className="chart-bar-track">
                    <div
                      className={`chart-bar-fill ${isHigh ? 'high' : 'medium'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Instructor Feedback & Progress Observations */}
      <div className="chart-card-box" id="reports-observations-box">
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
            Instructor Feedback & Progress Observations
          </h2>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Qualitative guidance recorded in the Student Log
          </span>
        </div>

        <div className="observations-list" style={{ marginTop: '1.25rem' }}>
          {observationLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No instructor feedback comments recorded yet.</p>
            </div>
          ) : (
            observationLogs.map((item, idx) => {
              const relatedClass = findClassForLog(item);
              const teacherName = relatedClass?.teacherName || relatedClass?.tutorName || item.teacherName || 'Instructor';
              const teacherInitial = teacherName.charAt(0).toUpperCase();
              const subjectLabel = relatedClass?.subjectLabel || relatedClass?.subjectName || relatedClass?.subject || 'General Session';
              const sessionDate = relatedClass?.date || relatedClass?.classDate || item.date || item.timestamp || 'Recent Session';
              const formattedDate = formatDatePretty(sessionDate);
              const commentText = item.comment || item.Comment || '';
              const rawRating = typeof item.rating === 'number' ? item.rating : (Number(item.Rating) || Number(item.rating) || 5);
              const rating = Number.isFinite(rawRating) ? rawRating : 5;

              return (
                <div key={item.logId || idx} className="observation-card" id={`obs-card-${item.logId || idx}`}>
                  <div className="obs-teacher-avatar">{teacherInitial}</div>

                  <div className="obs-content" style={{ flex: 1 }}>
                    <div className="obs-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="obs-teacher-name" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {teacherName}
                          </span>
                          <span style={{ fontSize: '0.78rem', background: 'var(--bg-tag, #e0e7ff)', color: 'var(--text-tag, #3730a3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {subjectLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Session Date: {formattedDate}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div className="kpi-stars-row" style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              fill={s <= rating ? '#f59e0b' : 'none'}
                              color={s <= rating ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309', marginLeft: '4px' }}>
                          {rating}/5
                        </span>
                      </div>
                    </div>

                    <div className="obs-quote" style={{ marginTop: '0.6rem', fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      "{commentText}"
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
