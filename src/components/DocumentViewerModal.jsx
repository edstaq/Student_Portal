// EDSTAQ Document Viewer Modal
// Embedded Google Drive preview iframe with fallback and ActiveStudyTimer

import React, { useState } from 'react';
import { X, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';


export default function DocumentViewerModal({
  isOpen,
  onClose,
  file,
  session,
  studentId,
  onStudyTimeLogged
}) {
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen || !file) return null;

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
    <div className="modal-overlay" id="document-viewer-modal-overlay" onClick={onClose}>
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
              <h2 className="modal-title" style={{ fontSize: '1.15rem' }}>
                {file.fileName || 'Study Material'}
              </h2>
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
              onClick={onClose}
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
