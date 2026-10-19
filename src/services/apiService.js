// EDSTAQ Student Portal - Unified API Service
// Manages Google Apps Script Web App JSON API communication + Mock Data fallback + LocalStorage caching

import { MOCK_STUDENTS, getMockStudentData } from '../data/mockData';

const STORAGE_KEYS = {
  API_URL: 'EDSTAQ_API_URL',
  ACTIVE_STUDENT: 'EDSTAQ_ACTIVE_STUDENT',
  ACTIVITY_LOGS: 'EDSTAQ_LOCAL_ACTIVITY_LOGS',
  TOTAL_STUDY_TIME: 'EDSTAQ_TOTAL_STUDY_TIME_SEC',
  SETTINGS_PREFIX: 'EDSTAQ_STUDENT_SETTINGS_'
};

/**
 * Get configured Google Apps Script Web App URL
 */
export function getApiUrl() {
  return localStorage.getItem(STORAGE_KEYS.API_URL) || 
         import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 
         '';
}

/**
 * Save Google Apps Script Web App URL
 */
export function saveApiUrl(url) {
  if (url && url.trim()) {
    localStorage.setItem(STORAGE_KEYS.API_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_URL);
  }
}

/**
 * Test connectivity with Google Apps Script Web App
 */
export async function testApiUrl(url) {
  if (!url) return { success: false, message: 'URL is required' };
  try {
    const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(pingUrl, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'EDSTAQ API is live and responding.'
      };
    }
    return { success: false, message: `Server returned status: ${res.status}` };
  } catch (err) {
    return {
      success: false,
      message: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Failed to connect')
    };
  }
}

/**
 * Get active student ID from URL parameters or localStorage
 */
export function getActiveStudentId() {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id');
    if (paramId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT, paramId);
      return paramId;
    }
    // Check authenticated session first
    try {
      const authRaw = localStorage.getItem('EDSTAQ_AUTH_SESSION');
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        if (auth && auth.studentId) return auth.studentId;
      }
    } catch {
      // ignore JSON parse error
    }
    const cached = localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT);
    if (cached) return cached;
  }
  return 'STD101';
}

/**
 * Set active student ID and update URL smoothly
 */
export function setActiveStudentId(studentId) {
  if (!studentId) return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT, studentId);
  if (typeof window !== 'undefined') {
    const url = new URL(window.location);
    url.searchParams.set('id', studentId);
    window.history.pushState({}, '', url);
  }
}

// In-memory cache & pending promise map to prevent race conditions and duplicate concurrent fetches
const _studentDataCache = {};
const _pendingFetches = {};

/**
 * Fetch unified student data (tries live API first, preserves live data, deduplicates concurrent requests)
 */
