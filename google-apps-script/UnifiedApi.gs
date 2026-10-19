/**
 * EDSTAQ Student Portal - Multi-Spreadsheet High-Performance Dynamic Unified Backend API
 * 
 * Features:
 * 1. Multi-Spreadsheet Architecture:
 *    - Sheet 1 (Profile & Register): 1ZgBm9UTj9JIpQ_Iq2V8O8IVPNNXUazntu-KrLpORg_I [Tab: Student]
 *    - Sheet 2 (Operations & Classes): 16TYFgItwYH8VgNK_Hpn7BeDQ-xMt41pS2ZD8dLeAJLw [Tabs: Teacher Assign, Class Master, Student Log, Upload File]
 *    - Sheet 3 (App Activity & Settings): 1BOKzKaKEAYCN6Ajt6dPUzJXwnsRpS9E2vUKa1oK26F0 [Tabs: App Student Activity, Student Settings]
 * 2. 100% Dynamic Header Mapping: Does NOT rely on fixed column order (A, B, C).
 * 3. Ultra-Fast Execution: Batch reads with getDataRange().getValues().
 * 4. Safe & Private: Excludes sensitive fields like "Password".
 */

// Configuration - Exact Spreadsheet IDs & Tab Name Aliases
var CONFIG = {
  // Sheet 1: Student Registration Master
  STUDENT_SPREADSHEET_ID: '1ZgBm9UTj9JIpQ_Iq2V8O8IVPNNXUazntu-KrLpORg_I',

  // Sheet 2: Daily Operations, Classes, Allocations, Logs, Uploaded Files
  OPERATIONS_SPREADSHEET_ID: '16TYFgItwYH8VgNK_Hpn7BeDQ-xMt41pS2ZD8dLeAJLw',

  // Sheet 3: App Student Activity & Settings (where the script is hosted)
  ACTIVITY_SPREADSHEET_ID: '1BOKzKaKEAYCN6Ajt6dPUzJXwnsRpS9E2vUKa1oK26F0',

  // Tab Name Aliases (Matches case-insensitively & ignores spaces)
  SHEET_NAMES: {
    STUDENT_REGISTER: ['Student', 'Student Register', 'Students', 'Register'],
    TEACHER_REGISTER: ['Teacher', 'Teachers', 'Teacher Register', 'Teacher Master'],
    SUBJECTS: ['Subjects', 'Subject', 'Subject Master', 'Curriculum'],
    TEACHER_ALLOCATION: ['Teacher Assign', 'Teacher Student Allocation', 'Teacher Allocation', 'Allocation'],
    CLASS_MASTER: ['Class Master', 'Daily Class Master', 'Classes'],
    STUDENT_LOG: ['Student Log', 'Student Logs', 'Teacher Feedback'],
    UPLOADED_FILES: ['Upload File', 'Uploaded Files', 'Files', 'Study Materials'],
    ACTIVITY_LOG: ['App Student Activity', 'Student Activity Log', 'Student Activity', 'Activity Log'],
    SETTINGS: ['Student Settings', 'App Student Settings', 'Settings', 'App Settings']
  }
};

/**
 * RUN THIS ONCE IN THE APPS SCRIPT EDITOR IF ASKED FOR PERMISSIONS:
 * Select "testRunAuthorization" in the function dropdown and click "Run (▶)".
 * This prompts Google's "Authorization Required" popup so you can click "Allow".
 */
function testRunAuthorization() {
  var s1 = SpreadsheetApp.openById(CONFIG.STUDENT_SPREADSHEET_ID);
  Logger.log('Sheet 1 Success: ' + s1.getName());
  var s2 = SpreadsheetApp.openById(CONFIG.OPERATIONS_SPREADSHEET_ID);
  Logger.log('Sheet 2 Success: ' + s2.getName());
  var s3 = SpreadsheetApp.openById(CONFIG.ACTIVITY_SPREADSHEET_ID);
  Logger.log('Sheet 3 Success: ' + s3.getName());
}

