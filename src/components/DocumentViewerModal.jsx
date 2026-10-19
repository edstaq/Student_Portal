import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, FileText, CheckCircle2, Clock } from 'lucide-react';
import { logActivity } from '../services/apiService';

export default function DocumentViewerModal({
  isOpen,
  onClose,
  file,
  session,
  studentId,
  onStudyTimeLogged
}) {
  const [successToast, setSuccessToast] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const startTimeRef = useRef(Date.now());
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !file) return;

    startTimeRef.current = Date.now();
    hasLoggedRef.current = false;
    setElapsedSec(0);

    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
      if (!hasLoggedRef.current) {
        hasLoggedRef.current = true;
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (duration >= 3) {
          logActivity({
            studentId: studentId || session?.studentId,
            sessionId: session?.sessionId || 'N/A',
            type: 'Document Studied',
            detail: `${file?.fileName || 'Document'} (${session?.subjectName || 'Study Material'})`,
            durationSeconds: duration
          }).catch((err) => console.warn('Activity log sync error:', err));
          if (onStudyTimeLogged) {
            onStudyTimeLogged(duration);
          }
        }
      }
    };
  }, [isOpen, file, session, studentId]);

  if (!isOpen || !file) return null;

  const handleClose = () => {
    if (!hasLoggedRef.current) {
      hasLoggedRef.current = true;
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (duration >= 3) {
        logActivity({
          studentId: studentId || session?.studentId,
          sessionId: session?.sessionId || 'N/A',
          type: 'Document Studied',
          detail: `${file?.fileName || 'Document'} (${session?.subjectName || 'Study Material'})`,
          durationSeconds: duration
        }).catch((err) => console.warn('Activity log sync error:', err));
        if (onStudyTimeLogged) {
          onStudyTimeLogged(duration);
        }
      }
    }
    onClose();
  };

  // Convert Google Drive open URL to preview URL
  const getEmbedUrl = (rawUrl) => {
    if (!rawUrl) return '';
    try {
      // Check if open?id= pattern exists
      if (rawUrl.includes('drive.google.com/open?id=')) {
        const fileId = rawUrl.split('open?id=')[1].split('&')[0];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      if (rawUrl.includes('/file/d/')) {
        const fileId = rawUrl.split('/file/d/')[1].split('/')[0];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const embedUrl = getEmbedUrl(file.fileUrl);

  const handleTimerDone = (durationSec) => {
    setSuccessToast(true);
    if (onStudyTimeLogged) {
      onStudyTimeLogged(durationSec);
    }
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-overlay" id="document-viewer-modal-overlay" onClick={handleClose}>
      <div
        className="doc-viewer-modal-card"
        id="document-viewer-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="doc-file-icon">
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 className="modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
                  {file.fileName || 'Study Material'}
                </h2>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                  title="Time spent reading this file is actively recorded and synced to Google Sheets"
                >
                  <Clock size={12} color="#059669" />
                  <span>{Math.floor(elapsedSec / 60)}m {elapsedSec % 60}s</span>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {session ? `${session.subjectName || 'Maths'} • Session Notes` : 'Class Learn Docs'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-card-secondary"
              id="btn-doc-open-external"
            >
              <ExternalLink size={14} /> Open in Google Drive
            </a>
            <button
              type="button"
              className="modal-close-btn"
              id="btn-close-doc-modal"
              onClick={handleClose}
              aria-label="Close document viewer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Success toast upon timer finish */}
        {successToast && (
          <div
            style={{
              position: 'absolute',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10b981',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 50,
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
            }}
          >
            <CheckCircle2 size={16} /> Study time logged to your academic record!
          </div>
        )}

        <div className="doc-viewer-frame-wrap">
          <iframe
            src={embedUrl}
            title={file.fileName || 'Google Drive Document'}
            className="doc-iframe"
            allow="autoplay"
          />
        </div>


      </div>
    </div>
  );
}
