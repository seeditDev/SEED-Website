import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TestCreator from './TestCreator';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Grid, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Divider, Stack, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tabs, Tab, Chip, Tooltip, ThemeProvider, createTheme, CssBaseline,
  LinearProgress, Alert,
} from '@mui/material';
import {
  CloudDownload as CloudDownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  EmojiEvents as EmojiEventsIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  People as PeopleIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { db } from '../firebase-config';
import DataService from '../services/dataService';
import { ACADEMIC_YEARS } from '../config/constants';

// ─── Theme ─────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#ec4899', light: '#f472b6', dark: '#db2777' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 10, padding: '8px 18px', boxShadow: 'none', transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)' } } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 16, boxShadow: '0 4px 20px 0 rgba(15, 23, 42, 0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 16, boxShadow: '0 4px 20px 0 rgba(15, 23, 42, 0.05)' } } },
  },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatYear = (y) => {
  if (!y || y === 'N/A' || y === 'All') return 'All';
  const str = String(y).trim();
  if (/^2K\d{2}$/i.test(str)) return str;
  if (/^\d{4}$/.test(str)) return `2K${str.slice(2)}`;
  if (/^[1-4]$/.test(str)) {
    const yrMap = { '1': '2K28', '2': '2K27', '3': '2K26', '4': '2K25' };
    return yrMap[str] || str;
  }
  return str;
};