/**
 * Handle GET Requests
 * Endpoints:
 * 1. ?action=ping                  -> Connectivity test
 * 2. ?action=getStudentData&studentId=STD101 -> Full student payload
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'ping';

    if (action === 'ping') {
      return createJsonResponse({
        status: 'success',
        message: 'EDSTAQ Learning Portal API is live and connected!',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'debug') {
      var diag = { sheets: {}, errors: {} };
      try {
        var s1 = SpreadsheetApp.openById(CONFIG.STUDENT_SPREADSHEET_ID);
        diag.sheets.studentSheetName = s1.getName();
        diag.sheets.studentTabs = s1.getSheets().map(function(s){ return s.getName(); });
      } catch(e1) { diag.errors.studentSheet = e1.toString(); }

      try {
        var s2 = SpreadsheetApp.openById(CONFIG.OPERATIONS_SPREADSHEET_ID);
        diag.sheets.operationsSheetName = s2.getName();
        diag.sheets.operationsTabs = s2.getSheets().map(function(s){ return s.getName(); });
      } catch(e2) { diag.errors.operationsSheet = e2.toString(); }

      try {
        var s3 = SpreadsheetApp.openById(CONFIG.ACTIVITY_SPREADSHEET_ID);
        diag.sheets.activitySheetName = s3.getName();
        diag.sheets.activityTabs = s3.getSheets().map(function(s){ return s.getName(); });
      } catch(e3) { diag.errors.activitySheet = e3.toString(); }

      return createJsonResponse(diag);
    }

    if (action === 'getStudentData') {
      var studentId = params.studentId || 'STD101';
      var payload = getStudentDataPayload(studentId);
      return createJsonResponse({
        status: 'success',
        studentId: studentId,
        data: payload
      });
    }

    if (action === 'getSiblings') {
      var sidParam = params.studentId || '';
      var contactParam = params.guardianContact || '';
      var payload = getStudentDataPayload(sidParam);
      return createJsonResponse({
        status: 'success',
        studentId: sidParam,
        siblings: payload.siblings || []
      });
    }

    if (action === 'login') {
      return handleLogin(params);
    }

    if (action === 'changePassword') {
      return handleChangePassword(params);
    }

    return createJsonResponse({
      status: 'error',
      message: 'Unknown GET action: ' + action
    }, 400);

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    }, 500);
  }
}

/**
 * Handle POST Requests
 * Endpoints:
 * 1. action=logActivity -> Appends study activity to "App Student Activity"
 * 2. action=saveSettings -> Upserts student preferences to "Student Settings"
 * 3. action=login -> Authenticates student with ID and Password
 * 4. action=changePassword -> Updates student password
 */
function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || 'logActivity';

    if (action === 'logActivity') {
      return handleLogActivity(payload);
    }

    if (action === 'saveSettings') {
      return handleSaveSettings(payload);
    }

    if (action === 'login') {
      return handleLogin(payload);
    }

    if (action === 'changePassword') {
      return handleChangePassword(payload);
    }

    return createJsonResponse({
      status: 'error',
      message: 'Unknown POST action: ' + action
    }, 400);

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    }, 500);
  }
}

// ============================================================================
// SPREADSHEET & TAB RESOLUTION (Smart Sheet Finder)
// ============================================================================

/**
 * Normalizes any string: "Teacher Assign" -> "teacherassign"
 */
function cleanKey(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds a tab in a spreadsheet by trying aliases with case & space insensitive matching
 */
function findSheetInSpreadsheet(ss, aliases) {
  if (!ss) return null;
  // 1. Direct match
  for (var i = 0; i < aliases.length; i++) {
    var s = ss.getSheetByName(aliases[i]);
    if (s) return s;
  }
  // 2. Normalized match
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) {
    var sNameClean = cleanKey(sheets[j].getName());
    for (var k = 0; k < aliases.length; k++) {
      if (sNameClean === cleanKey(aliases[k])) {
        return sheets[j];
      }
    }
  }
  return null;
}

/**
 * Cache spreadsheet instances to prevent repeated openById calls
 */
var _ssCache = {};
function getSpreadsheetById(id) {
  if (!id) return null;
  if (!_ssCache[id]) {
    try {
      _ssCache[id] = SpreadsheetApp.openById(id);
    } catch (e) {
      Logger.log('Could not open spreadsheet ' + id + ': ' + e);
      return null;
    }
  }
  return _ssCache[id];
}

/**
 * Resolves sheet dynamically from the correct spreadsheet
 */
function resolveSheet(aliases, targetSpreadsheetId) {
  // Try targeted spreadsheet first
  if (targetSpreadsheetId) {
    var targetSs = getSpreadsheetById(targetSpreadsheetId);
    if (targetSs) {
      var sh = findSheetInSpreadsheet(targetSs, aliases);
      if (sh) return sh;
    }
  }

  // Fallback to active spreadsheet
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      var activeSh = findSheetInSpreadsheet(activeSs, aliases);
      if (activeSh) return activeSh;
    }
  } catch (e) {}

  return null;
}

/**
 * Converts a raw header string into clean camelCase for the frontend:
 * e.g. "Student ID" -> "studentId", "Session ID" -> "sessionId"
 */
function toCamelCase(str) {
  var cleaned = String(str || '').trim();
  if (!cleaned) return '';
  return cleaned
    .replace(/[^a-zA-Z0-9]+(.)/g, function(_, chr) { return chr.toUpperCase(); })
    .replace(/^([A-Z])/, function(_, chr) { return chr.toLowerCase(); });
}

/**
 * Reads a sheet once and returns structured rows as JavaScript objects
 * dynamically mapped from Row 1 header names.
 */
