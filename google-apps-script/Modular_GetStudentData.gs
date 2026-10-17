/**
 * EDSTAQ Modular Component: GetStudentData
 * Use this module if you prefer splitting Apps Script files across separate tabs.
 */

function handleGetStudentData(e) {
  const params = (e && e.parameter) || {};
  const studentId = params.studentId || 'STD101';
  
  try {
    const payload = getStudentDataPayload(studentId);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      studentId: studentId,
      data: payload
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