const formatTime = (timeVal) => {
  if (!timeVal) return '—';
  if (typeof timeVal === 'object') {
    if (typeof timeVal.toDate === 'function') {
      try { return timeVal.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch (_) {}
    }
    if (typeof timeVal.seconds === 'number') {
      try { return new Date(timeVal.seconds * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch (_) {}
    }
    return '—';
  }
  try {
    const d = new Date(timeVal);
    if (isNaN(d.getTime())) return String(timeVal);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '—';
  }
};

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return '—';
  try {
    if (typeof dateVal === 'object' && dateVal.toDate) return dateVal.toDate().toLocaleDateString('en-IN');
    if (typeof dateVal === 'object' && dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString('en-IN');
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN');
  } catch (e) {
    return '—';
  }
};

const formatHrMinSec = (secInput) => {
  if (secInput === undefined || secInput === null || secInput === '') return '0s';
  if (typeof secInput === 'string') {
    if (secInput.trim() === '' || secInput === '—' || secInput === 'N/A') return '0s';
    if (secInput.includes('s') || secInput.includes('m') || secInput.includes(':') || secInput.includes('hr')) return secInput;
  }
  const secNum = Number(secInput) || 0;
  if (secNum === 0) return '0s';
  const hrs = Math.floor(secNum / 3600);
  const mins = Math.floor((secNum % 3600) / 60);
  const secs = Math.floor(secNum % 60);
  const parts = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} sec${secs !== 1 ? 's' : ''}`);
  return parts.join(' ');
};

const getQuestionTimeTaken = (q) => {
  if (!q) return 'Did Not Attempt';
  const t = q.timeTaken !== undefined ? q.timeTaken :
            q.timeSpent !== undefined ? q.timeSpent :
            q.duration !== undefined ? q.duration :
            q.timeTakenSeconds !== undefined ? q.timeTakenSeconds :
            q.time_taken !== undefined ? q.time_taken :
            q.time !== undefined ? q.time :
            q.elapsedTime !== undefined ? q.elapsedTime : 0;

  return formatHrMinSec(t);
};

const getInsightCategory = (pct) => {
  const p = Number(pct) || 0;
  if (p >= 85) return { insight: 'Strong Performance', category: 'Best' };
  if (p >= 70) return { insight: 'Good to go', category: 'Good' };
  if (p >= 55) return { insight: 'Average Performance', category: 'Average' };
  if (p >= 40) return { insight: 'Needs Practice', category: 'Average' };
  return { insight: 'Need Attention', category: 'Poor' };
};

const getCodingSubmissions = (student, assessData) => {
  const sources = [
    student?.codingSubmissions,
    student?.coding,
    student?.codingResults,
    assessData?.codingSubmissions,
    assessData?.coding,
    assessData?.codingResults,
  ];

  for (const src of sources) {
    if (Array.isArray(src) && src.length > 0) return src;
  }

  const allQs = student?.questions || student?.answers || assessData?.questions || assessData?.answers || [];
  if (Array.isArray(allQs) && allQs.length > 0) {
    const codingQs = allQs.filter(q => q && (q.type === 'coding' || q.code || q.submittedCode || q.solutionCode || q.solution));
    if (codingQs.length > 0) return codingQs;
  }

  return [];
};

const createExcelCell = (value, options = {}) => {
  const {
    bg = 'FFFFFF',
    fg = '000000',
    bold = false,
    fontSize = 10,
    align = 'center',
    wrap = false,
    border = true,
  } = options;

  let cellValue = value;
  if (cellValue === null || cellValue === undefined) cellValue = '—';

  const cellType = typeof cellValue === 'number' ? 'n' : 's';
  const cellObj = {
    v: cellValue,
    t: cellType,
    s: {
      font: { name: 'Calibri', sz: fontSize, bold, color: { rgb: fg } },
      fill: { fgColor: { rgb: bg } },
      alignment: { horizontal: align, vertical: 'center', wrapText: wrap },
    },
  };

  if (border) {
    cellObj.s.border = {
      top: { style: 'thin', color: { rgb: 'D1D5DB' } },
      bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
      left: { style: 'thin', color: { rgb: 'D1D5DB' } },
      right: { style: 'thin', color: { rgb: 'D1D5DB' } },
    };
  }

  return cellObj;
};

// ─── Fetch Firestore Data (college-scoped) ──────────────────────────────────────
const fetchFirestoreForCollege = async (college) => {
  const mcqResults = [], codingResults = [], assessmentResults = [];
  try {
    const { collectionGroup, getDocs, query, where } = await import('firebase/firestore');

    try {
      let snap;
      try {
        snap = await getDocs(query(collectionGroup(db, 'mcq_results'), where('college', '==', college)));
      } catch {
        const all = await getDocs(query(collectionGroup(db, 'mcq_results')));
        snap = { forEach: cb => all.forEach(d => { if (d.data().college === college) cb(d); }) };
      }
      snap.forEach(d => {
        const r = d.data();
        const pct = r.percentage > 1 ? r.percentage : (r.percentage || 0) * 100;
        mcqResults.push({ ...r, id: d.id, type: 'mcq', percentage: pct, testName: r.testName || r.test_name || 'MCQ Test', testID: r.testID || r.test_id || 'unknown' });
      });
    } catch (e) { void 0; }

    try {
      let snap;
      try {
        snap = await getDocs(query(collectionGroup(db, 'coding_results'), where('college', '==', college)));
      } catch {
        const all = await getDocs(query(collectionGroup(db, 'coding_results')));
        snap = { forEach: cb => all.forEach(d => { if (d.data().college === college) cb(d); }) };
      }
      snap.forEach(d => {
        const r = d.data();
        const pct = r.percentage > 1 ? r.percentage : (r.score ? (r.score / 300) * 100 : 0);
        codingResults.push({ ...r, id: d.id, type: 'coding', percentage: pct, testName: r.assessmentName || r.testName || 'Coding Test', testID: r.assessmentID || r.testID || 'unknown_coding' });
      });
    } catch (e) { void 0; }

    try {
      const snap = await getDocs(query(collectionGroup(db, 'Assessments')));
      snap.forEach(d => {
        const r = d.data();
        if (r.college === college) assessmentResults.push({ ...r, id: d.id });
      });
    } catch (e) { void 0; }

  } catch (e) { void 0; }

  return { mcqResults, codingResults, assessmentResults };
};

// ─── Normalize result to unified format ─────────────────────────────────────────
const normalize = (r, college) => {
  const pct = r.percentage !== undefined ? (r.percentage > 1 ? r.percentage : r.percentage * 100) : 0;
  return {
    rollNumber: r.rollNumber || r.roll_number || 'N/A',
    name: r.name || r.Name || 'Student',
    email: r.email || r.Email || '',
    year: r.year || r.Year || 'N/A',
    department: r.department || r.Department || 'N/A',
    college: r.college || r.College || college,
    testName: r.testName || r.test_name || 'Test',
    testID: r.testID || r.test_id || '',
    type: r.type || 'mcq',
    score: r.score || 0,
    totalMarks: r.totalMarks || r.totalQuestions || 100,
    percentage: pct,
    correctAnswers: r.correctAnswers || r.correct_answers || 0,
    totalQuestions: r.totalQuestions || r.total_questions || 10,
    timeTaken: r.timeTakenFormatted || r.time_taken_formatted || (r.timeTaken ? `${r.timeTaken}s` : 'N/A'),
    submittedAt: r.submittedAt || r.submitted_at || new Date().toISOString(),
    autoSubmitted: r.autoSubmitted || false,
    violationCount: r.violationCount || r.violation_count || 0,
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StaffDashboardComponent = () => {
  const navigate = useNavigate();
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('auth_data')) || {}; } catch { return {}; } }, []);
  const college = user?.College || user?.college || 'KGKITE';

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [showLogout, setShowLogout] = useState(false);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [testFilter, setTestFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dirSearch, setDirSearch] = useState('');
  const [dirYear, setDirYear] = useState('All');
  const [dirDept, setDirDept] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Student profiles
      let profiles = [];
      const yearsList = Object.keys(ACADEMIC_YEARS);
      for (const yr of yearsList) {
        try {
          const data = await DataService.getCollegeData(college, 'profiles', yr);
          if (Array.isArray(data)) profiles = [...profiles, ...data.map(p => ({ ...p, Year: yr }))];
        } catch (e) { void 0; }
      }
      setStudents(profiles);

      // 2. Supabase results
      let supaResults = [];
      try {
        const { data: mcqData } = await supabase.from('mcq_results').select('*').eq('college', college);
        if (mcqData) supaResults = [...supaResults, ...mcqData.map(r => ({ ...r, type: 'mcq' }))];
      } catch (e) { void 0; }
      try {
        const { data: codingData } = await supabase.from('coding_results').select('*').eq('college', college);
        if (codingData) supaResults = [...supaResults, ...codingData.map(r => ({ ...r, type: 'coding' }))];
      } catch (e) { void 0; }

      // 3. Firestore results
      const { mcqResults: fsMcq, codingResults: fsCoding, assessmentResults: fsAssessment } = await fetchFirestoreForCollege(college);
      setAssessmentResults(fsAssessment);

      // Combine & deduplicate
      const seen = new Set();
      const combined = [];
      [...supaResults, ...fsMcq, ...fsCoding].forEach(r => {
        const key = `${(r.email || r.Email || '').toLowerCase()}_${r.testID || r.test_id || ''}_${r.type}`;
        if (!seen.has(key)) { seen.add(key); combined.push(normalize(r, college)); }
      });
      setAllResults(combined);
    } catch (e) {
      void 0;
    } finally {
      setLoading(false);
    }
  }, [college]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    setShowLogout(true);
    setTimeout(() => {
      ['auth_data', 'role', 'token', 'isAuthenticated', 'authExpiration'].forEach(k => localStorage.removeItem(k));
      navigate('/login');
    }, 1500);
  };

  // Filter options
  const years = useMemo(() => ['All', ...new Set(allResults.map(r => r.year).filter(Boolean))].sort(), [allResults]);
  const depts = useMemo(() => ['All', ...new Set(allResults.map(r => r.department).filter(Boolean))].sort(), [allResults]);
  const tests = useMemo(() => ['All', ...new Set(allResults.map(r => r.testName).filter(Boolean))].sort(), [allResults]);
  const dirYears = useMemo(() => ['All', ...new Set(students.map(s => s.Year).filter(Boolean))].sort(), [students]);
  const dirDepts = useMemo(() => ['All', ...new Set(students.map(s => s.Department).filter(Boolean))].sort(), [students]);

  // Filtered results
  const filteredResults = useMemo(() => allResults.filter(r => {
    if (yearFilter !== 'All' && r.year !== yearFilter) return false;
    if (deptFilter !== 'All' && r.department !== deptFilter) return false;
    if (testFilter !== 'All' && r.testName !== testFilter) return false;
    if (typeFilter !== 'All' && r.type !== typeFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.rollNumber?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
    }
    return true;
  }), [allResults, yearFilter, deptFilter, testFilter, typeFilter, searchText]);

  const filteredStudents = useMemo(() => students.filter(s => {
    if (dirYear !== 'All' && s.Year !== dirYear) return false;
    if (dirDept !== 'All' && s.Department !== dirDept) return false;
    if (dirSearch) {
      const q = dirSearch.toLowerCase();
      return (s.Name || '').toLowerCase().includes(q) || (s['Roll Number'] || '').toLowerCase().includes(q);
    }
    return true;
  }), [students, dirYear, dirDept, dirSearch]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredResults.length;
    const avgPct = total > 0 ? filteredResults.reduce((s, r) => s + r.percentage, 0) / total : 0;
    const highAchievers = filteredResults.filter(r => r.percentage >= 80).length;
    const topPerformers = [...filteredResults].sort((a, b) => b.percentage - a.percentage).slice(0, 8);
    const needsAttention = filteredResults.filter(r => r.percentage < 40);

    const deptMap = {};
    filteredResults.forEach(r => {
      if (!r.department || r.department === 'N/A') return;
      if (!deptMap[r.department]) deptMap[r.department] = { sum: 0, count: 0 };
      deptMap[r.department].sum += r.percentage;
      deptMap[r.department].count++;
    });
    const deptData = Object.entries(deptMap).map(([dept, d]) => ({ label: dept, value: parseFloat((d.sum / d.count).toFixed(1)), count: d.count })).sort((a, b) => b.value - a.value);

    return { total, avgPct, highAchievers, topPerformers, needsAttention, deptData };
  }, [filteredResults]);

  // ── Multi-Sheet Excel Export for College (Row 1 & Row 2 Aligned, Scaled Coding Marks) ──
  const exportCollegeExcel = (selectedGroup) => {
    const results = selectedGroup?.results || filteredResults;
    if (!results || results.length === 0) return;

    const secs = selectedGroup?.sections || [];
    const isSpoken = selectedGroup?.type === 'spoken_english' || selectedGroup?.type === 'speech' || selectedGroup?.type === 'sea';

    // Computed stats for Summary Sheet
    const totalStudents = results.length;
    const avgPct = totalStudents > 0 ? results.reduce((s, r) => s + (Number(r.percentage) || 0), 0) / totalStudents : 0;
    const highestPct = totalStudents > 0 ? Math.max(...results.map(r => Number(r.percentage) || 0)) : 0;
    const lowestPct = totalStudents > 0 ? Math.min(...results.map(r => Number(r.percentage) || 0)) : 0;
    const sample = results[0] || {};
    const totalMarks = sample.totalMarks || 100;
    const numQ = sample.totalQuestions || secs.reduce((s, sec) => s + (sec.totalQuestions || sec.numQuestions || 0), 0) || '—';
    const batch = formatYear(sample.year || yearFilter || '—');
    const testDate = sample.submittedAt ? new Date(sample.submittedAt).toDateString() : '—';
    const attendance = `${totalStudents} / ${selectedGroup?.totalEnrolled || totalStudents}`;
    const duration = sample.assessmentDuration || sample.duration || '—';

    // Status counts
    const gtkCount = results.filter(r => (Number(r.percentage) || 0) >= 70).length;
    const niCount  = results.filter(r => { const p = Number(r.percentage) || 0; return p >= 50 && p < 70; }).length;
    const ntCount  = results.filter(r => (Number(r.percentage) || 0) < 50).length;

    // Top / At-Risk
    const sortedDesc = [...results].sort((a, b) => (Number(b.percentage) || 0) - (Number(a.percentage) || 0));
    const sortedAsc  = [...results].sort((a, b) => (Number(a.percentage) || 0) - (Number(b.percentage) || 0));
    const topN    = sortedDesc.slice(0, 10);
    const atRiskN = sortedAsc.slice(0, 10);

    // Branch-wise
    const branchMap = {};
    results.forEach(r => {
      const br = r.department || r.branch || 'Unknown';
      if (!branchMap[br]) branchMap[br] = { total: 0, poor: 0, avg: 0, good: 0, best: 0 };
      branchMap[br].total++;
      const p = Number(r.percentage) || 0;
      if (p >= 81)      branchMap[br].best++;
      else if (p >= 61) branchMap[br].good++;
      else if (p >= 31) branchMap[br].avg++;
      else              branchMap[br].poor++;
    });
    const branches = Object.entries(branchMap).sort((a, b) => a[0].localeCompare(b[0]));

    // ── Summary Sheet ──
    const HMain = (v) => createExcelCell(v, { bg: '10B981', fg: 'FFFFFF', bold: true, fontSize: 13 });
    const HSec  = (v, bg = '059669') => createExcelCell(v, { bg, fg: 'FFFFFF', bold: true, fontSize: 11 });
    const HDark = (v) => createExcelCell(v, { bg: '047857', fg: 'FFFFFF', bold: true, fontSize: 11 });
    const HCol  = (v, bg = '10B981') => createExcelCell(v, { bg, fg: 'FFFFFF', bold: true, fontSize: 10 });
    const HKey  = (v) => createExcelCell(v, { bg: 'E6F4EA', fg: '065F46', bold: true, fontSize: 10 });
    const CD    = (v, bg = 'FFFFFF', fg = '1F2937', bold = false) => createExcelCell(v, { bg, fg, bold, fontSize: 10 });

    const summaryAOA = [];

    // Title Header Centered (First 2 Lines)
    summaryAOA.push([
      HMain('SEED SEB ASSESSMENT ANALYSIS REPORT'),
      '', '', '', '', '', '', '', '', '', '', ''
    ]);
    summaryAOA.push([
      HMain('SEED SEB COMPANY READINESS REPORT'),
      '', '', '', '', '', '', '', '', '', '', ''
    ]);

    // Assessment Overview Header
    summaryAOA.push([
      HDark('Assessment Details'), '', '', '', '',
      '', HDark('Attachments'), '', '', '', '', ''
    ]);

    summaryAOA.push([
      HKey('Test Name:'), CD(selectedGroup?.testName || (testFilter !== 'All' ? testFilter : 'College Assessment Report'), 'FFFFFF', '1F2937', true), '',
      HKey('Attendance:'), CD(attendance), '',
      HKey('Assessment Report'), '', HKey('Test Date:'), CD(testDate), '', ''
    ]);
    summaryAOA.push([
      HKey('Number of Questions:'), CD(numQ), '',
      HKey('Answer Key'), '', HKey('Batch:'), CD(batch), '', ''
    ]);
    summaryAOA.push([
      HKey('Total Marks:'), CD(totalMarks), '',
      '', '', HKey('College:'), CD(college), '', ''
    ]);

    summaryAOA.push(['', '', '', '', '', '', '', '', '', '', '', ''].map(v => CD(v, 'FFFFFF', 'FFFFFF')));

    // Summary Table
    summaryAOA.push([
      HSec('Total Students'), HSec('Average %'), HSec('Highest %'), HSec('Lowest %'), HSec('Duration (Mins)'),
      '', '', '', '', '', '', ''
    ]);
    summaryAOA.push([
      CD(totalStudents, 'F9FAFB', '1F2937', true),
      CD(`${avgPct.toFixed(2)}%`, 'F9FAFB', '10B981', true),
      CD(`${highestPct.toFixed(2)}%`, 'F9FAFB', '059669', true),
      CD(`${lowestPct.toFixed(2)}%`, 'F9FAFB', 'DC2626', true),
      CD(duration, 'F9FAFB', '1F2937', true),
      '', '', '', '', '', '', ''
    ]);

    summaryAOA.push(['', '', '', '', '', '', '', '', '', '', '', ''].map(v => CD(v, 'FFFFFF', 'FFFFFF')));

    // Status Summary Table
    summaryAOA.push([
      HDark('Status'), HDark('Count'), HDark('Percentage'), HDark('Criteria'),
      '', '', '', '', '', '', '', ''
    ]);
    summaryAOA.push([
      CD('Good to Go', 'F0FDF4', '15803D', true), CD(gtkCount, 'F0FDF4'), CD(`${totalStudents > 0 ? ((gtkCount/totalStudents)*100).toFixed(1) : 0}%`, 'F0FDF4'), CD('>=70%', 'F0FDF4'),
      '', '', '', '', '', '', '', ''
    ]);
    summaryAOA.push([
      CD('Needs Improvement', 'FFFBEB', 'B45309', true), CD(niCount, 'FFFBEB'), CD(`${totalStudents > 0 ? ((niCount/totalStudents)*100).toFixed(1) : 0}%`, 'FFFBEB'), CD('50-69%', 'FFFBEB'),
      '', '', '', '', '', '', '', ''
    ]);
    summaryAOA.push([
      CD('Needs Training', 'FEF2F2', 'B91C1C', true), CD(ntCount, 'FEF2F2'), CD(`${totalStudents > 0 ? ((ntCount/totalStudents)*100).toFixed(1) : 0}%`, 'FEF2F2'), CD('<50%', 'FEF2F2'),
      '', '', '', '', '', '', '', ''
    ]);

    summaryAOA.push(['', '', '', '', '', '', '', '', '', '', '', ''].map(v => CD(v, 'FFFFFF', 'FFFFFF')));

    // Top Performers & At-Risk Side-by-Side
    summaryAOA.push([
      HSec('🏆 Top Performers', '059669'), '', '', '',
      HSec('⚠ At-Risk Students', 'DC2626'), '', '', '',
      '', '', '', ''
    ]);
    summaryAOA.push([
      HCol('Rank'), HCol('Name'), HCol('Branch'), HCol('Percentage %'),
      HCol('Rank', 'EF4444'), HCol('Name', 'EF4444'), HCol('Branch', 'EF4444'), HCol('Percentage %', 'EF4444'),
      '', '', '', ''
    ]);

    const maxRows = Math.max(topN.length, atRiskN.length);
    for (let i = 0; i < maxRows; i++) {
      const tp = topN[i];
      const ar = atRiskN[i];
      const tBg = i % 2 === 0 ? 'F9FAFB' : 'FFFFFF';
      summaryAOA.push([
        tp ? CD(i + 1, tBg) : '',
        tp ? CD(tp.name || 'N/A', tBg, '1F2937', true) : '',
        tp ? CD(tp.department || tp.branch || 'N/A', tBg) : '',
        tp ? CD(`${(Number(tp.percentage) || 0).toFixed(1)}%`, tBg, '059669', true) : '',
        ar ? CD(i + 1, tBg) : '',
        ar ? CD(ar.name || 'N/A', tBg, '1F2937', true) : '',
        ar ? CD(ar.department || ar.branch || 'N/A', tBg) : '',
        ar ? CD(`${(Number(ar.percentage) || 0).toFixed(1)}%`, tBg, 'DC2626', true) : '',
        '', '', '', ''
      ]);
    }

    summaryAOA.push(['', '', '', '', '', '', '', '', '', '', '', ''].map(v => CD(v, 'FFFFFF', 'FFFFFF')));

    // Branch-wise Header
    summaryAOA.push([
      HDark('📊 Branch-wise Performance Summary'), '', '', '', '', '',
      '', '', '', '', '', ''
    ]);
    summaryAOA.push([
      HCol('Branch'), HCol('Total'), HCol('POOR (<=30%)', 'EF4444'), HCol('AVERAGE (31-60%)', 'F59E0B'), HCol('GOOD (61-80%)', '3B82F6'), HCol('BEST (>=81%)', '10B981'),
      '', '', '', '', '', ''
    ]);
    branches.forEach(([br, d], idx) => {
      const bBg = idx % 2 === 0 ? 'F9FAFB' : 'FFFFFF';
      summaryAOA.push([
        CD(br, bBg, '1F2937', true),
        CD(d.total, bBg, '1F2937', true),
        CD(d.poor, bBg, d.poor > 0 ? 'DC2626' : '9CA3AF', d.poor > 0),
        CD(d.avg, bBg, d.avg > 0 ? 'D97706' : '9CA3AF', d.avg > 0),
        CD(d.good, bBg, d.good > 0 ? '2563EB' : '9CA3AF', d.good > 0),
        CD(d.best, bBg, d.best > 0 ? '059669' : '9CA3AF', d.best > 0),
        '', '', '', '', '', ''
      ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryAOA);
    summaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      { s: { r: 2, c: 6 }, e: { r: 2, c: 11 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 4 } },
      { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
      { s: { r: 15, c: 0 }, e: { r: 15, c: 3 } },
      { s: { r: 15, c: 4 }, e: { r: 15, c: 7 } },
      { s: { r: summaryAOA.length - branches.length - 2, c: 0 }, e: { r: summaryAOA.length - branches.length - 2, c: 5 } },
    ];
    summaryWs['!cols'] = [28, 28, 18, 16, 28, 28, 18, 16, 8, 8, 8, 8].map(wch => ({ wch }));

    // ── Test Results Data Sheet ──
    const codingSecDef = secs.find(s => /coding/i.test(s.name || s.sectionName));
    const codingSecTotalMarks = codingSecDef?.totalMarks || codingSecDef?.maxScore || sample.totalMarks || 40;

    const allCodingQs = new Map();
    results.forEach(r => {
      const cSubs = getCodingSubmissions(r);
      cSubs.forEach((c, idx) => {
        const qNum = c.questionNumber || idx + 1;
        const qKey = `Q${qNum}`;
        if (!allCodingQs.has(qKey)) {
          allCodingQs.set(qKey, {
            qNum,
            qKey,
            title: c.problemTitle || c.title || `Problem ${qNum}`,
            explicitMax: (c.totalMarks && c.totalMarks < codingSecTotalMarks) ? c.totalMarks : ((c.maxMarks && c.maxMarks < codingSecTotalMarks) ? c.maxMarks : null),
          });
        }
      });
    });
    const codingQList = Array.from(allCodingQs.values()).sort((a, b) => a.qNum - b.qNum);
    const defaultQMax = Math.max(1, Math.round(codingSecTotalMarks / Math.max(1, codingQList.length || 1)));

    codingQList.forEach(cq => {
      cq.maxMarks = cq.explicitMax || defaultQMax;
    });

    const baseHeaders1 = ['#', 'Roll Number', 'Candidate Name', 'Email', 'College', 'Department', 'Year',
      'Start Time', 'End Time', 'Total Time Taken', 'Violations', 'Auto Submitted'];
    const baseHeaders2 = ['#', 'Roll Number', 'Candidate Name', 'Email', 'College', 'Department', 'Year',
      'Start Time', 'End Time', 'Total Time Taken', 'Violations', 'Auto Submitted'];

    const sectionHeaders1 = [];
    const sectionHeaders2 = [];

    if (isSpoken) {
      sectionHeaders1.push('Spoken English', '', '', '');
      sectionHeaders2.push('CEFR Level', 'Accuracy (%)', 'Speaking Pace (WPM)', 'Fillers Count');
    } else {
      secs.forEach(sec => {
        const sName = sec.name || sec.sectionName || 'Section';
        const isSpokenSec = /spoken|speech|communication|sea/i.test(sName);
        if (isSpokenSec) {
          sectionHeaders1.push(sName, '', '', '', '', '');
          sectionHeaders2.push('Marks Obtained', 'Total Marks', 'Section %', 'Time Taken', 'CEFR Level', 'WPM');
        } else {
          sectionHeaders1.push(sName, '', '', '');
          sectionHeaders2.push('Marks Obtained', 'Total Marks', 'Section %', 'Time Taken');
        }
      });
    }

    const codingHeaders1 = [];
    const codingHeaders2 = [];
    codingQList.forEach(cq => {
      codingHeaders1.push(`${cq.qKey} - ${cq.title}`, '', '', '');
      codingHeaders2.push('Marks Obtained', 'Total Marks', 'Accuracy (%)', 'Time Taken');
    });

    const overallHeaders1 = ['Overall', '', '', '', ''];
    const overallHeaders2 = ['Score', 'Total Marks', 'Percentage', 'Status', 'Submitted Date'];
    const perfHeaders1 = ['Performance', ''];
    const perfHeaders2 = ['Insight', 'Category'];

    const row1Names = [...baseHeaders1, ...sectionHeaders1, ...codingHeaders1, ...overallHeaders1, ...perfHeaders1];
    const row2Names = [...baseHeaders2, ...sectionHeaders2, ...codingHeaders2, ...overallHeaders2, ...perfHeaders2];

    const row1Cells = row1Names.map((name, cIdx) => {
      let bg = '0F172A', fg = 'FFFFFF';
      if (cIdx < baseHeaders1.length) { bg = '0F172A'; fg = '38BDF8'; }
      else if (cIdx < baseHeaders1.length + sectionHeaders1.length) { bg = '0F172A'; fg = 'F59E0B'; }
      else if (cIdx < baseHeaders1.length + sectionHeaders1.length + codingHeaders1.length) { bg = '0F172A'; fg = '818CF8'; }
      else if (cIdx < baseHeaders1.length + sectionHeaders1.length + codingHeaders1.length + overallHeaders1.length) { bg = '0F172A'; fg = '34D399'; }
      else { bg = '0F172A'; fg = 'A78BFA'; }
      return createExcelCell(name, { bg, fg, bold: true, fontSize: 11 });
    });

    const row2Cells = row2Names.map(name => createExcelCell(name, { bg: '1E293B', fg: 'FFFFFF', bold: true, fontSize: 10 }));

    const dataRowCells = results.map((r, idx) => {
      const rowBg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
      const base = [
        idx + 1, r.rollNumber || 'N/A', r.name || 'N/A', r.email || 'N/A',
        r.college || 'N/A', r.department || 'N/A', formatYear(r.year),
        formatTime(r.startedAt || r.started_at), formatTime(r.submittedAt || r.submitted_at),
        formatHrMinSec(r.timeTakenSeconds || r.timeTaken), r.violationCount || 0,
        r.autoSubmitted ? 'Yes' : 'No',
      ];
      let secCells = [];
      if (isSpoken) {
        secCells = [r.cefrLevel || '—', typeof r.percentage === 'number' ? Math.round(r.percentage) + '%' : '—', r.wpm || '—', r.fillerCount !== undefined ? r.fillerCount : '—'];
      } else {
        secs.forEach(secDef => {
          const sName = secDef.name || secDef.sectionName || 'Section';
          const isSpokenSec = /spoken|speech|communication|sea/i.test(sName);
          const secData = r.sections?.find(s => (s.name || s.sectionName) === sName) || r.sections?.[secs.indexOf(secDef)];
          const score = secData?.score !== undefined ? secData.score : '—';
          const max = secData?.totalMarks || secData?.maxScore || '—';
          const pct = (typeof score === 'number' && typeof max === 'number' && max > 0) ? Math.round((score / max) * 100) + '%' : '—';
          const timeTaken = formatHrMinSec(secData?.timeTaken || secData?.timeSpent);
          if (isSpokenSec) { secCells.push(score, max, pct, timeTaken, secData?.cefrLevel || r.cefrLevel || '—', secData?.wpm || r.wpm || '—'); }
          else { secCells.push(score, max, pct, timeTaken); }
        });
      }

      let codingCells = [];
      if (codingQList.length > 0) {
        const cSubs = getCodingSubmissions(r);
        codingQList.forEach(cq => {
          const cSub = cSubs.find(c => (c.questionNumber || 0) === cq.qNum || (c.problemTitle && c.problemTitle === cq.title));
          const isAttempted = !!(cSub && (cSub.submitted || cSub.code || cSub.testsPassed !== undefined || cSub.score !== undefined || cSub.timeTaken || cSub.timeSpent));
          if (isAttempted) {
            const max = (cSub.totalMarks && cSub.totalMarks < codingSecTotalMarks) ? cSub.totalMarks : ((cSub.maxMarks && cSub.maxMarks < codingSecTotalMarks) ? cSub.maxMarks : cq.maxMarks);
            let score = 0;
            if (cSub.testsPassed !== undefined && cSub.totalTests && cSub.totalTests > 0) {
              score = Math.round((cSub.testsPassed / cSub.totalTests) * max);
            } else if (typeof cSub.score === 'number') {
              score = cSub.score > max ? max : cSub.score;
            } else if (typeof cSub.marks === 'number') {
              score = cSub.marks > max ? max : cSub.marks;
            }

            const pct = cSub.totalTests && cSub.totalTests > 0
              ? `${Math.round(((cSub.testsPassed || 0) / cSub.totalTests) * 100)}%`
              : `${Math.round((score / max) * 100)}%`;
            const timeTaken = getQuestionTimeTaken(cSub);
            codingCells.push(score, max, pct, timeTaken);
          } else {
            codingCells.push('Did Not Attempt', 'Did Not Attempt', 'Did Not Attempt', 'Did Not Attempt');
          }
        });
      }

      const pct = typeof r.percentage === 'number' ? Math.round(r.percentage * 10) / 10 : (r.percentage || 0);
      const ic = getInsightCategory(pct);
      const overall = [r.score !== undefined ? r.score : '—', r.totalMarks || '—', `${pct}%`, pct >= 50 ? 'PASS' : 'FAIL', formatDateDisplay(r.submittedAt)];
      const perf = [ic.insight, ic.category];

      const rawRowValues = [...base, ...secCells, ...codingCells, ...overall, ...perf];
      return rawRowValues.map((val) => {
        if (val === 'PASS') return createExcelCell(val, { bg: 'D1FAE5', fg: '065F46', bold: true });
        if (val === 'FAIL') return createExcelCell(val, { bg: 'FEE2E2', fg: '991B1B', bold: true });
        if (val === 'Did Not Attempt') return createExcelCell(val, { bg: 'FEF3C7', fg: '92400E', bold: false });
        return createExcelCell(val, { bg: rowBg });
      });
    });

    const dataAoa = [row1Cells, row2Cells, ...dataRowCells];
    const ws = XLSX.utils.aoa_to_sheet(dataAoa);

    const merges = [];
    for (let c = 0; c < baseHeaders1.length; c++) {
      merges.push({ s: { r: 0, c }, e: { r: 1, c } });
    }

    let colIdx = baseHeaders1.length;
    if (isSpoken) {
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 3 } });
      colIdx += 4;
    } else {
      secs.forEach(sec => {
        const sName = sec.name || sec.sectionName || 'Section';
        const isSpokenSec = /spoken|speech|communication|sea/i.test(sName);
        const span = isSpokenSec ? 6 : 4;
        merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + span - 1 } });
        colIdx += span;
      });
    }
    if (codingQList.length > 0) {
      codingQList.forEach(() => {
        merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 3 } });
        colIdx += 4;
      });
    }
    merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 4 } });
    colIdx += 5;
    merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 1 } });
    ws['!merges'] = merges;

    const allColLens = row1Names.map((n, i) => Math.max(12, n.length + 2, row2Names[i]?.length + 2 || 12));
    ws['!cols'] = allColLens.map(wch => ({ wch }));

    const cleanTestName = (selectedGroup?.testName || (testFilter !== 'All' ? testFilter : 'Assessment')).replace(/[/\\?%*:|"<>]/g, '_');
    const cleanCollege = (college || 'College').replace(/[/\\?%*:|"<>]/g, '_');
    const cleanYear = (yearFilter !== 'All' ? yearFilter : 'All').replace(/[/\\?%*:|"<>]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary Report');
    XLSX.utils.book_append_sheet(wb, ws, 'Test Results');
    XLSX.writeFile(wb, `SEED-${cleanTestName}-${cleanCollege}-${cleanYear}-${dateStr}.xlsx`);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2, bgcolor: 'background.default' }}>
          <CircularProgress size={56} sx={{ color: '#6366f1' }} />
          <Typography color="text.secondary">Loading dashboard for {college}…</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1.5, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Staff Dashboard</Typography>
          <Typography variant="subtitle1" color="text.secondary">College: <strong>{college}</strong> · {allResults.length} records</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} size="small">Refresh</Button>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={handleLogout} size="small">Logout</Button>
        </Stack>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Mapped Students', value: students.length, icon: <PeopleIcon />, color: '#6366f1' },
          { label: 'Total Assessments', value: stats.total, icon: <AssignmentTurnedInIcon />, color: '#22c55e' },
          { label: 'Average Score', value: `${stats.avgPct.toFixed(1)}%`, icon: <SchoolIcon />, color: '#f59e0b' },
          { label: 'High Achievers ≥80%', value: stats.highAchievers, icon: <EmojiEventsIcon />, color: '#ec4899' },
        ].map((m, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderLeft: `4px solid ${m.color}`, height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" sx={{ letterSpacing: 0.5 }}>{m.label}</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: m.color, mt: 0.5 }}>{m.value}</Typography>
                </Box>
                <Box sx={{ bgcolor: m.color + '18', p: 1.5, borderRadius: 2, color: m.color }}>{m.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Reports" sx={{ fontWeight: 700 }} />
          <Tab label="Student Directory" sx={{ fontWeight: 700 }} />
          <Tab label="Performance Insights" sx={{ fontWeight: 700 }} />
          <Tab label="Test Creator" sx={{ fontWeight: 700 }} />
        </Tabs>

        {/* ══ REPORTS TAB (Exclusive Excel Result Option) ══════════════════════ */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Header Action Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>Assessment Reports & Excel Export</Typography>
                <Typography variant="caption" color="text.secondary">Download full complete Excel results for {college}</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<CloudDownloadIcon />}
                onClick={() => exportCollegeExcel()}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}
              >
                Download College Excel Report
              </Button>
            </Box>

            {/* Shared Filters */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Search Candidate" value={searchText} onChange={e => setSearchText(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: 'action.active' }} /> }} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select value={yearFilter} label="Year" onChange={e => setYearFilter(e.target.value)}>
                    {years.map(y => <MenuItem key={y} value={y}>{y === 'All' ? 'All Years' : y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select value={deptFilter} label="Department" onChange={e => setDeptFilter(e.target.value)}>
                    {depts.map(d => <MenuItem key={d} value={d}>{d === 'All' ? 'All Depts' : d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Test</InputLabel>
                  <Select value={testFilter} label="Test" onChange={e => setTestFilter(e.target.value)}>
                    {tests.map(t => <MenuItem key={t} value={t}>{t === 'All' ? 'All Tests' : (t.length > 24 ? t.substring(0, 22) + '..' : t)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="mcq">MCQ</MenuItem>
                    <MenuItem value="coding">Coding</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Candidate Results Table */}
            <TableContainer sx={{ maxHeight: 540, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                    {['Roll No', 'Name', 'Dept', 'Year', 'Test Name', 'Type', '% Score', 'Correct/Total', 'Time Taken', 'Violations'].map(h => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>No results found for college "{college}".</TableCell></TableRow>
                  ) : filteredResults.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{r.rollNumber}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.name}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.department}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.year}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}><Tooltip title={r.testName}><span>{r.testName?.length > 22 ? r.testName.substring(0, 20) + '..' : r.testName}</span></Tooltip></TableCell>
                      <TableCell><Chip label={r.type.toUpperCase()} size="small" sx={{ fontSize: 10, height: 20, bgcolor: r.type === 'coding' ? '#ede9fe' : '#e0f2fe', color: r.type === 'coding' ? '#7c3aed' : '#0369a1' }} /></TableCell>
                      <TableCell>
                        <Chip label={`${r.percentage.toFixed(0)}%`} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: r.percentage >= 75 ? '#dcfce7' : r.percentage >= 40 ? '#ede9fe' : '#fee2e2', color: r.percentage >= 75 ? '#15803d' : r.percentage >= 40 ? '#6d28d9' : '#dc2626' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.correctAnswers}/{r.totalQuestions}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.timeTaken}</TableCell>
                      <TableCell>
                        {(r.violationCount || 0) > 0
                          ? <Chip label={r.violationCount} size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />
                          : <Chip label="Clear" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ══ STUDENT DIRECTORY TAB ═════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Search Student Directory" value={dirSearch} onChange={e => setDirSearch(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: 'action.active' }} /> }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select value={dirYear} label="Year" onChange={e => setDirYear(e.target.value)}>
                    {dirYears.map(y => <MenuItem key={y} value={y}>{y === 'All' ? 'All Years' : y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select value={dirDept} label="Department" onChange={e => setDirDept(e.target.value)}>
                    {dirDepts.map(d => <MenuItem key={d} value={d}>{d === 'All' ? 'All Depts' : d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TableContainer sx={{ maxHeight: 540, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                    {['#', 'Roll Number', 'Student Name', 'Department', 'Year', 'Email'].map(h => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No student profiles found for {college}.</TableCell></TableRow>
                  ) : filteredStudents.map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{s['Roll Number'] || s.rollNumber || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{s.Name || s.name || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{s.Department || s.department || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{s.Year || s.year || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{s.Email || s.email || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ══ PERFORMANCE INSIGHTS TAB ═════════════════════════════════════════ */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon sx={{ color: '#15803d' }} /><Typography fontWeight={700}>Top Performers</Typography>
                  </Box>
                  <Divider />
                  {stats.topPerformers.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No results available</Box>
                  ) : stats.topPerformers.map((r, i) => (
                    <Box key={i} sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: i < stats.topPerformers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.rollNumber} · {r.department} · {r.testName}</Typography>
                      </Box>
                      <Chip label={`${r.percentage.toFixed(0)}%`} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                    </Box>
                  ))}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: '#fef2f2', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon sx={{ color: '#dc2626' }} /><Typography fontWeight={700}>Needs Support (&lt;40%)</Typography>
                  </Box>
                  <Divider />
                  {stats.needsAttention.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No students below 40% — Great!</Box>
                  ) : stats.needsAttention.slice(0, 8).map((r, i) => (
                    <Box key={i} sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: i < Math.min(stats.needsAttention.length, 8) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.rollNumber} · {r.department}</Typography>
                      </Box>
                      <Chip label={`${r.percentage.toFixed(0)}%`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700 }} />
                    </Box>
                  ))}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>Department Performance Breakdown</Typography>
                  {stats.deptData.length === 0 ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No department data</Box> : (
                    <Stack spacing={2}>
                      {stats.deptData.map(d => (
                        <Box key={d.label}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{d.label} <Typography component="span" variant="caption" color="text.secondary">({d.count} candidates)</Typography></Typography>
                            <Typography variant="body2" fontWeight={700} color={d.value >= 70 ? 'success.main' : d.value >= 40 ? 'primary.main' : 'error.main'}>{d.value}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(d.value, 100)}
                            sx={{ height: 10, borderRadius: 5, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: d.value >= 70 ? '#22c55e' : d.value >= 40 ? '#6366f1' : '#ef4444', borderRadius: 5 } }} />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ══ TEST CREATOR TAB ═════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <TestCreator />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default function StaffDashboard() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StaffDashboardComponent />
    </ThemeProvider>
  );
}