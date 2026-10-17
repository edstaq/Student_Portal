// EDSTAQ Active Study Timer Component
// Live MM:SS timer with auto-pause on document.hidden, auto-log on unmount if >= 5s

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, CheckCircle2, Clock } from 'lucide-react';
import { logActivity } from '../services/apiService';

export default function ActiveStudyTimer({
  studentId,
  sessionId,
  documentTitle,
  onDone,
  autoStart = true
}) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);
  const [isLogged, setIsLogged] = useState(false);
  const secondsRef = useRef(0);
  const isLoggedRef = useRef(false);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    isLoggedRef.current = isLogged;
  }, [isLogged]);

  // Interval timer
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Auto-pause when tab is hidden (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-log on unmount if accumulated time >= 5 seconds
  useEffect(() => {
    return () => {
      const finalSec = secondsRef.current;
      if (finalSec >= 5 && !isLoggedRef.current) {
        logActivity({
          studentId,
          sessionId,
          type: 'Document Viewed',
          detail: documentTitle || 'Study Session Notes',
          durationSeconds: finalSec
        });
      }
    };
  }, [studentId, sessionId, documentTitle]);

  const handleToggleTimer = () => {
    setIsActive(!isActive);
  };

  const handleFinishTimer = async () => {
    setIsActive(false);
    const finalSec = seconds;
    if (finalSec >= 5 && !isLogged) {
      await logActivity({
        studentId,
        sessionId,
        type: 'Document Viewed',
        detail: documentTitle || 'Study Session Notes',
        durationSeconds: finalSec
      });
      setIsLogged(true);
    }
    if (onDone) onDone(finalSec);
  };

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="active-study-timer-pill" id="active-study-timer-pill">
      <div className="timer-pulsing-dot" style={{ opacity: isActive ? 1 : 0.4 }} />
      <Clock size={16} color="#93c5fd" />
      <span className="timer-digits" id="timer-display-digits">
        {formatTime(seconds)}
      </span>

      <button
        type="button"
        className="timer-action-btn"
        id="btn-timer-toggle-pause"
        onClick={handleToggleTimer}
        title={isActive ? 'Pause Timer' : 'Resume Timer'}
        aria-label={isActive ? 'Pause Timer' : 'Resume Timer'}
      >
        {isActive ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <button
        type="button"
        className="timer-done-btn"
        id="btn-timer-finish"
        onClick={handleFinishTimer}
        title="Complete study session and record time"
      >
        Done
      </button>
    </div>
  );
}