function readSheetWithDynamicHeaders(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var headers = data[0];
  var headerCount = headers.length;
  
  var camelKeys = new Array(headerCount);
  for (var h = 0; h < headerCount; h++) {
    camelKeys[h] = toCamelCase(headers[h]);
  }

  var timeZone = Session.getScriptTimeZone() || 'GMT';
  var result = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var obj = {};
    var hasContent = false;

    for (var c = 0; c < headerCount; c++) {
      var val = row[c];
      if (val instanceof Date) {
        var year = val.getFullYear();
        // If year is 1899 or 1900, Google Sheets represents a pure TIME value
        if (year === 1899 || year === 1900) {
          val = Utilities.formatDate(val, timeZone, 'hh:mm a');
        } else {
          val = Utilities.formatDate(val, timeZone, 'dd/MM/yyyy');
        }
      }
      var cKey = camelKeys[c];
      if (cKey) {
        obj[cKey] = val;
      }
      obj[headers[c]] = val;

      if (val !== '' && val !== null && val !== undefined) {
        hasContent = true;
      }
    }

    if (hasContent) {
      result.push(obj);
    }
  }

  return result;
}

/**
 * Finds a row value using flexible header matching
 */
function getFieldValue(obj, possibleNames) {
  if (!obj) return '';
  for (var i = 0; i < possibleNames.length; i++) {
    var p = possibleNames[i];
    var c = cleanKey(p);
    for (var key in obj) {
      if (cleanKey(key) === c && obj[key] !== undefined && obj[key] !== '') {
        return obj[key];
      }
    }
  }
  return '';
}

// ============================================================================
// MAIN DATA PAYLOAD ASSEMBLER
// ============================================================================

