// EDSTAQ Student Portal - Master Mock Data
// Exactly matches Google Sheets schema

export const MOCK_STUDENTS = [
  {
    studentId: 'STD101',
    studentName: 'Safa Salwa Pk',
    contact: '9526859832',
    email: 'sherinshahla64@gmail.com',
    dob: '11/06/2014',
    address: 'Valamboor, Kerala, India',
    guardianContact: '9526859832',
    guardianName: 'Shahla Sherin',
    guardianRelation: 'Mother',
    registeredClass: 'Class 6',
    board: 'Kerala',
    school: 'A. M. U. P SCHOOL KOOTTIL',
    referredBy: 'Advertisement',
    date: '29/10/2025',
    dashboardUrl: 'https://edstaq.github.io/progress_dashboard/?id=STD101',
    registrationAmt: 50,
    paymentMode: 'After',
    periodInDays: 10
  },
  {
    studentId: 'STD102',
    studentName: 'Liya Fathima.v',
    contact: '8943695345',
    email: 'sameerashabeer994@gmail.com',
    dob: '18/01/2012',
    address: 'Vayangara Malappuram',
    guardianContact: '8943695345',
    guardianName: 'Sameera shabeer',
    guardianRelation: 'Mother',
    registeredClass: 'Class 9',
    board: 'Kerala',
    school: 'Ichss shanthapuram',
    referredBy: 'Advertisement',
    date: '09/11/2025',
    dashboardUrl: 'https://edstaq.github.io/progress_dashboard/?id=STD102',
    registrationAmt: 50,
    paymentMode: 'Before',
    periodInDays: 10
  },
  {
    studentId: 'STD103',
    studentName: 'Arav Krishna K',
    contact: '8606625068',
    email: '11divyae@gmail.com',
    dob: '23/07/2013',
    address: 'Malhar, Kolathuparamba, Kottakkal',
    guardianContact: '8606625068',
    guardianName: 'Divya',
    guardianRelation: 'Mother',
    registeredClass: 'Class 6',
    board: 'Kerala',
    school: 'AKMHSS KOTTOOR',
    referredBy: 'on a call',
    date: '09/11/2025',
    dashboardUrl: 'https://edstaq.github.io/progress_dashboard/?id=STD103',
    registrationAmt: 50,
    paymentMode: 'Before',
    periodInDays: 10
  },
  {
    studentId: 'STD104',
    studentName: 'Badhi Mohammed V',
    contact: '9605056597',
    email: 'aysharisha92@gmail.com',
    dob: '22/01/2019',
    address: 'Perinthalmanna',
    guardianContact: '9605056597',
    guardianName: 'Aysha Risha T A',
    guardianRelation: 'Mother',
    registeredClass: 'Class / Grade 2',
    board: 'STATE',
    school: 'GLPS KARA',
    referredBy: 'Contacted from office',
    date: '25/11/2025',
    dashboardUrl: 'https://edstaq.github.io/progress_dashboard/?id=STD104',
    registrationAmt: 50,
    paymentMode: 'After',
    periodInDays: 7
  },
  {
    studentId: 'STD105',
    studentName: 'Aysha Nasha A',
    contact: '8086930308',
    email: 'nasiaslam308@gmail.com',
    dob: '20/08/2013',
    address: 'Pattikkad Santhapuram Malappuram',
    guardianContact: '8086930308',
    guardianName: 'Aslam Habeeb',
    guardianRelation: 'Father',
    registeredClass: 'Class / Grade 6',
    board: 'Kerala',
    school: 'PTMAUPS Mulliakurssi',
    referredBy: 'Contacted from office',
    date: '13/12/2025',
    dashboardUrl: 'https://edstaq.github.io/progress_dashboard/?id=STD105',
    registrationAmt: 50,
    paymentMode: 'After',
    periodInDays: 3
  },
  {
    studentId: 'STD106',
    studentName: 'Prarthana',
    contact: '8113884453',
    email: 'dhanyavinesh49@email.com',
    dob: '10/03/2013',
    address: 'Parakkal house',
    guardianContact: '8113884453',
    guardianName: 'Vinesh. K',
    guardianRelation: 'Mother',
    registeredClass: 'Class / Grade 7',
    board: 'kerala',
    school: 'Gmups venniyur',
    referredBy: 'By phone call',
    date: '16/12/2025',
    dashboardUrl: 'https://edstaq.github.io/progress_dashboard/?id=STD106',
    registrationAmt: 50,
    paymentMode: 'After',
    periodInDays: 1
  }
];

