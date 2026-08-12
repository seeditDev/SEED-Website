import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaUser, FaLock, FaEye, FaEyeSlash, FaBook, FaTrophy, FaChartBar, FaQuoteLeft, FaShieldAlt, FaArrowRight, FaGoogle, FaMicrosoft, FaGlobe, FaLaptop } from "react-icons/fa";
import DataService from "../services/dataService";
import TrackingService from "../services/trackingService";
import { COLLEGES, ACADEMIC_YEARS } from "../config/constants";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const DASHBOARD_PATHS = {
  student: "/student/dashboard",
  staff: "/staff/dashboard"
};

const Login = () => {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [yearSearchTerm, setYearSearchTerm] = useState("");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [filteredYears, setFilteredYears] = useState(Object.entries(ACADEMIC_YEARS));
  const navigate = useNavigate();

  const [currentTheme, setCurrentTheme] = useState(() => {
    // Default to 'Monochrome Minimalist (B&W)' if no preference saved yet
    return localStorage.getItem('portal_theme') || 'bw';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    // If already authenticated, redirect to appropriate dashboard page
    const authDataRaw = localStorage.getItem("auth_data");
    const userRole = localStorage.getItem("role");
    if (authDataRaw && userRole) {
      navigate(DASHBOARD_PATHS[userRole] || "/");
    }
  }, [navigate]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("rememberedUser"));
    if (savedUser) {
      setUsername(savedUser.username || "");
      // SECURITY FIX (Part 15): Plaintext passwords must NEVER be remembered or populated from storage
      setPassword("");
      setRole(savedUser.role || "student");
      if (savedUser.role === 'student') {
        setCollege(savedUser.college || "");
        if (savedUser.college) {
          setSearchTerm(COLLEGES[savedUser.college] || savedUser.college);
        }
        setYear(savedUser.year || "");
        if (savedUser.year) {
          setYearSearchTerm(ACADEMIC_YEARS[savedUser.year] || savedUser.year);
        }
      }
      setRememberMe(true);
    }

    // Initialize filtered colleges and years
    setFilteredColleges(Object.entries(COLLEGES));
    setFilteredYears(Object.entries(ACADEMIC_YEARS));
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setShowDropdown(true);
    setFilteredColleges(filterColleges(term));
  };

  const handleCollegeSelect = (key) => {
    setCollege(key);
    setSearchTerm(COLLEGES[key]);
    setShowDropdown(false);
  };

  const filterColleges = (term) => {
    term = (term || searchTerm).trim().toLowerCase();
    if (term === "") {
      return Object.entries(COLLEGES);
    }

    return Object.entries(COLLEGES).filter(([key, name]) =>
      name.toLowerCase().includes(term) ||
      key.toLowerCase().includes(term)
    );
  };

  const handleYearInputClick = () => {
    setShowYearDropdown(true);
    // If search is empty, show all years
    if (!yearSearchTerm.trim()) {
      setFilteredYears(Object.entries(ACADEMIC_YEARS));
    }
  };

  const handleYearInputFocus = () => {
    setShowYearDropdown(true);
    // If search is empty, show all years
    if (!yearSearchTerm.trim()) {
      setFilteredYears(Object.entries(ACADEMIC_YEARS));
    }
  };

  const handleYearSearch = (e) => {
    const term = e.target.value;
    setYearSearchTerm(term);
    setShowYearDropdown(true);
    setFilteredYears(filterYears(term));
  };

  const handleYearSelect = (key) => {
    setYear(key);
    setYearSearchTerm(ACADEMIC_YEARS[key]);
    setShowYearDropdown(false);
  };

  const filterYears = (term) => {
    term = term.trim().toLowerCase();
    if (term === "") {
      return Object.entries(ACADEMIC_YEARS);
    }
    return Object.entries(ACADEMIC_YEARS).filter(([key, name]) =>
      name.toLowerCase().includes(term) ||
      key.toLowerCase().includes(term)
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please fill in username/email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userData = await DataService.validateCredentials(username.trim(), password, role, college, year);

      if (userData) {
        // Clear all college_ prefixed caches from localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('college_')) {
            localStorage.removeItem(key);
          }
        });

        const effectiveRole = (userData.role || userData.Role || role || 'student').toLowerCase();

        if (rememberMe) {
          // SECURITY FIX (Part 15): Store only non-sensitive metadata (username, role, college, year) — NEVER store password
          localStorage.setItem(
            "rememberedUser",
            JSON.stringify({
              username,
              role: effectiveRole,
              ...(effectiveRole === 'student' && { college: userData.college || college, year: userData.year || year })
            })
          );
        } else {
          localStorage.removeItem("rememberedUser");
        }

        // Store authenticated user's profile data (Normalized Part 16 + Legacy backward compat)
        const authData = {
          uid: userData.uid || userData.UID || userData.Email || '',
          email: userData.Email || userData.email || username,
          name: userData.Name || userData.name || '',
          role: effectiveRole,
          tenantId: userData.College || userData.college || college || '',
          college: userData.College || userData.college || college || '',
          department: userData.Department || userData.department || '',
          year: userData.Year || userData.year || year || '',
          rollNumber: userData["Roll Number"] || userData.rollNumber || '',
          // Legacy capitalized keys for backward compatibility:
          Email: userData.Email || userData.email || username,
          Name: userData.Name || userData.name || '',
          Role: effectiveRole,
          College: userData.College || userData.college || college || '',
          Department: userData.Department || userData.department || '',
          Year: userData.Year || userData.year || year || '',
          "Roll Number": userData["Roll Number"] || userData.rollNumber || '',
          Premium: userData.Premium !== undefined ? userData.Premium : (userData.premium !== undefined ? userData.premium : 1),
          ...(effectiveRole === 'student' && {
            "Hackerrank Mail": userData["Hackerrank Mail"],
            "Hackerrank ID": userData["Hackerrank ID"]
          })
        };

        localStorage.setItem("auth_data", JSON.stringify(authData));
        localStorage.setItem("role", effectiveRole);

        // Sync PyQt session if desktop bridge is available
        try {
          if (window.desktopBridge) {
            window.desktopBridge.setStudentSession(authData);
          }
        } catch (e) {
          /* console.error("Failed to sync session with PyQt:", e) */ void 0;
        }

        // Start Live User Tracking
        try {
          await TrackingService.startTracking(authData);
        } catch (trackError) {
          /* console.error("Error starting tracking on login:", trackError) */ void 0;
        }

        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
          const targetPath = DASHBOARD_PATHS[effectiveRole] || DASHBOARD_PATHS.student;
          navigate(targetPath);
        }, 1500);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };


  const clearForm = () => {
    setUsername("");
    setPassword("");
    setError("");
    setShowSuccess(false);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'staff') {
      setCollege('');
    }
    clearForm();
  };

  const handleInputClick = () => {
    setShowDropdown(true);
    // If search is empty, show all colleges
    if (!searchTerm.trim()) {
      setFilteredColleges(Object.entries(COLLEGES));
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    // If search is empty, show all colleges
    if (!searchTerm.trim()) {
      setFilteredColleges(Object.entries(COLLEGES));
    }
  };

  // Add event listeners for clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add click outside handler for year dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.year-search-container')) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="login-page">
      {/* Perspective Grid Background Layer */}
      <div className="perspective-grid"></div>

      {/* Floating 3D Geometric shapes */}
      <div className="geometric-cube"></div>
      <div className="geometric-sphere"></div>

      {/* 3D trophy svg background */}
      <svg className="geometric-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
        <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z" />
      </svg>

      {/* Floating 3D Programming Language Chips */}
      <div className="floating-chip chip-python">
        <span className="chip-logo" style={{ color: '#07243bff' }}>🐍</span>
        <span>Python</span>
      </div>
      <div className="floating-chip chip-java">
        <span className="chip-logo" style={{ color: '#e76f51' }}>☕</span>
        <span>Java</span>
      </div>
      <div className="floating-chip chip-cpp">
        <span className="chip-logo" style={{ color: '#00599c' }}>⚡</span>
        <span>C++</span>
      </div>
      <div className="floating-chip chip-rust">
        <span className="chip-logo" style={{ color: '#f4a261' }}>🦀</span>
        <span>Rust</span>
      </div>

      {/* Floating Company Logos */}
      <div className="floating-chip chip-google">
        <FaGoogle className="chip-logo" style={{ color: '#ea4335' }} />
        <span>Google</span>
      </div>
      <div className="floating-chip chip-microsoft">
        <FaMicrosoft className="chip-logo" style={{ color: '#00a4ef' }} />
        <span>Microsoft</span>
      </div>
      <div className="floating-chip chip-meta">
        <FaGlobe className="chip-logo" style={{ color: '#0668e1' }} />
        <span>Meta</span>
      </div>

      {/* Left panel: Info & Feature Cards */}
      <div className="background-section animate-fade-in">
        <div className="background-content">
          <div className="background-logo">
            SEED <span></span>
          </div>
          <span className="platform-pill">SEED-SEB Platform</span>
          <h2>Welcome back to <span className="gradient-text">SEED</span></h2>
          <p className="welcome-subtitle">Where every login brings you closer to your goals.</p>

          <div className="background-features">
            <div className="feature-item">
              <div className="feature-icon-wrapper icon-blue">
                <FaBook />
              </div>
              <div className="feature-text-block">
                <h3>Learn</h3>
                <p>Access curated resources and enhance your knowledge.</p>
              </div>
              <FaArrowRight className="feature-arrow" />
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper icon-purple">
                <FaTrophy />
              </div>
              <div className="feature-text-block">
                <h3>Practice</h3>
                <p>Solve problems, test yourself and improve every day.</p>
              </div>
              <FaArrowRight className="feature-arrow" />
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper icon-green">
                <FaChartBar />
              </div>
              <div className="feature-text-block">
                <h3>Assess</h3>
                <p>Take assessments, participate in contests and track progress.</p>
              </div>
              <FaArrowRight className="feature-arrow" />
            </div>
          </div>

          <div className="quote-card">
            <FaQuoteLeft className="quote-icon" />
            <p>Empower yourself with the tools, knowledge, and opportunities to succeed.</p>
          </div>

          <div className="security-badges">
            <FaShieldAlt className="badge-icon" />
            <span>Secure • Reliable • Trusted</span>
          </div>
          <p className="copyright-text">
            © 2026 SEED-SEB. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel: Glassmorphic form card */}
      <div className="form-section">
        <div className="login-glass-card animate-slide-up">
          {/* Avatar placeholder with Letter S */}
          <div className="avatar-wrapper">
            S
          </div>

          <h1>Welcome back!</h1>
          <p className="subtitle">Login to your account</p>

          <form onSubmit={handleLogin} className="login-form-wrapper">
            {/* Email Address input */}
            <div className="input-group">
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Email address"
                  required
                />
              </div>
            </div>


            {/* Password input */}
            <div className="input-group">
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0'
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Remember me and Forgot Row */}
            <div className="form-footer-row">
              <div className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  id="remember-me-checkbox"
                  className="login-checkbox"
                />
                <label htmlFor="remember-me-checkbox">Remember Me</label>
              </div>

            </div>

            {/* Login button */}
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Logging in...' : 'Login'} <FaArrowRight />
            </button>

            {error && <div className="error">{error}</div>}
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="modal-overlay">
          <div className="success-modal">
            <FaCheckCircle className="success-icon" />
            <p>Welcome to SEED!</p>
            <p className="redirect-text">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