function getStudentDataPayload(targetStudentId) {
  var normalizedTargetId = String(targetStudentId || 'STD101').trim().toLowerCase();

  // 1. Student Profile from Sheet 1 ("Student")
  var studentSheet = resolveSheet(CONFIG.SHEET_NAMES.STUDENT_REGISTER, CONFIG.STUDENT_SPREADSHEET_ID);
  var regRows = readSheetWithDynamicHeaders(studentSheet);
  var matchedProfile = null;

  var targetDigits = normalizedTargetId.replace(/\D/g, '');
  var target10 = targetDigits.length >= 7 ? targetDigits.slice(-10) : '';

  for (var i = 0; i < regRows.length; i++) {
    var sid = getFieldValue(regRows[i], ['Student ID', 'studentId', 'ID', 'StudentID']);
    var contact = getFieldValue(regRows[i], ['Contact Number', 'contactNumber', 'contact', 'Phone', 'Mobile']);
    var rowContactDigits = String(contact || '').replace(/\D/g, '');
    var rowContact10 = rowContactDigits.length >= 7 ? rowContactDigits.slice(-10) : '';

    if (String(sid).trim().toLowerCase() === normalizedTargetId || 
        (target10 && rowContact10 && rowContact10 === target10)) {
      matchedProfile = regRows[i];
      break;
    }
  }

  // Fallback to first student if specific ID not found
  if (!matchedProfile && regRows.length > 0) {
    matchedProfile = regRows[0];
  }
  matchedProfile = matchedProfile || {};

  // Clean sensitive fields like password
  var profile = {};
  for (var k in matchedProfile) {
    if (cleanKey(k) !== 'password') {
      profile[toCamelCase(k) || k] = matchedProfile[k];
    }
  }

  // 1b. Real Sibling Resolution: match other students sharing the same guardian/parent contact
  var siblings = [];
  var matchedGuardianContact = String(
    getFieldValue(matchedProfile, ['Guardian Contact', 'guardianContact', 'Contact Number', 'contactNumber', 'contact', 'guardianMobile']) || ''
  ).replace(/\D/g, '');

  if (matchedGuardianContact && matchedGuardianContact.length >= 7) {
    var match10 = matchedGuardianContact.slice(-10);
    var seenStudentIds = {};
    for (var sr = 0; sr < regRows.length; sr++) {
      var rowGContact = String(getFieldValue(regRows[sr], ['Guardian Contact', 'guardianContact']) || '').replace(/\D/g, '');
      var rowSContact = String(getFieldValue(regRows[sr], ['Contact Number', 'contactNumber', 'contact', 'guardianMobile']) || '').replace(/\D/g, '');

      var row10_G = rowGContact.length >= 7 ? rowGContact.slice(-10) : '';
      var row10_S = rowSContact.length >= 7 ? rowSContact.slice(-10) : '';

      // Match if guardian contact OR student contact has the same last 10 digits (even if active or not)
      if ((row10_G && row10_G === match10) || (row10_S && row10_S === match10)) {
        var sid = getFieldValue(regRows[sr], ['Student ID', 'studentId', 'ID', 'StudentID']);
        var sname = getFieldValue(regRows[sr], ['Student Name', 'studentName', 'Name', 'FullName']);
        var sclass = getFieldValue(regRows[sr], ['Registered Class', 'registeredClass', 'Class', 'class']);
        var sstatus = getFieldValue(regRows[sr], ['Status', 'status', 'Student Status']) || 'Active';
        if (sid) {
          var cleanSid = String(sid).trim();
          if (!seenStudentIds[cleanSid.toLowerCase()]) {
            seenStudentIds[cleanSid.toLowerCase()] = true;
            siblings.push({
              studentId: cleanSid,
              studentName: String(sname || cleanSid).trim(),
              registeredClass: String(sclass || '').trim(),
              status: String(sstatus).trim()
            });
          }
        }
      }
    }
  }

  if (siblings.length === 0 && profile.studentId) {
    siblings.push({
      studentId: profile.studentId,
      studentName: profile.studentName || profile.studentId,
      registeredClass: profile.registeredClass || '',
      status: 'Active'
    });
  }

  // 1b. Teacher Register from Sheet 1 ("Teacher") to resolve Teacher Names
  var teacherMap = {};
  try {
    var teacherSheet = resolveSheet(CONFIG.SHEET_NAMES.TEACHER_REGISTER, CONFIG.STUDENT_SPREADSHEET_ID);
    if (teacherSheet) {
      var teacherRows = readSheetWithDynamicHeaders(teacherSheet);
      for (var t = 0; t < teacherRows.length; t++) {
        var tid = getFieldValue(teacherRows[t], ['Teacher ID', 'teacherId', 'ID', 'TeacherID']);
        var tname = getFieldValue(teacherRows[t], ['Name', 'Teacher Name', 'teacherName', 'FullName', 'Full Name']);
        if (tid && tname) {
          teacherMap[String(tid).trim().toLowerCase()] = String(tname).trim();
        }
      }
    }
  } catch (tErr) {
    Logger.log('Could not load Teacher sheet: ' + tErr);
  }

  // 1c. Subjects Master from Sheet 1 ("Subjects") to resolve Subject Names, Labels, and Textbook Links
  var subjectMap = {};
  try {
    var subjectSheet = resolveSheet(CONFIG.SHEET_NAMES.SUBJECTS, CONFIG.STUDENT_SPREADSHEET_ID);
    if (subjectSheet) {
      var subjectRows = readSheetWithDynamicHeaders(subjectSheet);
      for (var s = 0; s < subjectRows.length; s++) {
        var subId = getFieldValue(subjectRows[s], ['Subject ID', 'subjectId', 'ID', 'SubjectID', 'SUB ID']);
        if (subId) {
          var subKey = String(subId).trim().toLowerCase();
          subjectMap[subKey] = {
            subjectId: String(subId).trim(),
            subjectName: String(getFieldValue(subjectRows[s], ['Subject Name', 'subjectName', 'Name', 'Subject'])).trim(),
            label: String(getFieldValue(subjectRows[s], ['Label', 'label', 'Subject Label', 'subjectLabel'])).trim(),
            category: String(getFieldValue(subjectRows[s], ['Category', 'category'])).trim(),
            board: String(getFieldValue(subjectRows[s], ['Board', 'board'])).trim(),
            level: String(getFieldValue(subjectRows[s], ['Level', 'level'])).trim(),
            stage: String(getFieldValue(subjectRows[s], ['Stage', 'stage', 'Class'])).trim(),
            source: String(getFieldValue(subjectRows[s], ['Source', 'source', 'Link', 'URL', 'Textbook Link'])).trim(),
            description: String(getFieldValue(subjectRows[s], ['Subject Description', 'description'])).trim(),
            status: String(getFieldValue(subjectRows[s], ['Status', 'status'])).trim()
          };
        }
      }
    }
  } catch (sErr) {
    Logger.log('Could not load Subjects sheet: ' + sErr);
  }

  // 2. Allocations from Sheet 2 ("Teacher Assign")
  var allocSheet = resolveSheet(CONFIG.SHEET_NAMES.TEACHER_ALLOCATION, CONFIG.OPERATIONS_SPREADSHEET_ID);
  var allocRows = readSheetWithDynamicHeaders(allocSheet);
  var allocations = [];
  for (var a = 0; a < allocRows.length; a++) {
    var aId = getFieldValue(allocRows[a], ['Student ID', 'studentId', 'ID', 'StudentID']);
    if (String(aId).trim().toLowerCase() === normalizedTargetId) {
      var aObj = allocRows[a];
      var aTid = getFieldValue(aObj, ['Teacher ID', 'teacherId', 'TeacherID']);
      if (aTid) {
        var aTidStr = String(aTid).trim();
        aObj.teacherID = aTidStr;
        aObj.teacherId = aTidStr;
        if (teacherMap[aTidStr.toLowerCase()]) {
          aObj.teacherName = teacherMap[aTidStr.toLowerCase()];
        }
      }
      var aSubId = getFieldValue(aObj, ['Subject ID', 'subjectID', 'SubjectId', 'SUB ID']);
      if (aSubId) {
        var aSubStr = String(aSubId).trim();
        aObj.subjectID = aSubStr;
        aObj.subjectId = aSubStr;
        if (subjectMap[aSubStr.toLowerCase()]) {
          var asInfo = subjectMap[aSubStr.toLowerCase()];
          if (asInfo.subjectName) aObj.subjectName = asInfo.subjectName;
          if (asInfo.label) aObj.subjectLabel = asInfo.label;
          if (asInfo.source) aObj.subjectSource = asInfo.source;
          if (asInfo.board) aObj.board = asInfo.board;
          if (asInfo.category) aObj.category = asInfo.category;
        }
      }
      allocations.push(aObj);
    }
  }

  // 3. Classes from Sheet 2 ("Class Master")
  var classSheet = resolveSheet(CONFIG.SHEET_NAMES.CLASS_MASTER, CONFIG.OPERATIONS_SPREADSHEET_ID);
  var classRows = readSheetWithDynamicHeaders(classSheet);
  var classes = [];
  var sessionSet = {};

  for (var c = 0; c < classRows.length; c++) {
    var cId = getFieldValue(classRows[c], ['Student ID', 'studentId', 'ID', 'StudentID']);
    if (String(cId).trim().toLowerCase() === normalizedTargetId) {
      var clsObj = classRows[c];
      var cTid = getFieldValue(clsObj, ['Teacher ID', 'teacherId', 'TeacherID']);
      if (cTid) {
        var cTidStr = String(cTid).trim();
        clsObj.teacherID = cTidStr;
        clsObj.teacherId = cTidStr;
        if (teacherMap[cTidStr.toLowerCase()]) {
          clsObj.teacherName = teacherMap[cTidStr.toLowerCase()];
        }
      }
      var cSubId = getFieldValue(clsObj, ['Subject ID', 'subjectID', 'SubjectId', 'SUB ID']);
      if (cSubId) {
        var cSubStr = String(cSubId).trim();
        clsObj.subjectID = cSubStr;
        clsObj.subjectId = cSubStr;
        if (subjectMap[cSubStr.toLowerCase()]) {
          var csInfo = subjectMap[cSubStr.toLowerCase()];
          if (csInfo.subjectName) clsObj.subjectName = csInfo.subjectName;
          if (csInfo.label) clsObj.subjectLabel = csInfo.label;
          if (csInfo.source) clsObj.subjectSource = csInfo.source;
          if (csInfo.board) clsObj.board = csInfo.board;
        }
      }
      classes.push(clsObj);
      var sId = getFieldValue(classRows[c], ['Session ID', 'sessionId']);
      if (sId) sessionSet[String(sId).trim()] = true;
    }
  }

  // 4. Logs from Sheet 2 ("Student Log")
  var logSheet = resolveSheet(CONFIG.SHEET_NAMES.STUDENT_LOG, CONFIG.OPERATIONS_SPREADSHEET_ID);
  var logRows = readSheetWithDynamicHeaders(logSheet);
  var logs = [];
  for (var l = 0; l < logRows.length; l++) {
    var lId = getFieldValue(logRows[l], ['Student ID', 'studentId', 'ID', 'StudentID']);
    if (String(lId).trim().toLowerCase() === normalizedTargetId) {
      logs.push(logRows[l]);
    }
  }

  // 5. Uploaded Files from Sheet 2 ("Upload File")
  var fileSheet = resolveSheet(CONFIG.SHEET_NAMES.UPLOADED_FILES, CONFIG.OPERATIONS_SPREADSHEET_ID);
  var fileRows = readSheetWithDynamicHeaders(fileSheet);
  var files = [];
  for (var f = 0; f < fileRows.length; f++) {
    var fSessionId = String(getFieldValue(fileRows[f], ['Session ID', 'sessionId'])).trim();
    var fStudentId = String(getFieldValue(fileRows[f], ['Student ID', 'studentId', 'StudentID'])).trim().toLowerCase();

    // Match either by Session ID or Student ID
    if ((fSessionId && sessionSet[fSessionId]) || (fStudentId && fStudentId === normalizedTargetId)) {
      files.push(fileRows[f]);
    }
  }

  // 6. Settings from Sheet 3 ("Student Settings")
  var settingsSheet = resolveSheet(CONFIG.SHEET_NAMES.SETTINGS, CONFIG.ACTIVITY_SPREADSHEET_ID);
  var settings = { preferredReminderTime: '19:00', notificationsEnabled: true };

  if (settingsSheet) {
    var setRows = readSheetWithDynamicHeaders(settingsSheet);
    for (var s = 0; s < setRows.length; s++) {
      var sId = getFieldValue(setRows[s], ['Student ID', 'studentId', 'ID', 'StudentID']);
      if (String(sId).trim().toLowerCase() === normalizedTargetId) {
        var timeVal = getFieldValue(setRows[s], ['Preferred Reminder Time', 'preferredReminderTime', 'Reminder Time']);
        var notifVal = getFieldValue(setRows[s], ['Notifications Enabled', 'notificationsEnabled', 'Notification']);
        if (timeVal) settings.preferredReminderTime = String(timeVal);
        if (notifVal !== '') settings.notificationsEnabled = notifVal !== false && String(notifVal).toLowerCase() !== 'false';
        break;
      }
    }
  }

  return {
    profile: profile,
    siblings: siblings,
    allocations: allocations,
    classes: classes,
    logs: logs,
    files: files,
    settings: settings,
    subjects: subjectMap
  };
}