export const MOCK_ALLOCATIONS = [
  {
    teacherAssignId: 'TAS101',
    classRoomId: 'edstaq c6 safa',
    meetLink: 'https://meet.google.com/cmj-avnj-rvg',
    subjectId: 'SUB227',
    studentId: 'STD101',
    teacherId: 'TCH108',
    startDate: '2025-10-27',
    sessionsPerDay: 1,
    startTime: '07:00pm',
    endTime: '08:15pm',
    days: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    status: 'Active',
    neurostack: 'TRUE',
    subjectName: 'MATHS',
    subjectLabel: 'Class 6 - MATHS (Kerala)'
  },
  {
    teacherAssignId: 'TAS102',
    classRoomId: 'Edstaq C9 Liya fathima',
    meetLink: 'https://meet.google.com/ucj-tdrm-mme',
    subjectId: 'SUB296',
    studentId: 'STD102',
    teacherId: 'TCH114',
    startDate: '2025-10-30',
    sessionsPerDay: 1,
    startTime: '08:00pm',
    endTime: '09:15pm',
    days: 'Friday',
    status: 'Closed',
    neurostack: 'TRUE',
    subjectName: 'MATHS',
    subjectLabel: 'Class 9 - MATHS (Kerala)'
  },
  {
    teacherAssignId: 'TAS103',
    classRoomId: 'Edstaq c6 arav',
    meetLink: 'https://meet.google.com/tdk-rnmp-tcp',
    subjectId: 'SUB227',
    studentId: 'STD103',
    teacherId: 'TCH108',
    startDate: '2025-11-09',
    sessionsPerDay: 1,
    startTime: '07:30pm',
    endTime: '08:45pm',
    days: 'Sunday',
    status: 'HOLD',
    neurostack: 'TRUE',
    subjectName: 'MATHS',
    subjectLabel: 'Class 6 - MATHS (Kerala)'
  },
  {
    teacherAssignId: 'TAS115',
    classRoomId: 'EDSTAQ C-3 Ayra (EVS)',
    meetLink: 'https://meet.google.com/cqb-abmg-auo',
    subjectId: 'SUB154',
    studentId: 'STD111',
    teacherId: 'TCH108',
    startDate: '2026-03-09',
    sessionsPerDay: 1,
    startTime: '07:30pm',
    endTime: '08:45pm',
    days: 'Monday,Tuesday',
    status: 'Closed',
    neurostack: 'TRUE',
    subjectName: 'EVS',
    subjectLabel: 'Class 3 - EVS (Kerala)'
  }
];

// Helper to format date as DD/MM/YYYY
const formatDDMMYYYY = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

// Compute dynamic demo dates relative to current execution date
// to ensure the user always sees live 1-4-7 Due Today, In 1 Day, and Overdue items!
const now = new Date();
const tomorrow = new Date(now.getTime() + 1 * 86400000);
const yesterday = new Date(now.getTime() - 1 * 86400000);
const fourDaysAgo = new Date(now.getTime() - 4 * 86400000);
const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

