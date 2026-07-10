import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/SeedSeb.css";

function SeedSeb() {
  // 1. Student Journey Interactive Timeline State
  const [activeStep, setActiveStep] = useState(0);

  // 2. Interactive Proctoring Simulator State
  const [proctorState, setProctorState] = useState("idle"); // idle, checking, active, violation
  const [proctorLogs, setProctorLogs] = useState(["[System] Proctoring engine loaded. Press 'Start Simulation'."]);

  // 3. Learning Paths State
  const [activePath, setActivePath] = useState("java"); // java, python, aptitude

  // 4. Reports & Analytics State
  const [activeRole, setActiveRole] = useState("student"); // student, faculty, institution, placementCell

  // 5. Interactive Platform Gallery State
  const [galleryTab, setGalleryTab] = useState("dashboard");
  const [learningSubTab, setLearningSubTab] = useState(0); // 0: content, 1: playlist 1, 2: playlist 2
  const [practiceSubTab, setPracticeSubTab] = useState(0); // 0: bank, 1: modules, 2: editor

  // Handle Proctoring simulator transitions
  useEffect(() => {
    let t1, t2;
    if (proctorState === "checking") {
      setProctorLogs([
        "[System] Initializing webcam integration...",
        "[System] Accessing video channel...",
        "[AI Engine] Calibrating face geometry...",
        "[AI Engine] Running microphone decibel check..."
      ]);
      t1 = setTimeout(() => {
        setProctorState("active");
        setProctorLogs(prev => [
          ...prev,
          "[System] Session Active. Integrity level: 100%.",
          "[AI Engine] Monitoring: 1 user face detected in frame.",
          "[AI Engine] Background noise: 12dB (Normal)."
        ]);
      }, 2000);
    } else if (proctorState === "violation") {
      setProctorLogs(prev => [
        ...prev,
        "️ [ALERT] Multiple faces identified in video feed!",
        "️ [ALERT] Secondary mobile screen pattern recognized!",
        "️ [ALERT] Focus violation: User exited tab/fullscreen mode!",
        " [CRITICAL] Suspicion index exceeded limit (92%). Logged to coordinator dashboard."
      ]);
    } else if (proctorState === "idle") {
      setProctorLogs(["[System] Proctoring engine standby."]);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [proctorState]);

  const journeySteps = [
    {
      title: "1. Learning Phase",
      icon: "",
      img: "/images/journey/phase-learning.png",
      summary: "Video lectures, expert notes, and structured domain modules.",
      desc: "Access structured curriculum modules prepared by industry experts, covering basic programming syntax up to advanced frameworks."
    },
    {
      title: "2. Practice Phase",
      icon: "",
      img: "/images/journey/phase-practice.png",
      summary: "11,000+ coding challenges and 17,000+ aptitude/MCQ questions.",
      desc: "Build muscle memory on a vast collection of problems. Write clean code in our browser editor and test it against strict testcases."
    },
    {
      title: "3. Company-Specific Prep",
      icon: "",
      img: "/images/journey/phase-company.png",
      summary: "Simulated paper patterns for 40+ recruitment giants.",
      desc: "Simulate exact question distributions, timings, and test formats used by recruiters like TCS, Accenture, Wipro, and Infosys."
    },
    {
      title: "4. Analytics & Insight",
      icon: "",
      img: "/images/journey/phase-analytics.png",
      summary: "Real-time weakness identification & skill matrices.",
      desc: "Identify your conceptual gap immediately after taking tests. Pinpoint whether you need help with DP, SQL, or Quants."
    },
    {
      title: "5. Targeted Re-Learn",
      icon: "",
      img: "/images/journey/phase-relearn.png",
      summary: "AI-recommended revision cycles.",
      desc: "Don't guess what to study next. Our engine suggests targeted video units and practice challenges matching your weaker topics."
    },
    {
      title: "6. Get Placed!",
      icon: "",
      img: "/images/journey/phase-placed.png",
      summary: "Placement-ready verified profiles and credentials.",
      desc: "Export institutional performance scorecards to hiring teams as verified proof of your high-integrity engineering abilities."
    }
  ];

  const learningPaths = {
    java: {
      title: "Java Developer Path",
      steps: [
        "Core Java (Loops, Strings, OOPs)",
        "Collections & Data Structures",
        "Java Multithreading & Concurrency",
        "Spring Boot Microservices",
        "REST API Development & SQL",
        "Mini Project & Coding Testcase Prep",
        "Mock Placement Assessments",
        "MNC Final Selection Interview"
      ]
    },
    python: {
      title: "Python & Data Science Path",
      steps: [
        "Python Fundamentals & Scripting",
        "Data Manipulation (NumPy, Pandas)",
        "Exploratory Data Analysis (Matplotlib)",
        "Supervised ML Models & SciKit-Learn",
        "Neural Networks & Deep Learning",
        "SQL Query & Database Normalization",
        "AI Capstone Project Deployment",
        "Company Fit Shortlist Rounds"
      ]
    },
    aptitude: {
      title: "Aptitude & Verbal Mastery Path",
      steps: [
        "Number Systems & Simplifications",
        "Ratios, Proportions & Percentages",
        "Permutations, Combinations & Probability",
        "Logical Deductions & Syllogisms",
        "Data Interpretation (Charts & Tables)",
        "Verbal Comprehension & Sentence Correction",
        "Time-bound Aptitude Mock Assessments",
        "Corporate Elimination Screening Exams"
      ]
    }
  };

  const analyticsRoles = {
    student: {
      title: " Student Dashboard",
      desc: "Provides students complete transparency over their progress, ranking, and concept masteries.",
      bullets: [
        "Live scorecards & ranking leaderboards",
        "Interactive topic weakness heatmap",
        "Automated AI gap recomendations",
        "Verified resume-linkable credentials"
      ]
    },
    faculty: {
      title: " Faculty Control Panel",
      desc: "Gives professors and class coordinators the metrics to track class attendance and course progress.",
      bullets: [
        "Batch-wise student eligibility summaries",
        "Detailed difficulty spread analytics",
        "Custom question bank assignment builder",
        "Instant test completion audit report"
      ]
    },
    institution: {
      title: "️ Institutional Management Panel",
      desc: "Designed for college deans, directors, and principals to compare department rankings and performance.",
      bullets: [
        "Department-wise performance benchmarks",
        "Placement Readiness Index (PRI) trackers",
        "Historical academic batch trends",
        "Infrastructure and user concurrency logs"
      ]
    },
    placementCell: {
      title: " Placement Cell Dashboard",
      desc: "Equips campus recruiters and placement officers with filters to instantly screen candidates.",
      bullets: [
        "Instant filtering by exact company benchmarks",
        "Real-time company fit scores",
        "Verified resume, certificate, and profile database",
        "Offer letter log & feedback tracking"
      ]
    }
  };

  const companiesList = [
    "Accenture", "Amazon", "Microsoft", "Goldman Sachs", "JP Morgan", "Infosys",
    "TCS Digital", "TCS Ninja", "TCS NQT", "Wipro NTH", "Wipro WILP", "Capgemini",
    "Cognizant", "Deloitte", "IBM", "HCL", "Tech Mahindra", "Reliance Jio",
    "DXC Technology", "Hexaware", "Mphasis", "ZS Associates", "Mu Sigma",
    "CoCubes", "AMCAT", "eLitmus", "HackerRank Mock", "HackerEarth Mock",
    "NTT Data", "L&T Infotech", "Mindtree", "InfyTQ Prep", "Mettl Pattern",
    "WeCP Pattern", "HirePro Prep", "MyAnatomy Mock", "First Naukri"
  ];

  
  // Helper to render high-quality visual SVGs for journey steps
  const renderJourneyIllustration = (stepIndex) => {
    const green = "#00a83a";
    const dark = "#1e293b";
    
    switch(stepIndex) {
      case 0: // Learning
        return (
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="200" height="130" rx="10" stroke={dark} strokeWidth="4" fill="#ffffff" />
            <rect x="35" y="35" width="170" height="85" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M70 150 L170 150 L190 170 L50 170 Z" fill={dark} />
            <circle cx="120" cy="77" r="22" stroke={green} strokeWidth="4" strokeDasharray="6,4" fill="none" />
            <polygon points="115,70 130,77 115,84" fill={green} />
            <line x1="50" y1="132" x2="190" y2="132" stroke="#e2e8f0" strokeWidth="2" />
          </svg>
        );
      case 1: // Practice
        return (
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="15" width="210" height="150" rx="8" stroke={dark} strokeWidth="4" fill="#ffffff" />
            <rect x="15" y="15" width="210" height="35" fill={dark} />
            <circle cx="35" cy="32" r="5" fill="#ef4444" />
            <circle cx="50" cy="32" r="5" fill="#f59e0b" />
            <circle cx="65" cy="32" r="5" fill="#10b981" />
            <path d="M40 70 L65 85 L40 100" stroke={green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="75" y1="100" x2="110" y2="100" stroke={green} strokeWidth="4" strokeLinecap="round" />
            <rect x="140" y="70" width="70" height="75" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="175" cy="100" r="14" fill={green} />
            <path d="M169 100 L173 104 L181 96" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 2: // Company Mocks
        return (
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="40" width="180" height="110" rx="8" stroke={dark} strokeWidth="4" fill="#ffffff" />
            <path d="M90 40 L90 20 C90 14 150 14 150 20 L150 40" stroke={dark} strokeWidth="4" fill="none" />
            <line x1="30" y1="85" x2="210" y2="85" stroke={dark} strokeWidth="2" />
            <circle cx="70" cy="62" r="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="95" y="58" width="85" height="8" rx="4" fill={dark} />
            <circle cx="70" cy="118" r="12" fill={green} />
            <path d="M65 118 L68 121 L75 114" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="95" y="114" width="85" height="8" rx="4" fill="#64748b" />
          </svg>
        );
      case 3: // Analytics
        return (
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="200" height="140" rx="8" stroke={dark} strokeWidth="4" fill="#ffffff" />
            <line x1="45" y1="130" x2="195" y2="130" stroke={dark} strokeWidth="3" />
            <line x1="45" y1="45" x2="45" y2="130" stroke={dark} strokeWidth="3" />
            <rect x="65" y="90" width="22" height="40" rx="3" fill="#cbd5e1" />
            <rect x="100" y="70" width="22" height="60" rx="3" fill="#94a3b8" />
            <rect x="135" y="50" width="22" height="80" rx="3" fill="#475569" />
            <rect x="170" y="35" width="22" height="95" rx="3" fill={green} />
            <path d="M60 100 L95 70 L135 55 L175 35" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="175" cy="35" r="5" fill="#ef4444" />
          </svg>
        );
      case 4: // Targeted Re-Learn
        return (
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M120 30 C170 30 200 65 200 100 C200 135 170 150 120 150 C70 150 40 135 40 100 C40 65 70 30 120 30 Z" stroke={dark} strokeWidth="4" strokeDasharray="8 6" fill="none" />
            <circle cx="120" cy="30" r="12" fill={green} />
            <path d="M116 30 L119 33 L124 28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="200" cy="100" r="10" fill="#f59e0b" />
            <circle cx="40" cy="100" r="10" fill="#3b82f6" />
            <circle cx="120" cy="150" r="12" fill={green} />
            <path d="M116 150 L119 153 L124 148" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M120 70 L145 95 L95 95 Z" fill={dark} />
            <rect x="90" y="105" width="60" height="8" rx="4" fill={green} />
          </svg>
        );
      default: // Get Placed
        return (
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="55" width="160" height="110" rx="8" stroke={dark} strokeWidth="4" fill="#ffffff" />
            <path d="M120 20 L200 45 L120 70 L40 45 Z" fill={green} stroke={dark} strokeWidth="3" />
            <path d="M200 45 L200 110" stroke={dark} strokeWidth="3" />
            <path d="M120 70 L120 135" stroke={green} strokeWidth="3" />
            <circle cx="120" cy="105" r="22" fill="#fff7ed" stroke="#f59e0b" strokeWidth="3" />
            <polygon points="120,93 123,101 131,101 125,106 127,114 120,109 113,114 115,106 109,101 117,101" fill="#f59e0b" />
          </svg>
        );
    }
  };

  // Helper to render visual SVGs for path tracks
  const renderPathIllustration = (pathKey) => {
    const green = "#00a83a";
    const dark = "#1e293b";

    switch(pathKey) {
      case "java":
        return (
          <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="180" height="140" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M70 120 C70 120 65 70 110 70 C155 70 150 120 150 120 C150 120 155 135 110 135 C65 135 70 120 70 120 Z" fill="#e1f5fe" stroke="#0288d1" strokeWidth="3" />
            <path d="M110 35 Q125 50 115 65 Q130 80 120 95" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" />
            <path d="M98 40 Q110 52 102 67 Q115 82 107 97" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="110" cy="122" rx="30" ry="7" fill="none" stroke="#0288d1" strokeWidth="3" />
            <rect x="55" y="145" width="110" height="6" rx="3" fill={dark} />
          </svg>
        );
      case "python":
        return (
          <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="180" height="140" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M110 40 C75 40 75 55 75 55 L75 75 L110 75 L110 80 L60 80 C60 80 40 80 40 110 C40 140 60 140 60 140 L75 140 L75 125 L110 125 C145 125 145 110 145 110 L145 90 L110 90 L110 85 L160 85 C160 85 180 85 180 55 C180 25 160 40 110 40 Z" fill="#e0f2fe" stroke="#0288d1" strokeWidth="3" />
            <circle cx="90" cy="52" r="3" fill="#0288d1" />
            <circle cx="130" cy="128" r="3" fill="#0288d1" />
            <path d="M140 60 L180 85 L140 110" stroke={green} strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        );
      default:
        return (
          <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="180" height="140" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
            <circle cx="110" cy="90" r="45" stroke={green} strokeWidth="4" strokeDasharray="5,4" fill="none" />
            <circle cx="110" cy="90" r="28" fill="#f0fdf4" stroke={green} strokeWidth="2" />
            <text x="110" y="96" textAnchor="middle" fill={green} fontSize="18" fontWeight="bold">?</text>
            <rect x="40" y="30" width="30" height="25" rx="4" fill="#cbd5e1" />
            <rect x="150" y="120" width="30" height="25" rx="4" fill="#cbd5e1" />
          </svg>
        );
    }
  };

  // Helper to render problem statement illustration
  const renderProblemIllustration = () => {
    const red = "#be123c";
    const dark = "#1e293b";
    return (
      <svg width="240" height="200" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="25" width="190" height="150" rx="12" fill="#fff5f5" stroke="#fecdd3" strokeWidth="3" />
        <circle cx="120" cy="85" r="30" fill="none" stroke={red} strokeWidth="4" strokeDasharray="5 4" />
        <path d="M120 70 L120 90 L130 95" stroke={red} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="140" x2="190" y2="140" stroke="#fecdd3" strokeWidth="2" />
        <rect x="60" y="150" width="120" height="8" rx="4" fill={red} />
        <rect x="40" y="45" width="25" height="20" rx="4" fill="#fda4af" />
        <rect x="175" y="45" width="25" height="20" rx="4" fill="#fda4af" />
      </svg>
    );
  };

  return (
    <div className="seb-page-wrapper">
      {/* SEED-SEB Header */}
      <header className="seb-header">
        <div className="seb-logo-container">
          <img src="/SEED_Logo.png" alt="SEED IT Logo" className="seb-logo-img" />
          <span className="seb-logo-text">SEED-SEB</span>
        </div>
        <Link to="/" className="seb-back-btn">
          &larr; Back to Main Website
        </Link>
      </header>

      {/* Hero Section */}
      <section className="seb-hero">
        <div className="seb-hero-container">
          <div className="seb-hero-left">
            <span className="seb-hero-badge">Placement Operating System</span>
            <h1>AI-Powered Placement Readiness Platform</h1>
            <p className="seb-hero-sub">One Platform. Complete Placement Preparation.</p>
            <p className="seb-hero-tagline">Learn &middot; Practice &middot; Assess &middot; Improve &middot; Get Placed</p>
            
            <div className="seb-hero-features">
              <span className="seb-hero-feat-tag"> Coding</span>
              <span className="seb-hero-feat-tag"> Aptitude</span>
              <span className="seb-hero-feat-tag"> MCQs</span>
              <span className="seb-hero-feat-tag"> Company Papers</span>
              <span className="seb-hero-feat-tag"> AI Proctoring</span>
              <span className="seb-hero-feat-tag">️ Learning Paths</span>
              <span className="seb-hero-feat-tag"> Analytics</span>
              <span className="seb-hero-feat-tag"> AI Evaluation</span>
              <span className="seb-hero-feat-tag"> Reports</span>
            </div>

            <div className="seb-hero-actions">
              <a href="#contact" className="seb-btn-primary">Request Institution Demo</a>
              <Link to="/login" className="seb-btn-secondary">Portal Login</Link>
            </div>
          </div>
          <div className="seb-hero-right">
            <div className="seb-hero-img-box">
              <img 
                src="/images/seedseb/Seed-seb-StudentDashboard.png" 
                alt="SEED-SEB Student Dashboard UI"
                className="seb-hero-placeholder clickable-screenshot"
                onClick={() => {
                  setGalleryTab("dashboard");
                  document.getElementById("platform-gallery")?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="seb-section seb-problem-bg">
        <div className="seb-section-title">
          <h2>The Problem with Disconnected Tools</h2>
          <p>Campus coordinators spend valuable hours matching details on multiple disconnected portals with zero centralization.</p>
        </div>

        <div className="seb-problem-grid">
          <div className="seb-problem-left">
            <h3>Fragmented Tools Campus Placement Cells Struggle With:</h3>
            <p>Today, college placement cells pay separate licensing fees for 6 to 8 individual platforms, none of which share performance data.</p>
            <div className="seb-tools-list">
              <div className="seb-tool-item">
                <span className="cross"></span>
                <div>
                  <strong>LeetCode & CodeChef:</strong>
                  <span> Fine for coding, but completely lacks aptitude, company exam templates, or student dashboards.</span>
                </div>
              </div>
              <div className="seb-tool-item">
                <span className="cross"></span>
                <div>
                  <strong>HackerRank Assessments:</strong>
                  <span> Heavily expensive enterprise pricing, zero structured course materials or learning guides.</span>
                </div>
              </div>
              <div className="seb-tool-item">
                <span className="cross"></span>
                <div>
                  <strong>Google Forms / Sheets:</strong>
                  <span> Used for quants tests. Easily bypassed, zero timer constraints, and manual scoring overhead.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="seb-problem-right">
            <h4>Common Institutional Roadblocks</h4>
            <ul className="seb-issues-list">
              <li>Multiple Student Logins & Bills</li>
              <li>Zero unified performance analytics</li>
              <li>No structured company-specific training</li>
              <li>High licensing costs with minimal ROI</li>
              <li>Manual coordination of CSV files and reports</li>
              <li>Lack of high-integrity proctored test environment</li>
            </ul>
            <div className="seb-result-box">
              Result: Sub-optimal hiring outcomes, high administrative fatigue, and low institutional visibility.
            </div>
            <div className="seb-problem-visual" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              {renderProblemIllustration()}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="seb-section">
        <div className="seb-section-title">
          <h2>The Solution: SEED-SEB Placement Operating System</h2>
          <p>Consolidate your training and screening programs into a single campus assessment portal.</p>
        </div>

        <div className="seb-solution-grid">
          <div className="seb-solution-left">
            <h4>Replace 7 fragment subscriptions with:</h4>
            <h2>ONE Ecosystem</h2>
            <div className="seb-sol-bullets">
              <div className="seb-sol-bullet-item"> Complete Coding Practice Engine</div>
              <div className="seb-sol-bullet-item"> Aptitude & Reasoning Prep Library</div>
              <div className="seb-sol-bullet-item"> Realistic Mock Recruitment Exams</div>
              <div className="seb-sol-bullet-item"> AI-Powered Anti-Cheat Monitoring</div>
            </div>
            <p style={{ fontWeight: '700', color: '#166534' }}>
              ONE Platform &bull; ONE Subscription &bull; COMPLETE Placement Readiness
            </p>
          </div>

          <div className="seb-solution-right">
            <h3>SEED-SEB Unified Value Proposition</h3>
            <p>SEED-SEB provides a high-integrity ecosystem covering all aspects of training, diagnostic scoring, and campus screening drives.</p>
            <div className="seb-sol-features">
              <div className="seb-sol-card">
                <h4>11,000+ Coding Questions</h4>
                <p>Structured from basics up to complex graph theories, heaps, and tree sorting.</p>
              </div>
              <div className="seb-sol-card">
                <h4>11,000+ Aptitude Tests</h4>
                <p>Quantitative, Verbal, and Logical reasoning modules with step-by-step solutions.</p>
              </div>
              <div className="seb-sol-card">
                <h4>6,000+ Technical MCQs</h4>
                <p>Covers DBMS, computer networking, OS, cybersecurity, and system architecture.</p>
              </div>
              <div className="seb-sol-card">
                <h4>40+ Company Papers</h4>
                <p>MNC screening simulations (TCS Ninja/Digital, Accenture, Infosys, Zoho).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEED-SEB Platform Interface Gallery Section */}
      <section id="platform-gallery" className="seb-section seb-gallery-bg">
        <div className="seb-section-title">
          <h2>SEED-SEB Platform Interface Gallery</h2>
          <p>Explore real screenshots of the student prep environment and dashboard modules.</p>
        </div>

        <div className="seb-gallery-container">
          {/* Main Category Tabs */}
          <div className="seb-gallery-tabs">
            <button 
              className={`seb-gallery-tab-btn ${galleryTab === "dashboard" ? "active" : ""}`}
              onClick={() => setGalleryTab("dashboard")}
            >
              📊 Student Dashboard
            </button>
            <button 
              className={`seb-gallery-tab-btn ${galleryTab === "login" ? "active" : ""}`}
              onClick={() => setGalleryTab("login")}
            >
              🔒 Portal Access
            </button>
            <button 
              className={`seb-gallery-tab-btn ${galleryTab === "learning" ? "active" : ""}`}
              onClick={() => setGalleryTab("learning")}
            >
              📚 Learning Content
            </button>
            <button 
              className={`seb-gallery-tab-btn ${galleryTab === "practice" ? "active" : ""}`}
              onClick={() => setGalleryTab("practice")}
            >
              💻 Practice & Coding
            </button>
            <button 
              className={`seb-gallery-tab-btn ${galleryTab === "profile" ? "active" : ""}`}
              onClick={() => setGalleryTab("profile")}
            >
              👤 Verified Profile
            </button>
          </div>

          {/* Interactive Card Display */}
          <div className="seb-gallery-content">
            <div className="seb-gallery-grid">
              
              {/* Left Column: Description & Info */}
              <div className="seb-gallery-details">
                {galleryTab === "dashboard" && (
                  <div>
                    <h3>📊 Centralized Student Dashboard</h3>
                    <p className="seb-gallery-desc">
                      The primary cockpit for students. This screen shows overall progress metrics, placement eligibility trackers, mock assessment summaries, live activity charts, and ranking metrics.
                    </p>
                    <div className="seb-gallery-features-list">
                      <div className="seb-gallery-feat-item">✔️ Placement Ready Status indication</div>
                      <div className="seb-gallery-feat-item">✔️ Practice hours and coding problem tracker</div>
                      <div className="seb-gallery-feat-item">✔️ Strengths and concept mastery distribution map</div>
                      <div className="seb-gallery-feat-item">✔️ Quick access to assigned upcoming tests</div>
                    </div>
                  </div>
                )}

                {galleryTab === "login" && (
                  <div>
                    <h3>🔒 Secure Portal Entry</h3>
                    <p className="seb-gallery-desc">
                      A high-integrity login portal designed for security. It verifies session variables, manages cookie authentication details, and ensures single-user session binding.
                    </p>
                    <div className="seb-gallery-features-list">
                      <div className="seb-gallery-feat-item">✔️ Role-based access selector (Student/Faculty)</div>
                      <div className="seb-gallery-feat-item">✔️ Secure session state establishment</div>
                      <div className="seb-gallery-feat-item">✔️ Auto-cleanup of stale tracking storage</div>
                    </div>
                  </div>
                )}

                {galleryTab === "learning" && (
                  <div>
                    <h3>📚 Domain Learning & DSA Playlists</h3>
                    <p className="seb-gallery-desc">
                      A repository of structured academic content. Students can study module theories, watch embedded lectures, and navigate sequential DSA playlist roadmaps.
                    </p>
                    {/* Sub-tabs for Learning */}
                    <div className="seb-gallery-subtabs">
                      <button 
                        className={`seb-gallery-subtab-btn ${learningSubTab === 0 ? "active" : ""}`}
                        onClick={() => setLearningSubTab(0)}
                      >
                        Module Chapters
                      </button>
                      <button 
                        className={`seb-gallery-subtab-btn ${learningSubTab === 1 ? "active" : ""}`}
                        onClick={() => setLearningSubTab(1)}
                      >
                        DSA Roadmap
                      </button>
                      <button 
                        className={`seb-gallery-subtab-btn ${learningSubTab === 2 ? "active" : ""}`}
                        onClick={() => setLearningSubTab(2)}
                      >
                        Topic Navigation
                      </button>
                    </div>
                    <div className="seb-gallery-features-list" style={{ marginTop: '15px' }}>
                      {learningSubTab === 0 && (
                        <>
                          <div className="seb-gallery-feat-item">✔️ Structured chapter hierarchies for standard courses</div>
                          <div className="seb-gallery-feat-item">✔️ Detailed written lecture reviews and resource links</div>
                        </>
                      )}
                      {learningSubTab === 1 && (
                        <>
                          <div className="seb-gallery-feat-item">✔️ DSA Playlist Track covering arrays, lists, recursion</div>
                          <div className="seb-gallery-feat-item">✔️ Step-by-step progress tracking for algorithmic puzzles</div>
                        </>
                      )}
                      {learningSubTab === 2 && (
                        <>
                          <div className="seb-gallery-feat-item">✔️ Language selection (Java, Python, C++, SQL)</div>
                          <div className="seb-gallery-feat-item">✔️ Comprehensive concept categorization and quizzes</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {galleryTab === "practice" && (
                  <div>
                    <h3>💻 Practice Modules & Compiler Console</h3>
                    <p className="seb-gallery-desc">
                      The core practice framework. Students can solve conceptual questions, select modular challenges based on topic categories, and submit code to verify testcases.
                    </p>
                    {/* Sub-tabs for Practice */}
                    <div className="seb-gallery-subtabs">
                      <button 
                        className={`seb-gallery-subtab-btn ${practiceSubTab === 0 ? "active" : ""}`}
                        onClick={() => setPracticeSubTab(0)}
                      >
                        Practice Bank
                      </button>
                      <button 
                        className={`seb-gallery-subtab-btn ${practiceSubTab === 1 ? "active" : ""}`}
                        onClick={() => setPracticeSubTab(1)}
                      >
                        Topic Modules
                      </button>
                      <button 
                        className={`seb-gallery-subtab-btn ${practiceSubTab === 2 ? "active" : ""}`}
                        onClick={() => setPracticeSubTab(2)}
                      >
                        Compiler IDE
                      </button>
                    </div>
                    <div className="seb-gallery-features-list" style={{ marginTop: '15px' }}>
                      {practiceSubTab === 0 && (
                        <>
                          <div className="seb-gallery-feat-item">✔️ Thousands of categorized coding challenges</div>
                          <div className="seb-gallery-feat-item">✔️ Dynamic filtering by difficulty (Easy/Medium/Hard)</div>
                        </>
                      )}
                      {practiceSubTab === 1 && (
                        <>
                          <div className="seb-gallery-feat-item">✔️ Practice modules matching target recruitment blueprints</div>
                          <div className="seb-gallery-feat-item">✔️ Completion rate counters for targeted subcategories</div>
                        </>
                      )}
                      {practiceSubTab === 2 && (
                        <>
                          <div className="seb-gallery-feat-item">✔️ Interactive code editor console with multi-language compiler</div>
                          <div className="seb-gallery-feat-item">✔️ Live compiler console matching output testcases</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {galleryTab === "profile" && (
                  <div>
                    <h3>👤 Verified Student Performance Profile</h3>
                    <p className="seb-gallery-desc">
                      The candidate portfolio. Displays individual assessment scorecards, roll number validations, topic breakdown matrices, and recruiter-ready verified metrics.
                    </p>
                    <div className="seb-gallery-features-list">
                      <div className="seb-gallery-feat-item">✔️ College roll number and badge indicator</div>
                      <div className="seb-gallery-feat-item">✔️ Section-by-section breakdown (Aptitude, Tech, Coding)</div>
                      <div className="seb-gallery-feat-item">✔️ Score logs history and performance benchmark export</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Screenshot Visual Mockup */}
              <div className="seb-gallery-visual">
                <div className="seb-browser-mockup">
                  <div className="seb-browser-header">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yellow"></span>
                    <span className="dot dot-green"></span>
                    <div className="seb-browser-address-bar">
                      https://platform.seedit.in/{galleryTab}
                    </div>
                  </div>
                  <div className="seb-browser-viewport">
                    {galleryTab === "dashboard" && (
                      <img 
                        src="/images/seedseb/Seed-seb-StudentDashboard.png" 
                        alt="SEED-SEB Student Dashboard UI" 
                        className="seb-gallery-img"
                      />
                    )}
                    {galleryTab === "login" && (
                      <img 
                        src="/images/seedseb/Seed-seb-loginPage.png" 
                        alt="SEED-SEB Login Page UI" 
                        className="seb-gallery-img"
                      />
                    )}
                    {galleryTab === "learning" && (
                      <>
                        {learningSubTab === 0 && (
                          <img 
                            src="/images/seedseb/Seed-seb-LearningContent.png" 
                            alt="SEED-SEB Learning Content UI" 
                            className="seb-gallery-img"
                          />
                        )}
                        {learningSubTab === 1 && (
                          <img 
                            src="/images/seedseb/Seed-seb-DSAplaylist.png" 
                            alt="SEED-SEB DSA Playlist UI" 
                            className="seb-gallery-img"
                          />
                        )}
                        {learningSubTab === 2 && (
                          <img 
                            src="/images/seedseb/Seed-seb-Dsaplaylist2.png" 
                            alt="SEED-SEB DSA Sub playlist UI" 
                            className="seb-gallery-img"
                          />
                        )}
                      </>
                    )}
                    {galleryTab === "practice" && (
                      <>
                        {practiceSubTab === 0 && (
                          <img 
                            src="/images/seedseb/Seed-seb-PracitceBank.png" 
                            alt="SEED-SEB Practice Bank UI" 
                            className="seb-gallery-img"
                          />
                        )}
                        {practiceSubTab === 1 && (
                          <img 
                            src="/images/seedseb/Seed-seb-Practice Modules-.png" 
                            alt="SEED-SEB Practice Modules UI" 
                            className="seb-gallery-img"
                          />
                        )}
                        {practiceSubTab === 2 && (
                          <img 
                            src="/images/seedseb/Seed-seb-codingPage.png" 
                            alt="SEED-SEB Coding Page Editor UI" 
                            className="seb-gallery-img"
                          />
                        )}
                      </>
                    )}
                    {galleryTab === "profile" && (
                      <img 
                        src="/images/seedseb/Seed-seb-ProfilePage.png" 
                        alt="SEED-SEB Student Profile UI" 
                        className="seb-gallery-img"
                      />
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Student Journey Timeline Section */}
      <section className="seb-section seb-problem-bg">
        <div className="seb-section-title">
          <h2>The Guided Student Placement Journey</h2>
          <p>How SEED-SEB guides candidates step-by-step from onboarding to verified placement status.</p>
        </div>

        <div className="seb-journey-timeline">
          {journeySteps.map((step, index) => (
            <div 
              key={index} 
              className={`seb-journey-step ${activeStep === index ? "active" : ""}`}
              onClick={() => setActiveStep(index)}
            >
              <div className="seb-journey-step-img-wrap">
                <img src={step.img} alt={step.title} className="seb-journey-step-img" />
              </div>
              <div className="seb-journey-circle">{index + 1}</div>
              <h4>{step.title}</h4>
              <span>{step.summary}</span>
            </div>
          ))}
        </div>

        <div className="seb-journey-detail-card">
          <div className="seb-journey-detail-split">
            <div className="seb-journey-detail-text">
              <h3>{journeySteps[activeStep].title}: Detailed Outline</h3>
              <p>{journeySteps[activeStep].desc}</p>
            </div>
            <div className="seb-journey-detail-visual">
              <img
                src={journeySteps[activeStep].img}
                alt={journeySteps[activeStep].title}
                className="seb-journey-detail-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Section */}
      <section className="seb-section">
        <div className="seb-section-title">
          <h2>How We Stack Up Against Others</h2>
          <p>A detail breakdown comparing SEED-SEB against standard coding practice portals.</p>
        </div>

        <div className="seb-table-wrapper">
          <table className="seb-compare-table">
            <thead>
              <tr>
                <th>Key Requirement</th>
                <th className="seb-compare-highlight">SEED-SEB</th>
                <th>LeetCode</th>
                <th>CodeChef</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Coding Questions</strong></td>
                <td className="seb-compare-highlight"> 11,000+ Questions</td>
                <td> 3,000+ Questions</td>
                <td> 8,000+ Questions</td>
              </tr>
              <tr>
                <td><strong>Aptitude Prep</strong></td>
                <td className="seb-compare-highlight"> 11,000+ Questions</td>
                <td> None</td>
                <td> None</td>
              </tr>
              <tr>
                <td><strong>Technical MCQs</strong></td>
                <td className="seb-compare-highlight"> 6,000+ DBMS/OS/Net</td>
                <td> None</td>
                <td> None</td>
              </tr>
              <tr>
                <td><strong>Company-Specific Papers</strong></td>
                <td className="seb-compare-highlight"> 40+ Top Giant Patterns</td>
                <td> None</td>
                <td> None</td>
              </tr>
              <tr>
                <td><strong>AI-Powered Proctoring</strong></td>
                <td className="seb-compare-highlight"> Webcam + Audio + Tab Lock</td>
                <td> None</td>
                <td> None</td>
              </tr>
              <tr>
                <td><strong>Guided Learning Paths</strong></td>
                <td className="seb-compare-highlight"> Full Track Guidance</td>
                <td>️ Partial (Paid)</td>
                <td> None</td>
              </tr>
              <tr>
                <td><strong>Institutional Dashboards</strong></td>
                <td className="seb-compare-highlight"> Included (4 Stakeholder Views)</td>
                <td> None</td>
                <td> None</td>
              </tr>
              <tr>
                <td><strong>Excel/PDF Report Exports</strong></td>
                <td className="seb-compare-highlight"> Direct Batch Export</td>
                <td> None</td>
                <td> None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Content Repository Metrics */}
      <section className="seb-section seb-problem-bg">
        <div className="seb-section-title">
          <h2>Comprehensive Content Repository</h2>
          <p>Unmatched scope of preparation content covering all sectors of evaluation.</p>
        </div>

        <div className="seb-stats-grid">
          <div className="seb-stat-box">
            <h2>11,000+</h2>
            <p>CODING CHALLENGES</p>
          </div>
          <div className="seb-stat-box">
            <h2>11,000+</h2>
            <p>APTITUDE QUESTIONS</p>
          </div>
          <div className="seb-stat-box">
            <h2>6,000+</h2>
            <p>TECHNICAL MCQS</p>
          </div>
          <div className="seb-stat-box">
            <h2>40+</h2>
            <p>COMPANY PAPERS</p>
          </div>
        </div>

        <div className="seb-companies-section">
          <h4>Simulated papers representing 40+ MNC recruitment giants, including:</h4>
          <div className="seb-companies-flex">
            {companiesList.map((comp, idx) => (
              <span key={idx} className="seb-comp-badge">{comp}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment Engine Specifications */}
      <section className="seb-section">
        <div className="seb-section-title">
          <h2>High Performance Assessment Engine</h2>
          <p>Configure custom exams tailored exactly to MNC patterns with custom timer settings.</p>
        </div>

        <div className="seb-engine-grid">
          <div className="seb-engine-card">
            <h3>⏱ Flexible Timers</h3>
            <ul>
              <li>Overall assessment countdown limit</li>
              <li>Per-Question restrictive timer boundaries</li>
              <li>Sectional timeline controls (e.g. 20 min Quants, 20 min Coding)</li>
              <li>Automatic session submittal on timer end</li>
              <li>Authorized administrator pause/resume controls</li>
            </ul>
          </div>
          <div className="seb-engine-card">
            <h3> Question Categories</h3>
            <ul>
              <li>Coding tests with support for C, C++, Java, Python, and JS</li>
              <li>Database compilation checks with SQL editor console</li>
              <li>Logical aptitude and general technical MCQs</li>
              <li>Pseudo-code analysis and code debugging errors</li>
              <li>Descriptive essay writing & textual answers</li>
            </ul>
          </div>
          <div className="seb-engine-card">
            <h3> Advanced Control</h3>
            <ul>
              <li>Shuffle algorithms for questions and choices</li>
              <li>Custom negative marking schemes</li>
              <li>Sectional cutoff minimum boundaries</li>
              <li>Dynamic question database pooling</li>
              <li>Adaptive test difficulty options</li>
            </ul>
          </div>
        </div>

        <div className="seb-engine-screenshot-box">
          <h4 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-dimmed)' }}>💡 Real-world Compiler Workspace interface inside assessments:</h4>
          <div className="seb-browser-mockup">
            <div className="seb-browser-header">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
              <div className="seb-browser-address-bar">
                https://platform.seedit.in/assessment/coding-editor
              </div>
            </div>
            <div className="seb-browser-viewport">
              <img 
                src="/images/seedseb/Seed-seb-codingPage.png" 
                alt="SEED-SEB Compiler Coding Workspace" 
                className="seb-gallery-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Proctoring Simulator Widget */}
      <section className="seb-section seb-problem-bg">
        <div className="seb-section-title">
          <h2>High Integrity AI Proctoring Simulator</h2>
          <p>Run simulated scenarios of our webcam, voice, and browser monitoring rules in real-time.</p>
        </div>

        <div className="seb-proc-grid">
          <div className="seb-proc-details">
            <h3>Academic Integrity & Fraud Detection</h3>
            <p>Keep your online campus placement screening drives completely free from unfair practices. SEED-SEB locks the student session immediately if anomalies are flag-recorded.</p>
            <ul>
              <li><strong>AI Video Validation:</strong> Scans for missing candidate faces, unrecognized faces, or multiple people in the room.</li>
              <li><strong>Audio Monitoring:</strong> Identifies backchannel whispering or voice-prompt solutions.</li>
              <li><strong>Browser Sandbox Lock:</strong> Disables tab switching, copy-paste mechanisms, and external screens.</li>
              <li><strong>Unified Suspicion logs:</strong> Generates time-stamped activity indices for faculty audit.</li>
            </ul>
          </div>

          <div className="seb-proc-simulator">
            <div className={`seb-sim-screen ${proctorState}`}>
              {/* Simulator view representing webcam display */}
              <div className={`seb-sim-status-badge ${proctorState}`}>
                <span className="dot"></span>
                <span>
                  {proctorState === "idle" && "WEBCAM OFFLINE"}
                  {proctorState === "checking" && "CALIBRATING AI..."}
                  {proctorState === "active" && "MONITORING ACTIVE"}
                  {proctorState === "violation" && "PROCTOR ALERT - INCIDENT RED"}
                </span>
              </div>

              {proctorState === "idle" && (
                <div className="seb-sim-avatar-box">
                  <div className="seb-sim-avatar"></div>
                  <p>Camera Standby</p>
                </div>
              )}

              {proctorState === "checking" && (
                <div className="seb-sim-avatar-box">
                  <div className="seb-sim-avatar animate-pulse"></div>
                  <p>Initializing Face Validation...</p>
                </div>
              )}

              {proctorState === "active" && (
                <div className="seb-sim-avatar-box">
                  <div className="seb-sim-detection-box"></div>
                  <div className="seb-sim-avatar"></div>
                  <p style={{ color: "#10b981", fontWeight: "bold" }}>Candidate Face Verified</p>
                </div>
              )}

              {proctorState === "violation" && (
                <div className="seb-sim-avatar-box">
                  <div className="seb-sim-detection-box danger"></div>
                  <div className="seb-sim-secondary-device"></div>
                  <div className="seb-sim-avatar">  </div>
                  <p style={{ color: "#ef4444", fontWeight: "bold" }}>VIOLATION REGISTERED</p>
                </div>
              )}
            </div>

            <div className="seb-sim-controls">
              <button 
                className="seb-sim-btn idle"
                onClick={() => setProctorState("idle")}
              >
                Reset Engine
              </button>
              <button 
                className="seb-sim-btn check"
                onClick={() => setProctorState("checking")}
              >
                Start Proctor session
              </button>
              <button 
                className="seb-sim-btn alert"
                onClick={() => setProctorState("violation")}
              >
                Simulate Cheat Pattern
              </button>
            </div>

            <div className="seb-sim-log">
              {proctorLogs.map((log, idx) => {
                let logClass = "system";
                if (log.startsWith("️") || log.startsWith("")) logClass = "danger";
                else if (log.startsWith("[AI Engine]")) logClass = "info";
                return (
                  <div key={idx} className={`seb-log-line ${logClass}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths Guided Roadmaps */}
      <section className="seb-section">
        <div className="seb-section-title">
          <h2>Interactive Learning Paths</h2>
          <p>Pre-configured study roadmaps helping students acquire domain proficiencies.</p>
        </div>

        <div className="seb-paths-container">
          <div className="seb-paths-list">
            <button 
              className={`seb-path-select-btn ${activePath === "java" ? "active" : ""}`}
              onClick={() => setActivePath("java")}
            >
              <h4>Java Developer Track</h4>
              <p>Core OOPs, Collections, REST APIs & Spring Boot</p>
            </button>
            <button 
              className={`seb-path-select-btn ${activePath === "python" ? "active" : ""}`}
              onClick={() => setActivePath("python")}
            >
              <h4> Python & Data Science Track</h4>
              <p>Pandas, SciKit-Learn ML Models & AI deploy</p>
            </button>
            <button 
              className={`seb-path-select-btn ${activePath === "aptitude" ? "active" : ""}`}
              onClick={() => setActivePath("aptitude")}
            >
              <h4> Aptitude, Logical & Verbal Track</h4>
              <p>Numerical quants, logic structures & language cutoffs</p>
            </button>
          </div>

          <div className="seb-path-display-card">
            <div className="seb-path-display-split">
              <div className="seb-path-display-left">
                <h3>{learningPaths[activePath].title} Sequence</h3>
                <div className="seb-path-flow">
                  {learningPaths[activePath].steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="seb-path-flow-node">
                        <span>{idx + 1}</span> {step}
                      </div>
                      {idx < learningPaths[activePath].steps.length - 1 && (
                        <div className="seb-path-flow-arrow">&darr;</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="seb-path-display-right">
                {renderPathIllustration(activePath)}
              </div>
            </div>
          </div>
        </div>

        <div className="seb-domains-grid">
          <div className="seb-domain-box"> React / Frontend</div>
          <div className="seb-domain-box"> DSA Mastery</div>
          <div className="seb-domain-box">️ Cloud Computing</div>
          <div className="seb-domain-box">️ Cybersecurity</div>
        </div>
      </section>

      {/* Reports & Analytics Panels */}
      <section className="seb-section seb-problem-bg">
        <div className="seb-section-title">
          <h2>Multi-role Reports & Analytics</h2>
          <p>SEED-SEB provides tailored reporting panels for all key campus stakeholders.</p>
        </div>

        <div className="seb-analytics-tabs">
          <button 
            className={`seb-analytics-tab-btn ${activeRole === "student" ? "active" : ""}`}
            onClick={() => setActiveRole("student")}
          >
             Student Panel
          </button>
          <button 
            className={`seb-analytics-tab-btn ${activeRole === "faculty" ? "active" : ""}`}
            onClick={() => setActiveRole("faculty")}
          >
             Faculty View
          </button>
          <button 
            className={`seb-analytics-tab-btn ${activeRole === "institution" ? "active" : ""}`}
            onClick={() => setActiveRole("institution")}
          >
            ️ Institutional Deans
          </button>
          <button 
            className={`seb-analytics-tab-btn ${activeRole === "placementCell" ? "active" : ""}`}
            onClick={() => setActiveRole("placementCell")}
          >
             Placement Recruiter
          </button>
        </div>

        <div className="seb-analytics-view-card">
          <div className="seb-analytics-split">
            <div className="seb-analytics-left">
              <h3>{analyticsRoles[activeRole].title} Specifications</h3>
              <p>{analyticsRoles[activeRole].desc}</p>
              <div className="seb-analytics-bullet-grid">
                {analyticsRoles[activeRole].bullets.map((bullet, idx) => (
                  <div key={idx} className="seb-analytics-bullet">
                     {bullet}
                  </div>
                ))}
              </div>
            </div>
            <div className="seb-analytics-right">
              {activeRole === "student" && (
                <div className="seb-browser-mockup compact">
                  <div className="seb-browser-header">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yellow"></span>
                    <span className="dot dot-green"></span>
                    <div className="seb-browser-address-bar">
                      https://platform.seedit.in/student/profile
                    </div>
                  </div>
                  <div className="seb-browser-viewport">
                    <img 
                      src="/images/seedseb/Seed-seb-ProfilePage.png" 
                      alt="Student Profile Panel" 
                      className="seb-gallery-img"
                    />
                  </div>
                </div>
              )}
              {activeRole === "faculty" && (
                <div className="seb-analytics-panel-placeholder">
                  <h4>Faculty Control Panel Dashboard</h4>
                  <p>Includes live class completion status lists, custom test parameters creation tools, and diagnostic marks summary charts.</p>
                  <span className="seb-badge-tag-neon">Interactive metrics live</span>
                </div>
              )}
              {activeRole === "institution" && (
                <div className="seb-analytics-panel-placeholder">
                  <h4>Institutional Management Dashboard</h4>
                  <p>Aggregates multi-department KPIs, historic placement trends, infrastructure logging summaries, and batch eligibility indexes.</p>
                  <span className="seb-badge-tag-neon">Centralized compliance check</span>
                </div>
              )}
              {activeRole === "placementCell" && (
                <div className="seb-analytics-panel-placeholder">
                  <h4>Campus Recruiter Dashboard</h4>
                  <p>Equips hiring representatives with filtering queries for candidate scores, offer statuses tracking logs, and resume bundles extraction.</p>
                  <span className="seb-badge-tag-neon">Enterprise Recruiter Search</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Placement Outcomes & Graphs */}
      <section className="seb-section">
        <div className="seb-section-title">
          <h2>Proven Placement Outcomes</h2>
          <p>See the improvement metrics reported by institutions after deploying SEED-SEB.</p>
        </div>

        <div className="seb-outcomes-grid">
          <div className="seb-outcome-chart-box">
            <h3>Placement Rate Performance Index (%)</h3>
            <div className="seb-chart-bars-container">
              <div className="seb-chart-bar-wrapper">
                <div className="seb-chart-bar" style={{ height: "62%" }}>62%</div>
                <span className="seb-chart-label">2023</span>
              </div>
              <div className="seb-chart-bar-wrapper">
                <div className="seb-chart-bar" style={{ height: "71%" }}>71%</div>
                <span className="seb-chart-label">2024</span>
              </div>
              <div className="seb-chart-bar-wrapper">
                <div className="seb-chart-bar" style={{ height: "79%" }}>79%</div>
                <span className="seb-chart-label">2025</span>
              </div>
              <div className="seb-chart-bar-wrapper highlight">
                <div className="seb-chart-bar" style={{ height: "87%" }}>87%</div>
                <span className="seb-chart-label">2026</span>
              </div>
            </div>
            <p style={{ marginTop: "20px", color: "#166534", fontWeight: "bold" }}>+25% Campus Placement Growth</p>
          </div>

          <div className="seb-outcome-chart-box">
            <h3>Average Corporate Package Trend (LPA)</h3>
            <div className="seb-chart-bars-container">
              <div className="seb-chart-bar-wrapper">
                <div className="seb-chart-bar" style={{ height: "60%" }}>3.5L</div>
                <span className="seb-chart-label">2023</span>
              </div>
              <div className="seb-chart-bar-wrapper">
                <div className="seb-chart-bar" style={{ height: "72%" }}>4.2L</div>
                <span className="seb-chart-label">2024</span>
              </div>
              <div className="seb-chart-bar-wrapper">
                <div className="seb-chart-bar" style={{ height: "88%" }}>5.1L</div>
                <span className="seb-chart-label">2025</span>
              </div>
              <div className="seb-chart-bar-wrapper highlight">
                <div className="seb-chart-bar" style={{ height: "100%" }}>5.8L</div>
                <span className="seb-chart-label">2026</span>
              </div>
            </div>
            <p style={{ marginTop: "20px", color: "#166534", fontWeight: "bold" }}>+65% Average Salary Increase</p>
          </div>
        </div>

        <div className="seb-outcome-impact-banner">
           Highest Placement Achieved: 8.1 LPA | Average Batch Salary: ~5.8 LPA
        </div>

        <h3 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#1e293b", margin: "40px 0 20px" }}>
          Verified Institutional Success Stories
        </h3>

        <div className="seb-stories-grid">
          <div className="seb-story-card">
            <h4>TCS Digital</h4>
            <h2>7.0 LPA</h2>
            <p>Multiple offers cleared</p>
          </div>
          <div className="seb-story-card">
            <h4>TCS Ninja</h4>
            <h2>3.5 LPA</h2>
            <p>Mass onboarding drive</p>
          </div>
          <div className="seb-story-card">
            <h4>DeltaForge</h4>
            <h2>8.0 LPA</h2>
            <p>Core engineering placement</p>
          </div>
          <div className="seb-story-card">
            <h4>Multicoreware</h4>
            <h2>8.1 LPA</h2>
            <p>Top package achieved</p>
          </div>
          <div className="seb-story-card">
            <h4>Zoho</h4>
            <h2>7.0 LPA</h2>
            <p>Product developer tier</p>
          </div>
          <div className="seb-story-card">
            <h4>Infosys</h4>
            <h2>4.0 LPA</h2>
            <p>System engineer role</p>
          </div>
          <div className="seb-story-card">
            <h4>Hexaware</h4>
            <h2>4.0 LPA</h2>
            <p>Graduate trainee role</p>
          </div>
          <div className="seb-story-card">
            <h4>Wipro</h4>
            <h2>3.6 LPA</h2>
            <p>Associate developer</p>
          </div>
        </div>
      </section>

      {/* ROI & Cost Comparison Section */}
      <section className="seb-section seb-problem-bg">
        <div className="seb-section-title">
          <h2>Budget & Licensing ROI Comparison</h2>
          <p>Consolidate separate platform fees into a single, straightforward campus license plan.</p>
        </div>

        <div className="seb-roi-grid">
          <div className="seb-roi-card red-border">
            <h3>Standard Multi-Platform Setup Costs</h3>
            <ul>
              <li>Individual LeetCode Pro Accounts: <strong>₹999 / mo</strong></li>
              <li>Premium CodeChef Contests: <strong>₹1,500 / mo</strong></li>
              <li>Separate Assessment Engine: <strong>Custom Enterprise Billing</strong></li>
              <li>Stand-alone Proctoring Software: <strong>Per-Session licensing overhead</strong></li>
              <li>Basic learning LMS subscription: <strong>Per-User yearly charge</strong></li>
            </ul>
            <p style={{ marginTop: "20px", fontWeight: "700", color: "#ef4444" }}>
               Scattered dashboards, confusing credentials, high aggregate costs.
            </p>
          </div>

          <div className="seb-roi-card green-border">
            <h3>SEED-SEB Campus Package Value</h3>
            <ul>
              <li> Complete Coding Practice Sandbox Library</li>
              <li> Quant, Verbal & Logic Aptitude Prep</li>
              <li> 6,000+ Topic Wise Technical MCQs</li>
              <li> Webcam & Audio AI Proctoring Engine</li>
              <li> Multi-role Stakeholder Analytical Reports</li>
              <li> Customizable Institution Branding</li>
            </ul>
            <p style={{ marginTop: "20px", fontWeight: "700", color: "#10b981" }}>
               One contract. Absolute administrative controls. Optimal campus ROI.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="seb-section">
        <div className="seb-section-title">
          <h2>10 Reasons Why Colleges Choose SEED-SEB</h2>
          <p>The premium features making our operating system the preferred partner for universities.</p>
        </div>

        <div className="seb-reasons-grid">
          <div className="seb-reason-card">
            <h4>1. Single Centralized Portal</h4>
            <p>Stop tools switching. Access learning courses, practice codes, mock tests, and logs in one spot.</p>
          </div>
          <div className="seb-reason-card">
            <h4>2. Campus Budget Friendly</h4>
            <p>Obtain high savings by replacing 6 disconnected subscriptions with one consolidated campus plan.</p>
          </div>
          <div className="seb-reason-card">
            <h4>3. MNC Ready Mock Exams</h4>
            <p>40+ actual simulated paper patterns matching exact corporate recruiting rules.</p>
          </div>
          <div className="seb-reason-card">
            <h4>4. Automated AI Proctoring</h4>
            <p>Secure exam integrity using face checks, voice alerts, and tab shift locks.</p>
          </div>
          <div className="seb-reason-card">
            <h4>5. Diagnostic Analytics</h4>
            <p>Instantly map strengths and weak concepts for each candidate, batch, or college department.</p>
          </div>
          <div className="seb-reason-card">
            <h4>6. Rapid Onboarding Setup</h4>
            <p>Go live on your institutional campus domain within 1 to 2 weeks with zero setup hassle.</p>
          </div>
          <div className="seb-reason-card">
            <h4>7. College Theme Branding</h4>
            <p>Add your college logos, symbols, and theme colors across student headers.</p>
          </div>
          <div className="seb-reason-card">
            <h4>8. Scalable Deployment</h4>
            <p>Built on robust database infrastructure supporting 500 to 50,000 active candidates.</p>
          </div>
          <div className="seb-reason-card">
            <h4>9. Placement Focused Design</h4>
            <p>Specifically tuned to placement officer tasks rather than casual coding hobbies.</p>
          </div>
          <div className="seb-reason-card">
            <h4>10. Data Protection & Safety</h4>
            <p>High encryption standards keeping candidate scores and personal profiles confidential.</p>
          </div>
        </div>
      </section>

      {/* Product Roadmap Section */}
      <section className="seb-section seb-problem-bg">
        <div className="seb-section-title">
          <h2>Product Evolution Roadmap</h2>
          <p>Our upcoming product development cycle introducing next-gen AI placement assistance.</p>
        </div>

        <div className="seb-roadmap-grid">
          <div className="seb-roadmap-card">
            <h3>Q3 2026</h3>
            <ul>
              <li> AI Voice Interview Simulator</li>
              <li> ATS-optimized Resume matching scorer</li>
            </ul>
          </div>
          <div className="seb-roadmap-card">
            <h3>Q4 2026</h3>
            <ul>
              <li> AI Coding standard reviewer</li>
              <li> Placement opportunity recommender</li>
            </ul>
          </div>
          <div className="seb-roadmap-card">
            <h3>Q1 2027</h3>
            <ul>
              <li> Predictive skill gap indicator</li>
              <li> 24/7 AI-enabled student assistant</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="seb-section">
        <div className="seb-section-title">
          <h2>Flexible Pricing Tiers</h2>
          <p>Licensing plans tailored precisely to your student count and requirements.</p>
        </div>

        <div className="seb-pricing-grid">
          <div className="seb-pricing-card">
            <h3>Department Plan</h3>
            <div className="price">Enquire Now</div>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
              Best suited for single departments or specialized coding batches
            </p>
            <ul>
              <li>Coding and MCQ preparatory banks</li>
              <li>20 Proctored assessments per month</li>
              <li>Basic student performance scorecard</li>
              <li>Standard email query resolution</li>
            </ul>
            <a href="#contact" className="seb-pricing-btn">Select Plan</a>
          </div>

          <div className="seb-pricing-card highlighted">
            <span className="seb-pricing-badge"> MOST POPULAR</span>
            <h3>Campus Plan</h3>
            <div className="price text-gold">Enquire Now</div>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
              Complete placement support for all departments and batches
            </p>
            <ul>
              <li>Full 28,000+ preparation repository</li>
              <li>Unlimited high-integrity AI Proctored tests</li>
              <li>Advanced reports (Faculty, Recruiter views)</li>
              <li>Custom institution colors & subdomain</li>
              <li>Priority coordinator training setup</li>
            </ul>
            <a href="#contact" className="seb-pricing-btn">Select Campus Plan</a>
          </div>

          <div className="seb-pricing-card">
            <h3>Enterprise Plan</h3>
            <div className="price">Enquire Now</div>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
              Tailored for multi-campus university groups
            </p>
            <ul>
              <li>All Campus Plan specifications</li>
              <li>On-Premise server deployment options</li>
              <li>Dedicated success manager</li>
              <li>External LMS and API integrations</li>
              <li>99.9% Platform uptime guarantee</li>
            </ul>
            <a href="#contact" className="seb-pricing-btn">Select Enterprise</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="seb-section seb-problem-bg" id="contact">
        <div className="seb-section-title">
          <h2>Get in Touch with our Placement Specialists</h2>
          <p>Schedule a 15-minute dashboard walkthrough to onboarding credentials setup.</p>
        </div>

        <div className="seb-contact-grid">
          <div className="seb-contact-info-panel">
            <h3>Direct Contact Coordinates</h3>
            <div className="seb-contact-details-list">
              <div className="seb-contact-det-item">
                <span className="icon"></span>
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#1e293b" }}>Email Support</p>
                  <a href="mailto:seed.skillup@gmail.com">seed.skillup@gmail.com</a>
                </div>
              </div>
              <div className="seb-contact-det-item">
                <span className="icon"></span>
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#1e293b" }}>Official Portal</p>
                  <a href="http://www.seedit.site" target="_blank" rel="noopener noreferrer">www.seedit.site</a>
                </div>
              </div>
              <div className="seb-contact-det-item">
                <span className="icon"></span>
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#1e293b" }}>Phone support</p>
                  <a href="tel:+919442730135">+91 94427 30135</a>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "30px", fontSize: "0.9rem", color: "#64748b" }}>
              <p style={{ margin: 0, fontWeight: "bold", color: "#334155" }}>Coimbatore Office Address:</p>
              <p style={{ margin: "5px 0 0" }}>
                SEED Innovating Technologies and Educational Services (SEED-IT)<br />
                CHIL SEZ IT Park (Special Economic Zone),<br />
                Saravanampatti, Coimbatore - 641035
              </p>
            </div>
          </div>

          <div className="seb-contact-form-panel">
            <h3>Request Placement Assessment Credentials</h3>
            <form onSubmit={e => { e.preventDefault(); alert("Request received! Our team will contact you within 24 hours."); }}>
              <div className="seb-form-group">
                <label htmlFor="instName">Institution / University Name</label>
                <input type="text" id="instName" className="seb-form-control" required placeholder="e.g. SEED Engineering College" />
              </div>
              <div className="seb-form-group">
                <label htmlFor="coordinatorName">Contact Person Name</label>
                <input type="text" id="coordinatorName" className="seb-form-control" required placeholder="e.g. Dr. Rajesh Kumar" />
              </div>
              <div className="seb-form-group">
                <label htmlFor="coordinatorEmail">Official Institutional Email ID</label>
                <input type="email" id="coordinatorEmail" className="seb-form-control" required placeholder="e.g. placements@college.edu" />
              </div>
              <div className="seb-form-group">
                <label htmlFor="batchSize">Approximate Annual Batch Size</label>
                <select id="batchSize" className="seb-form-control">
                  <option value="100-500">100 to 500 Students</option>
                  <option value="500-2000">500 to 2,000 Students</option>
                  <option value="2000+">More than 2,000 Students</option>
                </select>
              </div>
              <button type="submit" className="seb-form-submit">Submit Request Details &rarr;</button>
            </form>
          </div>
        </div>
      </section>

      {/* SEED-SEB Footer */}
      <footer className="seb-footer">
        <p>&copy; 2023-2026 SEED Innovating Technologies and Educational Services (SEED-IT). All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default SeedSeb;