// ============================================================================
// WRITE OPERATIONS (Dynamic Column Mapping, No Fixed Positions)
// ============================================================================

/**
 * Logs study activity dynamically matching sheet headers
 */
function handleLogActivity(payload) {
  var studentId = payload.studentId || 'STD101';
  var sessionId = payload.sessionId || 'N/A';
  var actionType = payload.type || payload.actionType || 'General Activity';
  var detail = payload.detail || '';
  var durationSeconds = Number(payload.durationSeconds) || 0;

  var defaultHeaders = [
    'Timestamp',
    'Student ID',
    'Session ID',
    'Action Type',
    'Detail',
    'Duration Seconds'
  ];

  var sheet = resolveSheet(CONFIG.SHEET_NAMES.ACTIVITY_LOG, CONFIG.ACTIVITY_SPREADSHEET_ID);
  if (!sheet) {
    sheet = getOrCreateSheet('App Student Activity', defaultHeaders, CONFIG.ACTIVITY_SPREADSHEET_ID);
  }

  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  if (!headers || headers.length === 0 || !headers[0]) {
    sheet.appendRow(defaultHeaders);
    headers = defaultHeaders;
  }

  var timeZone = Session.getScriptTimeZone() || 'GMT';
  var timestamp = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss');

  // Build row array strictly based on the order of headers in Row 1!
  var rowData = new Array(headers.length);
  for (var c = 0; c < headers.length; c++) {
    var h = cleanKey(headers[c]);
    if (h.indexOf('time') !== -1 || h.indexOf('date') !== -1) {
      rowData[c] = timestamp;
    } else if (h.indexOf('studentid') !== -1 || h === 'student') {
      rowData[c] = studentId;
    } else if (h.indexOf('session') !== -1) {
      rowData[c] = sessionId;
    } else if (h.indexOf('type') !== -1 || h.indexOf('action') !== -1) {
      rowData[c] = actionType;
    } else if (h.indexOf('detail') !== -1 || h.indexOf('desc') !== -1 || h.indexOf('note') !== -1) {
      rowData[c] = detail;
    } else if (h.indexOf('duration') !== -1 || h.indexOf('second') !== -1) {
      rowData[c] = durationSeconds;
    } else {
      rowData[c] = '';
    }
  }

  sheet.appendRow(rowData);

  return createJsonResponse({
    status: 'success',
    message: 'Activity logged successfully'
  });
}

