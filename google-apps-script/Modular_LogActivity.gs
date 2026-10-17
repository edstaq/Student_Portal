/**
 * EDSTAQ Modular Component: LogActivity & Settings
 * Handles appending study logs and updating user reminder preferences.
 */

function handleLogActivity(payload) {
  const studentId = payload.studentId || 'STD101';
  const sessionId = payload.sessionId || 'N/A';
  const type = payload.type || 'Document Viewed';
  const detail = payload.detail || '';
  const durationSeconds = payload.durationSeconds || 0;

  const sheet = getOrCreateSheet('Student Activity Log', [
    'Timestamp', 'Student ID', 'Session ID', 'Action Type', 'Detail', 'Duration Seconds'
  ]);

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([timestamp, studentId, sessionId, type, detail, durationSeconds]);

  return { status: 'success', message: 'Activity recorded' };
}
