import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Cookies from 'js-cookie';
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import StudentDashboard from "./components/StudentDashboard";
import StaffDashboard from "./components/StaffDashboard";
import Registration from "./components/Registration";
import ChallengeSubmission from "./components/ChallengeSubmission";
import AdminQuestionBank from "./components/AdminQuestionBank";
import SeedSeb from "./components/SeedSeb";
import cacheManager from './utils/cacheManager';
import TrackingService from './services/trackingService';
import timeService from './services/timeService';

import "./styles/Login.css";  // Import global styles
import "./styles/HomePage.css";
import "./styles/PDFViewer.css";
import "./styles/SeedSeb.css";

// Get version from package.json
export const APP_VERSION = '1.0.1';

// Make cacheManager available globally for the logout process
window.cacheManager = cacheManager;

// Constants for version management
const VERSION_COOKIE_NAME = 'app_version';

// Version comparison utility
export const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    /* console.error('Error:', error) */ void 0;
    /* console.error('Error Info:', errorInfo) */ void 0;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1>Something went wrong</h1>
          <p>Please try refreshing the page. If the problem persists, please contact support.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Guarded route: allow /trainer only for SEED-IT college
const TrainerRoute = ({ children }) => {
  try {
    const raw = localStorage.getItem("auth_data");
    if (!raw) return <Navigate to="/login" replace />;
    const data = JSON.parse(raw);
    const college = String(data?.College || '').trim().toUpperCase();
    if (college === 'SEED-IT') {
      return children;
    }
    return <Navigate to="/student/dashboard" replace />;
  } catch (_) {
    return <Navigate to="/login" replace />;
  }
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const safeSetState = (setter, value) => {
      if (isMounted) {
        try {
          setter(value);
        } catch (e) {
          /* console.warn('State update failed:', e) */ void 0;
        }
      }
    };

    const init = async () => {
      try {
        // Initialize cache system
        await cacheManager.initCacheSystem();

        // Initialize time service (fetch online IST)
        await timeService.init();

        // Check login status
        const loginStatus = !!(Cookies.get('user_session') || Cookies.get('user_token'));
        safeSetState(setIsLoggedIn, loginStatus);

        // Version handling - just update the cookie without verification
        const storedVersion = Cookies.get(VERSION_COOKIE_NAME);

        if (storedVersion !== APP_VERSION) {
          // Update stored version
          Cookies.set(VERSION_COOKIE_NAME, APP_VERSION, { expires: 365 });

          // Clear cache if version changed
          if (storedVersion) {
            const comparison = compareVersions(APP_VERSION, storedVersion);
            if (comparison !== 0) {
              await cacheManager.clearCacheOnVersionChange(storedVersion, APP_VERSION);
            }
          } else {
            await cacheManager.clearCacheOnVersionChange(null, APP_VERSION);
          }
        }
      } catch (err) {
        /* console.error('Initialization error:', err) */ void 0;
        safeSetState(setError, err.message);
      } finally {
        timeoutId = setTimeout(() => {
          safeSetState(setIsLoading, false);
        }, 100);
      }
    };

    init();

    // Start tracking if user is already logged in (e.g. refresh)
    const rawAuth = localStorage.getItem("auth_data");
    if (rawAuth) {
      try {
        TrackingService.startTracking(JSON.parse(rawAuth));
      } catch (e) {
        /* console.error("Failed to restart tracking on App mount:", e) */ void 0;
      }
    }

    // Handle session end on window close/refresh
    const handleUnload = () => {
      TrackingService.stopTracking();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleUnload);
      if (timeoutId) clearTimeout(timeoutId);
      try {
        cacheManager.clearMemoryCache();
      } catch (e) {
        /* console.warn('Cleanup error:', e) */ void 0;
      }
    };
  }, []);

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f4f6f9'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <img
            src="https://i.ibb.co/xq80RrBW/SEED-Logo.webp"
            alt="SEED-IT Logo"
            style={{ width: '150px', height: 'auto' }}
          />
        </div>
        <p style={{
          color: '#666',
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif'
        }}>
          Loading... Please wait
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/trainer" element={<TrainerRoute><ChallengeSubmission /></TrainerRoute>} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/admin" element={<AdminQuestionBank />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/seed-seb" element={<SeedSeb />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