/**
 * Saves/Updates student settings dynamically matching sheet headers
 */
function handleSaveSettings(payload) {
  var studentId = String(payload.studentId || 'STD101').trim();
  var reminderTime = String(payload.preferredReminderTime || '19:00').trim();
  var notificationsEnabled = payload.notificationsEnabled !== false;

  var defaultHeaders = [
    'Student ID',
    'Preferred Reminder Time',
    'Notifications Enabled',
    'Last Updated'
  ];

  var sheet = resolveSheet(CONFIG.SHEET_NAMES.SETTINGS, CONFIG.ACTIVITY_SPREADSHEET_ID);
  if (!sheet) {
    sheet = getOrCreateSheet('Student Settings', defaultHeaders, CONFIG.ACTIVITY_SPREADSHEET_ID);
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Map header column indices dynamically
  var colStudentId = -1;
  var colReminder = -1;
  var colNotif = -1;
  var colUpdated = -1;

  for (var c = 0; c < headers.length; c++) {
    var h = cleanKey(headers[c]);
    if (h.indexOf('studentid') !== -1 || h === 'student' || h === 'id') colStudentId = c;
    else if (h.indexOf('remind') !== -1 || h.indexOf('time') !== -1) colReminder = c;
    else if (h.indexOf('notif') !== -1) colNotif = c;
    else if (h.indexOf('update') !== -1 || h.indexOf('date') !== -1) colUpdated = c;
  }

  if (colStudentId === -1) colStudentId = 0;
  if (colReminder === -1) colReminder = 1;
  if (colNotif === -1) colNotif = 2;
  if (colUpdated === -1) colUpdated = 3;

  var timeZone = Session.getScriptTimeZone() || 'GMT';
  var nowFormatted = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss');

  // Search if student already exists (1-based row index)
  var targetRow = -1;
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][colStudentId]).trim().toLowerCase() === studentId.toLowerCase()) {
      targetRow = r + 1; // 1-indexed for Sheets
      break;
    }
  }

  if (targetRow > 0) {
    // Fast batch update
    sheet.getRange(targetRow, colReminder + 1).setValue(reminderTime);
    sheet.getRange(targetRow, colNotif + 1).setValue(notificationsEnabled);
    sheet.getRange(targetRow, colUpdated + 1).setValue(nowFormatted);
  } else {
    // Append new row matching column count
    var newRow = new Array(headers.length);
    for (var i = 0; i < headers.length; i++) newRow[i] = '';
    newRow[colStudentId] = studentId;
    newRow[colReminder] = reminderTime;
    newRow[colNotif] = notificationsEnabled;
    newRow[colUpdated] = nowFormatted;
    sheet.appendRow(newRow);
  }

  return createJsonResponse({
    status: 'success',
    message: 'Settings saved successfully'
  });
}

