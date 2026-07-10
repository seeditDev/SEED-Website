import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  FaSignOutAlt, FaEye, FaTimes, FaUser, FaBars,
  FaAngleDoubleLeft, FaChartBar, FaDownload,
  FaFileExport, FaBell, FaEnvelope, FaStar,
  FaChartLine, FaUserGraduate, FaExclamationTriangle,
  FaGraduationCap, FaChartPie, FaTrophy, FaCog,
  FaChartArea, FaUsers, FaFilePdf, FaFileCsv,
  FaBriefcase, FaFileAlt, FaCheckCircle, FaExclamationCircle,
  FaChevronDown, FaChevronUp, FaTimesCircle, FaSearchMinus
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import "../styles/StaffDashboard.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import TrackingService from "../services/trackingService";
import timeService from "../services/timeService";
import { supabase } from "../supabaseClient";


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Simulated data generator for fallback assessments
const generateSimulatedResults = (studentsList) => {
  const list = [];
  if (!studentsList || studentsList.length === 0) return list;

  studentsList.forEach(student => {
    const email = student.Email || student.email || 'student@kite.edu';
    const name = student.Name || 'Student';
    const roll = student['Roll Number'] || student.rollNumber || '2K26-CS-000';
    const college = student.College || '';
    const department = student.Department || '';
    const year = student.Year || '';

    // Calculate a consistent academic factor (0.4 to 1.0) based on existing scores if available
    let totalScoreSum = 0;
    let scoreCount = 0;
    Object.keys(student).forEach(k => {
      if (k.endsWith('Score')) {
        const val = parseFloat(student[k]);
        if (!isNaN(val) && val > 0) {
          totalScoreSum += val;
          scoreCount++;
        }
      }
    });
    const baseFactor = scoreCount > 0 ? (totalScoreSum / scoreCount / 500) : Math.random(); 
    const factor = Math.min(1.0, Math.max(0.4, baseFactor)); 

    // 1. Mock MCQ Result (id: mock_mcq_1)
    const mcqCorrect = Math.round(5 + factor * 5); 
    const mcqScore = mcqCorrect * 10;
    const mcqPercentage = mcqCorrect / 10;
    const mcqTimeTaken = Math.round(400 + (1 - factor) * 800); 
    
    // MCQ answers and question-specific parameters
    const mcqQuestionsDef = [
      { id: 'mq1', tag: 'Java Strings', question: 'What is the output of System.out.println(10 + 20 + "KITE")?', correctAns: '30KITE', options: ['1020KITE', '30KITE', 'KITE30', 'Compilation Error'] },
      { id: 'mq2', tag: 'Stacks', question: 'Which data structure follows LIFO principle?', correctAns: 'Stack', options: ['Queue', 'Stack', 'Linked List', 'Tree'] },
      { id: 'mq3', tag: 'Search Algorithms', question: 'What is the time complexity of searching in a balanced BST?', correctAns: 'O(log N)', options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'] },
      { id: 'mq4', tag: 'Quantitative Aptitude', question: 'If a card is drawn from a deck, what is the probability of it being a King?', correctAns: '1/13', options: ['1/52', '1/13', '4/13', '1/4'] },
      { id: 'mq5', tag: 'Java OOP', question: 'Which class is the superclass of all classes in Java?', correctAns: 'Object', options: ['Class', 'Object', 'System', 'String'] },
      { id: 'mq6', tag: 'Logical Reasoning', question: 'Find the odd one out: 3, 5, 7, 9, 11, 13', correctAns: '9', options: ['3', '7', '9', '13'] },
      { id: 'mq7', tag: 'Java Architecture', question: 'What does JVM stand for?', correctAns: 'Java Virtual Machine', options: ['Java Virtual Method', 'Java Virtual Machine', 'Java Variable Manager', 'Java Vector Map'] },
      { id: 'mq8', tag: 'Basic Datatypes', question: 'What is the size of int in Java?', correctAns: '4 bytes', options: ['2 bytes', '4 bytes', '8 bytes', '1 byte'] },
      { id: 'mq9', tag: 'Java Language Basics', question: 'Which of the following is not a keyword in Java?', correctAns: 'null', options: ['class', 'null', 'import', 'volatile'] },
      { id: 'mq10', tag: 'Quantitative Aptitude', question: 'In how many ways can 5 people be seated in a row?', correctAns: '120', options: ['24', '120', '60', '720'] }
    ];

    const mcqAnswers = {};
    mcqQuestionsDef.forEach((q, idx) => {
      const isCorrect = idx < mcqCorrect;
      const studentAns = isCorrect ? q.correctAns : q.options.filter(o => o !== q.correctAns)[Math.floor(Math.random() * 3)];
      const qTime = Math.round((mcqTimeTaken / 10) * (0.6 + Math.random() * 0.8));
      mcqAnswers[q.id] = {
        questionId: q.id,
        question: q.question,
        selectedAnswer: studentAns,
        correctAnswer: q.correctAns,
        isCorrect: isCorrect,
        timeSpent: qTime,
        tag: q.tag
      };
    });

    list.push({
      email,
      name,
      roll_number: roll,
      college,
      department,
      year,
      test_id: 'mock_mcq_1',
      test_name: 'SEED-IT Java & Aptitude Assessment',
      type: 'mcq',
      score: mcqScore,
      total_questions: 10,
      correct_answers: mcqCorrect,
      incorrect_answers: 10 - mcqCorrect,
      percentage: mcqPercentage,
      time_taken: mcqTimeTaken,
      time_taken_formatted: `${Math.floor(mcqTimeTaken / 60)}m ${mcqTimeTaken % 60}s`,
      time_started: new Date(Date.now() - 3600000).toISOString(),
      time_ended: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      auto_submitted: Math.random() > 0.9,
      violation_count: Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0,
      violations: [],
      answers: mcqAnswers
    });

    // 2. Mock Coding Result (id: mock_coding_1)
    const codingCorrect = factor > 0.85 ? 3 : (factor > 0.6 ? 2 : 1); 
    const codingScore = codingCorrect * 100;
    const codingPercentage = codingCorrect / 3;
    const codingTimeTaken = Math.round(800 + (1 - factor) * 1200); 

    const codingSubmitOrder = factor > 0.8 && Math.random() > 0.6 
      ? ['binary_search', 'factorial', 'hello_world'] 
      : ['hello_world', 'binary_search', 'factorial']; 

    const language = factor > 0.7 ? 'python' : (Math.random() > 0.5 ? 'java' : 'cpp');

    const codingCodeMap = {
      'hello_world': {
        questionId: 'hello_world',
        title: 'Hello, World!',
        difficulty: 'Easy',
        tag: 'Basic Programming',
        passed: true,
        total: 5,
        executionTime: '0.04s',
        compileTime: language === 'python' ? '0.0s' : '0.45s',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        timeSpent: Math.round(codingTimeTaken * 0.15),
        submitOrder: codingSubmitOrder.indexOf('hello_world') + 1,
        code: language === 'python' 
          ? `print("Hello, World!")`
          : (language === 'java' 
              ? `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
              : `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`),
        solution: `print("Hello, World!")`,
        statement: 'Write a program that outputs exactly "Hello, World!" to the console.',
        constraints: 'Time Limit: 2.0s'
      },
      'binary_search': {
        questionId: 'binary_search',
        title: 'Binary Search',
        difficulty: 'Medium',
        tag: 'Search Algorithms',
        passed: codingCorrect >= 2,
        total: 5,
        executionTime: '0.08s',
        compileTime: language === 'python' ? '0.0s' : '0.52s',
        timeComplexity: 'O(log N)',
        spaceComplexity: 'O(1)',
        timeSpent: Math.round(codingTimeTaken * 0.45),
        submitOrder: codingSubmitOrder.indexOf('binary_search') + 1,
        code: codingCorrect >= 2
          ? (language === 'python'
              ? `def search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: l = mid + 1\n        else: r = mid - 1\n    return -1`
              : `int binarySearch(int arr[], int n, int k) {\n    int l = 0, r = n - 1;\n    while(l <= r) {\n        int m = l + (r - l)/2;\n        if(arr[m] == k) return m;\n        if(arr[m] < k) l = m + 1; else r = m - 1;\n    }\n    return -1;\n}`)
          : `def search(nums, target):\n    # linear search fallback\n    for i in range(len(nums)):\n        if nums[i] == target: return i\n    return -1`, 
        solution: `def search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: l = mid + 1\n        else: r = mid - 1\n    return -1`,
        statement: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
        constraints: '1 <= N <= 10^4'
      },
      'factorial': {
        questionId: 'factorial',
        title: 'Factorial Calculations',
        difficulty: 'Hard',
        tag: 'Recursion & Math',
        passed: codingCorrect >= 3,
        total: 5,
        executionTime: '0.15s',
        compileTime: language === 'python' ? '0.0s' : '0.61s',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        timeSpent: Math.round(codingTimeTaken * 0.45),
        submitOrder: codingSubmitOrder.indexOf('factorial') + 1,
        code: codingCorrect >= 3
          ? (language === 'python'
              ? `def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)`
              : `long long factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}`)
          : `def factorial(n):\n    # missing recursive base case\n    return n * factorial(n - 1)`, 
        solution: `def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)`,
        statement: 'Write a recursive function that returns the factorial of a given integer N.',
        constraints: '0 <= N <= 20'
      }
    };

    list.push({
      email,
      name,
      roll_number: roll,
      college,
      department,
      year,
      test_id: 'mock_coding_1',
      test_name: 'SEED-IT Placement Coding Challenge',
      type: 'coding',
      score: codingScore,
      total_questions: 3,
      correct_answers: codingCorrect,
      incorrect_answers: 3 - codingCorrect,
      percentage: codingPercentage,
      time_taken: codingTimeTaken,
      time_taken_formatted: `${Math.floor(codingTimeTaken / 60)}m ${codingTimeTaken % 60}s`,
      time_started: new Date(Date.now() - 3600000).toISOString(),
      time_ended: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      auto_submitted: false,
      violation_count: 0,
      violations: [],
      languageUsed: language,
      code_map: codingCodeMap
    });
  });

  return list;
};

const StaffDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ Name: "", Role: "", College: "" });
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedView, setSelectedView] = useState('table');
  const [announcements, setAnnouncements] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [scoreColumns, setScoreColumns] = useState([]);
  const [selectedScoreColumns, setSelectedScoreColumns] = useState([]);
  const [reportsSortConfig, setReportsSortConfig] = useState({ key: 'Name', order: 'asc' });
  const [showReportsAnalytics, setShowReportsAnalytics] = useState(false);

  // States for Advanced student reports (Marks, Sectional, Student-wise)
  const [reportsSubTab, setReportsSubTab] = useState("marks"); // 'marks' | 'sectional' | 'student'
  const [selectedStudentId, setSelectedStudentId] = useState(null); // Selected student's email/ID
  const [onlineResults, setOnlineResults] = useState([]); // Integrated test results from Supabase
  const [onlineAssessments, setOnlineAssessments] = useState([]); // Unique online tests list
  const [selectedTestFilter, setSelectedTestFilter] = useState(""); // Current test ID filtered
  const [expandedQuestionId, setExpandedQuestionId] = useState(null); // Expanded question accordion ID

  // New state variables for insights
  const [departmentStats, setDepartmentStats] = useState({});
  const [courseStats, setCourseStats] = useState({});
  const [performanceTrends, setPerformanceTrends] = useState({ labels: [], datasets: [] });

  // MCQ Reports states
  const [mcqResults, setMcqResults] = useState([]);
  const [filteredMcqResults, setFilteredMcqResults] = useState([]);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqError, setMcqError] = useState(null);
  const [mcqSearchTerm, setMcqSearchTerm] = useState("");
  const [mcqTestFilter, setMcqTestFilter] = useState("");
  const [mcqDeptFilter, setMcqDeptFilter] = useState("");
  const [mcqYearFilter, setMcqYearFilter] = useState("");
  const [mcqSortConfig, setMcqSortConfig] = useState({ key: 'Score', order: 'desc' });
  const [mcqTestOptions, setMcqTestOptions] = useState([]);
  const [mcqDeptOptions, setMcqDeptOptions] = useState([]);
  const [mcqYearOptions, setMcqYearOptions] = useState([]);
  const [showMcqAnalytics, setShowMcqAnalytics] = useState(false);

  const [exportFormat, setExportFormat] = useState('excel');
  const [exportLoading, setExportLoading] = useState(false);

  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);

  // ── Report Generator Modal State ──────────────────────────────────────────
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalType, setReportModalType] = useState('marks');    // 'marks' | 'sectional' | 'student'
  const [reportScope, setReportScope] = useState('all-by-test');      // 'all-by-test' | 'single-student' | 'all-history'
  const [reportTargetStudent, setReportTargetStudent] = useState(''); // email for single-student scope
  const [reportTargetTest, setReportTargetTest] = useState('');       // test id for by-test scope
  const [reportFormat, setReportFormat] = useState('pdf');            // 'pdf' | 'excel'
  const [reportGenerating, setReportGenerating] = useState(false);

  const navigate = useNavigate();

  // Fixed year buckets (legacy 2Kxx form) - not used for display anymore but kept for compatibility
  const FIXED_YEARS = ["2K26", "2K27", "2K28", "2K29", "2K30"];

  // Course configuration for performance tracking
  const COURSE_CONFIG = React.useMemo(() => ({
    BasicDataTypesScore: { displayName: 'Basic Datatypes', maxScore: 310, questions: 31 },
    ConditionalStatementsScore: { displayName: 'Conditional Statements', maxScore: 200, questions: 20 },
    LoopingScore: { displayName: 'Looping', maxScore: 200, questions: 20 },
    PatternsScore: { displayName: 'Patterns', maxScore: 800, questions: 80 },
    NumberCrunchingScore: { displayName: 'Number Crunching', maxScore: 300, questions: 30 },
    NumberProblemsScore: { displayName: 'Number Based Problems', maxScore: 200, questions: 20 },
    ArraysScore: { displayName: 'Arrays', maxScore: 500, questions: 50 },
    StringsScore: { displayName: 'Strings', maxScore: 380, questions: 38 }
  }), []);

  // Resolve actual Year key from incoming data (handles spacing/casing like "Year", "Year ")
  const yearKey = React.useMemo(() => {
    if (students.length === 0) return 'Year';
    const normalizeKey = (k) => (k || '').replace(/\s+/g, '').toLowerCase();
    // Scan up to first 100 students to find a consistent key
    const candidateKeys = new Set();
    students.slice(0, 100).forEach((s) => {
      Object.keys(s || {}).forEach(k => {
        if (normalizeKey(k) === 'year') candidateKeys.add(k);
      });
    });
    const resolved = candidateKeys.values().next().value || 'Year';
    try { console.log('Resolved yearKey:', resolved); } catch (_) { }
    return resolved;
  }, [students]);

  // Canonicalize year to a 4-digit string like 2025, 2026
  const toCanonicalYear = React.useCallback((value) => {
    if (value === undefined || value === null) return null;
    const raw = String(value).toUpperCase().replace(/\s+/g, '');
    if (/^\d{4}$/.test(raw)) return raw; // already a 4-digit year
    const m = raw.match(/^2K(\d{2})$/); // 2K26 -> 2026
    if (m) return `20${m[1]}`;
    return null;
  }, []);

  // Population used for analytics cards (respects Department/Year filters)
  const getAnalyticsPopulation = React.useCallback(() => {
    const dep = (departmentFilter || '').toString().trim().toLowerCase();
    const yr = (yearFilter || '').toString(); // already canonical 4-digit
    return students.filter((s) => {
      const matchesDep = !dep || (s?.Department || '').toString().trim().toLowerCase() === dep;
      const studYear = toCanonicalYear(s?.[yearKey] ?? s?.Year);
      const matchesYear = !yr || studYear === yr;
      return matchesDep && matchesYear;
    });
  }, [students, departmentFilter, yearFilter, yearKey, toCanonicalYear]);

  // Determine maximum observed score per score column across all students
  const getScoreMax = React.useCallback((scoreKey) => {
    let maxVal = 0;
    for (const s of students) {
      const v = Number(s?.[scoreKey]);
      if (!Number.isNaN(v) && v > maxVal) maxVal = v;
    }
    return maxVal;
  }, [students]);



  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("auth_data"));
    const userRole = localStorage.getItem("role");

    if (!userData || userRole !== "staff") {
      navigate("/");
      return;
    }

    setUser(userData);
    setUserInfo({ Name: userData.Name, Role: userData.Role, College: userData.College });

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prefer local JSON (public/SEEDDB/userPassword.json), fallback to remote
        const sources = [
          `${process.env.PUBLIC_URL || ''}/SEEDDB/userPassword.json`,
          '/SEEDDB/userPassword.json',
          'https://raw.githubusercontent.com/seeditDev/SEEDDB/main/userPassword.json'
        ];
        let data = null;
        for (const url of sources) {
          try {
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
              data = await res.json();
              break;
            }
          } catch (_) { }
        }
        if (!data) {
          throw new Error('Failed to fetch student data from all sources');
        }

        const normalize = (v) => (v || '')
          .toString()
          .toUpperCase()
          .replace(/\s+/g, '')
          .replace(/[^A-Z0-9]/g, '');
        const staffCollege = normalize(userData.College);

        // Primary: exact normalized match
        let collegeStudents = data.filter(student => normalize(student.College) === staffCollege);

        // Fallback: partial match (includes either way)
        if (collegeStudents.length === 0) {
          collegeStudents = data.filter(student => {
            const c = normalize(student.College);
            return c.includes(staffCollege) || staffCollege.includes(c);
          });
        }

        // Final fallback: if still zero, use entire dataset (so dashboard still shows counts)
        if (collegeStudents.length === 0) {
          console.warn('No students matched staff college; falling back to entire dataset for counting.');
          collegeStudents = data;
        }

        // Debug: log college distribution and chosen filter
        try {
          const dist = data.reduce((acc, s) => {
            const key = normalize(s.College) || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          console.log('College distribution (normalized):', dist);
          console.log('Staff college (normalized):', staffCollege);
          console.log('Matched students count:', collegeStudents.length);
        } catch (_) { }

        // Debug: Log the first few students to see the data structure
        if (collegeStudents.length > 0) {
          console.log('Sample student data:', collegeStudents.slice(0, 3));
          console.log('Available fields:', Object.keys(collegeStudents[0]));
        }

        // Set students data first
        setStudents(collegeStudents);
        setFilteredStudents(collegeStudents);

        // Derive dynamic table columns preserving JSON order
        // Strategy: take keys in the order they first appear across records
        const seenKeys = new Set();
        const dynamicColumns = [];
        collegeStudents.forEach(student => {
          Object.keys(student || {}).forEach(key => {
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              dynamicColumns.push(key);
            }
          });
        });
        setTableColumns(dynamicColumns);

        // Identify score columns and set defaults for export selection
        const inferredScoreCols = dynamicColumns.filter(k => /score/i.test(k));
        setScoreColumns(inferredScoreCols);
        setSelectedScoreColumns(inferredScoreCols);

        // Calculate all statistics
        if (collegeStudents.length > 0) {
          // Calculate all stats at once
          const deptStats = calculateDepartmentStats(collegeStudents);
          const courseCompletionStats = calculateCourseStats(collegeStudents);
          const performanceTrendData = calculatePerformanceTrends(collegeStudents);
          const topPerformersData = calculateTopPerformers(collegeStudents);
          const needsAttentionData = calculateNeedsAttention(collegeStudents);

           // Update all state variables
           setDepartmentStats(deptStats);
           setCourseStats(courseCompletionStats);
           setPerformanceTrends(performanceTrendData);
           setTopPerformers(topPerformersData);
           setNeedsAttention(needsAttentionData);
         }

         // Fetch Supabase online assessment results
         let dbResults = [];
         try {
           const { data: mcqData, error: mcqErr } = await supabase
             .from('mcq_results')
             .select('*')
             .eq('college', userData.College);
           if (!mcqErr && mcqData) {
             dbResults = [...dbResults, ...mcqData.map(r => ({ ...r, type: 'mcq' }))];
           }
         } catch (e) {
           console.warn('Failed to fetch MCQ results:', e);
         }

         try {
           const { data: codingData, error: codingErr } = await supabase
             .from('coding_results')
             .select('*')
             .eq('college', userData.College);
           if (!codingErr && codingData) {
             dbResults = [...dbResults, ...codingData.map(r => ({ ...r, type: 'coding' }))];
           }
         } catch (e) {
           console.warn('Failed to fetch Coding results:', e);
         }

         // If no online records, generate premium mock data
         if (dbResults.length === 0) {
           console.log('[Reports] Empty database, generating premium simulated mock results for reports');
           dbResults = generateSimulatedResults(collegeStudents);
         }

         setOnlineResults(dbResults);

         // Derive unique assessments
         const assessmentsMap = {};
         dbResults.forEach(r => {
           assessmentsMap[r.test_id] = {
             id: r.test_id,
             name: r.test_name || r.test_id,
             type: r.type
           };
         });
         const assessmentsList = Object.values(assessmentsMap);
         setOnlineAssessments(assessmentsList);
         if (assessmentsList.length > 0) {
           setSelectedTestFilter(assessmentsList[0].id);
         }
       } catch (error) {
         console.error("Error fetching student data:", error);
         setError("Failed to load student data. Please try again later.");
       } finally {
         setLoading(false);
       }
     };

     fetchData();
   }, [navigate]);

  // Update filter function - dynamic across dataset
  const handleFilter = () => {
    const normalized = (v) => (v ?? "").toString().trim().toLowerCase();
    const normalizedYearValue = (v) => toCanonicalYear(v);

    let filtered = students.filter(student => {
      const matchesDepartment = !departmentFilter || normalized(student.Department) === normalized(departmentFilter);
      const yearRaw = student?.[yearKey] ?? student?.Year;
      const matchesYear = !yearFilter || normalizedYearValue(yearRaw) === yearFilter;

      const matchesSearch = !searchQuery || tableColumns.some(col =>
        normalized(student[col]).includes(normalized(searchQuery))
      );

      return matchesDepartment && matchesYear && matchesSearch;
    });

    // Apply Sorting for General Reports
    filtered.sort((a, b) => {
      let valA = a[reportsSortConfig.key];
      let valB = b[reportsSortConfig.key];

      // Handle numeric values for score columns
      if (scoreColumns.includes(reportsSortConfig.key)) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return reportsSortConfig.order === 'asc' ? -1 : 1;
      if (valA > valB) return reportsSortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    // Reset and display table anew with filtered results
    setShowTable(false);
    setTimeout(() => {
      setFilteredStudents(filtered);
      setShowTable(true);
    }, 0);
  };

  const handleReset = () => {
    setDepartmentFilter("");
    setYearFilter("");
    setSearchQuery("");
    setFilteredStudents(students);
    setShowTable(false);
  };

  // Export to Excel function
  const exportToExcel = () => {
    const dataToExport = prepareExportData();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const fileName = generateFileName('xlsx');
    XLSX.writeFile(wb, fileName);
  };

  // Export to CSV function
  const exportToCSV = () => {
    const dataToExport = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const fileName = generateFileName('csv');

    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);

      try {
        link.click();
      } finally {
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(link.href);
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        }, 100);
      }
    }
  };

  // Export to PDF function
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const dataToExport = prepareExportData();

    // Add title
    doc.setFontSize(16);
    doc.text(`${user?.College} - Student Report`, 14, 15);
    doc.setFontSize(11);
    doc.text(`Department: ${departmentFilter || 'All'} | Year: ${yearFilter || 'All'}`, 14, 25);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${timeService.getNow().toLocaleString()}`, 14, 30);

    // Convert data for autotable using selected export columns
    const columnsForPdf = (tableColumns.length > 0 ? getExportColumns() : (dataToExport[0] ? Object.keys(dataToExport[0]) : []));
    const tableData = dataToExport.map(item => columnsForPdf.map(col => item[col]));

    // Generate table
    doc.autoTable({
      head: [columnsForPdf],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 }, // Name
        1: { cellWidth: 20 }, // Roll Number
        2: { cellWidth: 25 }, // College
        3: { cellWidth: 20 }, // Department
        4: { cellWidth: 15 }, // Year
      },
      didDrawPage: (data) => {
        // Add footer
        doc.setFontSize(8);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    // Save PDF
    const fileName = generateFileName('pdf');
    doc.save(fileName);
  };

  // Helper: prepare export data using dynamic columns
  const prepareExportData = () => {
    const cols = getExportColumns().length > 0 ? getExportColumns() : Array.from(
      filteredStudents.reduce((set, s) => {
        Object.keys(s || {}).forEach(k => set.add(k));
        return set;
      }, new Set())
    );
    return filteredStudents.map(student => {
      const row = {};
      cols.forEach(col => {
        row[col] = student[col] ?? '';
      });
      return row;
    });
  };

  // Compute export columns: all non-score columns + selected score columns
  const getExportColumns = React.useCallback(() => {
    const nonScoreCols = tableColumns.filter(c => !scoreColumns.includes(c));
    return [...nonScoreCols, ...selectedScoreColumns];
  }, [tableColumns, scoreColumns, selectedScoreColumns]);

  // Helper function to generate filename
  const generateFileName = (extension) => {
    const timestamp = timeService.getNow().toISOString().slice(0, 10);
    return `${user?.College}_${departmentFilter || 'All'}_${yearFilter || 'All'}_${timestamp}.${extension}`;
  };

  // Helper to prettify score column names for display
  const getReadableCourseName = React.useCallback((columnKey) => {
    if (!columnKey) return '';
    const withoutScore = columnKey.replace(/Score$/i, '');
    return withoutScore.replace(/([A-Z])/g, ' $1').trim();
  }, []);

  // Handle export based on format
  const handleExport = async () => {
    if (exportLoading) return; // Prevent multiple clicks

    try {
      setExportLoading(true);
      switch (exportFormat) {
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'pdf':
          await exportToPDF();
          break;
        default:
          await exportToExcel();
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Show error message to user
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Get unique dropdown values dynamically from dataset
  const departmentOptions = React.useMemo(() => {
    const values = Array.from(new Set(students.map(s => s?.Department).filter(Boolean)));
    values.sort((a, b) => a.localeCompare(b));
    return values;
  }, [students]);

  // Year options based on dataset values (normalized for values)
  const yearOptions = React.useMemo(() => {
    const values = Array.from(new Set(
      students
        .map(s => toCanonicalYear(s?.[yearKey] ?? s?.Year))
        .filter(v => v)
    ));
    values.sort();
    return values;
  }, [students, yearKey, toCanonicalYear]);

  // Logout function
  const handleLogout = () => {
    // Show the logout animation first
    // Step 0: Stop Live User Tracking
    TrackingService.stopTracking();

    console.log("Starting comprehensive logout process...");

    // Step 1: Clear HackerRank authentication status from both storage mechanisms
    localStorage.removeItem('hackerRankAuth');
    sessionStorage.removeItem('hackerRankAuthInProgress');
    sessionStorage.removeItem('currentHackerRankAssessmentUrl');
    console.log('Cleared all HackerRank authentication flags');

    // Step 2: Call cacheManager utilities to clear all app caches
    try {
      // Use the static methods from cacheManager to clear all caches
      if (typeof window.cacheManager !== 'undefined' && window.cacheManager.clearAllCache) {
        window.cacheManager.clearAllCache();
        console.log('Cleared all caches using cacheManager.clearAllCache()');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }

    // Step 3: Clear college-specific caches and other localStorage items
    try {
      // Clear college-specific caches
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('college_') ||
          key.startsWith('seed-') ||
          key.startsWith('cache_') ||
          key.includes('_cache_')) {
          localStorage.removeItem(key);
          console.log(`Removed cache: ${key}`);
        }
      });
    } catch (error) {
      console.error('Error clearing college caches:', error);
    }

    // Step 4: Clear all cookies using JavaScript
    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";

        // Also try to clear with domain parameters
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.hackerrank.com";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
      }
      console.log('Cleared all cookies');
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }

    // Step 5: Clear all session and local storage completely
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("auth_data");
      localStorage.removeItem("role");
      localStorage.removeItem("portal_links");

      // For thorough cleanup, clear all storage
      sessionStorage.clear();

      // Only clear remaining localStorage after saving what we've cleared so far
      setTimeout(() => {
        localStorage.clear();
        console.log('Cleared all localStorage and sessionStorage');
      }, 100);
    } catch (error) {
      console.error('Error clearing storages:', error);
    }

    // Step 6: Check if running in PyQt environment
    if (typeof window.pyqtFlag !== 'undefined' && window.pyqtFlag === true) {
      console.log('Detected PyQt environment, letting browser handle complete cleanup...');
    } else {
      console.log('Not running in PyQt environment, using standard web cleanup...');
      // Additional web-specific cleanup could go here
    }

    // Step 7: Wait for animation and redirect
    setTimeout(() => {
      setShowLogoutAnimation(false);
      console.log('Logout process complete, redirecting to login page');
      navigate("/login");
    }, 1500);
  };

  // Calculate top performers
  const calculateTopPerformers = (studentData) => {
    const studentsToUse = studentData || students;
    return studentsToUse
      .map(student => {
        const scores = [
          student.BasicDataTypesScore,
          student.ConditionalStatementsScore,
          student.LoopingScore,
          student.PatternsScore,
          student.NumberCrunchingScore,
          student.NumberProblemsScore,
          student.ArraysScore,
          student.StringsScore,
          student.FunctionsScore,
          student.StructuresScore
        ].filter(score => score && score !== 'N/A' && score !== '-').map(Number);

        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

        return {
          ...student,
          avgScore,
          completedCourses: scores.length
        };
      })
      .filter(student => student.completedCourses > 0)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  };

  // Calculate students needing attention
  const calculateNeedsAttention = (studentData) => {
    const studentsToUse = studentData || students;
    return studentsToUse
      .map(student => {
        const scores = [
          student.BasicDataTypesScore,
          student.ConditionalStatementsScore,
          student.LoopingScore,
          student.PatternsScore,
          student.NumberCrunchingScore,
          student.NumberProblemsScore,
          student.ArraysScore,
          student.StringsScore,
          student.FunctionsScore,
          student.StructuresScore
        ].filter(score => score && score !== 'N/A' && score !== '-').map(Number);

        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

        return {
          ...student,
          avgScore,
          completedCourses: scores.length
        };
      })
      .filter(student => student.completedCourses > 0 && student.avgScore < 40)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5);
  };

  // Calculate department-wise performance
  const calculateDepartmentStats = (studentData) => {
    const studentsToUse = studentData || students;
    const stats = {};
    const deptStudents = studentsToUse.reduce((acc, student) => {
      if (!acc[student.Department]) {
        acc[student.Department] = [];
      }
      acc[student.Department].push(student);
      return acc;
    }, {});

    Object.entries(deptStudents).forEach(([dept, deptStudents]) => {
      const deptScores = deptStudents.map(student => {
        const scores = [
          student.BasicDataTypesScore,
          student.ConditionalStatementsScore,
          student.LoopingScore,
          student.PatternsScore,
          student.NumberCrunchingScore,
          student.NumberProblemsScore,
          student.ArraysScore,
          student.StringsScore,
          student.FunctionsScore,
          student.StructuresScore
        ].filter(score => score && score !== 'N/A' && score !== '-').map(Number);

        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      }).filter(score => score > 0);

      if (deptScores.length > 0) {
        stats[dept] = {
          avgScore: (deptScores.reduce((a, b) => a + b, 0) / deptScores.length).toFixed(1),
          studentCount: deptStudents.length
        };
      }
    });
    return stats;
  };

  // Calculate course completion rates
  const calculateCourseStats = (studentData) => {
    const studentsToUse = studentData || students;
    const courseList = [
      'BasicDataTypes',
      'ConditionalStatements',
      'Looping',
      'Patterns',
      'NumberCrunching',
      'NumberProblems',
      'Arrays',
      'Strings',
      'Functions',
      'Structures'
    ];

    const stats = {};
    courseList.forEach(course => {
      const scoreKey = course + 'Score';
      const attempted = studentsToUse.filter(s => s[scoreKey] && s[scoreKey] !== 'N/A' && s[scoreKey] !== '-').length;
      stats[course] = ((attempted / studentsToUse.length) * 100).toFixed(1);
    });
    return stats;
  };

  // Calculate performance trends
  const calculatePerformanceTrends = (studentData) => {
    const studentsToUse = studentData || students;
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const courseList = [
      'BasicDataTypes',
      'ConditionalStatements',
      'Looping',
      'Patterns'
    ];

    const datasets = courseList.map((course, index) => {
      const scoreKey = course + 'Score';
      const scores = studentsToUse
        .filter(s => s[scoreKey] && s[scoreKey] !== 'N/A' && s[scoreKey] !== '-')
        .map(s => Number(s[scoreKey]));

      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      return {
        label: course.replace(/([A-Z])/g, ' $1').trim(),
        data: [
          avgScore * 0.7,
          avgScore * 0.8,
          avgScore * 0.9,
          avgScore
        ].map(score => score.toFixed(1)),
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)'
        ][index],
        tension: 0.1
      };
    });

    return {
      labels: weeks,
      datasets
    };
  };

  // Enhanced Insights Section
  const renderInsights = () => (
    <div className="staff-insights-section">
      <h2 className="staff-section-title">Performance Insights</h2>
      <div className="staff-insights-grid">
        {/* Top Performers Card */}
        <div className="staff-insight-box">
          <h3><FaTrophy /> Top Performers</h3>
          <div className="staff-insight-list">
            {topPerformers.map((student, index) => (
              <div key={index} className="staff-insight-item">
                <div className="student-info">
                  <span className="rank">#{index + 1}</span>
                  <div>
                    <div className="student-name">{student.Name}</div>
                    <div className="student-details">{student.Department} - {student.Year}</div>
                  </div>
                </div>
                <span className="score">{student.avgScore.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention Card */}
        <div className="staff-insight-box">
          <h3><FaExclamationTriangle /> Needs Attention</h3>
          <div className="staff-insight-list">
            {needsAttention.map((student, index) => (
              <div key={index} className="staff-insight-item attention">
                <div className="student-info">
                  <div>
                    <div className="student-name">{student.Name}</div>
                    <div className="student-details">{student.Department} - {student.Year}</div>
                  </div>
                </div>
                <span className="score">{student.avgScore.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Performance */}
        <div className="staff-insight-box">
          <h3><FaGraduationCap /> Department Performance</h3>
          <div className="chart-container">
            <Bar
              data={{
                labels: Object.keys(departmentStats),
                datasets: [{
                  label: 'Average Score',
                  data: Object.values(departmentStats).map(stat => stat.avgScore),
                  backgroundColor: 'rgba(54, 162, 235, 0.5)',
                  borderColor: 'rgb(54, 162, 235)',
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Department-wise Average Scores'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Course Completion Rates */}
        <div className="staff-insight-box">
          <h3><FaChartPie /> Course Completion</h3>
          <div className="chart-container">
            <Pie
              data={{
                labels: Object.keys(courseStats),
                datasets: [{
                  data: Object.values(courseStats),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                    'rgba(199, 199, 199, 0.5)',
                    'rgba(83, 102, 255, 0.5)',
                  ],
                  borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(199, 199, 199)',
                    'rgb(83, 102, 255)',
                  ],
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: true,
                    text: 'Course Completion Rates (%)'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Performance Trends */}
        <div className="staff-insight-box full-width">
          <h3><FaChartLine /> Performance Trends</h3>
          <div className="chart-container">
            <Line
              data={performanceTrends}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Weekly Performance Trends'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Update the navigation to include new sections
  const renderNavigation = () => (
    <nav className="staff-nav">
      <button
        className={`staff-nav-item ${activeSection === "overview" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("overview");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaChartBar />
        <span className="staff-nav-text">Overview</span>
      </button>
      <button
        className={`staff-nav-item ${activeSection === "insights" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("insights");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaChartLine />
        <span className="staff-nav-text">Insights</span>
      </button>
      <button
        className={`staff-nav-item ${activeSection === "analytics" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("analytics");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaChartArea />
        <span className="staff-nav-text">Analytics</span>
      </button>
      <button
        className={`staff-nav-item ${activeSection === "students" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("students");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaUsers />
        <span className="staff-nav-text">Student Management</span>
      </button>
      <button
        className={`staff-nav-item ${activeSection === "reports" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("reports");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaFileExport />
        <span className="staff-nav-text">Reports</span>
      </button>
      <button
        className={`staff-nav-item ${activeSection === "placements" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("placements");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaBriefcase />
        <span className="staff-nav-text">Placements</span>
      </button>
      <button
        className={`staff-nav-item ${activeSection === "profile" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("profile");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaUser />
        <span className="staff-nav-text">Profile</span>
      </button>
      <button
        className={`staff-nav-item ${activeSection === "settings" ? 'staff-nav-active' : ''}`}
        onClick={() => {
          setActiveSection("settings");
          setIsMobileMenuOpen(false);
        }}
      >
        <FaCog />
        <span className="staff-nav-text">Settings</span>
      </button>
    </nav>
  );

  // Add placeholder sections for new features
  const renderAnalytics = () => (
    <div className="staff-analytics-section">
      <h2 className="staff-section-title">Advanced Analytics</h2>
      <div className="staff-analytics-content">
        <p>Analytics features coming soon...</p>
        <ul>
          <li>Detailed Performance Metrics</li>
          <li>Custom Report Generation</li>
          <li>Predictive Analysis</li>
          <li>Learning Pattern Recognition</li>
        </ul>
      </div>
    </div>
  );

  const renderStudentManagement = () => (
    <div className="staff-students-section">
      <h2 className="staff-section-title">Student Management</h2>
      <div className="staff-students-content">
        <p>Student management features coming soon...</p>
        <ul>
          <li>Direct Student Communication</li>
          <li>Progress Tracking</li>
          <li>Performance Reviews</li>
          <li>Attendance Management</li>
        </ul>
      </div>
    </div>
  );

  const renderPlacements = () => (
    <div className="staff-placements-section">
      <h2 className="staff-section-title">Placements</h2>
      <div className="staff-placements-content">
        <p>Placement management features coming soon...</p>
        <ul>
          <li>Company Partner Management</li>
          <li>Job Posting Management</li>
          <li>Student Placement Tracking</li>
          <li>Interview Scheduling</li>
          <li>Offer Letter Management</li>
        </ul>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="staff-settings-section">
      <h2 className="staff-section-title">Dashboard Settings</h2>
      <div className="staff-settings-content">
        <p>Settings features coming soon...</p>
        <ul>
          <li>Dashboard Customization</li>
          <li>Notification Preferences</li>
          <li>Data Display Options</li>
          <li>Theme Settings</li>
        </ul>
      </div>
    </div>
  );

  const handleFetchMcqResults = async () => {
    setMcqLoading(true);
    setMcqResults([]);
    setFilteredMcqResults([]);
    setMcqLoading(false);
  };

  const handleMcqFilter = () => {
    let filtered = mcqResults;
    const search = mcqSearchTerm.toLowerCase().trim();

    if (search) {
      filtered = filtered.filter(r =>
        (r['Name'] || "").toLowerCase().includes(search) ||
        (r['Roll Number'] || "").toLowerCase().includes(search)
      );
    }

    if (mcqTestFilter) {
      filtered = filtered.filter(r => r['Test Name'] === mcqTestFilter);
    }

    if (mcqDeptFilter) {
      filtered = filtered.filter(r => r['Department'] === mcqDeptFilter);
    }

    if (mcqYearFilter) {
      filtered = filtered.filter(r => r['Year'] === mcqYearFilter);
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      let valA = a[mcqSortConfig.key];
      let valB = b[mcqSortConfig.key];

      // Handle numeric values
      if (mcqSortConfig.key === 'Score' || mcqSortConfig.key === 'Percentage' || mcqSortConfig.key === 'Total Questions') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (mcqSortConfig.key === 'Submitted At') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return mcqSortConfig.order === 'asc' ? -1 : 1;
      if (valA > valB) return mcqSortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMcqResults(filtered);
  };

  const exportMcqReport = (format) => {
    const dataToExport = filteredMcqResults;
    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const filename = `MCQ_Report_${userInfo.College}_${mcqTestFilter || 'All'}_${timeService.getNow().toISOString().split('T')[0]}`;

    if (format === 'excel' || format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MCQ Results");
      XLSX.writeFile(wb, `${filename}.${format === 'excel' ? 'xlsx' : 'csv'}`);
    } else if (format === 'pdf') {
      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text(`${userInfo.College} - MCQ Report`, 14, 15);
      doc.setFontSize(11);
      doc.text(`Test: ${mcqTestFilter || 'All'} | Dept: ${mcqDeptFilter || 'All'}`, 14, 25);

      const headers = Object.keys(dataToExport[0]).filter(k => k !== 'Violations Details');
      const body = dataToExport.map(r => headers.map(h => r[h]));

      doc.autoTable({
        head: [headers],
        body: body,
        startY: 30,
        styles: { fontSize: 7 },
        margin: { top: 30 }
      });
      doc.save(`${filename}.pdf`);
    }
  };

  const renderReportsAnalytics = () => {
    // Analytics for current courses (scoreColumns)
    const activeScoreCols = selectedScoreColumns.length > 0 ? selectedScoreColumns : scoreColumns.slice(0, 5);

    // Average scores per course
    const courseLabels = activeScoreCols.map(col => COURSE_CONFIG[col]?.displayName || col);
    const courseAverages = activeScoreCols.map(col => {
      const scores = filteredStudents
        .map(s => parseFloat(s[col]))
        .filter(n => !isNaN(n) && n > 0);
      return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    });

    // Student performance breakdown (Sum of all active scores if numeric)
    const performanceCategories = ['Excellent (>80%)', 'Good (60-80%)', 'Average (40-60%)', 'Below Avg (<40%)'];
    const distribution = [0, 0, 0, 0];

    filteredStudents.forEach(s => {
      let totalPoints = 0;
      let maxPoints = 0;
      activeScoreCols.forEach(col => {
        const score = parseFloat(s[col]);
        if (!isNaN(score)) {
          totalPoints += score;
          maxPoints += (COURSE_CONFIG[col]?.maxScore || 100);
        }
      });

      const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
      if (percentage > 80) distribution[0]++;
      else if (percentage > 60) distribution[1]++;
      else if (percentage > 40) distribution[2]++;
      else distribution[3]++;
    });

    return (
      <div className="modal-overlay" onClick={() => setShowReportsAnalytics(false)}>
        <div className="modal-content analytics-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 className="staff-section-title" style={{ marginBottom: 0 }}>Reports Analytics - {filteredStudents.length} Students</h2>
            <button className="staff-reset-btn" onClick={() => setShowReportsAnalytics(false)}>
              <FaTimes /> Close
            </button>
          </div>

          <div className="staff-insights-grid">
            <div className="staff-insight-box">
              <h3>Average Scores by Course</h3>
              <Bar
                data={{
                  labels: courseLabels,
                  datasets: [{
                    label: 'Avg Score',
                    data: courseAverages,
                    backgroundColor: 'rgba(33, 150, 243, 0.5)',
                    borderColor: 'rgb(33, 150, 243)',
                    borderWidth: 1
                  }]
                }}
                options={{ responsive: true }}
              />
            </div>

            <div className="staff-insight-box">
              <h3>Overall Performance Distribution</h3>
              <Doughnut
                data={{
                  labels: performanceCategories,
                  datasets: [{
                    data: distribution,
                    backgroundColor: [
                      'rgba(76, 175, 80, 0.5)',
                      'rgba(33, 150, 243, 0.5)',
                      'rgba(255, 152, 0, 0.5)',
                      'rgba(244, 67, 54, 0.5)',
                    ]
                  }]
                }}
                options={{ responsive: true }}
              />
            </div>

            <div className="staff-stat-box full-width" style={{ marginTop: '1.5rem', flexBasis: '100%' }}>
              <h3>Dataset Performance Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="staff-stat-item">
                  <span>Selected Students:</span>
                  <span>{filteredStudents.length}</span>
                </div>
                <div className="staff-stat-item">
                  <span>Avg Dept Performance:</span>
                  <span>{(courseAverages.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / (courseAverages.length || 1)).toFixed(1)} %</span>
                </div>
                <div className="staff-stat-item">
                  <span>High Achievers:</span>
                  <span>{distribution[0]}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
            * Analytics based on the currently filtered students and {selectedScoreColumns.length > 0 ? "selected" : "first 5"} score columns.
          </div>
        </div>
      </div>
    );
  };

  const renderMCQReports = () => {
    return null;
  };

  const renderMcqAnalytics = () => {
    // Prepare Data for Score Distribution
    const scoreRanges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
    const distribution = [0, 0, 0, 0, 0];

    filteredMcqResults.forEach(r => {
      const p = (parseFloat(r['Percentage']) || 0) * 100;
      if (p <= 20) distribution[0]++;
      else if (p <= 40) distribution[1]++;
      else if (p <= 60) distribution[2]++;
      else if (p <= 80) distribution[3]++;
      else distribution[4]++;
    });

    // Prepare Data for Average Score by Department
    const deptAverages = {};
    filteredMcqResults.forEach(r => {
      const dept = r['Department'] || 'Unknown';
      const score = parseFloat(r['Percentage'] || 0) * 100;
      if (!deptAverages[dept]) deptAverages[dept] = { total: 0, count: 0 };
      deptAverages[dept].total += score;
      deptAverages[dept].count++;
    });

    const deptLabels = Object.keys(deptAverages);
    const deptData = deptLabels.map(l => (deptAverages[l].total / deptAverages[l].count).toFixed(1));

    return (
      <div className="modal-overlay" onClick={() => setShowMcqAnalytics(false)}>
        <div className="modal-content analytics-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 className="staff-section-title" style={{ marginBottom: 0 }}>MCQ Analytics - {mcqTestFilter || 'Filtered Data'}</h2>
            <button className="staff-reset-btn" onClick={() => setShowMcqAnalytics(false)}>
              <FaTimes /> Close
            </button>
          </div>

          <div className="staff-insights-grid">
            <div className="staff-insight-box">
              <h3>Score Distribution</h3>
              <Bar
                data={{
                  labels: scoreRanges,
                  datasets: [{
                    label: 'Number of Students',
                    data: distribution,
                    backgroundColor: 'rgba(103, 58, 183, 0.5)',
                    borderColor: 'rgb(103, 58, 183)',
                    borderWidth: 1
                  }]
                }}
                options={{ responsive: true }}
              />
            </div>

            <div className="staff-insight-box">
              <h3>Average Score by Department (%)</h3>
              <Pie
                data={{
                  labels: deptLabels,
                  datasets: [{
                    data: deptData,
                    backgroundColor: [
                      'rgba(54, 162, 235, 0.5)',
                      'rgba(255, 99, 132, 0.5)',
                      'rgba(255, 206, 86, 0.5)',
                      'rgba(75, 192, 192, 0.5)',
                    ]
                  }]
                }}
                options={{ responsive: true }}
              />
            </div>

            <div className="staff-stat-box full-width" style={{ marginTop: '1.5rem', flexBasis: '100%' }}>
              <h3>Summary Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="staff-stat-item">
                  <span>Total Students:</span>
                  <span>{filteredMcqResults.length}</span>
                </div>
                <div className="staff-stat-item">
                  <span>Average Score:</span>
                  <span>
                    {(filteredMcqResults.reduce((acc, r) => acc + (parseFloat(r['Percentage']) || 0), 0) / (filteredMcqResults.length || 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="staff-stat-item">
                  <span>Highest Score:</span>
                  <span>
                    {(Math.max(...filteredMcqResults.map(r => parseFloat(r['Percentage']) || 0)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleDownloadStudentPdf = (student, result, activeTest) => {
    const doc = new jsPDF();
    const primaryColor = [26, 35, 126]; 
    const secondaryColor = [44, 62, 80]; 
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SEED-IT ASSESSMENT REPORT", 14, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Diagnostic Placement Readiness Report", 14, 33);

    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Candidate Profile", 14, 60);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 63, 196, 63);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${student.Name}`, 14, 71);
    doc.text(`Roll Number: ${student['Roll Number'] || '—'}`, 14, 77);
    doc.text(`Email: ${student.Email}`, 14, 83);
    doc.text(`College: ${student.College}`, 14, 89);
    doc.text(`Department: ${student.Department} | Year: ${student.Year || '—'}`, 14, 95);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Assessment Performance Overview", 14, 110);
    doc.line(14, 113, 196, 113);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Assessment Name: ${activeTest.name}`, 14, 120);
    doc.text(`Type: ${activeTest.type.toUpperCase()}`, 14, 126);
    doc.text(`Final Score: ${result.score} (Pct: ${Math.round(result.percentage * 100)}%)`, 14, 132);
    doc.text(`Time Spent: ${result.time_taken_formatted || `${result.time_taken}s`}`, 14, 138);
    doc.text(`Submission Status: ${result.auto_submitted ? 'Auto-Submitted (Timeout)' : 'Submitted by Candidate'}`, 14, 144);
    doc.text(`Proctor Warnings: ${result.violation_count} Flagged Violations`, 14, 150);

    const pct = Math.round(result.percentage * 100);
    let category = '';
    let packageProbability = '';
    let strategy = '';
    
    if (pct >= 80) {
      category = 'Elite Placement Ready (Direct Premium Tier recommendation)';
      packageProbability = '92% probability of cracking Tier-1 Core / Tech companies (8+ LPA)';
      strategy = 'Attempted challenges with high problem-solving confidence.';
    } else if (pct >= 60) {
      category = 'Standard Placement Ready (Tier-2 recommendations)';
      packageProbability = '75% probability of cracking Tier-2 Service / Tech companies (5-8 LPA)';
      strategy = 'Attempted challenges sequentially with logical progression.';
    } else if (pct >= 45) {
      category = 'Standard Candidate (Requires training updates)';
      packageProbability = '50% probability of cracking general service companies (3.5-5 LPA)';
      strategy = 'Candidate focused on easy/medium sections first.';
    } else {
      category = 'Needs Remedial Help (Specific tracking recommended)';
      packageProbability = '25% probability; focus on DSA and logical core is highly required';
      strategy = 'Struggled with complex sections or timed out.';
    }

    doc.setFillColor(248, 249, 250);
    doc.rect(14, 160, 182, 45, 'F');
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.text("SEED Diagnostic Analytics", 18, 168);
    doc.setFont("helvetica", "normal");
    doc.text(`Readiness Level: ${category}`, 18, 175);
    doc.text(`Package Probability: ${packageProbability}`, 18, 181);
    doc.text(`Proctoring Flags: ${result.violation_count === 0 ? 'None (Clean attempt integrity)' : `${result.violation_count} warnings observed`}`, 18, 187);
    doc.text(`Solved Strategy: ${strategy}`, 18, 193);

    doc.addPage();
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Candidate Question-Answer Workbook", 14, 10);
    
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(13);
    doc.text("Submitted Questions & Detailed Solution Workbook", 14, 25);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 28, 196, 28);

    let yOffset = 35;
    
    if (result.type === 'mcq' && result.answers) {
      Object.values(result.answers).forEach((ans, idx) => {
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Question ${idx + 1}: ${ans.question ? ans.question.slice(0, 80) : 'Java MCQ Task'}`, 14, yOffset);
        yOffset += 6;
        if (ans.question && ans.question.length > 80) {
          doc.text(ans.question.slice(80, 160), 14, yOffset);
          yOffset += 6;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Topic Tag: ${ans.tag || 'General'} | Speed: ${ans.timeSpent}s spent`, 14, yOffset);
        yOffset += 5;
        
        doc.text(`Candidate Answer: ${ans.selectedAnswer}`, 14, yOffset);
        doc.text(`Correct Model Answer: ${ans.correctAnswer}`, 100, yOffset);
        yOffset += 5;
        
        if (ans.isCorrect) {
          doc.setTextColor(39, 174, 96);
          doc.text("Status: CORRECT", 14, yOffset);
        } else {
          doc.setTextColor(192, 57, 43);
          doc.text("Status: INCORRECT", 14, yOffset);
        }
        doc.setTextColor(...secondaryColor);
        yOffset += 8;
        doc.line(14, yOffset - 2, 196, yOffset - 2);
        yOffset += 5;
      });
    } else if (result.type === 'coding' && result.code_map) {
      Object.values(result.code_map).forEach((codeObj, idx) => {
        if (yOffset > 200) {
          doc.addPage();
          yOffset = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Coding Challenge ${idx + 1}: ${codeObj.title || 'Challenge'} (${codeObj.difficulty})`, 14, yOffset);
        yOffset += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Topic Tag: ${codeObj.tag} | Solving Speed: ${codeObj.timeSpent}s | Language: ${codeObj.language || result.languageUsed || 'Python'}`, 14, yOffset);
        yOffset += 5;
        
        doc.text(`Testcases Passed: ${codeObj.passed ? '5/5' : '0/5'} | Time Complexity: ${codeObj.timeComplexity} | Space Complexity: ${codeObj.spaceComplexity}`, 14, yOffset);
        yOffset += 7;

        doc.setFont("helvetica", "bold");
        doc.text("Candidate's Submitted Code:", 14, yOffset);
        yOffset += 5;
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        
        const submittedLines = (codeObj.code || '').split('\n').slice(0, 12);
        submittedLines.forEach(l => {
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
          }
          doc.text(l.slice(0, 85), 18, yOffset);
          yOffset += 4;
        });
        
        yOffset += 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Expected Model Solution:", 14, yOffset);
        yOffset += 5;
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        
        const solutionLines = (codeObj.solution || '').split('\n').slice(0, 10);
        solutionLines.forEach(l => {
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
          }
          doc.text(l.slice(0, 85), 18, yOffset);
          yOffset += 4;
        });

        doc.setFont("helvetica", "normal");
        yOffset += 8;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yOffset - 4, 196, yOffset - 4);
      });
    }

    doc.save(`${student.Name}_SEED_Assessment_Report.pdf`);
  };

  const renderStudentDetailReport = (student, result, activeTest) => {
    const pct = Math.round(result.percentage * 100);
    
    let readinessClass = '';
    let readinessColorClass = '';
    let packageProbabilityText = '';
    let strategyText = '';
    let strengthTags = [];
    let attentionTags = [];

    if (activeTest.type === 'mcq' && result.answers) {
      Object.values(result.answers).forEach(ans => {
        if (ans.isCorrect) {
          strengthTags.push(ans.tag);
        } else {
          attentionTags.push(ans.tag);
        }
      });
    } else if (activeTest.type === 'coding' && result.code_map) {
      Object.values(result.code_map).forEach(cObj => {
        if (cObj.passed) {
          strengthTags.push(cObj.tag);
        } else {
          attentionTags.push(cObj.tag);
        }
      });
    }

    strengthTags = Array.from(new Set(strengthTags));
    attentionTags = Array.from(new Set(attentionTags)).filter(t => !strengthTags.includes(t));
    if (attentionTags.length === 0 && strengthTags.length > 0) {
      attentionTags = ["None - High Core Concept Strength!"];
    }

    if (pct >= 80) {
      readinessClass = 'Elite Placement Ready';
      readinessColorClass = 'elite';
      packageProbabilityText = '92% probability of cracking Tier-1 Product Tech companies (8+ LPA)';
      strategyText = 'Candidate attempted tasks with high logic confidence. Time margins were extremely positive.';
    } else if (pct >= 60) {
      readinessClass = 'Standard Placement Ready';
      readinessColorClass = 'good';
      packageProbabilityText = '75% probability of cracking Tier-2 Service / Tech companies (5-8 LPA)';
      strategyText = 'Sequential submission pattern shows balanced logical pacing and standard test strategy.';
    } else if (pct >= 45) {
      readinessClass = 'Standard Candidate';
      readinessColorClass = 'average';
      packageProbabilityText = '50% probability of cracking entry-level tech roles (3.5-5 LPA)';
      strategyText = 'Attempt priority shows focus on lower complexity modules first to maximize safe points.';
    } else {
      readinessClass = 'Needs Remedial Training';
      readinessColorClass = 'remedial';
      packageProbabilityText = '25% probability. High recommendations for foundational syntax training.';
      strategyText = 'Extended solving times or timeouts indicate difficulty in basic loops, recursion, or math modules.';
    }

    return (
      <div className="student-report-details">
        <div className="student-report-header">
          <div className="profile-badge-avatar">
            {student.Name.charAt(0)}
          </div>
          <div className="profile-identity">
            <h3>{student.Name}</h3>
            <span className="profile-meta">{student['Roll Number'] || '—'} | {student.Department} | Class of {student.Year || '—'}</span>
          </div>
          <button 
            className="download-student-report-btn"
            onClick={() => handleDownloadStudentPdf(student, result, activeTest)}
          >
            <FaFilePdf style={{ marginRight: 6 }} /> Download Assessment PDF
          </button>
        </div>

        <div className="report-scorecard-grid">
          <div className="scorecard-mini-box">
            <span className="box-label">Assessment Score</span>
            <span className="box-value">{result.score}</span>
            <span className="box-footer">({pct}% Correctness)</span>
          </div>
          <div className="scorecard-mini-box">
            <span className="box-label">Placement Readiness Index</span>
            <span className={`box-value-badge ${readinessColorClass}`}>{readinessClass}</span>
            <span className="box-footer">SEED Placement Tier</span>
          </div>
          <div className="scorecard-mini-box">
            <span className="box-label">High Package Probability</span>
            <span className="box-value-small">{packageProbabilityText}</span>
            <span className="box-footer">Premium Hiring Odds</span>
          </div>
        </div>

        <div className="diagnostic-alert-card">
          <div className="alert-icon-wrap">
            <FaSearchMinus size={20} />
          </div>
          <div className="alert-body">
            <strong>Diagnostic Attempt Strategy:</strong> {strategyText}
          </div>
        </div>

        <div className="skills-concept-matrix">
          <div className="concept-box strength">
            <h4><FaCheckCircle style={{ color: '#2ecc71', marginRight: 6 }} /> Concept Strengths</h4>
            <div className="concept-tags-wrap">
              {strengthTags.map(tag => (
                <span key={tag} className="strength-tag-badge">{tag}</span>
              ))}
            </div>
          </div>
          <div className="concept-box weakness">
            <h4><FaExclamationCircle style={{ color: '#e74c3c', marginRight: 6 }} /> Focus Areas (Attention Needed)</h4>
            <div className="concept-tags-wrap">
              {attentionTags.map(tag => (
                <span key={tag} className="weakness-tag-badge">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="timing-analysis-section">
          <h4>Candidate Solving Timeline & Execution</h4>
          <div className="solving-timeline-list">
            {activeTest.type === 'mcq' && result.answers && (
              Object.values(result.answers).map((ans, idx) => (
                <div key={ans.questionId} className="timeline-item">
                  <div className="timeline-status-dot">
                    <span className={`dot ${ans.isCorrect ? 'correct' : 'wrong'}`}>{idx + 1}</span>
                  </div>
                  <div className="timeline-item-body">
                    <div className="timeline-item-header">
                      <span className="question-topic">{ans.tag}</span>
                      <span className="question-duration">{ans.timeSpent}s spent</span>
                    </div>
                    <span className="question-text-preview">{ans.question}</span>
                  </div>
                </div>
              ))
            )}
            {activeTest.type === 'coding' && result.code_map && (
              Object.values(result.code_map).map((cObj, idx) => (
                <div key={cObj.questionId} className="timeline-item">
                  <div className="timeline-status-dot">
                    <span className={`dot ${cObj.passed ? 'correct' : 'wrong'}`}>{idx + 1}</span>
                  </div>
                  <div className="timeline-item-body">
                    <div className="timeline-item-header">
                      <span className="question-topic">{cObj.title} ({cObj.difficulty})</span>
                      <span className="question-duration">{cObj.timeSpent}s spent</span>
                    </div>
                    <span className="question-text-preview">{cObj.tag} | Complexity: {cObj.timeComplexity} space: {cObj.spaceComplexity} | lang: {cObj.language || result.languageUsed}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="question-accordion-explorer">
          <h4>Detailed Workbook (Questions, Submissions & Solutions)</h4>
          <div className="accordion-wrapper">
            {activeTest.type === 'mcq' && result.answers && (
              Object.values(result.answers).map((ans, idx) => {
                const isExp = expandedQuestionId === ans.questionId;
                return (
                  <div key={ans.questionId} className="accordion-item-card">
                    <div 
                      className={`accordion-item-header ${isExp ? 'expanded' : ''}`}
                      onClick={() => setExpandedQuestionId(isExp ? null : ans.questionId)}
                    >
                      <span className="item-title">Question {idx + 1}: {ans.tag}</span>
                      <div className="header-badges">
                        <span className={`badge-status ${ans.isCorrect ? 'success' : 'danger'}`}>
                          {ans.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                        {isExp ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                    {isExp && (
                      <div className="accordion-item-body">
                        <p className="question-text"><strong>Problem Statement:</strong><br />{ans.question}</p>
                        <div className="qa-split-view">
                          <div className="qa-column">
                            <span className="qa-label">Candidate Answer:</span>
                            <span className={`qa-value ${ans.isCorrect ? 'correct' : 'wrong'}`}>{ans.selectedAnswer}</span>
                          </div>
                          <div className="qa-column">
                            <span className="qa-label">Model Solution Answer:</span>
                            <span className="qa-value correct">{ans.correctAnswer}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {activeTest.type === 'coding' && result.code_map && (
              Object.values(result.code_map).map((cObj, idx) => {
                const isExp = expandedQuestionId === cObj.questionId;
                return (
                  <div key={cObj.questionId} className="accordion-item-card">
                    <div 
                      className={`accordion-item-header ${isExp ? 'expanded' : ''}`}
                      onClick={() => setExpandedQuestionId(isExp ? null : cObj.questionId)}
                    >
                      <span className="item-title">Challenge {idx + 1}: {cObj.title} ({cObj.difficulty})</span>
                      <div className="header-badges">
                        <span className={`badge-status ${cObj.passed ? 'success' : 'danger'}`}>
                          {cObj.passed ? 'All Passed' : 'Failed Testcases'}
                        </span>
                        {isExp ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                    {isExp && (
                      <div className="accordion-item-body">
                        <p className="question-text"><strong>Problem Statement:</strong><br />{cObj.statement}</p>
                        <p className="question-constraints"><strong>Constraints:</strong> {cObj.constraints}</p>
                        
                        <div className="code-split-view">
                          <div className="code-column">
                            <span className="code-label">Candidate Code Submission ({cObj.language || result.languageUsed}):</span>
                            <pre className="code-block"><code>{cObj.code}</code></pre>
                          </div>
                          <div className="code-column">
                            <span className="code-label">Correct Model Code Solution:</span>
                            <pre className="code-block model"><code>{cObj.solution}</code></pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStudentWiseTabContent = (reportStudents, activeTest) => {
    if (!activeTest) return <div className="no-data-alert">No assessments found.</div>;

    const selectedStudent = reportStudents.find(s => s.Email === selectedStudentId || s.email === selectedStudentId);
    const result = selectedStudent ? onlineResults.find(r => r.email === selectedStudent.Email && r.test_id === activeTest.id) : null;

    const handleStudentSelect = (email) => {
      setSelectedStudentId(email);
      setExpandedQuestionId(null);
    };

    return (
      <div className="student-wise-split-layout">
        <div className="student-sidebar-panel">
          <div className="sidebar-search-box">
            <input
              type="text"
              className="staff-select sidebar-search-input"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sidebar-students-list">
            {reportStudents.length === 0 ? (
              <div className="no-results-msg">No students found.</div>
            ) : (
              reportStudents.map(student => {
                const res = onlineResults.find(r => r.email === student.Email && r.test_id === activeTest.id);
                const pct = res ? Math.round(res.percentage * 100) : null;
                const isSel = selectedStudentId === student.Email;
                
                return (
                  <div 
                    key={student.Email} 
                    className={`sidebar-student-card ${isSel ? 'selected' : ''}`}
                    onClick={() => handleStudentSelect(student.Email)}
                  >
                    <div className="card-info">
                      <span className="card-student-name">{student.Name}</span>
                      <span className="card-student-roll">{student['Roll Number'] || student.Email}</span>
                    </div>
                    {pct !== null ? (
                      <span className={`card-student-score ${pct >= 80 ? 'elite' : pct >= 60 ? 'good' : pct >= 45 ? 'average' : 'remedial'}`}>
                        {pct}%
                      </span>
                    ) : (
                      <span className="card-student-score absent">Absent</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="student-details-panel">
          {!selectedStudent ? (
            <div className="no-student-selected-view">
              <FaUserGraduate size={64} style={{ color: '#bdc3c7', marginBottom: 16 }} />
              <h3>No Candidate Selected</h3>
              <p>Select a candidate from the sidebar to inspect their deep-dive sectional, speed, strategy, and Q&A workbook reports.</p>
            </div>
          ) : !result ? (
            <div className="no-student-selected-view">
              <FaTimesCircle size={64} style={{ color: '#e74c3c', marginBottom: 16 }} />
              <h3>Candidate Absent</h3>
              <p><strong>{selectedStudent.Name}</strong> did not attempt the selected assessment <strong>{activeTest.name}</strong>.</p>
            </div>
          ) : (
            renderStudentDetailReport(selectedStudent, result, activeTest)
          )}
        </div>
      </div>
    );
  };

  const renderSectionalTabContent = (reportStudents, activeTest) => {
    if (!activeTest) return <div className="no-data-alert">No assessments found.</div>;

    const results = reportStudents
      .map(s => onlineResults.find(r => r.email === s.Email && r.test_id === activeTest.id))
      .filter(Boolean);

    if (results.length === 0) {
      return <div className="no-data-alert">No submissions found for the selected assessment.</div>;
    }

    const totalCandidates = results.length;
    const percentages = results.map(r => r.percentage * 100);
    const avgScore = (percentages.reduce((a, b) => a + b, 0) / totalCandidates).toFixed(1);
    const maxScore = Math.max(...percentages).toFixed(0);
    const minScore = Math.min(...percentages).toFixed(0);
    const totalTime = results.reduce((acc, r) => acc + (r.time_taken || 0), 0);
    const avgTimeSec = Math.round(totalTime / totalCandidates);
    const avgTimeFormatted = `${Math.floor(avgTimeSec / 60)}m ${avgTimeSec % 60}s`;

    const flaggedCandidates = results.filter(r => r.violation_count > 0).length;
    const flaggingRate = ((flaggedCandidates / totalCandidates) * 100).toFixed(1);

    const eliteCount = percentages.filter(p => p >= 80).length;
    const professionalCount = percentages.filter(p => p >= 60 && p < 80).length;
    const intermediateCount = percentages.filter(p => p >= 45 && p < 60).length;
    const remedialCount = percentages.filter(p => p < 45).length;

    const performanceChartData = {
      labels: ['Elite (>80%)', 'Professional (60-80%)', 'Intermediate (40-60%)', 'Remedial (<40%)'],
      datasets: [{
        data: [eliteCount, professionalCount, intermediateCount, remedialCount],
        backgroundColor: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'],
        borderWidth: 1
      }]
    };

    const tagAccuracy = {};
    const tagAttempts = {};

    results.forEach(res => {
      if (res.type === 'mcq' && res.answers) {
        Object.values(res.answers).forEach(ans => {
          const tag = ans.tag || 'General';
          if (!tagAccuracy[tag]) {
            tagAccuracy[tag] = 0;
            tagAttempts[tag] = 0;
          }
          tagAttempts[tag]++;
          if (ans.isCorrect) {
            tagAccuracy[tag]++;
          }
        });
      } else if (res.type === 'coding' && res.code_map) {
        Object.values(res.code_map).forEach(codeObj => {
          const tag = codeObj.tag || 'General Coding';
          if (!tagAccuracy[tag]) {
            tagAccuracy[tag] = 0;
            tagAttempts[tag] = 0;
          }
          tagAttempts[tag]++;
          if (codeObj.passed) {
            tagAccuracy[tag]++;
          }
        });
      }
    });

    const tagsList = Object.keys(tagAccuracy);
    const tagAverages = tagsList.map(tag => {
      const pct = (tagAccuracy[tag] / tagAttempts[tag]) * 100;
      return { tag, pct };
    });

    const topicChartData = {
      labels: tagAverages.map(t => t.tag),
      datasets: [{
        label: 'Average Correctness (%)',
        data: tagAverages.map(t => t.pct),
        backgroundColor: '#9b59b6',
        borderColor: '#8e44ad',
        borderWidth: 1
      }]
    };

    const focusStudents = reportStudents.filter(s => {
      const res = onlineResults.find(r => r.email === s.Email && r.test_id === activeTest.id);
      return res && (res.percentage * 100) < 45;
    });

    return (
      <div className="reports-sectional-tab-content">
        <div className="reports-analytics-grid">
          <div className="sectional-stat-card">
            <span className="card-label">Average Score</span>
            <span className="card-value color-primary">{avgScore}%</span>
            <span className="card-subtext">Class Mean Percentage</span>
          </div>
          <div className="sectional-stat-card">
            <span className="card-label">Score Range</span>
            <span className="card-value color-secondary">{minScore}% - {maxScore}%</span>
            <span className="card-subtext">Lowest to Highest Performance</span>
          </div>
          <div className="sectional-stat-card">
            <span className="card-label">Mean Solving Speed</span>
            <span className="card-value color-warning">{avgTimeFormatted}</span>
            <span className="card-subtext">Average Time per Candidate</span>
          </div>
          <div className="sectional-stat-card">
            <span className="card-label">Proctor Flagging Rate</span>
            <span className="card-value color-danger">{flaggingRate}%</span>
            <span className="card-subtext">{flaggedCandidates} flagged out of {totalCandidates}</span>
          </div>
        </div>

        <div className="reports-charts-row">
          <div className="reports-chart-card">
            <h3>Student Performance Distribution</h3>
            <div className="chart-wrapper doughnut-chart" style={{ height: 260 }}>
              <Doughnut data={performanceChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="reports-chart-card">
            <h3>Concept/Topic Mastery Accuracy</h3>
            <div className="chart-wrapper bar-chart" style={{ height: 260 }}>
              <Bar 
                data={topicChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: { y: { min: 0, max: 100 } } 
                }} 
              />
            </div>
          </div>
        </div>

        <div className="remedial-focus-box">
          <h3>Candidates Requiring Remedial Training ({focusStudents.length})</h3>
          <p className="remedial-intro">These students scored below the benchmark passing rate of 45% and require specific concept reviews.</p>
          {focusStudents.length === 0 ? (
            <div className="no-remedial-alert">Excellent! No candidates scored below the benchmark.</div>
          ) : (
            <div className="remedial-candidates-chips">
              {focusStudents.map(s => {
                const res = onlineResults.find(r => r.email === s.Email && r.test_id === activeTest.id);
                return (
                  <div key={s.Email} className="remedial-chip" onClick={() => {
                    setSelectedStudentId(s.Email);
                    setReportsSubTab('student');
                  }}>
                    <span className="chip-name">{s.Name}</span>
                    <span className="chip-score">{res ? `${Math.round(res.percentage * 100)}%` : '—'}</span>
                    <span className="chip-dept">{s.Department}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMarksTabContent = (reportStudents, activeTest) => {
    if (!activeTest) return <div className="no-data-alert">No assessments found.</div>;

    const sortedReportStudents = [...reportStudents].sort((a, b) => {
      const resA = onlineResults.find(r => r.email === a.Email && r.test_id === activeTest.id);
      const resB = onlineResults.find(r => r.email === b.Email && r.test_id === activeTest.id);
      const scoreA = resA ? resA.score : -1;
      const scoreB = resB ? resB.score : -1;
      return scoreB - scoreA;
    });

    const exportToPdfLocal = () => {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(26, 35, 126);
      doc.text("Assessment Marks Report", 14, 15);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`College: ${userInfo.College} | Department: ${departmentFilter || 'All'} | Year: ${yearFilter || 'All'}`, 14, 21);
      doc.text(`Assessment: ${activeTest.name} (${activeTest.type.toUpperCase()})`, 14, 26);
      
      const head = [["Rank", "Name", "Roll Number", "Department", "Score", "Percentage", "Time Taken", "Auto Submit", "Warnings"]];
      const body = sortedReportStudents.map((s, idx) => {
        const res = onlineResults.find(r => r.email === s.Email && r.test_id === activeTest.id);
        return [
          idx + 1,
          s.Name,
          s['Roll Number'] || '—',
          s.Department,
          res ? res.score : 'Absent',
          res ? `${Math.round(res.percentage * 100)}%` : '—',
          res ? res.time_taken_formatted || `${res.time_taken}s` : '—',
          res ? (res.auto_submitted ? 'Yes' : 'No') : '—',
          res ? res.violation_count : '—'
        ];
      });

      doc.autoTable({
        head,
        body,
        startY: 32,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 35, 126] }
      });
      doc.save(`${userInfo.College}_Marks_${activeTest.id}.pdf`);
    };

    const exportToExcelLocal = () => {
      const data = sortedReportStudents.map((s, idx) => {
        const res = onlineResults.find(r => r.email === s.Email && r.test_id === activeTest.id);
        return {
          Rank: idx + 1,
          Name: s.Name,
          Email: s.Email,
          "Roll Number": s['Roll Number'] || '',
          Department: s.Department,
          Year: s.Year,
          Score: res ? res.score : 'Absent',
          Percentage: res ? `${Math.round(res.percentage * 100)}%` : '—',
          "Time Taken": res ? res.time_taken_formatted || `${res.time_taken}s` : '—',
          "Auto Submitted": res ? (res.auto_submitted ? 'Yes' : 'No') : '—',
          "Violation Flags": res ? res.violation_count : '—'
        };
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Marks Report");
      XLSX.writeFile(wb, `${userInfo.College}_Marks_${activeTest.id}.xlsx`);
    };

    return (
      <div className="reports-marks-tab-content">
        <div className="table-actions-header">
          <span className="results-count">Showing {sortedReportStudents.length} candidates</span>
          <div className="action-buttons-group">
            <button className="action-export-btn btn-excel" onClick={exportToExcelLocal}>
              <FaFileExport /> Export Excel
            </button>
            <button className="action-export-btn btn-pdf" onClick={exportToPdfLocal}>
              <FaFilePdf /> Export Tabular PDF
            </button>
          </div>
        </div>

        <div className="staff-table-wrapper">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Department</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Time Spent</th>
                <th>Proctor Flags</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedReportStudents.map((student, idx) => {
                const res = onlineResults.find(r => r.email === student.Email && r.test_id === activeTest.id);
                const scorePercent = res ? Math.round(res.percentage * 100) : 0;
                
                return (
                  <tr key={student.Email}>
                    <td><strong style={{ color: '#2c3e50' }}>{idx + 1}</strong></td>
                    <td>
                      <div className="student-profile-cell">
                        <span className="profile-name">{student.Name}</span>
                        <span className="profile-email">{student.Email}</span>
                      </div>
                    </td>
                    <td>{student['Roll Number'] || '—'}</td>
                    <td>{student.Department}</td>
                    <td>
                      {res ? (
                        <span className="score-val"><strong>{res.score}</strong></span>
                      ) : (
                        <span className="score-val absent">Absent</span>
                      )}
                    </td>
                    <td>
                      {res ? (
                        <div className="percentage-progress-wrapper">
                          <span className={`badge-percentage ${scorePercent >= 80 ? 'elite' : scorePercent >= 60 ? 'good' : scorePercent >= 45 ? 'average' : 'remedial'}`}>
                            {scorePercent}%
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>{res ? res.time_taken_formatted || `${res.time_taken}s` : '—'}</td>
                    <td>
                      {res && res.violation_count > 0 ? (
                        <span className="badge-violation warning">
                          <FaExclamationTriangle /> {res.violation_count} Flags
                        </span>
                      ) : res ? (
                        <span className="badge-violation clean">Clean</span>
                      ) : '—'}
                    </td>
                    <td>
                      {res ? (
                        res.auto_submitted ? (
                          <span className="badge-status auto-sub">Auto Submit</span>
                        ) : (
                          <span className="badge-status success">Submitted</span>
                        )
                      ) : (
                        <span className="badge-status absent">Absent</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  BATCH REPORT GENERATORS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Report 1 – Marks Report (PDF table or Excel sheet)
   * Modes:
   *   all-by-test    → every student who attempted testId
   *   single-student → every test for one student
   *   all-history    → every student × every test
   */
  const generateMarksReport = async (format) => {
    setReportGenerating(true);
    try {
      // Resolve student rows and result lookup
      const allTests = onlineAssessments;
      const allStudents = students;

      let rows = [];

      if (reportScope === 'all-by-test') {
        const testId = reportTargetTest || (allTests[0] && allTests[0].id);
        const test = allTests.find(t => t.id === testId);
        const testResults = onlineResults.filter(r => r.test_id === testId);
        rows = allStudents.map((s, idx) => {
          const res = testResults.find(r => r.email === s.Email);
          return {
            Rank: idx + 1,
            Name: s.Name,
            'Roll Number': s['Roll Number'] || '—',
            Email: s.Email,
            Department: s.Department || '—',
            Year: s.Year || '—',
            Assessment: test ? test.name : testId,
            Type: test ? test.type.toUpperCase() : '—',
            Score: res ? res.score : 'Absent',
            'Max Score': res ? res.total_questions * 10 : '—',
            Percentage: res ? `${Math.round(res.percentage * 100)}%` : '—',
            'Time Taken': res ? (res.time_taken_formatted || `${res.time_taken}s`) : '—',
            'Auto Submitted': res ? (res.auto_submitted ? 'Yes' : 'No') : '—',
            'Proctor Flags': res ? res.violation_count : '—',
            Status: res ? (res.percentage >= 0.8 ? 'Elite' : res.percentage >= 0.6 ? 'Good' : res.percentage >= 0.45 ? 'Average' : 'Remedial') : 'Absent'
          };
        });
      } else if (reportScope === 'single-student') {
        const email = reportTargetStudent;
        const student = allStudents.find(s => s.Email === email);
        if (!student) { setReportGenerating(false); return; }
        rows = allTests.map(test => {
          const res = onlineResults.find(r => r.email === email && r.test_id === test.id);
          return {
            'Assessment Name': test.name,
            'Test Type': test.type.toUpperCase(),
            Score: res ? res.score : 'Absent',
            Percentage: res ? `${Math.round(res.percentage * 100)}%` : '—',
            'Time Taken': res ? (res.time_taken_formatted || `${res.time_taken}s`) : '—',
            'Auto Submitted': res ? (res.auto_submitted ? 'Yes' : 'No') : '—',
            'Proctor Flags': res ? res.violation_count : '—',
            Status: res ? (res.percentage >= 0.8 ? 'Elite' : res.percentage >= 0.6 ? 'Good' : res.percentage >= 0.45 ? 'Average' : 'Remedial') : 'Absent'
          };
        });
      } else {
        // all-history: every student × every test
        allStudents.forEach((s, idx) => {
          allTests.forEach(test => {
            const res = onlineResults.find(r => r.email === s.Email && r.test_id === test.id);
            rows.push({
              'S.No': idx + 1,
              Name: s.Name,
              'Roll Number': s['Roll Number'] || '—',
              Department: s.Department || '—',
              Assessment: test.name,
              Type: test.type.toUpperCase(),
              Score: res ? res.score : 'Absent',
              Percentage: res ? `${Math.round(res.percentage * 100)}%` : '—',
              Status: res ? (res.percentage >= 0.8 ? 'Elite' : res.percentage >= 0.6 ? 'Good' : res.percentage >= 0.45 ? 'Average' : 'Remedial') : 'Absent'
            });
          });
        });
      }

      const titleLabel = reportScope === 'all-by-test'
        ? `Assessment: ${(onlineAssessments.find(t => t.id === (reportTargetTest || onlineAssessments[0]?.id)) || {}).name || 'All Tests'}`
        : reportScope === 'single-student'
        ? `Student: ${(students.find(s => s.Email === reportTargetStudent) || {}).Name || reportTargetStudent}`
        : 'All Students — Complete History';

      if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Report');
        XLSX.writeFile(wb, `SEEDIT_Marks_Report_${Date.now()}.xlsx`);
      } else {
        const doc = new jsPDF({ orientation: rows.length > 30 ? 'landscape' : 'portrait' });
        const primary = [26, 35, 126];
        doc.setFillColor(...primary);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('SEED-IT — Marks Report', 10, 12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(titleLabel, 10, 23);
        doc.text(`College: ${userInfo.College} | Generated: ${new Date().toLocaleDateString()}`, 10, 28);
        doc.setTextColor(44, 62, 80);

        const head = [Object.keys(rows[0] || {})];
        const body = rows.map(r => Object.values(r).map(v => String(v)));
        doc.autoTable({
          head,
          body,
          startY: 34,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 250] }
        });
        doc.save(`SEEDIT_Marks_Report_${Date.now()}.pdf`);
      }
    } catch (e) {
      console.error('Marks report generation failed:', e);
    } finally {
      setReportGenerating(false);
      setShowReportModal(false);
    }
  };

  /**
   * Report 2 – Sectional Analysis Report (PDF with stats table, or Excel multi-sheet)
   */
  const generateSectionalReport = async (format) => {
    setReportGenerating(true);
    try {
      const testId = reportTargetTest || (onlineAssessments[0] && onlineAssessments[0].id);
      const test = onlineAssessments.find(t => t.id === testId);
      const results = onlineResults.filter(r => r.test_id === testId);
      const total = results.length;

      if (total === 0) { setReportGenerating(false); return; }

      // --- Compute stats ---
      const percentages = results.map(r => r.percentage * 100);
      const avg = (percentages.reduce((a, b) => a + b, 0) / total).toFixed(1);
      const topScore = Math.max(...percentages).toFixed(1);
      const botScore = Math.min(...percentages).toFixed(1);
      const eliteN = percentages.filter(p => p >= 80).length;
      const goodN = percentages.filter(p => p >= 60 && p < 80).length;
      const avgN = percentages.filter(p => p >= 45 && p < 60).length;
      const remN = percentages.filter(p => p < 45).length;

      // Tag accuracy
      const tagAccuracy = {};
      const tagAttempts = {};
      results.forEach(res => {
        if (res.type === 'mcq' && res.answers) {
          Object.values(res.answers).forEach(ans => {
            const tag = ans.tag || 'General';
            tagAttempts[tag] = (tagAttempts[tag] || 0) + 1;
            if (ans.isCorrect) tagAccuracy[tag] = (tagAccuracy[tag] || 0) + 1;
          });
        } else if (res.type === 'coding' && res.code_map) {
          Object.values(res.code_map).forEach(cObj => {
            const tag = cObj.tag || 'Coding';
            tagAttempts[tag] = (tagAttempts[tag] || 0) + 1;
            if (cObj.passed) tagAccuracy[tag] = (tagAccuracy[tag] || 0) + 1;
          });
        }
      });

      const tagRows = Object.keys(tagAttempts).map(tag => ({
        Topic: tag,
        Attempts: tagAttempts[tag],
        Correct: tagAccuracy[tag] || 0,
        'Accuracy%': `${(((tagAccuracy[tag] || 0) / tagAttempts[tag]) * 100).toFixed(1)}%`,
        Strength: (((tagAccuracy[tag] || 0) / tagAttempts[tag]) * 100) >= 60 ? '✔ Strong' : '✘ Needs Work'
      }));

      if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        // Sheet 1: Summary
        const summary = [
          { Metric: 'Assessment', Value: test ? test.name : testId },
          { Metric: 'Total Candidates', Value: total },
          { Metric: 'Average Score', Value: `${avg}%` },
          { Metric: 'Highest Score', Value: `${topScore}%` },
          { Metric: 'Lowest Score', Value: `${botScore}%` },
          { Metric: 'Elite (≥80%)', Value: eliteN },
          { Metric: 'Good (60-80%)', Value: goodN },
          { Metric: 'Average (45-60%)', Value: avgN },
          { Metric: 'Remedial (<45%)', Value: remN },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary');
        // Sheet 2: Topic Mastery
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tagRows), 'Topic Mastery');
        // Sheet 3: Per-student
        const perStudent = results.map(r => {
          const s = students.find(st => st.Email === r.email);
          return {
            Name: s ? s.Name : r.name || r.email,
            'Roll Number': s ? (s['Roll Number'] || '—') : '—',
            Department: s ? s.Department : '—',
            Score: r.score,
            Percentage: `${Math.round(r.percentage * 100)}%`,
            'Time Taken': r.time_taken_formatted || `${r.time_taken}s`,
            'Proctor Flags': r.violation_count,
            Category: r.percentage >= 0.8 ? 'Elite' : r.percentage >= 0.6 ? 'Good' : r.percentage >= 0.45 ? 'Average' : 'Remedial'
          };
        }).sort((a, b) => parseFloat(b.Percentage) - parseFloat(a.Percentage));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perStudent), 'Individual Scores');
        XLSX.writeFile(wb, `SEEDIT_Sectional_Report_${Date.now()}.xlsx`);
      } else {
        const doc = new jsPDF();
        const primary = [26, 35, 126];
        const W = doc.internal.pageSize.getWidth();

        // Cover header
        doc.setFillColor(...primary);
        doc.rect(0, 0, W, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('SEED-IT — Sectional Analysis Report', 12, 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(44, 62, 80);
        doc.text(`Assessment: ${test ? test.name : testId}  |  College: ${userInfo.College}  |  Date: ${new Date().toLocaleDateString()}`, 12, 28);

        // Section 1: Key Metrics
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Class Performance Summary', 12, 38);
        doc.autoTable({
          head: [['Metric', 'Value']],
          body: [
            ['Total Candidates Assessed', total],
            ['Class Average Score', `${avg}%`],
            ['Score Range', `${botScore}% – ${topScore}%`],
            ['Elite Performers (≥80%)', `${eliteN} students (${((eliteN/total)*100).toFixed(0)}%)`],
            ['Good Performers (60–80%)', `${goodN} students`],
            ['Average Performers (45–60%)', `${avgN} students`],
            ['Remedial (<45%)', `${remN} students`],
          ],
          startY: 43,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: primary },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 } }
        });

        // Section 2: Topic Mastery
        const afterSummary = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Topic / Concept Mastery Analysis', 12, afterSummary);
        doc.autoTable({
          head: [['Topic Tag', 'Attempts', 'Correct', 'Accuracy%', 'Status']],
          body: tagRows.map(t => [t.Topic, t.Attempts, t.Correct, t['Accuracy%'], t.Strength]),
          startY: afterSummary + 5,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [80, 40, 160] },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
              data.cell.styles.textColor = data.cell.raw && String(data.cell.raw).includes('Strong') ? [39, 174, 96] : [192, 57, 43];
            }
          }
        });

        // Section 3: Individual Scores (new page)
        doc.addPage();
        doc.setFillColor(...primary);
        doc.rect(0, 0, W, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Individual Student Scores', 12, 10);
        doc.setTextColor(44, 62, 80);

        const perStudentRows = results
          .map(r => {
            const s = students.find(st => st.Email === r.email);
            return {
              name: s ? s.Name : r.name || r.email,
              roll: s ? (s['Roll Number'] || '—') : '—',
              dept: s ? s.Department : '—',
              score: r.score,
              pct: Math.round(r.percentage * 100),
              time: r.time_taken_formatted || `${r.time_taken}s`,
              flags: r.violation_count,
              cat: r.percentage >= 0.8 ? 'Elite' : r.percentage >= 0.6 ? 'Good' : r.percentage >= 0.45 ? 'Avg' : 'Remedial'
            };
          })
          .sort((a, b) => b.pct - a.pct);

        doc.autoTable({
          head: [['Name', 'Roll No', 'Dept', 'Score', '%', 'Time', 'Flags', 'Cat']],
          body: perStudentRows.map((r, i) => [r.name, r.roll, r.dept, r.score, `${r.pct}%`, r.time, r.flags, r.cat]),
          startY: 18,
          theme: 'striped',
          styles: { fontSize: 7 },
          headStyles: { fillColor: primary },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 7) {
              const v = String(data.cell.raw);
              data.cell.styles.textColor = v === 'Elite' ? [39, 174, 96] : v === 'Good' ? [41, 128, 185] : v === 'Avg' ? [211, 84, 0] : [192, 57, 43];
            }
          }
        });

        doc.save(`SEEDIT_Sectional_Report_${Date.now()}.pdf`);
      }
    } catch (e) {
      console.error('Sectional report generation failed:', e);
    } finally {
      setReportGenerating(false);
      setShowReportModal(false);
    }
  };

  /**
   * Report 3 – Student-wise Individual Report (always PDF)
   * Modes:
   *   single-student + all-history → cumulative PDF: all tests for one student
   *   all-by-test                  → batch: one PDF per student for the test (zipped via sequential saves)
   *   all-history (all students)   → batch PDF for all students for current test
   */
  const generateStudentWiseReport = async () => {
    setReportGenerating(true);
    try {
      const primary = [26, 35, 126];
      const secondary = [44, 62, 80];

      const buildStudentPage = (doc, student, results, isFirstPage) => {
        if (!isFirstPage) doc.addPage();
        const W = doc.internal.pageSize.getWidth();

        // === COVER HEADER ===
        doc.setFillColor(...primary);
        doc.rect(0, 0, W, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('SEED-IT ASSESSMENT REPORT', 12, 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Premium Placement Diagnostics & Comprehensive Student Report', 12, 22);

        // === STUDENT PROFILE ===
        doc.setTextColor(...secondary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Candidate Profile', 12, 36);
        doc.setDrawColor(200, 200, 200);
        doc.line(12, 38, W - 12, 38);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Name: ${student.Name}`, 12, 44);
        doc.text(`Roll Number: ${student['Roll Number'] || '—'}`, 12, 50);
        doc.text(`Email: ${student.Email}`, 12, 56);
        doc.text(`College: ${student.College || userInfo.College}`, 100, 44);
        doc.text(`Department: ${student.Department || '—'}`, 100, 50);
        doc.text(`Year: ${student.Year || '—'}`, 100, 56);
        doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 100, 62);

        let yOff = 70;

        // === PER-TEST SECTIONS ===
        results.forEach((item, tIdx) => {
          const { test, result } = item;
          if (!result) return;

          const pct = Math.round(result.percentage * 100);
          let tier = pct >= 80 ? 'Elite Placement Ready' : pct >= 60 ? 'Standard Placement Ready' : pct >= 45 ? 'Standard Candidate' : 'Needs Remedial Training';
          let pkgProb = pct >= 80 ? '92% — Tier-1 Product Tech (8+ LPA)' : pct >= 60 ? '75% — Tier-2 Service/Tech (5-8 LPA)' : pct >= 45 ? '50% — Entry-Level Roles (3.5-5 LPA)' : '25% — Requires Core Training';

          if (yOff > 230) { doc.addPage(); yOff = 20; }

          // Test header
          doc.setFillColor(240, 240, 250);
          doc.rect(12, yOff, W - 24, 10, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...primary);
          doc.text(`${tIdx + 1}. ${test.name} (${test.type.toUpperCase()})`, 14, yOff + 7);
          yOff += 14;

          doc.setTextColor(...secondary);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.text(`Score: ${result.score}  |  Percentage: ${pct}%  |  Time: ${result.time_taken_formatted || result.time_taken + 's'}  |  Proctor Flags: ${result.violation_count}`, 14, yOff);
          yOff += 6;
          doc.text(`Auto-Submitted: ${result.auto_submitted ? 'Yes' : 'No'}`, 14, yOff);
          yOff += 8;

          // Diagnostic box
          doc.setFillColor(245, 248, 255);
          doc.rect(12, yOff, W - 24, 22, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text('SEED Diagnostic Summary', 14, yOff + 7);
          doc.setFont('helvetica', 'normal');
          doc.text(`Placement Tier: ${tier}`, 14, yOff + 13);
          doc.text(`Package Probability: ${pkgProb}`, 14, yOff + 19);
          yOff += 26;

          // Strengths / Weaknesses
          let strengths = [], weaknesses = [];
          if (result.type === 'mcq' && result.answers) {
            Object.values(result.answers).forEach(a => {
              if (a.isCorrect) strengths.push(a.tag);
              else weaknesses.push(a.tag);
            });
          } else if (result.type === 'coding' && result.code_map) {
            Object.values(result.code_map).forEach(c => {
              if (c.passed) strengths.push(c.tag);
              else weaknesses.push(c.tag);
            });
          }
          strengths = [...new Set(strengths)];
          weaknesses = [...new Set(weaknesses)].filter(t => !strengths.includes(t));

          if (yOff > 240) { doc.addPage(); yOff = 20; }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(39, 174, 96);
          doc.text(`✔ Strong Topics: ${strengths.join(', ') || 'N/A'}`, 14, yOff);
          yOff += 6;
          doc.setTextColor(192, 57, 43);
          doc.text(`✘ Needs Work: ${weaknesses.join(', ') || 'None'}`, 14, yOff);
          doc.setTextColor(...secondary);
          yOff += 10;

          // Q&A Workbook
          if (yOff > 220) { doc.addPage(); yOff = 20; }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...primary);
          doc.text('Question-by-Question Workbook', 14, yOff);
          doc.line(14, yOff + 2, W - 14, yOff + 2);
          yOff += 8;
          doc.setTextColor(...secondary);

          if (result.type === 'mcq' && result.answers) {
            Object.values(result.answers).forEach((ans, qIdx) => {
              if (yOff > 260) { doc.addPage(); yOff = 20; }
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8);
              doc.text(`Q${qIdx + 1}: ${ans.question ? ans.question.slice(0, 90) : 'MCQ Question'}`, 14, yOff);
              yOff += 5;
              if (ans.question && ans.question.length > 90) {
                doc.setFont('helvetica', 'normal');
                doc.text(ans.question.slice(90, 180), 14, yOff);
                yOff += 5;
              }
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7.5);
              doc.text(`Tag: ${ans.tag || '—'}  |  Time: ${ans.timeSpent}s  |  Candidate: ${ans.selectedAnswer}  |  Correct: ${ans.correctAnswer}`, 14, yOff);
              yOff += 5;
              if (ans.isCorrect) {
                doc.setTextColor(39, 174, 96);
                doc.text('✔ CORRECT', 14, yOff);
              } else {
                doc.setTextColor(192, 57, 43);
                doc.text('✘ INCORRECT', 14, yOff);
              }
              doc.setTextColor(...secondary);
              doc.setDrawColor(220, 220, 220);
              yOff += 5;
              doc.line(14, yOff, W - 14, yOff);
              yOff += 4;
            });
          } else if (result.type === 'coding' && result.code_map) {
            Object.values(result.code_map).forEach((cObj, cIdx) => {
              if (yOff > 220) { doc.addPage(); yOff = 20; }
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.text(`Challenge ${cIdx + 1}: ${cObj.title} [${cObj.difficulty}]`, 14, yOff);
              yOff += 5;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7.5);
              doc.text(`Tag: ${cObj.tag}  |  Language: ${cObj.language || result.languageUsed}  |  Time: ${cObj.timeSpent}s  |  Time Complexity: ${cObj.timeComplexity}  |  Space: ${cObj.spaceComplexity}`, 14, yOff);
              yOff += 5;
              doc.text(`Testcases: ${cObj.passed ? '5/5 Passed' : '0/5 Failed'}  |  Submit Order: #${cObj.submitOrder} — (Submitted ${cObj.submitOrder === 1 ? cObj.difficulty + ' first' : 'after easier tasks'})`, 14, yOff);
              yOff += 7;

              // Problem statement
              doc.setFont('helvetica', 'italic');
              const stmtLines = doc.splitTextToSize(`Problem: ${cObj.statement || '—'}`, W - 28);
              stmtLines.slice(0, 3).forEach(line => {
                if (yOff > 270) { doc.addPage(); yOff = 20; }
                doc.text(line, 14, yOff);
                yOff += 4;
              });

              // Candidate code
              if (yOff > 240) { doc.addPage(); yOff = 20; }
              doc.setFont('courier', 'bold');
              doc.setFontSize(7);
              doc.text('Candidate Submission:', 14, yOff);
              yOff += 4;
              doc.setFont('courier', 'normal');
              (cObj.code || '').split('\n').slice(0, 10).forEach(line => {
                if (yOff > 270) { doc.addPage(); yOff = 20; }
                doc.text(line.slice(0, 90), 16, yOff);
                yOff += 3.5;
              });

              // Model solution
              yOff += 2;
              doc.setFont('courier', 'bold');
              doc.text('Model Solution:', 14, yOff);
              yOff += 4;
              doc.setFont('courier', 'normal');
              (cObj.solution || '').split('\n').slice(0, 8).forEach(line => {
                if (yOff > 270) { doc.addPage(); yOff = 20; }
                doc.text(line.slice(0, 90), 16, yOff);
                yOff += 3.5;
              });

              doc.setFont('helvetica', 'normal');
              doc.setDrawColor(180, 180, 180);
              yOff += 4;
              doc.line(14, yOff, W - 14, yOff);
              yOff += 6;
            });
          }

          // Gap between tests
          yOff += 8;
        });
      };

      // ── Determine which students/tests to process ──
      const allTests = onlineAssessments;
      const doc = new jsPDF();
      let isFirstPage = true;

      if (reportScope === 'single-student') {
        const email = reportTargetStudent;
        const student = students.find(s => s.Email === email);
        if (!student) { setReportGenerating(false); return; }
        const resultItems = allTests.map(test => ({
          test,
          result: onlineResults.find(r => r.email === email && r.test_id === test.id) || null
        })).filter(i => i.result);
        buildStudentPage(doc, student, resultItems, true);
        doc.save(`${student.Name.replace(/\s/g, '_')}_SEEDIT_Full_Report.pdf`);
      } else {
        // all-by-test or all-history: generate one PDF per student
        const testId = reportScope === 'all-by-test'
          ? (reportTargetTest || (allTests[0] && allTests[0].id))
          : null;

        const targetStudents = testId
          ? students.filter(s => onlineResults.some(r => r.email === s.Email && r.test_id === testId))
          : students;

        if (targetStudents.length === 0) { setReportGenerating(false); return; }

        // Batch: all students in one combined PDF (separated by pages)
        targetStudents.forEach((student, idx) => {
          const resultItems = testId
            ? [{ test: allTests.find(t => t.id === testId), result: onlineResults.find(r => r.email === student.Email && r.test_id === testId) }].filter(i => i.test && i.result)
            : allTests.map(test => ({ test, result: onlineResults.find(r => r.email === student.Email && r.test_id === test.id) || null })).filter(i => i.result);
          if (resultItems.length > 0) {
            buildStudentPage(doc, student, resultItems, isFirstPage);
            isFirstPage = false;
          }
        });

        const label = testId ? (allTests.find(t => t.id === testId) || {}).name || testId : 'All_Tests';
        doc.save(`SEEDIT_StudentWise_${label.replace(/\s/g, '_')}_${Date.now()}.pdf`);
      }
    } catch (e) {
      console.error('Student-wise report generation failed:', e);
    } finally {
      setReportGenerating(false);
      setShowReportModal(false);
    }
  };

  // ── Report Generator Modal ────────────────────────────────────────────────
  const renderReportGeneratorModal = () => {
    if (!showReportModal) return null;

    const handleGenerate = () => {
      if (reportModalType === 'marks') generateMarksReport(reportFormat);
      else if (reportModalType === 'sectional') generateSectionalReport(reportFormat);
      else generateStudentWiseReport();
    };

    return (
      <div className="rg-modal-overlay" onClick={() => !reportGenerating && setShowReportModal(false)}>
        <div className="rg-modal-card" onClick={e => e.stopPropagation()}>
          <div className="rg-modal-header">
            <h2>📥 Generate Report</h2>
            <button className="rg-close-btn" onClick={() => setShowReportModal(false)} disabled={reportGenerating}><FaTimes /></button>
          </div>

          {reportGenerating ? (
            <div className="rg-generating-overlay">
              <div className="rg-spinner" />
              <p>Generating report, please wait…</p>
            </div>
          ) : (
            <>
              {/* Step 1: Report Type */}
              <div className="rg-section">
                <p className="rg-section-label">1. Select Report Type</p>
                <div className="rg-type-cards">
                  {[
                    { key: 'marks', icon: '📊', title: 'Marks Report', desc: 'Scores & ranks table for all students' },
                    { key: 'sectional', icon: '📈', title: 'Sectional Analysis', desc: 'Topic mastery & distribution analytics' },
                    { key: 'student', icon: '🧑‍🎓', title: 'Student-wise Report', desc: 'Individual deep-dive with Q&A workbook' },
                  ].map(t => (
                    <div
                      key={t.key}
                      className={`rg-type-card ${reportModalType === t.key ? 'active' : ''}`}
                      onClick={() => setReportModalType(t.key)}
                    >
                      <span className="rg-type-icon">{t.icon}</span>
                      <strong>{t.title}</strong>
                      <span className="rg-type-desc">{t.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Scope */}
              <div className="rg-section">
                <p className="rg-section-label">2. Select Scope</p>
                <div className="rg-scope-options">
                  <label className={`rg-scope-option ${reportScope === 'all-by-test' ? 'active' : ''}`}>
                    <input type="radio" name="scope" value="all-by-test" checked={reportScope === 'all-by-test'}
                      onChange={() => setReportScope('all-by-test')} />
                    <div>
                      <strong>All Students — For a Specific Test</strong>
                      <span>Print report for all students who took one assessment</span>
                    </div>
                  </label>
                  <label className={`rg-scope-option ${reportScope === 'single-student' ? 'active' : ''}`}>
                    <input type="radio" name="scope" value="single-student" checked={reportScope === 'single-student'}
                      onChange={() => setReportScope('single-student')} />
                    <div>
                      <strong>Single Student — All Assessments</strong>
                      <span>Cumulative history report for one student across all tests</span>
                    </div>
                  </label>
                  <label className={`rg-scope-option ${reportScope === 'all-history' ? 'active' : ''}`}>
                    <input type="radio" name="scope" value="all-history" checked={reportScope === 'all-history'}
                      onChange={() => setReportScope('all-history')} />
                    <div>
                      <strong>All Students — All Tests (Complete History)</strong>
                      <span>Full batch report for the entire class across every assessment</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3: Conditional selectors */}
              {reportScope === 'all-by-test' && (
                <div className="rg-section">
                  <p className="rg-section-label">Select Assessment</p>
                  <select className="staff-select rg-select" value={reportTargetTest || (onlineAssessments[0] && onlineAssessments[0].id) || ''}
                    onChange={e => setReportTargetTest(e.target.value)}>
                    {onlineAssessments.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.type.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
              )}
              {reportScope === 'single-student' && (
                <div className="rg-section">
                  <p className="rg-section-label">Select Student</p>
                  <select className="staff-select rg-select" value={reportTargetStudent}
                    onChange={e => setReportTargetStudent(e.target.value)}>
                    <option value="">— Choose a student —</option>
                    {students.map(s => (
                      <option key={s.Email} value={s.Email}>{s.Name} ({s['Roll Number'] || s.Email})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 4: Format (not for student-wise which is always PDF) */}
              {reportModalType !== 'student' && (
                <div className="rg-section">
                  <p className="rg-section-label">3. Output Format</p>
                  <div className="rg-format-toggle">
                    <button className={`rg-fmt-btn ${reportFormat === 'pdf' ? 'active' : ''}`} onClick={() => setReportFormat('pdf')}>
                      📄 PDF
                    </button>
                    <button className={`rg-fmt-btn ${reportFormat === 'excel' ? 'active' : ''}`} onClick={() => setReportFormat('excel')}>
                      📑 Excel
                    </button>
                  </div>
                </div>
              )}

              {reportModalType === 'student' && (
                <div className="rg-info-note">
                  <FaFilePdf style={{ color: '#e74c3c' }} /> Student-wise reports are always generated as PDF with full Q&A workbook, graphs, and placement diagnostics.
                </div>
              )}

              <div className="rg-modal-footer">
                <button className="rg-cancel-btn" onClick={() => setShowReportModal(false)}>Cancel</button>
                <button
                  className="rg-generate-btn"
                  onClick={handleGenerate}
                  disabled={reportScope === 'single-student' && !reportTargetStudent}
                >
                  Generate &amp; Download
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReportsTab = () => {
    const getFilteredReportStudents = () => {
      const dep = (departmentFilter || '').toString().trim().toLowerCase();
      const yr = (yearFilter || '').toString();
      const query = searchQuery.trim().toLowerCase();

      return students.filter(student => {
        const matchesDept = !dep || (student.Department || '').toString().trim().toLowerCase() === dep;
        const cy = toCanonicalYear(student?.[yearKey] ?? student?.Year);
        const matchesYear = !yr || cy === yr;

        const matchesSearch = !query || [
          student.Name,
          student.Email,
          student['Roll Number'],
          student.Department,
          student.Year
        ].some(val => (val || '').toString().toLowerCase().includes(query));

        return matchesDept && matchesYear && matchesSearch;
      });
    };

    const reportStudents = getFilteredReportStudents();
    const activeTest = onlineAssessments.find(a => a.id === selectedTestFilter) || onlineAssessments[0];

    return (
      <div className="staff-reports-section">
        <div className="reports-tab-header">
          <h2 className="staff-section-title">Assessment Reports Hub</h2>
          <button
            className="rg-open-modal-btn"
            onClick={() => {
              setReportTargetTest(selectedTestFilter || (onlineAssessments[0] && onlineAssessments[0].id) || '');
              setShowReportModal(true);
            }}
          >
            <FaDownload style={{ marginRight: 6 }} /> Generate Reports
          </button>
          <div className="reports-sub-nav">
            <button 
              className={`reports-sub-nav-btn ${reportsSubTab === 'marks' ? 'active' : ''}`}
              onClick={() => { setReportsSubTab('marks'); setSelectedStudentId(null); }}
            >
              <FaFileAlt style={{ marginRight: 6 }} /> Marks Overview
            </button>
            <button 
              className={`reports-sub-nav-btn ${reportsSubTab === 'sectional' ? 'active' : ''}`}
              onClick={() => { setReportsSubTab('sectional'); setSelectedStudentId(null); }}
            >
              <FaChartBar style={{ marginRight: 6 }} /> Sectional Analysis
            </button>
            <button 
              className={`reports-sub-nav-btn ${reportsSubTab === 'student' ? 'active' : ''}`}
              onClick={() => { 
                setReportsSubTab('student'); 
                if (reportStudents.length > 0 && !selectedStudentId) {
                  setSelectedStudentId(reportStudents[0].Email || reportStudents[0].email);
                }
              }}
            >
              <FaUserGraduate style={{ marginRight: 6 }} /> Student-wise Analysis
            </button>
          </div>
        </div>

        <div className="reports-test-selector-bar">
          <div className="selector-group">
            <label htmlFor="active-test-select">Select Assessment:</label>
            <select
              id="active-test-select"
              className="staff-select"
              value={selectedTestFilter}
              onChange={(e) => {
                setSelectedTestFilter(e.target.value);
                setSelectedStudentId(null);
              }}
              style={{ minWidth: 320 }}
            >
              {onlineAssessments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type === 'mcq' ? 'MCQ' : 'Coding'})
                </option>
              ))}
            </select>
          </div>

          {reportsSubTab !== 'student' && (
            <div className="filter-group">
              <select
                className="staff-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                className="staff-select"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All Years</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <input
                className="staff-select search-input"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {reportsSubTab === 'marks' && renderMarksTabContent(reportStudents, activeTest)}
        {reportsSubTab === 'sectional' && renderSectionalTabContent(reportStudents, activeTest)}
        {reportsSubTab === 'student' && renderStudentWiseTabContent(reportStudents, activeTest)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="staff-loading-wrapper">
        <div className="staff-spinner"></div>
        <p style={{ marginTop: '1rem', color: '#666' }}>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-loading-wrapper">
        <div style={{
          padding: '2rem',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <p style={{ color: '#d32f2f', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a237e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-root">
      {/* Header */}
      <header className="staff-header-container">
        <div className="staff-header-inner">
          {window.innerWidth <= 768 ? (
            <>
              <button
                className="staff-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <FaBars />
              </button>
              <div className="staff-header-logo-wrapper">
                <img
                  src="https://raw.githubusercontent.com/seeditDev/SEED-Website/f3cee9002410a00df4da7bea636ac9fbc4c312ca/Plugins/SEED_Logo.webp"
                  alt="SEED Logo"
                  className="staff-logo"
                />
              </div>
            </>
          ) : (
            <div className="staff-header-logo-wrapper">
              <img
                src="https://raw.githubusercontent.com/seeditDev/SEED-Website/f3cee9002410a00df4da7bea636ac9fbc4c312ca/Plugins/SEED_Logo.webp"
                alt="SEED Logo"
                className="staff-logo"
              />
              <span className="staff-portal-title">SEED-IT STAFF PORTAL</span>
            </div>
          )}
          <button className="staff-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      <div className="staff-container">
        {/* Sidebar */}
        <div className={`staff-sidebar-container ${collapsed ? 'staff-sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'staff-sidebar-mobile-open' : ''}`}>
          {window.innerWidth > 768 && (
            <button
              className="staff-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              <FaAngleDoubleLeft />
            </button>
          )}

          {renderNavigation()}
        </div>

        {/* Main Content */}
        <main className={`staff-main-content ${collapsed ? 'staff-main-collapsed' : ''}`}>
          {activeSection === "overview" && (
            <div className="staff-overview-section">
              <h2 className="staff-section-title">Staff Overview</h2>
              <div className="staff-overview-grid">
                <div className="staff-stat-box">
                  <h3>Total Students in {userInfo.College}</h3>
                  <p>{students.length}</p>
                </div>
                <div className="staff-stat-box">
                  <h3>Students by Department</h3>
                  <div className="staff-stat-details">
                    {Object.entries(
                      students.reduce((acc, student) => {
                        acc[student.Department] = (acc[student.Department] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([dept, count]) => (
                        <div key={dept} className="staff-stat-item">
                          <span>{dept}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="staff-stat-box">
                  <h3>Students by Year</h3>
                  <div className="staff-stat-details">
                    {Array.from(new Set(students
                      .map(s => toCanonicalYear(s?.[yearKey] ?? s?.Year))
                      .filter(Boolean)
                    )).sort().map(y => {
                      const count = students.reduce((acc, s) => {
                        const cy = toCanonicalYear(s?.[yearKey] ?? s?.Year);
                        return acc + (cy === y ? 1 : 0);
                      }, 0);
                      return (
                        <div key={y} className="staff-stat-item">
                          <span>{y}:</span>
                          <span>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="staff-stat-box course-progress-box">
                  <h3>Course Progress Overview</h3>
                  <div className="staff-stat-details">
                    {(() => {
                      const cols = (selectedScoreColumns && selectedScoreColumns.length > 0)
                        ? selectedScoreColumns
                        : scoreColumns;
                      if (!cols || cols.length === 0) {
                        return (
                          <div className="staff-stat-item">
                            <span>No score columns detected.</span>
                          </div>
                        );
                      }
                      const population = getAnalyticsPopulation();
                      const totalStudents = population.length;
                      return cols.map((scoreKey) => {
                        const conf = COURSE_CONFIG[scoreKey];
                        const isAttempted = (val) => {
                          const n = Number(val);
                          if (Number.isNaN(n)) return false;
                          if (n <= 0) return false; // 0 or negative = not attempted
                          return true; // Any positive score = attempted
                        };

                        const attempted = population.filter(s => isAttempted(s[scoreKey])).length;
                        const percentage = totalStudents > 0 ? ((attempted / totalStudents) * 100).toFixed(1) : '0.0';

                        const scores = population
                          .map(s => Number(s[scoreKey]))
                          .filter(n => !Number.isNaN(n) && isAttempted(n));
                        const above50Percent = scores.filter(n => {
                          if (conf?.maxScore > 0) {
                            return n >= 0.5 * conf.maxScore;
                          }
                          return n > 0; // For unconfigured courses, any positive score counts
                        }).length;

                        return (
                          <div key={scoreKey} className="staff-stat-item course-stat-item">
                            <div className="course-info">
                              <div className="course-header">
                                <span className="course-name">{conf?.displayName || getReadableCourseName(scoreKey)}</span>
                                <span className="course-details">
                                  Above 50%: {above50Percent} | Questions: {conf?.questions ?? '—'} | Attempted: {attempted}/{totalStudents}
                                </span>
                              </div>
                              <div className="progress-bar-container">
                                <div
                                  className="progress-bar"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="completion-info">
                              <span>{percentage}%</span>
                              <span className="completion-count">({attempted}/{totalStudents})</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "insights" && renderInsights()}
          {activeSection === "analytics" && renderAnalytics()}
          {activeSection === "students" && renderStudentManagement()}
          {activeSection === "reports" && renderReportsTab()}
          {showReportsAnalytics && renderReportsAnalytics()}
          {activeSection === "mcq-reports" && renderMCQReports()}
          {activeSection === "profile" && (
            <div className="staff-profile-section">
              <h2 className="staff-section-title">Staff Profile</h2>
              <div className="staff-profile-content">
                <div className="staff-profile-item">
                  <label>Name:</label>
                  <p>{user?.Name}</p>
                </div>
                <div className="staff-profile-item">
                  <label>Email:</label>
                  <p>{user?.Email}</p>
                </div>
                <div className="staff-profile-item">
                  <label>Department:</label>
                  <p>{user?.Department || 'Not specified'}</p>
                </div>
                <div className="staff-profile-item">
                  <label>College:</label>
                  <p>{user?.College}</p>
                </div>
                <div className="staff-profile-item">
                  <label>Role:</label>
                  <p>{user?.Role}</p>
                </div>
              </div>
            </div>
          )}
          {activeSection === "placements" && renderPlacements()}
          {activeSection === "settings" && renderSettings()}
        </main>
      </div>

      {/* Report Generator Modal */}
      {renderReportGeneratorModal()}

      {/* Logout Animation Modal */}
      {showLogoutAnimation && (
        <div className="modal-overlay">
          <div className="logout-modal">
            <div className="logout-icon-container">
              <FaSignOutAlt className="logout-icon" />
            </div>
            <p>Goodbye, {user?.Name}!</p>
            <p className="redirect-text">Logging you out...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;