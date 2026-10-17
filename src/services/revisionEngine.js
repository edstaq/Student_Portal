// EDSTAQ 1-4-7 Spaced Repetition Engine
// Calculates Quick Recall (Day 1), Reinforcement (Day 4), and Long-term Mastery (Day 7)

/**
 * Parses date string in DD/MM/YYYY or YYYY-MM-DD format into midnight Date object
 */
export function parseDate(dateStr) {
  if (!dateStr || dateStr.toLowerCase().includes('upcoming')) return null;

  try {
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        d.setHours(0, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // YYYY-MM-DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        d.setHours(0, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
      }
    }
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Format date nicely as 'DD MMM YYYY'
 */
export function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Add days to a given Date
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Compute all 1-4-7 revision milestones for completed classes
 * @param {Array} classesList - List of class objects
 * @returns {Array} List of revision items
 */
export function computeRevisions(classesList = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const revisions = [];
  const seenIds = new Set();

  const completedClasses = classesList.filter(
    c => c.status && c.status.toLowerCase() === 'completed'
  );

  const upcomingClasses = classesList.filter(
    c => !c.status || (c.status.toLowerCase() !== 'completed' && !c.status.toLowerCase().includes('cancel'))
  );

  // 1-4-7 Spaced Repetition Intervals (plus Day 14 for extended retention)
  const intervals = [
    { dayOffset: 1, label: 'Revision', name: 'Recall Review (Day 1)', badgeClass: 'day-1' },
    { dayOffset: 4, label: 'Revision', name: 'Practice Review (Day 4)', badgeClass: 'day-4' },
    { dayOffset: 7, label: 'Revision', name: 'Mastery Review (Day 7)', badgeClass: 'day-7' },
    { dayOffset: 14, label: 'Revision', name: 'Retention Review (Day 14)', badgeClass: 'day-7' }
  ];

  // 1. Compute 1-4-7 spaced repetition milestones for completed classes
  completedClasses.forEach(cls => {
    const classDate = parseDate(cls.date || cls.classDate);
    if (!classDate) return;

    intervals.forEach(inv => {
      const milestoneDate = addDays(classDate, inv.dayOffset);
      const diffTime = milestoneDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let status = '';
      let urgency = 'low'; // 'high' | 'medium' | 'low'
      let statusLabel = '';

      if (diffDays === 0) {
        status = 'Due Today';
        urgency = 'high';
        statusLabel = 'Due Today';
      } else if (diffDays < 0) {
        status = 'Overdue / Done';
        urgency = 'low';
        statusLabel = `${Math.abs(diffDays)}d ago`;
      } else if (diffDays <= 2) {
        status = `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        urgency = 'medium';
        statusLabel = `In ${diffDays}d`;
      } else {
        status = `In ${diffDays} days`;
        urgency = 'low';
        statusLabel = `In ${diffDays}d`;
      }

      const revId = `rev-${cls.sessionId || cls.classRoomId || cls.date}-day${inv.dayOffset}`;
      if (!seenIds.has(revId)) {
        seenIds.add(revId);
        revisions.push({
          id: revId,
          sessionId: cls.sessionId,
          classRoomId: cls.classRoomId,
          subjectName: cls.subjectName || 'General',
          subjectLabel: cls.subjectLabel || cls.subjectName || 'Class',
          topicCovered: cls.topicCovered || 'Topic revision',
          teacherName: cls.teacherName || 'Instructor',
          classDate: cls.date || cls.classDate,
          classDateObj: classDate,
          milestoneDate,
          milestoneDateFormatted: formatDate(milestoneDate),
          intervalLabel: inv.label,
          intervalName: inv.name,
          badgeClass: inv.badgeClass,
          diffDays,
          status,
          statusLabel,
          urgency,
          isDueToday: diffDays === 0,
          isOverdue: diffDays < 0,
          isUpcoming: diffDays > 0,
          rawClass: cls
        });
      }
    });
  });

  // 2. Also include scheduled upcoming classes and sessions for today
  upcomingClasses.forEach(cls => {
    const classDate = parseDate(cls.date || cls.classDate);
    if (!classDate) return;

    const diffTime = classDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let status = '';
    let urgency = 'low';
    let statusLabel = '';

    if (diffDays === 0) {
      status = 'Due Today';
      urgency = 'high';
      statusLabel = 'Today';
    } else if (diffDays < 0) {
      status = 'Past Session';
      urgency = 'low';
      statusLabel = `${Math.abs(diffDays)}d ago`;
    } else if (diffDays === 1) {
      status = 'Tomorrow';
      urgency = 'medium';
      statusLabel = 'Tomorrow';
    } else {
      status = `In ${diffDays} days`;
      urgency = 'low';
      statusLabel = `In ${diffDays}d`;
    }

    const schedId = `sched-${cls.sessionId || cls.classRoomId || cls.date || Math.random().toString(36).substring(7)}`;
    if (!seenIds.has(schedId)) {
      seenIds.add(schedId);
      revisions.push({
        id: schedId,
        sessionId: cls.sessionId,
        classRoomId: cls.classRoomId,
        subjectName: cls.subjectName || 'General',
        subjectLabel: cls.subjectLabel || cls.subjectName || 'Class',
        topicCovered: cls.topicCovered || cls.chapterName || 'Live Session',
        teacherName: cls.teacherName || 'Instructor',
        classDate: cls.date || cls.classDate,
        classDateObj: classDate,
        milestoneDate: classDate,
        milestoneDateFormatted: formatDate(classDate),
        intervalLabel: diffDays === 0 ? 'Today’s Class' : 'Upcoming Session',
        intervalName: diffDays === 0 ? 'Live Session Today' : 'Scheduled Class',
        badgeClass: diffDays === 0 ? 'day-1' : 'day-4',
        diffDays,
        status,
        statusLabel,
        urgency,
        isDueToday: diffDays === 0,
        isOverdue: diffDays < 0,
        isUpcoming: diffDays > 0,
        isScheduledClass: true,
        rawClass: cls
      });
    }
  });

  // Sort order:
  // 1. Due Today (diffDays === 0)
  // 2. Upcoming soonest (diffDays > 0, ascending by diffDays)
  // 3. Overdue (diffDays < 0, descending by diffDays, closest to today first)
  return revisions.sort((a, b) => {
    if (a.diffDays === 0 && b.diffDays !== 0) return -1;
    if (b.diffDays === 0 && a.diffDays !== 0) return 1;

    if (a.diffDays > 0 && b.diffDays > 0) {
      return a.diffDays - b.diffDays;
    }
    if (a.diffDays < 0 && b.diffDays < 0) {
      return b.diffDays - a.diffDays; // closest overdue first
    }
    if (a.diffDays > 0 && b.diffDays < 0) return -1;
    if (a.diffDays < 0 && b.diffDays > 0) return 1;

    return 0;
  });
}