/**
 * Student Login Authenticator
 * Primary: Contact Number (Mobile Number) + Password
 * Fallback: Student ID + Password
 * If multiple students share the same contact number (siblings), the first student is authenticated,
 * and the portal's sibling switcher allows toggling between them seamlessly.
 */
function handleLogin(payload) {
  var inputIdentifier = String(
    payload.contactNumber || 
    payload.mobileNumber || 
    payload.phone || 
    payload.studentId || 
    payload.id || 
    payload.identifier || 
    ''
  ).trim();
  var password = String(payload.password || '').trim();

  if (!inputIdentifier) {
    return createJsonResponse({ status: 'error', message: 'Please enter your Mobile Number' }, 400);
  }
  if (!password) {
    return createJsonResponse({ status: 'error', message: 'Please enter your Password' }, 400);
  }

  var studentSheet = resolveSheet(CONFIG.SHEET_NAMES.STUDENT_REGISTER, CONFIG.STUDENT_SPREADSHEET_ID);
  if (!studentSheet) {
    return createJsonResponse({ status: 'error', message: 'Student Register sheet not accessible' }, 500);
  }

  var data = studentSheet.getDataRange().getValues();
  if (data.length < 2) {
    return createJsonResponse({ status: 'error', message: 'No student records found' }, 404);
  }

  var headers = data[0];
  var colStudentId = -1;
  var colPassword = -1;
  var colName = -1;
  var colContact = -1;

  for (var c = 0; c < headers.length; c++) {
    var h = cleanKey(headers[c]);
    if (h.indexOf('studentid') !== -1 || h === 'student' || h === 'id') colStudentId = c;
    else if (h.indexOf('password') !== -1 || h === 'pass' || h === 'pwd') colPassword = c;
    else if (h.indexOf('studentname') !== -1 || h === 'name') colName = c;
    else if (h.indexOf('contact') !== -1 || h.indexOf('mobile') !== -1 || h.indexOf('phone') !== -1) colContact = c;
  }

  if (colStudentId === -1) colStudentId = 0;

  var targetRowIndex = -1;
  var matchedRow = null;

  var digitsOnly = inputIdentifier.replace(/\D/g, '');
  var inputLast10 = digitsOnly.length >= 7 ? digitsOnly.slice(-10) : digitsOnly;

  // 1. First priority: Match by Contact Number column
  if (colContact !== -1) {
    for (var r = 1; r < data.length; r++) {
      var rowContactRaw = String(data[r][colContact] || '').trim();
      var rowContactDigits = rowContactRaw.replace(/\D/g, '');
      var rowContact10 = rowContactDigits.length >= 7 ? rowContactDigits.slice(-10) : rowContactDigits;

      if ((inputLast10 && rowContact10 && rowContact10 === inputLast10) || 
          (rowContactRaw && rowContactRaw.toLowerCase() === inputIdentifier.toLowerCase())) {
        targetRowIndex = r;
        matchedRow = data[r];
        break; // Match first student in case of siblings sharing the same mobile number
      }
    }
  }

  // 2. Second priority / fallback: Match by Student ID
  if (!matchedRow && colStudentId !== -1) {
    for (var r = 1; r < data.length; r++) {
      var sVal = String(data[r][colStudentId] || '').trim();
      if (sVal.toLowerCase() === inputIdentifier.toLowerCase()) {
        targetRowIndex = r;
        matchedRow = data[r];
        break;
      }
    }
  }

  if (!matchedRow) {
    return createJsonResponse({ status: 'error', message: 'Mobile Number not found. Please check and try again.' }, 401);
  }

  var storedPassword = colPassword !== -1 ? String(matchedRow[colPassword] || '').trim() : '';
  var studentContact = colContact !== -1 ? String(matchedRow[colContact] || '').trim() : '';
  var studentName = colName !== -1 ? String(matchedRow[colName] || 'Student').trim() : 'Student';
  var studentId = String(matchedRow[colStudentId] || '').trim();

  // Validation logic:
  // 1. If stored password exists in sheet, compare directly
  // 2. If stored password is blank, allow 12345678, contact number, or 'edstaq123' as initial default password
  var isValid = false;
  if (storedPassword) {
    isValid = (storedPassword === password);
  } else {
    var contactDigits = studentContact.replace(/\D/g, '');
    var contact10 = contactDigits.length >= 7 ? contactDigits.slice(-10) : contactDigits;
    var passDigits = password.replace(/\D/g, '');

    if (password === '12345678' || 
        password === 'edstaq123' ||
        (studentContact && password === studentContact) ||
        (contact10 && passDigits && contact10 === passDigits)) {
      isValid = true;
      // Auto-initialize Password column if missing or empty
      if (colPassword === -1) {
        var newCol = headers.length + 1;
        studentSheet.getRange(1, newCol).setValue('Password');
        studentSheet.getRange(targetRowIndex + 1, newCol).setValue(password);
      } else {
        studentSheet.getRange(targetRowIndex + 1, colPassword + 1).setValue(password);
      }
    }
  }

  if (!isValid) {
    return createJsonResponse({ status: 'error', message: 'Incorrect Password. Please try again.' }, 401);
  }

  return createJsonResponse({
    status: 'success',
    message: 'Login successful',
    studentId: studentId,
    studentName: studentName,
    contactNumber: studentContact,
    token: 'EDSTAQ_' + studentId + '_' + Date.now()
  });
}

