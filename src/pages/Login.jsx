// EDSTAQ Student Portal - Login Page
// Premium glassmorphism login with Student ID + Password auth

import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Shield, Key, X, CheckCircle, Phone, User, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { login, changePassword, selectChildSession } from '../services/authService';

const DEFAULT_PASSWORD = '12345678';

export default function Login({ onLoginSuccess }) {
  const [loginMethod, setLoginMethod] = useState('studentId'); // 'studentId' | 'mobile'
  const [studentId, setStudentId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Multiple Children Chooser State (for Parents)
  const [showStudentChooser, setShowStudentChooser] = useState(false);
  const [studentCandidates, setStudentCandidates] = useState([]);
  const [contactNumber, setContactNumber] = useState('');

  // Change Password Popup State
  const [showChangePopup, setShowChangePopup] = useState(false);
  const [pendingSession, setPendingSession] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const identifier = loginMethod === 'mobile' ? mobileNumber.trim() : studentId.trim();

    if (loginMethod === 'mobile' && identifier.length !== 10) {
      setError('Please enter a valid 10-digit registered contact number.');
      setIsLoading(false);
      return;
    }

    const result = await login(identifier, password.trim(), { loginMethod });

    if (result.success) {
      // Multiple students under this mobile number -> Show child chooser dialog
      if (result.multiple) {
        setStudentCandidates(result.students || []);
        setContactNumber(result.contactNumber || identifier);
        setShowStudentChooser(true);
      } else {
        // If password is the default, prompt for change
        if (password.trim() === DEFAULT_PASSWORD) {
          setPendingSession(result.session);
          setShowChangePopup(true);
        } else {
          onLoginSuccess(result.session);
        }
      }
    } else {
      setError(result.message || 'Login failed. Please check credentials and try again.');
    }
    setIsLoading(false);
  };

  const handleSelectChild = (child) => {
    const session = selectChildSession(child, contactNumber);
    setShowStudentChooser(false);

    if (password.trim() === DEFAULT_PASSWORD) {
      setPendingSession(session);
      setShowChangePopup(true);
    } else {
      onLoginSuccess(session);
    }
  };

  const handleSkipChange = () => {
    setShowChangePopup(false);
    onLoginSuccess(pendingSession);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeError('');

    if (newPassword.length < 4) {
      setChangeError('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('Passwords do not match.');
      return;
    }
    if (newPassword === DEFAULT_PASSWORD) {
      setChangeError('Please choose a different password.');
      return;
    }

    setChangeLoading(true);
    const result = await changePassword(pendingSession.studentId, DEFAULT_PASSWORD, newPassword);
    setChangeLoading(false);

    if (result.success) {
      setChangeSuccess(true);
      setTimeout(() => {
        setShowChangePopup(false);
        onLoginSuccess(pendingSession);
      }, 1800);
    } else {
      setChangeError(result.message || 'Failed to change password. Please try again.');
    }
  };

  return (
    <div className="login-page" id="edstaq-login-page">
      {/* Animated Background */}
      <div className="login-bg-gradient" aria-hidden="true">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container">
        {/* Brand Header */}
        <div className="login-brand" id="login-brand-header">
          <div className="login-logo-wrap">
            <img
              src={`${import.meta.env.BASE_URL}edstaq-logo.png`}
              alt="EDSTAQ Logo"
              className="login-logo-img"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <h1 className="login-brand-name">Student Portal</h1>
          <p className="login-brand-tagline">
            powered by <strong style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>EDSTAQ</strong>
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card" id="login-card-main">
          <div className="login-card-header">
            <h2 className="login-title">Welcome Back!</h2>
            <p className="login-subtitle">Sign in to access your learning dashboard</p>
          </div>

          {/* Login Mode Switcher Tabs */}
          <div className="login-method-tabs" role="tablist" aria-label="Login Mode">
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'studentId'}
              className={`login-method-tab ${loginMethod === 'studentId' ? 'active' : ''}`}
              id="login-tab-student-id"
              onClick={() => {
                setLoginMethod('studentId');
                setError('');
              }}
            >
              <User size={15} />
              <span>Student ID</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'mobile'}
              className={`login-method-tab ${loginMethod === 'mobile' ? 'active' : ''}`}
              id="login-tab-mobile"
              onClick={() => {
                setLoginMethod('mobile');
                setError('');
              }}
            >
              <Phone size={15} />
              <span>Mobile Number</span>
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit} id="login-form-main" autoComplete="off">
            {/* Conditional Input Field: Student ID vs Contact Number (Mobile) */}
            {loginMethod === 'studentId' ? (
              <div className="login-field">
                <label className="login-label" htmlFor="login-student-id">
                  Student ID
                </label>
                <div className="login-input-wrap">
                  <Shield size={16} className="login-input-icon" />
                  <input
                    id="login-student-id"
                    type="text"
                    className="login-input"
                    placeholder="e.g. STD101"
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value); setError(''); }}
                    required
                    autoFocus
                    autoCapitalize="characters"
                  />
                </div>
              </div>
            ) : (
              <div className="login-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="login-label" htmlFor="login-mobile-number">
                    Contact Number (Mobile)
                  </label>
                  <span className="login-parent-badge">Parents / Guardians</span>
                </div>
                <div className="login-input-wrap">
                  <Phone size={16} className="login-input-icon" />
                  <input
                    id="login-mobile-number"
                    type="tel"
                    className="login-input"
                    placeholder="10-digit mobile number (e.g. 9526859832)"
                    value={mobileNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobileNumber(val);
                      setError('');
                    }}
                    required
                    autoFocus
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="10-digit registered Contact Number"
                  />
                </div>
                <span className="login-field-hint">
                  Access portal for single or multiple children under this contact
                </span>
              </div>
            )}

            {/* Password Field */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-input-wrap">
                <Shield size={16} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error" role="alert" id="login-error-msg">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-btn ${isLoading ? 'login-btn--loading' : ''}`}
              id="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-spinner" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="login-footer-text">
          Powered by <b>EDSTAQ</b> · Secure Student Learning Platform
        </p>
      </div>

      {/* ── Choose Student / Child Modal (for Parents with Multiple Registered Students) ── */}
      {showStudentChooser && (
        <div
          className="student-chooser-overlay"
          id="student-chooser-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Select student account"
        >
          <div className="student-chooser-modal">
            <div className="student-chooser-header">
              <div className="student-chooser-badge">
                <Users size={16} />
                <span>Parent Account Access</span>
              </div>
              <h2 className="student-chooser-title">Choose Student</h2>
              <p className="student-chooser-subtitle">
                Multiple students are registered under Contact Number <strong>{contactNumber}</strong>. Select which student's portal to access:
              </p>
            </div>

            <div className="student-chooser-list">
              {studentCandidates.map((child) => (
                <button
                  key={child.studentId}
                  type="button"
                  className="student-chooser-card"
                  onClick={() => handleSelectChild(child)}
                  id={`choose-student-${child.studentId}`}
                >
                  <div className="chooser-avatar">
                    {child.studentName ? child.studentName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="chooser-info">
                    <span className="chooser-name">{child.studentName}</span>
                    <span className="chooser-meta">
                      {child.registeredClass || 'Class 10'} • ID: <strong>{child.studentId}</strong>
                    </span>
                    {child.school && (
                      <span className="chooser-school">{child.school}</span>
                    )}
                  </div>
                  <div className="chooser-arrow-wrap">
                    <ArrowRight size={18} />
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="student-chooser-back-btn"
              onClick={() => {
                setShowStudentChooser(false);
                setStudentCandidates([]);
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Change Password Popup ── */}
      {showChangePopup && (
        <div className="chpwd-overlay" id="change-password-overlay">
          <div className="chpwd-modal" id="change-password-modal" role="dialog" aria-modal="true">
            {changeSuccess ? (
              <div className="chpwd-success">
                <CheckCircle size={48} className="chpwd-success-icon" />
                <h3>Password Updated!</h3>
                <p>Your new password has been saved. Redirecting…</p>
              </div>
            ) : (
              <>
                <div className="chpwd-header">
                  <div className="chpwd-icon-ring">
                    <Key size={22} />
                  </div>
                  <h3 className="chpwd-title">Update Your Password</h3>
                  <p className="chpwd-subtitle">
                    You are using the default password. Please set a new password to secure your account.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="chpwd-form" id="change-password-form">
                  <div className="login-field">
                    <label className="login-label" htmlFor="chpwd-new">New Password</label>
                    <div className="login-input-wrap">
                      <Key size={15} className="login-input-icon" />
                      <input
                        id="chpwd-new"
                        type={showNewPwd ? 'text' : 'password'}
                        className="login-input"
                        placeholder="Min. 4 characters"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setChangeError(''); }}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="login-eye-btn"
                        onClick={() => setShowNewPwd(p => !p)}
                        tabIndex={-1}
                      >
                        {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="login-field">
                    <label className="login-label" htmlFor="chpwd-confirm">Confirm New Password</label>
                    <div className="login-input-wrap">
                      <Key size={15} className="login-input-icon" />
                      <input
                        id="chpwd-confirm"
                        type="password"
                        className="login-input"
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setChangeError(''); }}
                        required
                      />
                    </div>
                  </div>

                  {changeError && (
                    <div className="login-error" role="alert">
                      <span>⚠️ {changeError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`login-btn ${changeLoading ? 'login-btn--loading' : ''}`}
                    id="chpwd-submit-btn"
                    disabled={changeLoading}
                  >
                    {changeLoading ? (
                      <><span className="login-spinner" /> Saving...</>
                    ) : (
                      <><Key size={17} /> Update Password</>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  className="chpwd-skip-btn"
                  id="chpwd-skip-btn"
                  onClick={handleSkipChange}
                >
                  Skip for now
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
