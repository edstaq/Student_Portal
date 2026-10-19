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
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const lastScrollY = useRef(0);

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

  // Smart hide/show mobile bottom bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      // Always show near the very top
      if (currentScrollY < 40) {
        setIsBottomNavVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      // Require noticeable scroll distance to avoid trigger from jitter
      if (Math.abs(diff) > 8) {
        if (diff > 0) {
          // Scrolling down -> hide bottom bar
          setIsBottomNavVisible(false);
        } else {
          // Scrolling up -> show bottom bar
          setIsBottomNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'reports', label: 'Reports', icon: FileBarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
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
                src={`${import.meta.env.BASE_URL}edstaq-logo.png`}
                alt="EDSTAQ Logo"
                className="brand-logo-img"
                onError={(e) => {
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

          {/* Desktop Center Tabs Navigation (hidden on mobile) */}
          <nav className="nav-center-menu desktop-only-nav" id="nav-tabs-menu" aria-label="Portal Navigation">
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

                {/* Log Out Option inside Profile Dropdown */}
                {onLogout && (
                  <div
                    style={{
                      marginTop: '0.65rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #f1f5f9'
                    }}
                  >
                    <button
                      type="button"
                      className="student-dropdown-item logout"
                      id="student-dropdown-logout-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      style={{
                        color: 'var(--accent-rose, #ef4444)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.55rem 0.65rem',
                        borderRadius: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <LogOut size={16} color="#ef4444" />
                      <span>Sign Out / Log Out</span>
                    </button>
                  </div>
                )}
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
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation Bar (Fixed to screen bottom, slides down on scroll down, slides up on scroll up) */}
    <nav
      className={`mobile-bottom-nav ${isBottomNavVisible ? 'visible' : 'hidden'}`}
      id="mobile-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
              id={`mobile-tab-${tab.id}`}
              onClick={() => {
                onSelectTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-tab-icon-wrap">
                <Icon size={20} />
              </div>
              <span className="mobile-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  </>
  );
}