/**
 * Change Student Password
 */
function handleChangePassword(payload) {
  var identifier = String(payload.studentId || payload.contactNumber || payload.id || '').trim();
  var currentPassword = String(payload.currentPassword || '').trim();
  var newPassword = String(payload.newPassword || '').trim();

  if (!identifier || !newPassword) {
    return createJsonResponse({ status: 'error', message: 'Student ID and new password are required' }, 400);
  }
  if (newPassword.length < 4) {
    return createJsonResponse({ status: 'error', message: 'New password must be at least 4 characters long' }, 400);
  }

  var studentSheet = resolveSheet(CONFIG.SHEET_NAMES.STUDENT_REGISTER, CONFIG.STUDENT_SPREADSHEET_ID);
  if (!studentSheet) {
    return createJsonResponse({ status: 'error', message: 'Student sheet not accessible' }, 500);
  }

  var data = studentSheet.getDataRange().getValues();
  var headers = data[0];
  var colStudentId = -1;
  var colPassword = -1;
  var colContact = -1;

  for (var c = 0; c < headers.length; c++) {
    var h = cleanKey(headers[c]);
    if (h.indexOf('studentid') !== -1 || h === 'student' || h === 'id') colStudentId = c;
    else if (h.indexOf('password') !== -1 || h === 'pass' || h === 'pwd') colPassword = c;
    else if (h.indexOf('contact') !== -1 || h.indexOf('phone') !== -1) colContact = c;
  }

  if (colStudentId === -1) colStudentId = 0;

  var targetRowIndex = -1;
  var matchedRow = null;

  var idDigits = identifier.replace(/\D/g, '');
  var id10 = idDigits.length >= 7 ? idDigits.slice(-10) : '';

  for (var r = 1; r < data.length; r++) {
    var sidVal = String(data[r][colStudentId] || '').trim().toLowerCase();
    var contactVal = colContact !== -1 ? String(data[r][colContact] || '').replace(/\D/g, '') : '';
    var contact10 = contactVal.length >= 7 ? contactVal.slice(-10) : '';

    if (sidVal === identifier.toLowerCase() || (id10 && contact10 && id10 === contact10)) {
      targetRowIndex = r;
      matchedRow = data[r];
      break;
    }
  }

  if (!matchedRow) {
    return createJsonResponse({ status: 'error', message: 'Student not found' }, 404);
  }

  var storedPassword = colPassword !== -1 ? String(matchedRow[colPassword] || '').trim() : '';
  var studentContact = colContact !== -1 ? String(matchedRow[colContact] || '').trim() : '';

  // Verify current password
  var isCurrentValid = false;
  if (storedPassword) {
    isCurrentValid = (storedPassword === currentPassword);
  } else {
    // If no password set yet in sheet, allow default 12345678, edstaq123, contact number, or initial setup
    isCurrentValid = (currentPassword === '12345678' || currentPassword === 'edstaq123' || (studentContact && currentPassword === studentContact) || !currentPassword);
  }

  if (!isCurrentValid) {
    return createJsonResponse({ status: 'error', message: 'Current password is incorrect' }, 401);
  }

  // If Password column doesn't exist yet, add it
  if (colPassword === -1) {
    colPassword = headers.length;
    studentSheet.getRange(1, colPassword + 1).setValue('Password');
  }

  // Write new password into the exact row and column
  studentSheet.getRange(targetRowIndex + 1, colPassword + 1).setValue(newPassword);
  SpreadsheetApp.flush();

  return createJsonResponse({
    status: 'success',
    message: 'Password changed successfully!'
  });
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function getOrCreateSheet(sheetName, defaultHeaders, targetSpreadsheetId) {
  var targetSs = getSpreadsheetById(targetSpreadsheetId) || SpreadsheetApp.getActiveSpreadsheet();

  var sheet = targetSs.getSheetByName(sheetName);
  if (!sheet) {
    sheet = targetSs.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
      var headerRange = sheet.getRange(1, 1, 1, defaultHeaders.length);
      headerRange.setBackground('#001789');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function createJsonResponse(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