export const MOCK_CLASSES = [
  {
    sessionId: 'AAA5E1D6',
    sessionTempId: 'TAS101_2025-10-27_19:00',
    classRoomId: 'edstaq c6 safa',
    teacherAssign: 'TAS101',
    studentId: 'STD101',
    subjectId: 'SUB227',
    teacherId: 'TCH108',
    date: '27/10/2025',
    startTime: '19:00:00',
    endTime: '20:15:00',
    status: 'Completed',
    subjectLabel: 'Class 6 - MATHS (Kerala)',
    subjectName: 'MATHS',
    classLink: 'https://meet.google.com/cmj-avnj-rvg',
    topicCovered: 'Arithmetic of parts (introduction), Basic division',
    started: '07:00 pm',
    ended: '08:15 pm',
    verify: 'Verified',
    neurostack: 'TRUE',
    teacherName: 'Asna Fathimath'
  },
  {
    sessionId: '6F03840D',
    sessionTempId: 'TAS101_2025-10-28_19:00',
    classRoomId: 'edstaq c6 safa',
    teacherAssign: 'TAS101',
    studentId: 'STD101',
    subjectId: 'SUB227',
    teacherId: 'TCH108',
    date: '28/10/2025',
    startTime: '19:00:00',
    endTime: '20:15:00',
    status: 'Completed',
    subjectLabel: 'Class 6 - MATHS (Kerala)',
    subjectName: 'MATHS',
    classLink: 'https://meet.google.com/cmj-avnj-rvg',
    topicCovered: 'Arithmetic of parts (addition of fraction)',
    started: '07:00 pm',
    ended: '08:15 pm',
    verify: 'Verified',
    neurostack: 'TRUE',
    teacherName: 'Asna Fathimath'
  },
  {
    sessionId: '5E3DDF92',
    sessionTempId: 'TAS101_2025-10-29_19:00',
    classRoomId: 'edstaq c6 safa',
    teacherAssign: 'TAS101',
    studentId: 'STD101',
    subjectId: 'SUB227',
    teacherId: 'TCH108',
    date: '29/10/2025',
    startTime: '19:00:00',
    endTime: '20:15:00',
    status: 'Completed',
    subjectLabel: 'Class 6 - MATHS (Kerala)',
    subjectName: 'MATHS',
    classLink: 'https://meet.google.com/cmj-avnj-rvg',
    topicCovered: 'Subtraction of fraction',
    started: '07:00 pm',
    ended: '08:15 pm',
    verify: 'Verified',
    neurostack: 'TRUE',
    teacherName: 'Asna Fathimath'
  },
  {
    sessionId: 'D3A55669',
    sessionTempId: 'TAS101_2025-10-30_19:00',
    classRoomId: 'edstaq c6 safa',
    teacherAssign: 'TAS101',
    studentId: 'STD101',
    subjectId: 'SUB227',
    teacherId: 'TCH108',
    date: formatDDMMYYYY(fourDaysAgo), // Dynamic 4-day interval gives Due Today for Day 4!
    startTime: '19:00:00',
    endTime: '20:15:00',
    status: 'Completed',
    subjectLabel: 'Class 6 - MATHS (Kerala)',
    subjectName: 'MATHS',
    classLink: 'https://meet.google.com/cmj-avnj-rvg',
    topicCovered: 'Some other sums, Revision of chapter, Removing parts (Chapter complete)',
    started: '07:00 pm',
    ended: '08:15 pm',
    verify: 'Verified',
    neurostack: 'TRUE',
    teacherName: 'Asna Fathimath'
  },
  {
    sessionId: '19B421CE',
    sessionTempId: 'TAS101_2025-10-31_19:00',
    classRoomId: 'edstaq c6 safa',
    teacherAssign: 'TAS101',
    studentId: 'STD101',
    subjectId: 'SUB227',
    teacherId: 'TCH108',
    date: formatDDMMYYYY(yesterday), // Yesterday's class gives Day 1 Due Today!
    startTime: '19:00:00',
    endTime: '20:15:00',
    status: 'Completed',
    subjectLabel: 'Class 6 - MATHS (Kerala)',
    subjectName: 'MATHS',
    classLink: 'https://meet.google.com/cmj-avnj-rvg',
    topicCovered: 'Decimal Forms Introduction - Fractions with 10 and 100',
    started: '07:00 pm',
    ended: '08:15 pm',
    verify: 'Verified',
    neurostack: 'TRUE',
    teacherName: 'Asna Fathimath'
  },
  {
    sessionId: 'UPC-101',
    sessionTempId: 'TAS101_UPCOMING',
    classRoomId: 'edstaq c6 safa',
    teacherAssign: 'TAS101',
    studentId: 'STD101',
    subjectId: 'SUB227',
    teacherId: 'TCH108',
    date: formatDDMMYYYY(tomorrow),
    startTime: '19:00:00',
    endTime: '20:15:00',
    status: 'Upcoming',
    subjectLabel: 'Class 6 - MATHS (Kerala)',
    subjectName: 'MATHS',
    classLink: 'https://meet.google.com/cmj-avnj-rvg',
    topicCovered: 'Decimal Forms - Place values and arithmetic operations',
    started: '07:00 pm',
    ended: '08:15 pm',
    verify: 'Scheduled',
    neurostack: 'TRUE',
    teacherName: 'Asna Fathimath'
  }
];