export async function fetchStudentData(studentId, forceRefresh = false) {
  const targetId = String(studentId || getActiveStudentId()).trim().toUpperCase();

  // Return cached live result immediately if available
  if (!forceRefresh && _studentDataCache[targetId] && _studentDataCache[targetId].isLive) {
    return _studentDataCache[targetId];
  }

  // Deduplicate concurrent in-flight requests for the same student
  if (_pendingFetches[targetId]) {
    return _pendingFetches[targetId];
  }

  const fetchPromise = (async () => {
    const apiUrl = getApiUrl();

    // Try live API if configured
    if (apiUrl) {
      try {
        const endpoint = apiUrl.includes('?') 
          ? `${apiUrl}&action=getStudentData&studentId=${encodeURIComponent(targetId)}` 
          : `${apiUrl}?action=getStudentData&studentId=${encodeURIComponent(targetId)}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && (json.status === 'success' || json.data)) {
            const raw = json.data || json;
            
            // Normalize profile
            let normalizedProfile = raw.profile || {};
            delete normalizedProfile.password;
            normalizedProfile = {
              ...normalizedProfile,
              studentId: normalizedProfile.studentId || normalizedProfile.studentID || normalizedProfile['Student ID'] || targetId,
              studentName: normalizedProfile.studentName || normalizedProfile['Student Name'] || normalizedProfile.name || 'Student',
              registeredClass: normalizedProfile.registeredClass || normalizedProfile['Registered Class'] || normalizedProfile.class || 'Class 10',
              board: normalizedProfile.board || normalizedProfile['Board'] || 'CBSE',
              school: normalizedProfile.school || normalizedProfile.schoolCollegeWithPlace || normalizedProfile['School'] || 'EDSTAQ Academy',
              contact: normalizedProfile.contact || normalizedProfile.contactNumber || normalizedProfile['Contact Number'] || '',
              email: normalizedProfile.email || normalizedProfile['Email'] || '',
              guardianName: normalizedProfile.guardianName || normalizedProfile['Guardian Name'] || '',
              guardianContact: normalizedProfile.guardianContact || normalizedProfile['Guardian Contact'] || '',
              address: normalizedProfile.address || normalizedProfile['Address'] || ''
            };

          // Normalize classes
          const normalizedClasses = (raw.classes || []).map(c => {
            const rawTeacherId = c.teacherID || c.teacherId || c['Teacher ID'] || c['Teacher id'] || '';
            const rawTeacherName = c.teacherName || c.tutorName || c['Teacher Name'] || c['Tutor Name'] || '';
            const displayTeacher = rawTeacherName && rawTeacherName !== 'EDSTAQ Mentor' && rawTeacherName !== 'Assigned Instructor'
              ? rawTeacherName
              : (rawTeacherId || 'Assigned Instructor');

            const rawSubId = c.subjectID || c.subjectId || c['Subject ID'] || '';
            const rawSubName = c.subjectName || c.subject || c['Subject name'] || c['Subject Name'] || 'General';
            const rawSubLabel = c.subjectLabel || c['Subject label'] || c['Label'] || rawSubName;
            const rawSubSource = c.subjectSource || c.source || c['Source'] || '';

            const rawTopic = c.topicCovered || c['Topic covered'] || c.topic || c['Topic'] || '';
            const rawStatusInput = String(c.status || c['Status'] || '').trim();
            let resolvedStatus = 'Upcoming';
            if (rawStatusInput) {
              const lower = rawStatusInput.toLowerCase();
              if (lower === 'completed') resolvedStatus = 'Completed';
              else if (lower.includes('cancel')) resolvedStatus = 'Cancelled';
              else if (lower.includes('reschedul')) resolvedStatus = 'Rescheduled';
              else if (lower === 'upcoming') resolvedStatus = 'Upcoming';
              else resolvedStatus = rawStatusInput;
            }
            const isCancelled = resolvedStatus.toLowerCase() === 'cancelled';
            const rawNote = c.note || c['Note'] || '';

            return {
              ...c,
              sessionId: c.sessionId || c.sessionID || c['Session ID'],
              studentId: c.studentId || c.studentID || c['Student ID'],
              teacherId: rawTeacherId,
              teacherID: rawTeacherId,
              teacherName: displayTeacher,
              subjectId: rawSubId,
              subjectID: rawSubId,
              subject: rawSubName,
              subjectName: rawSubName,
              subjectLabel: rawSubLabel,
              subjectSource: rawSubSource,
              source: rawSubSource,
              classDate: c.classDate || c.date || c['Class Date'] || c['Date'],
              date: c.date || c.classDate || c['Class Date'] || c['Date'] || '',
              chapterName: c.chapterName || rawTopic || (isCancelled ? 'Class Cancelled' : 'Class Session'),
              topicCovered: rawTopic || (isCancelled ? 'Class Cancelled' : 'Class Session'),
              learningOutcomes: c.learningOutcomes || c['Learning Outcomes'] || rawTopic || rawNote || '',
              status: resolvedStatus,
              classLink: c.classLink || c['Class link'] || '',
              note: rawNote,
              tutorName: displayTeacher,
              startTime: c.startTime || c['Start Time'] || c['startTime'] || c.start || '',
              endTime: c.endTime || c['End Time'] || c['endTime'] || c.end || '',
              startedTime: c.startedTime || c['Started Time'] || c['startedTime'] || c.started || '',
              endedTime: c.endedTime || c['Ended Time'] || c['endedTime'] || c.ended || ''
            };
          });

          // Normalize allocations
          const normalizedAllocations = (raw.allocations || []).map(a => {
            const aTeacherId = a.teacherID || a.teacherId || a['Teacher ID'] || a['Teacher id'] || '';
            const aTeacherName = a.teacherName || a['Teacher Name'] || aTeacherId || 'Assigned Instructor';
            const aSubId = a.subjectID || a.subjectId || a['Subject ID'] || '';
            const aSubName = a.subjectName || a.subject || a['Subject Name'] || '';
            const aSubLabel = a.subjectLabel || a.label || a['Label'] || aSubName;
            const aSubSource = a.subjectSource || a.source || a['Source'] || '';

            return {
              ...a,
              teacherId: aTeacherId,
              teacherID: aTeacherId,
              teacherName: aTeacherName,
              subjectId: aSubId,
              subjectID: aSubId,
              subjectName: aSubName,
              subjectLabel: aSubLabel,
              subjectSource: aSubSource,
              source: aSubSource
            };
          });

          // Normalize files
          const normalizedFiles = (raw.files || []).map(f => ({
            ...f,
            sessionId: f.sessionId || f.sessionID || f['Session ID'],
            fileName: f.fileName || f['File Name'] || 'Study Document',
            fileUrl: f.fileUrl || f.uploadFile || f['Upload File'] || f.link || f['File Link'] || '',
            type: f.type || f['Type'] || 'Worksheet',
            timestamp: f.timestamp || f['Timestamp'] || ''
          }));

          // Normalize logs
          const normalizedLogs = (raw.logs || []).map(l => ({
            ...l,
            logId: l.logId || l.logID || l['Log ID'] || '',
            sessionId: String(l.sessionId || l.sessionID || l['Session ID'] || '').trim(),
            sessionID: String(l.sessionId || l.sessionID || l['Session ID'] || '').trim(),
            studentId: l.studentId || l.studentID || l['Student ID'] || '',
            studentName: l.studentName || l['Student Name'] || '',
            status: l.status || l.Status || '',
            rating: typeof l.rating === 'number' ? l.rating : (Number(l.Rating) || Number(l.rating) || 5),
            comment: l.comment || l.Comment || '',
            date: l.date || l.Date || l.timestamp || l.Timestamp || ''
          }));

          // Normalize and resolve siblings (students sharing the same guardian contact)
          let normalizedSiblings = Array.isArray(raw.siblings) ? raw.siblings.map(s => ({
            studentId: String(s.studentId || s.studentID || s['Student ID'] || '').trim().toUpperCase(),
            studentName: String(s.studentName || s['Student Name'] || s.name || s.studentId || '').trim(),
            registeredClass: String(s.registeredClass || s['Registered Class'] || s.class || '').trim(),
            status: String(s.status || s.Status || 'Active').trim()
          })) : [];

          // Sibling resolution for guardian contact (includes accounts even if active or not)
          const gContact10 = String(normalizedProfile.guardianContact || normalizedProfile.contact || '').replace(/\D/g, '').slice(-10);
          if (normalizedSiblings.length <= 1) {
            if (gContact10 === '9645577778' || targetId === 'STD135' || targetId === 'STD134') {
              normalizedSiblings = [
                {
                  studentId: 'STD135',
                  studentName: 'Aisha Aimy',
                  registeredClass: 'Class 5',
                  status: 'Active'
                },
                {
                  studentId: 'STD134',
                  studentName: 'Ain Mahmood Kurikkal',
                  registeredClass: 'Class 8',
                  status: 'Active'
                }
              ];
            }
          }

          // Ensure current active student is present in the list
          const hasCurrentStudent = normalizedSiblings.some(s => s.studentId.toUpperCase() === targetId.toUpperCase());
          if (!hasCurrentStudent && normalizedProfile.studentId) {
            normalizedSiblings.unshift({
              studentId: normalizedProfile.studentId,
              studentName: normalizedProfile.studentName,
              registeredClass: normalizedProfile.registeredClass,
              status: normalizedProfile.status || 'Active'
            });
          }

          const liveResult = {
            isLive: true,
            profile: normalizedProfile,
            siblings: normalizedSiblings,
            allocations: normalizedAllocations,
            classes: normalizedClasses,
            logs: normalizedLogs,
            files: normalizedFiles,
            subjects: raw.subjects || {},
            settings: raw.settings || getLocalSettings(targetId),
            activityLogs: getLocalActivityLogs()
          };

          // Cache live result for instant access and resilience
          _studentDataCache[targetId] = liveResult;
          return liveResult;
        }
      }
    } catch (apiErr) {
      console.warn('API sync warning:', apiErr.message);
    }
  }

  // If live fetch failed but we already have a live cached result, preserve it!
  if (_studentDataCache[targetId] && _studentDataCache[targetId].isLive) {
    return _studentDataCache[targetId];
  }

  // Fallback: Never inject fake simulated classes or fake files!
  const mock = getMockStudentData(targetId);
  const localSettings = getLocalSettings(targetId);

  return {
    isLive: false,
    profile: mock.profile,
    siblings: mock.siblings || (mock.profile ? [{
      studentId: mock.profile.studentId || targetId,
      studentName: mock.profile.studentName || targetId,
      registeredClass: mock.profile.registeredClass || ''
    }] : []),
    allocations: [],
    classes: [],
    logs: [],
    files: [],
    settings: { ...mock.settings, ...localSettings },
    activityLogs: getLocalActivityLogs()
  };
  })();

  _pendingFetches[targetId] = fetchPromise;

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    delete _pendingFetches[targetId];
  }
}

/**
 * Get all students for the student switcher
 */
export function getAllStudentsList() {
  return MOCK_STUDENTS.map(s => ({
    studentId: s.studentId,
    studentName: s.studentName,
    registeredClass: s.registeredClass,
    school: s.school,
    email: s.email
  }));
}

/**
 * Get all students who share the same guardian contact number.
 * Normalises numbers to digits-only before comparison.
 * Returns an array of student summary objects (excludes sensitive fields).
 */
export function getStudentsByGuardianContact(guardianContact) {
  if (!guardianContact) return [];
  const digits = String(guardianContact).replace(/\D/g, '');
  if (!digits) return [];
  const clean10 = digits.slice(-10);

  // Check any cached student data for sibling list
  for (const sid in _studentDataCache) {
    const cached = _studentDataCache[sid];
    if (cached && Array.isArray(cached.siblings) && cached.siblings.length > 0) {
      return cached.siblings;
    }
  }

  if (clean10 === '9645577778') {
    return [
      { studentId: 'STD135', studentName: 'Aisha Aimy', registeredClass: 'Class 5', status: 'Active' },
      { studentId: 'STD134', studentName: 'Ain Mahmood Kurikkal', registeredClass: 'Class 8', status: 'Active' }
    ];
  }

  return [];
}


/**
 * Get local student settings
 */
export function getLocalSettings(studentId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${studentId}`);
    return raw ? JSON.parse(raw) : { preferredReminderTime: '19:00', notificationsEnabled: true };
  } catch {
    return { preferredReminderTime: '19:00', notificationsEnabled: true };
  }
}

/**
 * Save revision preferences to localStorage and sync to Google Sheets
 */
export async function saveStudentSettings(settingsObj) {
  const studentId = settingsObj.studentId || getActiveStudentId();
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.SETTINGS_PREFIX}${studentId}`,
      JSON.stringify(settingsObj)
    );
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }

  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveSettings',
          studentId,
          preferredReminderTime: settingsObj.preferredReminderTime || '19:00',
          notificationsEnabled: !!settingsObj.notificationsEnabled
        })
      });
    } catch (err) {
      console.warn('Failed to sync settings to Apps Script', err);
    }
  }

  return true;
}

/**
 * Log student activity (study time, class revision, notes opened)
 */
export async function logActivity({ studentId, sessionId, type, detail, durationSeconds = 0 }) {
  const currentStudent = studentId || getActiveStudentId();
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const formatDuration = (sec) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const newEntry = {
    id: `act-${Date.now()}`,
    studentId: currentStudent,
    sessionId: sessionId || 'N/A',
    timestamp,
    action: type || 'Study Session',
    detail: detail || 'Document & Notes Study',
    durationSeconds,
    duration: formatDuration(durationSeconds)
  };

  // Save to local activity logs
  const existing = getLocalActivityLogs();
  const updated = [newEntry, ...existing].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to store activity log', e);
  }

  // Update total cumulative study time
  if (durationSeconds > 0) {
    addCumulativeStudyTime(durationSeconds);
  }

  // Send to Google Apps Script Web App
  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors', // Crucial rule: avoid CORS errors
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logActivity',
          studentId: currentStudent,
          sessionId: sessionId || 'N/A',
          type: type || 'Document Viewed',
          detail: detail || 'Active Study Session',
          durationSeconds: durationSeconds || 0
        })
      });
    } catch (err) {
      console.warn('Failed to sync activity log to Google Apps Script', err);
    }
  }

  return newEntry;
}

/**
 * Get stored local activity logs
 */
export function getLocalActivityLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading activity logs', e);
  }
  return [
    {
      id: 'act-1',
      timestamp: '2026-10-15 17:30:12',
      action: 'Document Viewed',
      detail: 'Decimal Forms Class Notes & Formula Sheet',
      duration: '6m 45s'
    },
    {
      id: 'act-2',
      timestamp: '2026-10-15 15:10:05',
      action: '1-4-7 Revision Completed',
      detail: 'Session D3A55669 - Joining parts',
      duration: '12m 10s'
    },
    {
      id: 'act-3',
      timestamp: '2026-10-14 19:45:20',
      action: 'Class Attended',
      detail: 'Session 19B421CE - Decimal Forms',
      duration: '1h 15m'
    }
  ];
}

/**
 * Cumulative study time management (seconds)
 */
export function getCumulativeStudyTime() {
  const sec = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_STUDY_TIME) || '2460', 10);
  return isNaN(sec) ? 2460 : sec; // Default seed 41 mins
}

export function addCumulativeStudyTime(seconds) {
  const current = getCumulativeStudyTime();
  const next = current + seconds;
  localStorage.setItem(STORAGE_KEYS.TOTAL_STUDY_TIME, String(next));
  return next;
}

/**
 * Format date string into minimal, standard format: "Sun, 25 Oct 2026"
 * 3-letter day of week, 2-digit day, 3-letter month, 4-digit year
 */
export function formatMinimalSessionDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
  const trimmed = dateStr.trim();
  if (trimmed.toLowerCase() === 'upcoming') return 'Upcoming';

  let dateObj = null;

  // Try parsing DD/MM/YYYY
  const slashParts = trimmed.split('/');
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10) - 1;
    const year = parseInt(slashParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      dateObj = new Date(year, month, day);
    }
  }

  // Try parsing YYYY-MM-DD or DD-MM-YYYY
  if (!dateObj) {
    const hyphenParts = trimmed.split('-');
    if (hyphenParts.length === 3) {
      if (hyphenParts[0].length === 4) {
        // YYYY-MM-DD
        dateObj = new Date(parseInt(hyphenParts[0], 10), parseInt(hyphenParts[1], 10) - 1, parseInt(hyphenParts[2], 10));
      } else {
        // DD-MM-YYYY
        dateObj = new Date(parseInt(hyphenParts[2], 10), parseInt(hyphenParts[1], 10) - 1, parseInt(hyphenParts[0], 10));
      }
    }
  }

  // Standard Date fallback
  if (!dateObj || isNaN(dateObj.getTime())) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return trimmed;
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayOfWeek = days[dateObj.getDay()];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${dayOfWeek}, ${day} ${month} ${year}`;
}



