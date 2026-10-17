// EDSTAQ Student Portal - Master App Component
// Coordinates State, Deep Linking, Modals, 1-4-7 Spaced Repetition, and Tabs

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import NotificationDrawer from './components/NotificationDrawer';
import SessionDetailModal from './components/SessionDetailModal';
import DocumentViewerModal from './components/DocumentViewerModal';
import InstallAppModal from './components/InstallAppModal';
import InstallPromptBanner from './components/InstallPromptBanner';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

import {
  fetchStudentData,
  getActiveStudentId,
  setActiveStudentId,
  getAllStudentsList,
  getStudentsByGuardianContact,
  getCumulativeStudyTime,
  getLocalActivityLogs
} from './services/apiService';
import { computeRevisions } from './services/revisionEngine';
import { getAuthSession, saveAuthSession, logout } from './services/authService';

export default function App() {
  // Auth State
  const [authSession, setAuthSession] = useState(() => getAuthSession());

  // Navigation & Student Selection State
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeStudentId, setActiveStudentIdState] = useState(
    () => getAuthSession()?.studentId || 'STD101'
  );
  const [studentsList, setStudentsList] = useState([]);

  // Data State
  const [data, setData] = useState({
    isLive: false,
    profile: null,
    allocations: [],
    classes: [],
    logs: [],
    files: [],
    settings: { preferredReminderTime: '19:00', notificationsEnabled: true },
    activityLogs: []
  });
  const [revisions, setRevisions] = useState([]);
  const [cumulativeStudyTimeSec, setCumulativeStudyTimeSec] = useState(2460);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [selectedSession, setSelectedSession] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocSession, setSelectedDocSession] = useState(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // PWA Mobile Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Cleared Notification IDs (synced per student)
  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      const activeId = getActiveStudentId();
      const saved = localStorage.getItem(`edstaq_cleared_notifs_${activeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-sync cleared IDs when student changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`edstaq_cleared_notifs_${activeStudentId}`);
      setClearedNotifIds(saved ? JSON.parse(saved) : []);
    } catch {
      setClearedNotifIds([]);
    }
  }, [activeStudentId]);

  // Clear past/overdue notifications handler (leaves today & upcoming untouched)
  const handleClearPastNotifications = useCallback(() => {
    const pastRevisions = revisions.filter((r) => !r.isDueToday && r.isOverdue);
    const pastIds = pastRevisions.map((r) => r.id);
    const updated = Array.from(new Set([...clearedNotifIds, ...pastIds]));
    setClearedNotifIds(updated);
    try {
      localStorage.setItem(`edstaq_cleared_notifs_${activeStudentId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save cleared notifications:', e);
    }
  }, [revisions, clearedNotifIds, activeStudentId]);

  // Read Notification IDs (stored in device memory per student)
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const activeId = getActiveStudentId();
      const saved = localStorage.getItem(`edstaq_read_notifs_${activeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`edstaq_read_notifs_${activeStudentId}`);
      setReadNotifIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReadNotifIds([]);
    }
  }, [activeStudentId]);

  // Active / Visible revisions after excluding cleared items
  const visibleRevisions = useMemo(() => {
    return revisions.filter((r) => !clearedNotifIds.includes(r.id));
  }, [revisions, clearedNotifIds]);

  const handleMarkAsRead = useCallback((notifId) => {
    setReadNotifIds((prev) => {
      const updated = Array.from(new Set([...prev, notifId]));
      try {
        localStorage.setItem(`edstaq_read_notifs_${activeStudentId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save read notifications:', e);
      }
      return updated;
    });
  }, [activeStudentId]);

  const handleMarkAllAsRead = useCallback(() => {
    const allIds = visibleRevisions.map((r) => r.id);
    setReadNotifIds((prev) => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem(`edstaq_read_notifs_${activeStudentId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save read notifications:', e);
      }
      return updated;
    });
  }, [visibleRevisions, activeStudentId]);

  // Automated Native Device Push Notification Scheduler (Checks every 30s)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!data.settings?.notificationsEnabled) return;

    const checkReminder = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const reminderTimeStr = data.settings?.preferredReminderTime || '19:00';

      const todayKey = now.toISOString().slice(0, 10);
      const lastSentKey = `edstaq_last_native_alert_${activeStudentId}_${todayKey}`;

      if (currentTimeStr === reminderTimeStr && !localStorage.getItem(lastSentKey)) {
        const dueToday = visibleRevisions.filter((r) => r.isDueToday);
        if (dueToday.length > 0) {
          try {
            const notif = new Notification('EDSTAQ Revision Reminder', {
              body: `Hello ${data.profile?.studentName || 'Student'}! You have ${dueToday.length} revision session${dueToday.length > 1 ? 's' : ''} scheduled for today.`,
              icon: `${import.meta.env.BASE_URL}edstaq-logo.png`,
              badge: `${import.meta.env.BASE_URL}edstaq-logo.png`
            });
            notif.onclick = () => {
              window.focus();
              setIsNotifDrawerOpen(true);
            };
            localStorage.setItem(lastSentKey, 'sent');
          } catch (e) {
            console.warn('Native alert dispatch failed:', e);
          }
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [data.settings, visibleRevisions, activeStudentId, data.profile]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered programmatically
      setDeferredPrompt(e);
      console.log('EDSTAQ: Captured beforeinstallprompt event');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log('EDSTAQ: App installed successfully');
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Load student data payload
  const loadData = useCallback(async (studentId) => {
    setIsLoading(true);
    const result = await fetchStudentData(studentId);
    setData(result);

    // Compute 1-4-7 spaced repetition milestones
    const computed = computeRevisions(result.classes);
    setRevisions(computed);

    // Load tracked study time
    setCumulativeStudyTimeSec(getCumulativeStudyTime());
    setIsLoading(false);

    // Build sibling list: students from real database sharing the same guardian contact
    const siblings = (result.siblings && result.siblings.length > 0)
      ? result.siblings
      : (result.profile
          ? [{
              studentId: result.profile.studentId || studentId,
              studentName: result.profile.studentName || studentId,
              registeredClass: result.profile.registeredClass || ''
            }]
          : []);
    setStudentsList(siblings);

    return result;
  }, []);

  // Handle Login success
  const handleLoginSuccess = useCallback((session) => {
    saveAuthSession(session);
    setActiveStudentId(session.studentId);
    setAuthSession(session);
    setActiveStudentIdState(session.studentId);
    loadData(session.studentId);
  }, [loadData]);

  // Handle Logout
  const handleLogout = useCallback(() => {
    logout();
    setAuthSession(null);
    setCurrentTab('dashboard');
  }, []);

  // Handle Initial Deep-linking on mount
  useEffect(() => {
    const session = getAuthSession();
    if (!session) return; // Don't load data until logged in

    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id') || session.studentId || getActiveStudentId();
    const paramTab = urlParams.get('tab');
    const paramSession = urlParams.get('session');

    setActiveStudentIdState(paramId);
    setActiveStudentId(paramId);

    if (paramTab && ['dashboard', 'classes', 'reports', 'settings'].includes(paramTab)) {
      setCurrentTab(paramTab);
    }

    loadData(paramId).then((loadedData) => {
      // Auto-open session modal if deep-link ?session=SESSION_ID is present
      if (paramSession && loadedData.classes) {
        const matched = loadedData.classes.find(
          (c) => c.sessionId.toLowerCase() === paramSession.toLowerCase()
        );
        if (matched) {
          setSelectedSession(matched);
          setIsSessionModalOpen(true);
        }
      }
    });
  }, [loadData]);

  // Handle Tab Switch
  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    // Smoothly update URL query
    const url = new URL(window.location);
    if (tabId === 'dashboard') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabId);
    }
    window.history.pushState({}, '', url);
  };

  // Handle Student Switch
  const handleSelectStudent = (studentId) => {
    setActiveStudentIdState(studentId);
    setActiveStudentId(studentId);
    const currSession = getAuthSession();
    if (currSession) {
      saveAuthSession({
        ...currSession,
        studentId: studentId
      });
      setAuthSession((prev) => (prev ? { ...prev, studentId } : prev));
    }
    loadData(studentId);
  };

  // Open Session Detail Modal
  const handleOpenSessionModal = (sessionObj) => {
    setSelectedSession(sessionObj);
    setIsSessionModalOpen(true);

    // Update URL param ?session=...
    const url = new URL(window.location);
    url.searchParams.set('session', sessionObj.sessionId);
    window.history.pushState({}, '', url);
  };

  // Close Session Detail Modal
  const handleCloseSessionModal = () => {
    setIsSessionModalOpen(false);
    setSelectedSession(null);

    // Remove ?session= from URL
    const url = new URL(window.location);
    url.searchParams.delete('session');
    window.history.pushState({}, '', url);
  };

  // Open Document Viewer Modal
  const handleOpenDocumentModal = (fileObj, sessionObj) => {
    setSelectedDocument(fileObj);
    setSelectedDocSession(sessionObj);
    setIsDocModalOpen(true);
  };

  // Close Document Viewer Modal
  const handleCloseDocumentModal = () => {
    setIsDocModalOpen(false);
    setSelectedDocument(null);
    setSelectedDocSession(null);
  };

  // On study time logged from Document Viewer
  const handleStudyTimeLogged = (durationSec) => {
    setCumulativeStudyTimeSec(getCumulativeStudyTime());
    // Refresh local audit logs in data
    setData((prev) => ({
      ...prev,
      activityLogs: getLocalActivityLogs()
    }));
  };

  // Unread revisions count for bell badge (from active visible revisions)
  const unreadCount = visibleRevisions.filter((r) => !readNotifIds.includes(r.id)).length;
  const unreadDueTodayCount = visibleRevisions.filter((r) => r.isDueToday && !readNotifIds.includes(r.id)).length;
  const bellBadgeCount = unreadDueTodayCount > 0 ? unreadDueTodayCount : unreadCount;

  // Show Login page if not authenticated
  if (!authSession) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="edstaq-app" id="edstaq-root-container">
      {/* Sticky Glassmorphism Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        activeStudent={data.profile}
        studentsList={studentsList}
        onSelectStudent={handleSelectStudent}
        dueTodayCount={bellBadgeCount}
        isLiveMode={data.isLive}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content" id="edstaq-main-content">
        {isLoading && (
          <div className="top-sync-banner" id="app-top-sync-banner">
            <span className="sync-spinner" />
            <span>Syncing latest curriculum records...</span>
          </div>
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            student={data.profile}
            allocations={data.allocations}
            classes={data.classes}
            logs={data.logs}
            files={data.files}
            revisions={visibleRevisions}
            cumulativeStudyTimeSec={cumulativeStudyTimeSec}
            onOpenSessionModal={handleOpenSessionModal}
            onOpenNotifications={() => setIsNotifDrawerOpen(true)}
            onOpenDocumentModal={handleOpenDocumentModal}
            onNavigateTab={handleSelectTab}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'classes' && (
          <Classes
            classes={data.classes}
            logs={data.logs}
            files={data.files}
            onOpenSessionModal={handleOpenSessionModal}
            onOpenDocumentModal={handleOpenDocumentModal}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'reports' && (
          <Reports
            student={data.profile}
            classes={data.classes}
            logs={data.logs}
            cumulativeStudyTimeSec={cumulativeStudyTimeSec}
          />
        )}

        {currentTab === 'settings' && (
          <Settings
            student={data.profile}
            activityLogs={data.activityLogs}
            onSettingsUpdated={(updatedSettings) => {
              setData((prev) => ({
                ...prev,
                settings: { ...prev.settings, ...updatedSettings }
              }));
            }}
            onApiUrlChanged={(isLive) => {
              loadData(activeStudentId);
            }}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}
      </main>

      {/* Revision Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        revisions={revisions}
        clearedIds={clearedNotifIds}
        readIds={readNotifIds}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearPastNotifications={handleClearPastNotifications}
        reminderTime={data.settings?.preferredReminderTime || '19:00'}
        onSelectRevision={(revClass) => {
          if (revClass?.sessionId) {
            handleMarkAsRead(revClass.sessionId);
          }
          handleOpenSessionModal(revClass);
        }}
        onGoToSettings={() => handleSelectTab('settings')}
        studentId={activeStudentId}
      />

      {/* Session Detail Modal */}
      <SessionDetailModal
        isOpen={isSessionModalOpen}
        onClose={handleCloseSessionModal}
        session={selectedSession}
        files={data.files}
        logs={data.logs}
        studentId={activeStudentId}
        onOpenDocument={(file, session) => {
          handleOpenDocumentModal(file, session);
        }}
      />

      {/* Document Viewer Modal with Active Study Timer */}
      <DocumentViewerModal
        isOpen={isDocModalOpen}
        onClose={handleCloseDocumentModal}
        file={selectedDocument}
        session={selectedDocSession}
        studentId={activeStudentId}
        onStudyTimeLogged={handleStudyTimeLogged}
      />

      {/* Floating Smart Mobile Install Prompt Banner */}
      <InstallPromptBanner
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        hasNativePrompt={!!deferredPrompt}
        onTriggerNativeInstall={async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              setDeferredPrompt(null);
            }
          } else {
            setIsInstallModalOpen(true);
          }
        }}
      />

      {/* Mobile App & Home Screen Installation Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => {
          setDeferredPrompt(null);
        }}
      />
    </div>
  );
}