export const MOCK_STUDENT_LOGS = [
  {
    logId: 'LOG-001',
    sessionId: 'AAA5E1D6',
    studentId: 'STD101',
    status: 'Present',
    rating: 3,
    comment: 'Initially took some time to settle in, but followed division steps nicely.'
  },
  {
    logId: 'LOG-002',
    sessionId: '6F03840D',
    studentId: 'STD101',
    status: 'Present',
    rating: 5,
    comment: 'Extremely attentive and actively asked questions about fractions.'
  },
  {
    logId: 'LOG-003',
    sessionId: '5E3DDF92',
    studentId: 'STD101',
    status: 'Present',
    rating: 5,
    comment: 'Very quick in solving subtraction problems independently.'
  },
  {
    logId: 'LOG-004',
    sessionId: 'D3A55669',
    studentId: 'STD101',
    status: 'Present',
    rating: 5,
    comment: 'Superb focus throughout chapter revision and practice problems.'
  },
  {
    logId: 'LOG-005',
    sessionId: '19B421CE',
    studentId: 'STD101',
    status: 'Present',
    rating: 5,
    comment: 'Understood decimal concepts instantly, energetic session.'
  }
];

export const MOCK_UPLOADED_FILES = [
  {
    sessionId: 'AAA5E1D6',
    fileName: 'Screenshot',
    fileUrl: 'https://drive.google.com/open?id=1KGvlMdHtvEYJj20q-RXG6RWsRhixuMvH',
    type: 'Session Proof'
  },
  {
    sessionId: '6F03840D',
    fileName: 'Fraction Addition Worksheet',
    fileUrl: 'https://drive.google.com/open?id=1K5yzmKJEUQP-gDJXPxTbD4tMairL4xRb',
    type: 'Learn Docs'
  },
  {
    sessionId: '6F03840D',
    fileName: 'Screenshot',
    fileUrl: 'https://drive.google.com/open?id=1K5yzmKJEUQP-gDJXPxTbD4tMairL4xRb',
    type: 'Session Proof'
  },
  {
    sessionId: '5E3DDF92',
    fileName: 'Screenshot',
    fileUrl: 'https://drive.google.com/open?id=1bii6aUy0bOClPdlDlTJMiRzAMvZpsQyv',
    type: 'Session Proof'
  },
  {
    sessionId: 'D3A55669',
    fileName: 'Joining parts (Chapter Summary & Practice)',
    fileUrl: 'https://drive.google.com/open?id=1rRlLrJ-WMTt57nsmyO_wqKX6FReQlL7n',
    type: 'Learn Docs'
  },
  {
    sessionId: 'D3A55669',
    fileName: 'Screenshot',
    fileUrl: 'https://drive.google.com/open?id=1rCcC9ScFauBbvopZ7FZh_96SSjzA6tLB',
    type: 'Session Proof'
  },
  {
    sessionId: '19B421CE',
    fileName: 'Decimal Forms Class Notes & Formula Sheet',
    fileUrl: 'https://drive.google.com/open?id=1rRlLrJ-WMTt57nsmyO_wqKX6FReQlL7n',
    type: 'Learn Docs'
  }
];

export const MOCK_SETTINGS = {
  preferredReminderTime: '19:00',
  notificationsEnabled: true
};

export const MOCK_ACTIVITY_LOGS = [
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

/**
 * Get unified dataset for a given student ID
 */
export function getMockStudentData(studentId = 'STD101') {
  const cleanId = String(studentId || 'STD101').toUpperCase();
  const profile = MOCK_STUDENTS.find(s => s.studentId.toUpperCase() === cleanId) || {
    studentId: cleanId,
    studentName: cleanId === 'STD134' ? 'Ain Mahmood Kurikkal' : `Student (${cleanId})`,
    contact: cleanId === 'STD134' ? '9645577778' : '9876543210',
    email: '',
    dob: '09/10/2013',
    address: 'Manjeri, Malappuram, Kerala',
    guardianContact: '9645577778',
    guardianName: 'Shaheela',
    guardianRelation: 'Mother',
    registeredClass: 'Class 8',
    board: 'CBSE',
    school: 'ACE Manjeri',
    referredBy: 'Friend/parent',
    date: '05/10/2026',
    dashboardUrl: `https://edstaq.github.io/progress_dashboard/?id=${cleanId}`,
    registrationAmt: 50,
    paymentMode: 'After',
    periodInDays: 1
  };
  const allocations = MOCK_ALLOCATIONS.filter(a => a.studentId === cleanId);
  
  // For STD101, full classes & logs. For others, provide simulated classes matching their allocation
  // Clean classes & logs for the student
  const classes = [];
  const logs = [];

  // Ensure safe profile (never expose password field)
  const safeProfile = { ...profile };
  delete safeProfile.password;

  return {
    profile: safeProfile,
    allocations,
    classes,
    logs,
    files: MOCK_UPLOADED_FILES,
    settings: MOCK_SETTINGS,
    activityLogs: MOCK_ACTIVITY_LOGS
  };
}
