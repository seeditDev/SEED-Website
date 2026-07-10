import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css"; // Import CSS for styling
import { APP_VERSION } from "../App";
import TrackingService from "../services/trackingService";
import { useEffect } from "react";

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [liveCount, setLiveCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  const heroSlides = [
    {
      eyebrow: "AI-POWERED PLACEMENT READINESS PLATFORM",
      title: "Achieve your placement and career ambitions.",
      highlight: "With absolute confidence.",
      subtitle: "SEED-SEB architects, monitors, and accelerates student career outcomes — replacing disconnected training portals and basic forms with ONE unified institutional platform.",
      exploreLink: "/seed-seb",
      features: [
        "11K+ Developer Practice Challenges",
        "11K+ Aptitude & Logical Reasoning Prep",
        "AI Audio-Visual proctoring sandbox",
        "Multi-role stakeholder analytics & reporting"
      ]
    },
    {
      eyebrow: "HIGH INTEGRITY EXAM MONITORING",
      title: "Secure screening exams beyond simple checks.",
      highlight: "Eliminate academic fraud.",
      subtitle: "High-performance browser sandboxing and webcam-microphone tracking flags violations in real-time, delivering secure candidate scoring.",
      exploreLink: "/seed-seb",
      features: [
        "Automated facial verification checks",
        "Sandbox tab-locking mechanisms",
        "Real-time background audio detection",
        "Fully verifiable suspicion activity logs"
      ]
    },
    {
      eyebrow: "PERSONALIZED PRACTICE PATHS",
      title: "Customized learning sequences for tech mastery.",
      highlight: "Target weak concepts directly.",
      subtitle: "Automated roadmaps guide students from syntax basics to complex data structures, database queries, and aptitude proficiency.",
      exploreLink: "/seed-seb",
      features: [
        "Java Developer & Spring Boot paths",
        "Python & Machine Learning steps",
        "Quants & Logical reasoning tracks",
        "Student concept heatmaps & scoring logs"
      ]
    }
  ];

  useEffect(() => {
    // Subscribe to live user count
    const unsubscribe = TrackingService.subscribeToLiveCount((count) => {
      setLiveCount(count);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="homepage-container">
      {/* Header Section */}
      <header className="homepage-header">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img
              src="/SEED_Logo.png"
              alt="SEED-IT Logo"
              className="logo logo-animated"
            />
            <span className="logo-text">SEED-IT</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`homepage-nav ${isMenuOpen ? 'active' : ''}`}>
          <div 
            className="nav-dropdown-wrapper"
            onMouseEnter={() => setIsServicesDropdownOpen(true)}
            onMouseLeave={() => setIsServicesDropdownOpen(false)}
          >
            <span className="nav-link dropdown-toggle">
              Services <span className="chevron-icon">▼</span>
            </span>
            {isServicesDropdownOpen && (
              <div className="nav-dropdown-menu">
                <a href="#courses" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Strategy &amp; Advisory</a>
                <a href="#courses" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Practice Arenas</a>
                <a href="#courses" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>AI Proctoring</a>
                <a href="#courses" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Stakeholder Reports</a>
              </div>
            )}
          </div>
          <a href="#about"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
            }}
          >About Us</a>
          <Link
            to="/seed-seb"
            className="nav-link text-highlight-seb"
            onClick={() => setIsMenuOpen(false)}
          >
            SEED-SEB
          </Link>
          <a href="#testimonials"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              document.getElementById('testimonials').scrollIntoView({ behavior: 'smooth' });
            }}
          >Our Work</a>
          <a href="#schedule"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              document.getElementById('schedule').scrollIntoView({ behavior: 'smooth' });
            }}
          >Careers</a>

          <Link
            to="/login"
            className="nav-link header-btn header-btn-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Portal Login
          </Link>
          <Link
            to="/register"
            className="nav-link header-btn header-btn-outline"
            onClick={() => setIsMenuOpen(false)}
          >
            Register
          </Link>
        </nav>
      </header>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* SEED-SEB Hero Slider Section (Inspired by bi3technologies) */}
      <section className="seb-hero-banner-section">
        <div className="seb-hero-banner-bg-overlay"></div>
        <div className="seb-hero-banner-container">
          {heroSlides.map((slide, index) => (
            <div 
              key={index} 
              className={`seb-hero-slide-wrapper ${currentSlide === index ? "active" : "inactive"}`}
            >
              {currentSlide === index && (
                <div className="seb-hero-banner-content-split fade-in-up">
                  {/* Left Column - Text Content */}
                  <div className="seb-hero-banner-text-column">
                    <div className="seb-hero-eyebrow">
                      <span>{slide.eyebrow}</span>
                    </div>
                    <h1 className="seb-hero-title">
                      {slide.title}<br/>
                      <span className="seb-hero-gradient-text">{slide.highlight}</span>
                    </h1>
                    <p className="seb-hero-subtitle">{slide.subtitle}</p>
                    <div className="seb-hero-actions-left">
                      <Link to={slide.exploreLink} className="seb-hero-explore-btn">
                        Explore Now &rarr;
                      </Link>
                    </div>
                    <div className="seb-hero-features-mini">
                      {slide.features.map((feat, fIdx) => (
                        <span key={fIdx}>{feat}</span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Dynamic Animated Mockups */}
                  <div className="seb-hero-banner-visual-column">
                    {index === 0 && (
                      <div className="seb-mockup-card index-0-mockup">
                        <div className="seb-mockup-header">
                          <span className="dot red"></span>
                          <span className="dot yellow"></span>
                          <span className="dot green"></span>
                          <span className="title">Candidate Diagnostic Summary</span>
                        </div>
                        <div className="seb-mockup-body">
                          <div className="seb-readiness-circle-box">
                            <svg className="progress-ring" width="120" height="120">
                              <circle className="progress-ring__circle-bg" stroke="rgba(0,0,0,0.05)" strokeWidth="8" fill="transparent" r="50" cx="60" cy="60"/>
                              <circle className="progress-ring__circle progress-animate" stroke="var(--secondary-color-neon)" strokeWidth="8" strokeDasharray="314.16" strokeDashoffset="40" fill="transparent" r="50" cx="60" cy="60"/>
                            </svg>
                            <div className="circle-percent">87.4%</div>
                            <div className="circle-label">Readiness Index</div>
                          </div>
                          <div className="seb-mockup-stats-grid">
                            <div className="stat-item">
                              <span className="label">Quants &amp; Aptitude</span>
                              <span className="val">88%</span>
                            </div>
                            <div className="stat-item">
                              <span className="label">Developer Coding</span>
                              <span className="val">92%</span>
                            </div>
                            <div className="stat-item">
                              <span className="label">Verbal Mastery</span>
                              <span className="val">81%</span>
                            </div>
                            <div className="stat-item">
                              <span className="label">Technical MCQs</span>
                              <span className="val">85%</span>
                            </div>
                          </div>
                          <div className="seb-profile-status-badge">
                            <span className="status-dot pulsing"></span>
                            Verified Placement Profile Active
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 1 && (
                      <div className="seb-mockup-card index-1-mockup">
                        <div className="seb-mockup-header">
                          <span className="dot red"></span>
                          <span className="dot yellow"></span>
                          <span className="dot green"></span>
                          <span className="title">AI Proctoring Monitor</span>
                        </div>
                        <div className="seb-mockup-body">
                          <div className="seb-camera-simulator-box">
                            <div className="seb-cam-scan-corners"></div>
                            <div className="seb-cam-target-box"></div>
                            <div className="seb-cam-avatar-sim">
                              <div className="head"></div>
                              <div className="shoulders"></div>
                            </div>
                            <span className="live-indicator-glowing">● LIVE TARGET LOCK</span>
                          </div>
                          <div className="seb-proctor-live-log-box">
                            <div className="log-line green-text"> [10:35:12] Candidate face locked and verified</div>
                            <div className="log-line green-text"> [10:35:28] Browser sandbox initialized (tab lock)</div>
                            <div className="log-line red-text pulsing">️ [10:35:42] Ambient audio warning: secondary voice decibels flag</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="seb-mockup-card index-2-mockup">
                        <div className="seb-mockup-header">
                          <span className="dot red"></span>
                          <span className="dot yellow"></span>
                          <span className="dot green"></span>
                          <span className="title">Learning Roadmap Engine</span>
                        </div>
                        <div className="seb-mockup-body">
                          <div className="seb-roadmap-sim-flow">
                            <div className="roadmap-node active">
                              <div className="node-icon">01</div>
                              <span>Diagnostics</span>
                            </div>
                            <div className="roadmap-connector active"></div>
                            <div className="roadmap-node active">
                              <div className="node-icon">02</div>
                              <span>Syntax Practice</span>
                            </div>
                            <div className="roadmap-connector pulsing"></div>
                            <div className="roadmap-node current">
                              <div className="node-icon">03</div>
                              <span>Core Algorthims</span>
                            </div>
                            <div className="roadmap-connector"></div>
                            <div className="roadmap-node">
                              <div className="node-icon">04</div>
                              <span>Company Mocks</span>
                            </div>
                          </div>
                          <div className="seb-roadmap-concept-card">
                            <h4>Active Module: Sorting &amp; Search Optimization</h4>
                            <p>Master quicksort bounds and binary search indices for strategic placement evaluations.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Slider Indicators */}
          <div className="seb-slider-dots-container">
            {heroSlides.map((_, index) => (
              <button 
                key={index} 
                className={`seb-slider-dot ${currentSlide === index ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="seb-hero-portal-links">
            <p>Access the Student or Staff Dashboard:</p>
            <div className="seb-portal-buttons">
              <Link to="/login" className="seb-portal-login-btn">Portal Login</Link>
              <Link to="/register" className="seb-portal-register-btn">Register</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Partners Section (s-partners, inspired by bi3technologies) */}
      <section className="seb-partners-section" id="about">
        <div className="seb-partners-container">
          <div className="seb-partners-header">
            <div className="seb-section-eyebrow">
              <span>PARTNERS &amp; BADGES</span>
            </div>
            <h2 className="seb-section-title">
              Certified integrations. Built on outcomes.
            </h2>
            <p className="seb-section-desc">
              Certified compatibility with leading learning frameworks and cloud deployment systems — transforming student efforts into verifiable industry readiness.
            </p>
          </div>
          <div className="seb-partners-grid">
            <div className="seb-partner-card">
              <div className="seb-pc-content">
                <h3>Microsoft Certified Academy</h3>
              </div>
            </div>
            <div className="seb-partner-card">
              <div className="seb-pc-content">
                <h3>AWS Academy Partner</h3>
              </div>
            </div>
            <div className="seb-partner-card">
              <div className="seb-pc-content">
                <h3>ISO 9001:2015 Registered</h3>
              </div>
            </div>
            <div className="seb-partner-card">
              <div className="seb-pc-content">
                <h3>ISTQB Silver Partner</h3>
              </div>
            </div>
            <div className="seb-partner-card">
              <div className="seb-pc-content">
                <h3>British Council Certified</h3>
              </div>
            </div>
            <div className="seb-partner-card">
              <div className="seb-pc-content">
                <h3>AI evaluation APIs</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 About the Training Institute Section */}
      <section className="seb-about-institute-section" id="about-institute">
        <div className="seb-about-institute-container">
          <div className="seb-about-institute-split">
            <div className="seb-about-institute-left">
              <div className="seb-section-eyebrow">
                <span>SKILL-ENHANCEMENT &amp; EMPLOYABILITY DEVELOPMENT</span>
              </div>
              <h2 className="seb-section-title" style={{ color: "#000000", textAlign: "left" }}>
                SEED Institute of Training
              </h2>
              <p className="seb-about-institute-desc">
                SEED IT is a premier skill-enhancement and career accelerator managed by IT veterans with over a decade of MNC leadership experience. Spread across regional tech hubs including <strong>Coimbatore, Bangalore, Chennai, Hyderabad, Tiruppur, Vizag, and Kochi</strong>, we deliver practical, industry-aligned training programs that prepare graduates for top-tier developer roles.
              </p>
              <div className="seb-about-metrics-grid">
                <div className="seb-about-metric">
                  <span className="num">50K+</span>
                  <span className="lbl">Careers Shifted &amp; Started</span>
                </div>
                <div className="seb-about-metric">
                  <span className="num">300+</span>
                  <span className="lbl">Placement Tie-up Companies</span>
                </div>
                <div className="seb-about-metric">
                  <span className="num">30-60</span>
                  <span className="lbl">Max Students Per Batch</span>
                </div>
              </div>
            </div>
            <div className="seb-about-institute-right">
              <div className="seb-features-glass-card">
                <h3>Why Leading Colleges &amp; Learners Trust SEED-IT</h3>
                <ul className="seb-features-bullet-list">
                  <li>
                    <strong>MNC Industry Practitioners:</strong> Learn directly from active developers and systems architects working in leading multinational tech groups.
                  </li>
                  <li>
                    <strong>Individual Attention Focus:</strong> Enrolling only 30-60 students per classroom batch to guarantee intensive mentoring support.
                  </li>
                  <li>
                    <strong>Unlimited Sandbox Lab Access:</strong> Continuous access to cloud execution environments, mock testing sandboxes, and code compilers.
                  </li>
                  <li>
                    <strong>Comprehensive Career Drives:</strong> Our placement cells work continuously with 300+ hiring giants to run mock recruitment pipelines.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Placement Success Stories (s-cases, inspired by bi3technologies) */}
      <section className="seb-cases-section" id="testimonials">
        <div className="seb-cases-container">
          <div className="seb-cases-header">
            <div className="seb-section-eyebrow">
              <span>FEATURED PLACEMENT SUCCESS STORIES</span>
            </div>
            <h2 className="seb-section-title" style={{ color: "#000000" }}>
              Transformative outcomes. Built on verified readiness.
            </h2>
            <p className="seb-section-desc" style={{ color: "#475569" }}>
              See how colleges and recruiting partners use SEED-SEB to scale placement numbers and secure evaluation workflows.
            </p>
          </div>

          <div className="seb-cases-grid-layout">
            {/* Case 1 */}
            <div className="seb-case-card">
              <div className="seb-case-left">
                <div className="seb-case-eyebrow">
                  <span>Featured Case Study 01</span>
                </div>
                <div className="seb-case-category">
                  <span>Institutional Growth &bull; Centralized Analytics</span>
                </div>
                <h3 className="seb-case-title">
                  Driving campus placement rates through integrated candidate diagnostics.
                </h3>
                <p className="seb-case-impact-label">The Impact</p>
                <div className="seb-case-metrics">
                  <div className="seb-metric-item">
                    <div className="seb-metric-number">87%</div>
                    <div className="seb-metric-desc">Placement Rate Achieved</div>
                  </div>
                  <div className="seb-metric-item">
                    <div className="seb-metric-number">8.1 LPA</div>
                    <div className="seb-metric-desc">Highest Package Tier</div>
                  </div>
                </div>
                <p className="seb-case-description">
                  A unified student evaluation system combining coding roadmaps, aptitude practice, and proctoring logs into a single analytical dashboard.
                </p>
              </div>
              <div className="seb-case-right style-blue">
                <div className="seb-case-badge-meta">ACADEMIC EXCELLENCE</div>
                <div className="seb-case-quote-box">
                  <p>"SEED-SEB unified all our placement training into a single portal. We replaced three different platform subscriptions and saved 60% on our licensing budget, while improving our placement rate to 87%."</p>
                  <div className="seb-quote-author">
                    <strong>Dr. Anand Swamy</strong>
                    <span>Dean of Engineering Academics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 2 */}
            <div className="seb-case-card">
              <div className="seb-case-left">
                <div className="seb-case-eyebrow">
                  <span>Featured Case Study 02</span>
                </div>
                <div className="seb-case-category">
                  <span>Corporate Recruiting &bull; Candidate Sourcing</span>
                </div>
                <h3 className="seb-case-title">
                  Fast-tracking corporate hiring drives via verified candidate profile links.
                </h3>
                <p className="seb-case-impact-label">The Impact</p>
                <div className="seb-case-metrics">
                  <div className="seb-metric-item">
                    <div className="seb-metric-number">4x</div>
                    <div className="seb-metric-desc">Faster Sourcing Cycle</div>
                  </div>
                  <div className="seb-metric-item">
                    <div className="seb-metric-number">100%</div>
                    <div className="seb-metric-desc">Profile Verification Rate</div>
                  </div>
                </div>
                <p className="seb-case-description">
                  Allowing recruitment partners to search, filter, and extract candidate portfolios with pre-verified skill metrics and proctoring indices.
                </p>
              </div>
              <div className="seb-case-right style-blue">
                <div className="seb-case-badge-meta">RECRUITMENT TIE-UP</div>
                <div className="seb-case-quote-box">
                  <p>"SEED-SEB's verified link exports eliminated our candidate screening bottlenecks. We filtered candidates by coding scores and hired 45 graduates in under 4 days."</p>
                  <div className="seb-quote-author">
                    <strong>Kiran Dev</strong>
                    <span>Talent Acquisition Lead</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 3 */}
            <div className="seb-case-card">
              <div className="seb-case-left">
                <div className="seb-case-eyebrow">
                  <span>Featured Case Study 03</span>
                </div>
                <div className="seb-case-category">
                  <span>Assessment Integrity &bull; Anti-Cheat Audits</span>
                </div>
                <h3 className="seb-case-title">
                  Strengthening online exam honor codes via AI proctoring logs.
                </h3>
                <p className="seb-case-impact-label">The Impact</p>
                <div className="seb-case-metrics">
                  <div className="seb-metric-item">
                    <div className="seb-metric-number">0</div>
                    <div className="seb-metric-desc">Cheating Incidents Undetected</div>
                  </div>
                  <div className="seb-metric-item">
                    <div className="seb-metric-number">100%</div>
                    <div className="seb-metric-desc">Secure Sandboxed Browsing</div>
                  </div>
                </div>
                <p className="seb-case-description">
                  Automated checks lock search browser tabs, monitor secondary device audio signals, and track facial angles to generate verified evaluation scores.
                </p>
              </div>
              <div className="seb-case-right style-blue">
                <div className="seb-case-badge-meta">HONOR SECURITY</div>
                <div className="seb-case-quote-box">
                  <p>"The AI face-lock and tab sandboxing provided verified assessment diagnostics that our academic boards can rely on with absolute trust."</p>
                  <div className="seb-quote-author">
                    <strong>Prof. S. Ranganathan</strong>
                    <span>Head of Examination Cell</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. What We Do (s-what, inspired by bi3technologies) */}
      <section className="seb-what-we-do-section" id="courses">
        <div className="seb-what-inner">
          <div className="seb-what-left">
            <div className="seb-what-left-eyebrow">What We Do</div>
            <h2 className="seb-what-left-title">
              Five core practices.<br/>
              <span className="seb-highlight-text">One integrated platform.</span>
            </h2>
            <p className="seb-what-left-sub">
              From initial mock diagnostics to final verified credentials — everything an institution needs to train and place students, without administrative friction.
            </p>
          </div>
          <div className="seb-what-rows-wrap">
            <div className="seb-what-row">
              <div className="seb-what-row-inner">
                <div className="seb-what-row-num">
                  <div className="seb-num-badge">01</div>
                </div>
                <div className="seb-what-row-name-col">
                  <h3 className="seb-what-row-name">Strategy &amp; Career Advisory</h3>
                  <p className="seb-what-row-tagline">Know what to prepare and where to improve</p>
                </div>
                <div className="seb-what-row-divider"></div>
                <div className="seb-what-row-items">
                  <span className="seb-svc-tag">Custom MNC Test Blueprints</span>
                  <span className="seb-svc-tag">Diagnostic Placement Indexing</span>
                </div>
              </div>
            </div>
            <div className="seb-what-row">
              <div className="seb-what-row-inner">
                <div className="seb-what-row-num">
                  <div className="seb-num-badge">02</div>
                </div>
                <div className="seb-what-row-name-col">
                  <h3 className="seb-what-row-name">Practice Arenas &amp; Foundations</h3>
                  <p className="seb-what-row-tagline">Build core skills - from day one</p>
                </div>
                <div className="seb-what-row-divider"></div>
                <div className="seb-what-row-items">
                  <span className="seb-svc-tag">11K+ Developer Coding Problems</span>
                  <span className="seb-svc-tag">Aptitude &amp; Verbal Mastery Libraries</span>
                </div>
              </div>
            </div>
            <div className="seb-what-row">
              <div className="seb-what-row-inner">
                <div className="seb-what-row-num">
                  <div className="seb-num-badge">03</div>
                </div>
                <div className="seb-what-row-name-col">
                  <h3 className="seb-what-row-name">AI &amp; Proctoring Sandboxes</h3>
                  <p className="seb-what-row-tagline">Secure exam integrity at scale</p>
                </div>
                <div className="seb-what-row-divider"></div>
                <div className="seb-what-row-items">
                  <span className="seb-svc-tag">AI Webcam &amp; Audio Monitoring</span>
                  <span className="seb-svc-tag">Automatic Tab Transition Lockout</span>
                </div>
              </div>
            </div>
            <div className="seb-what-row">
              <div className="seb-what-row-inner">
                <div className="seb-what-row-num">
                  <div className="seb-num-badge">04</div>
                </div>
                <div className="seb-what-row-name-col">
                  <h3 className="seb-what-row-name">Insights &amp; Institutional Analytics</h3>
                  <p className="seb-what-row-tagline">Turn candidate data into hiring action</p>
                </div>
                <div className="seb-what-row-divider"></div>
                <div className="seb-what-row-items">
                  <span className="seb-svc-tag">Multi-Stakeholder Dashboards</span>
                  <span className="seb-svc-tag">Department benchmarking indices</span>
                </div>
              </div>
            </div>
            <div className="seb-what-row">
              <div className="seb-what-row-inner">
                <div className="seb-what-row-num">
                  <div className="seb-num-badge">05</div>
                </div>
                <div className="seb-what-row-name-col">
                  <h3 className="seb-what-row-name">Placement Support &amp; Onboarding</h3>
                  <p className="seb-what-row-tagline">Connect with corporate recruiters with confidence</p>
                </div>
                <div className="seb-what-row-divider"></div>
                <div className="seb-what-row-items">
                  <span className="seb-svc-tag">Verified Profile Database</span>
                  <span className="seb-svc-tag">MNC Screening drive simulation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Our Clients / Hiring Giants (s-clients, inspired by bi3technologies) */}
      <section className="seb-clients-section">
        <div className="seb-clients-header">
          <div className="seb-section-eyebrow">
            <span>OUR CLIENTS</span>
          </div>
          <h2 className="seb-section-title">
            Where our students get placed.
          </h2>
          <p className="seb-section-desc">
            Trusted by leading multinational enterprises and technology groups worldwide — partnering to recruit the next generation of software engineers and developers.
          </p>
        </div>
        <div className="seb-clients-marquee-wrap">
          <div className="seb-clients-marquee-row">
            <div className="seb-clients-track">
              <img src="/images/companies/accenture.png" className="seb-client-logo" alt="Accenture" />
              <img src="/images/companies/amazon.png" className="seb-client-logo" alt="Amazon" />
              <img src="/images/companies/microsoft.png" className="seb-client-logo" alt="Microsoft" />
              <img src="/images/companies/tcs.png" className="seb-client-logo" alt="TCS" />
              <img src="/images/companies/infosys.png" className="seb-client-logo" alt="Infosys" />
              <img src="/images/companies/wipro.png" className="seb-client-logo" alt="Wipro" />
              <img src="/images/companies/cognizant.png" className="seb-client-logo" alt="Cognizant" />
              <img src="/images/companies/deloitte.png" className="seb-client-logo" alt="Deloitte" />
              <img src="/images/companies/ibm.png" className="seb-client-logo" alt="IBM" />
              <img src="/images/companies/capgemini.png" className="seb-client-logo" alt="Capgemini" />
              <img src="/images/companies/oracle.png" className="seb-client-logo" alt="Oracle" />
              <img src="/images/companies/hcl.png" className="seb-client-logo" alt="HCL" />
              {/* Duplicate for infinite loop */}
              <img src="/images/companies/accenture.png" className="seb-client-logo" alt="Accenture" />
              <img src="/images/companies/amazon.png" className="seb-client-logo" alt="Amazon" />
              <img src="/images/companies/microsoft.png" className="seb-client-logo" alt="Microsoft" />
              <img src="/images/companies/tcs.png" className="seb-client-logo" alt="TCS" />
              <img src="/images/companies/infosys.png" className="seb-client-logo" alt="Infosys" />
              <img src="/images/companies/wipro.png" className="seb-client-logo" alt="Wipro" />
              <img src="/images/companies/cognizant.png" className="seb-client-logo" alt="Cognizant" />
              <img src="/images/companies/deloitte.png" className="seb-client-logo" alt="Deloitte" />
              <img src="/images/companies/ibm.png" className="seb-client-logo" alt="IBM" />
              <img src="/images/companies/capgemini.png" className="seb-client-logo" alt="Capgemini" />
              <img src="/images/companies/oracle.png" className="seb-client-logo" alt="Oracle" />
              <img src="/images/companies/hcl.png" className="seb-client-logo" alt="HCL" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Global scale (s-global, inspired by bi3technologies) */}
      <section className="seb-global-section">
        <div className="seb-global-inner">
          <div className="seb-global-header">
            <div className="seb-section-eyebrow">
              <span>REGIONAL REACH &amp; SCALE</span>
            </div>
            <h2 className="seb-section-title">
              Delivering across multiple hubs, <br/>
              across 16 industries.
            </h2>
            <p className="seb-section-desc">
              Hiring partners and training footprint across major software hubs — ensuring top-tier training is within reach of every student.
            </p>
          </div>
          <div className="seb-global-body">
            <div className="seb-global-stats">
              <div className="seb-global-stat">
                <span className="seb-gs-num">3+</span>
                <span className="seb-gs-lbl">Cities served</span>
              </div>
              <div className="seb-global-stat">
                <span className="seb-gs-num">16+</span>
                <span className="seb-gs-lbl">College batches deployed</span>
              </div>
              <div className="seb-global-stat">
                <span className="seb-gs-num">5</span>
                <span className="seb-gs-lbl">Technical placement hubs</span>
              </div>
            </div>
            <div className="seb-global-regions">
              <div className="seb-region-card">
                <h4>Primary Cities</h4>
                <p>Coimbatore &bull; Bangalore &bull; Chennai &bull; Cochin &bull; Hyderabad</p>
              </div>
              <div className="seb-region-card">
                <h4>Affiliations</h4>
                <p>ISO Certified Academy &bull; British Council Partner &bull; ISTQB Accredited</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Schedule & Batches (Adapted to BI3 premium cards) */}
      <section className="seb-schedule-section-premium" id="schedule">
        <div className="seb-schedule-container">
          <div className="seb-section-eyebrow">
            <span>TRAINING SCHEDULE</span>
          </div>
          <h2 className="seb-section-title">Upcoming Practice Batches</h2>
          <div className="seb-schedule-grid-premium">
            <div className="seb-schedule-card-premium">
              <div className="seb-schedule-card-image-wrapper">
                <img src="/users-live.png" className="seb-schedule-card-img" alt="Full Stack Track" />
                <span className="badge">LIVE</span>
              </div>
              <h3>Full Stack Development Track</h3>
              <p>MERN stack and core backend platform delivery systems.</p>
              <ul>
                <li><strong>Weekday Batch:</strong> Starts July 15, 2026</li>
                <li><strong>Weekend Batch:</strong> Starts July 20, 2026</li>
                <li><strong>Mode:</strong> Hybrid Classroom &amp; Live online</li>
              </ul>
            </div>
            <div className="seb-schedule-card-premium">
              <div className="seb-schedule-card-image-wrapper">
                <img src="/users-live.png" className="seb-schedule-card-img" alt="Data Science Track" />
                <span className="badge">POPULAR</span>
              </div>
              <h3>Data Science &amp; ML Track</h3>
              <p>Pandas, SciKit-Learn ML Models &amp; AI deploy sequences.</p>
              <ul>
                <li><strong>Weekday Batch:</strong> Starts July 18, 2026</li>
                <li><strong>Weekend Batch:</strong> Starts July 22, 2026</li>
                <li><strong>Mode:</strong> Hybrid Classroom &amp; Live online</li>
              </ul>
            </div>
            <div className="seb-schedule-card-premium">
              <div className="seb-schedule-card-image-wrapper">
                <img src="/users-live.png" className="seb-schedule-card-img" alt="DevOps Track" />
                <span className="badge">FAST TRACK</span>
              </div>
              <h3>DevOps &amp; Cloud Platform Foundations</h3>
              <p>Docker, Kubernetes, AWS &amp; Terraform platform delivery guides.</p>
              <ul>
                <li><strong>Weekday Batch:</strong> Starts July 25, 2026</li>
                <li><strong>Weekend Batch:</strong> Starts July 29, 2026</li>
                <li><strong>Mode:</strong> Hybrid Classroom &amp; Live online</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section className="seed-faq-section" id="faq">
        <div className="seed-container">
          <div className="seb-section-eyebrow">
            <span>FAQ</span>
          </div>
          <h2 className="seb-section-title">Frequently Asked Questions</h2>
          <div className="seed-faq-grid">
            <div className="seed-faq-item" onClick={() => setExpandedFaqs(prev => ({ ...prev, 1: !prev[1] }))}>
              <div className="seed-faq-header">
                <h3>What are the payment options available?</h3>
                <span className={`seed-faq-arrow ${expandedFaqs[1] ? 'expanded' : ''}`}>▼</span>
              </div>
              {expandedFaqs[1] && (
                <p>We offer flexible payment options including EMI, full payment, and installment-based payments. We accept all major payment methods.</p>
              )}
            </div>

            <div className="seed-faq-item" onClick={() => setExpandedFaqs(prev => ({ ...prev, 2: !prev[2] }))}>
              <div className="seed-faq-header">
                <h3>Do you provide placement assistance?</h3>
                <span className={`seed-faq-arrow ${expandedFaqs[2] ? 'expanded' : ''}`}>▼</span>
              </div>
              {expandedFaqs[2] && (
                <p>Yes, we provide 100% placement assistance with our network of 300+ hiring partners and dedicated placement team.</p>
              )}
            </div>

            <div className="seed-faq-item" onClick={() => setExpandedFaqs(prev => ({ ...prev, 3: !prev[3] }))}>
              <div className="seed-faq-header">
                <h3>What is the course duration?</h3>
                <span className={`seed-faq-arrow ${expandedFaqs[3] ? 'expanded' : ''}`}>▼</span>
              </div>
              {expandedFaqs[3] && (
                <p>Course duration varies from 3-6 months based on the program. We offer both fast-track and regular pace options.</p>
              )}
            </div>

            <div className="seed-faq-item" onClick={() => setExpandedFaqs(prev => ({ ...prev, 4: !prev[4] }))}>
              <div className="seed-faq-header">
                <h3>Is there a demo class available?</h3>
                <span className={`seed-faq-arrow ${expandedFaqs[4] ? 'expanded' : ''}`}>▼</span>
              </div>
              {expandedFaqs[4] && (
                <p>Yes, we offer a free demo class for all our courses to help you understand our teaching methodology.</p>
              )}
            </div>

            <div className="seed-faq-item" onClick={() => setExpandedFaqs(prev => ({ ...prev, 5: !prev[5] }))}>
              <div className="seed-faq-header">
                <h3>What is the class size for each batch?</h3>
                <span className={`seed-faq-arrow ${expandedFaqs[5] ? 'expanded' : ''}`}>▼</span>
              </div>
              {expandedFaqs[5] && (
                <p>We maintain small batch sizes of 30-60 students to ensure individual attention and better learning outcomes.</p>
              )}
            </div>

            <div className="seed-faq-item" onClick={() => setExpandedFaqs(prev => ({ ...prev, 6: !prev[6] }))}>
              <div className="seed-faq-header">
                <h3>Are the courses available online?</h3>
                <span className={`seed-faq-arrow ${expandedFaqs[6] ? 'expanded' : ''}`}>▼</span>
              </div>
              {expandedFaqs[6] && (
                <p>Yes, all our courses are available in both online and offline modes. You can choose the mode that suits you best.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="homepage-footer">
        <div className="seed-footer-container">
          <div className="seed-footer-grid">
            <div className="seed-footer-col">
              <h4>Contact Us</h4>
              <div className="seed-contact-info">
                <h5>Coimbatore CHIL IT Park:</h5>
                <p>SEED Innovating Technologies and Educational Services (SEED-IT)</p>
                <p>CHIL SEZ IT Park (Special Economic Zone),</p>
                <p>Saravanampatti, Coimbatore - 641035</p>
                <p><strong>Phone:</strong> +91-94427 30135</p>
                <p><strong>Email:</strong> seed.skillup@gmail.com</p>
              </div>
            </div>

            <div className="seed-footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#about" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
                }}>About Us</a></li>
                <li><a href="#courses" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
                }}>What We Do</a></li>
                <li><a href="#schedule" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('schedule').scrollIntoView({ behavior: 'smooth' });
                }}>Upcoming Batches</a></li>
                <li><a href="#testimonials" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('testimonials').scrollIntoView({ behavior: 'smooth' });
                }}>Placements</a></li>
              </ul>
            </div>

            <div className="seed-footer-col">
              <h4>Training Programs</h4>
              <ul>
                <li>Full Stack Web Development</li>
                <li>Data Science &amp; Machine Learning</li>
                <li>DevOps &amp; Cloud Platforms</li>
                <li>Software Testing &amp; Automation</li>
                <li>Aptitude &amp; Logical Skill Prep</li>
              </ul>
            </div>

            <div className="seed-footer-col">
              <h4>Follow Us</h4>
              <div className="seed-social-links">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://instagram.com/seed_skillup" target="_blank" rel="noopener noreferrer">Instagram</a>
              </div>
            </div>
          </div>

          <div className="seed-footer-bottom">
            <p>&copy; 2023-2026 SEED Innovating Technologies and Educational Services (SEED-IT). All Rights Reserved.</p>
            <div className="seed-footer-links">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                document.querySelector('.homepage-container').scrollIntoView({ behavior: 'smooth' });
              }}>Back to Top</a>
              <a href="#faq" onClick={(e) => {
                e.preventDefault();
                document.getElementById('faq').scrollIntoView({ behavior: 'smooth' });
              }}>FAQ</a>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>Version {APP_VERSION}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
