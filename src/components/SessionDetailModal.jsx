import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle,
  Video,
  FileText,
  Share2,
  Star,
  Calendar,
  Clock,
  User,
  DoorOpen,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { formatMinimalSessionDate, logActivity } from '../services/apiService';

export default function SessionDetailModal({
  isOpen,
  onClose,
  session,
  files = [],
  logs = [],
  studentId,
  onOpenDocument
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const startTimeRef = useRef(Date.now());
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !session) return;
    startTimeRef.current = Date.now();
    hasLoggedRef.current = false;

    return () => {
      if (!hasLoggedRef.current) {
        hasLoggedRef.current = true;
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (duration >= 5) {
          logActivity({
            studentId: studentId || session?.studentId,
            sessionId: session?.sessionId || 'N/A',
            type: 'Session Notes Viewed',
            detail: `${session?.subjectName || 'Subject'} - ${session?.chapterName || session?.topicCovered || 'Class Details'}`,
            durationSeconds: duration
          }).catch(() => {});
        }
      }
    };
  }, [isOpen, session, studentId]);

  if (!isOpen || !session) return null;

  const handleClose = () => {
    if (!hasLoggedRef.current) {
      hasLoggedRef.current = true;
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (duration >= 5) {
        logActivity({
          studentId: studentId || session?.studentId,
          sessionId: session?.sessionId || 'N/A',
          type: 'Session Notes Viewed',
          detail: `${session?.subjectName || 'Subject'} - ${session?.chapterName || session?.topicCovered || 'Class Details'}`,
          durationSeconds: duration
        }).catch(() => {});
      }
    }
    onClose();
  };

  // Find attendance & listening rate log for this session
  const sessionLog = logs.find((l) => l.sessionId === session.sessionId);
  const ratingValue = sessionLog ? sessionLog.rating : null;
  const teacherComment = sessionLog ? sessionLog.comment : null;

  // Filter ONLY Learn Docs files (CRITICAL RULE: Session proofs are strictly hidden from students)
  const learnDocs = files.filter(
    (f) => f.sessionId === session.sessionId && f.type === 'Learn Docs'
  );

  // Status mapping: Completed, Cancelled, Rescheduled, (blank) = Upcoming
  const rawStatus = String(session.status || '').trim();
  const lowerStatus = rawStatus.toLowerCase();
  const isCompleted = lowerStatus === 'completed';
  const isCancelled = lowerStatus.includes('cancel');
  const isRescheduled = lowerStatus.includes('reschedul');
  const isUpcoming = !rawStatus || lowerStatus === 'upcoming';
  const displayStatus = isCompleted
    ? 'Completed'
    : isCancelled
    ? 'Cancelled'
    : isRescheduled
    ? 'Rescheduled'
    : 'Upcoming';

  const handleShareLink = () => {
    const activeId = studentId || 'STD101';
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${activeId}&session=${session.sessionId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    } else {
      // Fallback
      prompt('Copy deep link to this session:', shareUrl);
    }
  };

  return (
    <div className="modal-overlay" id="session-detail-modal-overlay" onClick={handleClose}>
      <div
        className="modal-content-card"
        id="session-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="subject-badge">{session.subjectName || session.subject || 'MATHS'}</span>
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
            {session.verify === 'Verified' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#10b981'
                }}
              >
                <CheckCircle size={14} /> Verified
              </span>
            )}
          </div>

          <button
            type="button"
            className="modal-close-btn"
            id="btn-close-session-modal"
            onClick={onClose}
            aria-label="Close session details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-light)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Topic Covered
            </span>
            <h2
              className="modal-title"
              style={{ fontSize: '1.45rem', marginTop: '0.3rem', color: 'var(--text-main)' }}
            >
              {session.topicCovered || session.chapterName || ((session.status || '').toLowerCase() === 'cancelled' ? 'Class Cancelled' : 'Class Curriculum Session')}
            </h2>
          </div>

          {/* Metadata Grid */}
          <div className="session-modal-meta-grid">
            <div className="meta-field">
              <span className="meta-field-label">Date</span>
              <span className="meta-field-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} color="#64748b" /> {formatMinimalSessionDate(session.date || session.classDate)}
              </span>
            </div>

            <div className="meta-field">
              <span className="meta-field-label">
                {isCompleted ? 'Class Time (Started - Ended)' : 'Class Time (Scheduled)'}
              </span>
              <span className="meta-field-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} color="#64748b" />{' '}
                {isCompleted
                  ? `${session.startedTime || session.started || session.startTime || '08:45 PM'} - ${session.endedTime || session.ended || session.endTime || '10:00 PM'}`
                  : `${session.startTime || '08:45 PM'} - ${session.endTime || '10:00 PM'}`
                }
              </span>
            </div>

            <div className="meta-field">
              <span className="meta-field-label">Instructor</span>
              <span className="meta-field-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} color="#64748b" /> <strong>{session.teacherName || session.teacherId || session.teacherID || 'Assigned Teacher'}</strong>
              </span>
            </div>

            <div className="meta-field">
              <span className="meta-field-label">Classroom</span>
              <span className="meta-field-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DoorOpen size={14} color="#64748b" /> {session.classRoomId || session.classRoomID || 'Main Room'}
              </span>
            </div>

            <div className="meta-field">
              <span className="meta-field-label">Subject Curriculum</span>
              <span className="meta-field-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={14} color="#64748b" /> {session.subjectLabel || session.subjectName || session.subject || 'General'}
              </span>
            </div>


            {(session.source || session.subjectSource) && (
              <div className="meta-field">
                <span className="meta-field-label">Curriculum Textbook</span>
                <a
                  href={session.source || session.subjectSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meta-field-val"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'var(--brand-blue-accent)',
                    fontWeight: 700
                  }}
                >
                  <ExternalLink size={14} /> Official Textbook Link ↗
                </a>
              </div>
            )}
          </div>

          {/* Listening Rating Box (For completed sessions with logs) */}
          {ratingValue !== null && (
            <div className="listening-rating-box" id="modal-listening-rate-box">
              <div className="rating-header-row">
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e3a8a', lineHeight: 1.3 }}>
                  Student Listening & Focus Rating
                </span>
                <span
                  className="rating-score-pill"
                  style={{
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{ratingValue}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.78rem', fontWeight: 600 }}>/ 5.0</span>
                </span>
              </div>

              <div className="kpi-stars-row" style={{ marginTop: '0.2rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= ratingValue ? '#f59e0b' : 'none'}
                    color={star <= ratingValue ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </div>

              {teacherComment && (
                <div className="teacher-comment-quote">
                  "{teacherComment}"
                </div>
              )}
            </div>
          )}

          {/* Learn Docs Section */}
          <div className="learn-docs-section">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
              Study Notes & Learning Materials ({learnDocs.length})
            </h3>

            {learnDocs.length > 0 ? (
              <div className="docs-list">
                {learnDocs.map((doc, idx) => (
                  <div key={idx} className="doc-file-card">
                    <div className="doc-file-left">
                      <div className="doc-file-icon">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="doc-file-name">{doc.fileName}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Official Session Notes • Read-only
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-study-doc"
                      id={`btn-study-doc-${idx}`}
                      onClick={() => onOpenDocument(doc, session)}
                    >
                      Study Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                No study document uploaded for this session yet. Check back following teacher sync.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-card-secondary"
              id="btn-share-class-link"
              onClick={handleShareLink}
            >
              <Share2 size={14} />
              {copiedLink ? 'Copied Link to Clipboard!' : 'Share Class Link'}
            </button>
            {(session.sessionId || session.sessionID) && (
              <span
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-light)',
                  fontFamily: 'monospace'
                }}
              >
                Session ID: <strong>{session.sessionId || session.sessionID}</strong>
              </span>
            )}
          </div>

          {isUpcoming && session.classLink && (
            <a
              href={session.classLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-join-meet"
              id="btn-join-meet-modal"
            >
              <Video size={16} /> Join Google Meet
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
