// EDSTAQ Sticky Glassmorphism Navbar
// Logo, Tab switcher, Student switcher, Notification bell, and Live/Demo Mode badge

import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  FileBarChart2,
  Settings,
  Bell,
  ChevronDown,
  User,
  Radio,
  Smartphone,
  LogOut
} from 'lucide-react';

export default function Navbar({
  currentTab,
  onSelectTab,
  activeStudent,
  studentsList = [],
  onSelectStudent,
  dueTodayCount = 0,
  isLiveMode = false,
  onOpenNotifications,
  onOpenInstallModal,
  onLogout
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'reports', label: 'Reports', icon: FileBarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header className="edstaq-navbar" id="edstaq-main-navbar">
      <div className="navbar-inner">
        {/* Brand Section */}
        <div className="brand-section">
          <a
            href="#"
            className="brand-logo-link"
            id="edstaq-logo-brand"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('dashboard');
            }}
          >
            <img
              src="/edstaq-logo.png"
              alt="EDSTAQ Logo"
              className="brand-logo-img"
              onError={(e) => {
                // If logo fails, fallback to styled logo text
                e.target.style.display = 'none';
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--brand-navy)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15
                }}
              >
                Student Portal
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.01em',
                  marginTop: '1px',
                  lineHeight: 1
                }}
              >
                powered by <strong style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>EDSTAQ</strong>
              </span>
            </div>
          </a>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="nav-center-menu" id="nav-tabs-menu" aria-label="Portal Navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Mode Badge, Student Switcher, Notification Bell */}
        <div className="nav-actions-section">


          {/* Quick Install Mobile App Button */}
          <button
            type="button"
            className="nav-install-btn"
            id="nav-btn-install-app"
            onClick={onOpenInstallModal}
            title="Install EDSTAQ as a Mobile App on your Home Screen"
          >
            <Smartphone size={14} />
            <span>Install App</span>
          </button>

          {/* Student Switcher Dropdown */}
          <div className="student-switcher-container" ref={dropdownRef}>
            <button
              type="button"
              className="student-select-btn"
              id="nav-student-select-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="student-avatar-micro">
                {activeStudent?.studentName ? activeStudent.studentName.charAt(0) : 'S'}
              </div>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeStudent?.studentName || 'Student'}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {dropdownOpen && (
              <div className="student-select-dropdown" id="nav-student-dropdown">
                <div className="student-dropdown-header">
                  ACTIVE STUDENT
                </div>

                {/* Active student — always first */}
                {activeStudent && (
                  <button
                    type="button"
                    className="student-dropdown-item active"
                    id={`student-opt-${activeStudent.studentId}`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="student-item-left">
                      <div className="student-item-indicator" />
                      <div className="student-item-info">
                        <span className="student-item-name">{activeStudent.studentName}</span>
                        <span className="student-item-meta">
                          {activeStudent.registeredClass} • {activeStudent.studentId}
                        </span>
                      </div>
                    </div>
                    <span className="student-status-badge active">
                      {activeStudent.status || 'Active'}
                    </span>
                  </button>
                )}

                {/* Sibling students — same guardian contact, different ID (even if active or not) */}
                {studentsList
                  .filter((s) => s.studentId !== activeStudent?.studentId)
                  .map((s, idx, arr) => {
                    const isStudentActive = String(s.status || 'Active').toLowerCase() === 'active';
                    return (
                      <React.Fragment key={s.studentId}>
                        {idx === 0 && (
                          <div
                            className="student-dropdown-header"
                            style={{
                              marginTop: '0.65rem',
                              paddingTop: '0.5rem',
                              borderTop: '1px solid #f1f5f9'
                            }}
                          >
                            OTHER STUDENTS
                          </div>
                        )}
                        <button
                          type="button"
                          className="student-dropdown-item"
                          id={`student-opt-${s.studentId}`}
                          onClick={() => {
                            if (onSelectStudent) onSelectStudent(s.studentId);
                            setDropdownOpen(false);
                          }}
                        >
                          <div className="student-item-left">
                            <div className="student-item-indicator" />
                            <div className="student-item-info">
                              <span className="student-item-name">{s.studentName}</span>
                              <span className="student-item-meta">
                                {s.registeredClass} • {s.studentId}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`student-status-badge ${isStudentActive ? 'active' : 'inactive'}`}
                          >
                            {s.status || (isStudentActive ? 'Active' : 'Inactive')}
                          </span>
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Notification Bell Icon */}
          <button
            type="button"
            className="notif-bell-btn"
            id="nav-notification-bell"
            onClick={onOpenNotifications}
            aria-label="Open revisions and alerts"
            title="Revision Notifications"
          >
            <Bell size={18} />
            {dueTodayCount > 0 && (
              <span className="notif-badge-pill" id="nav-notif-badge-count">
                {dueTodayCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              className="notif-bell-btn"
              id="nav-logout-btn"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign Out"
              style={{ opacity: 0.75 }}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
