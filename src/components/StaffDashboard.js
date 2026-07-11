import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StudentAnalysisView from './StudentAnalysisView';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Grid, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Divider, Stack, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tabs, Tab, Chip, Tooltip, ThemeProvider, createTheme, CssBaseline,
  LinearProgress, Alert, Avatar, IconButton,
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
  PictureAsPdf as PdfIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  Timer as TimerIcon,
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

// ─── PDF Generator ─────────────────────────────────────────────────────────────
const generateStudentPDF = async (student, assessmentResults) => {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 0;

  const c = {
    primary: [99, 102, 241], secondary: [236, 72, 153],
    success: [34, 197, 94], warning: [251, 191, 36],
    error: [239, 68, 68], dark: [15, 23, 42],
    light: [248, 250, 252], gray: [71, 85, 105],
  };

  const checkPage = (needed = 20) => { if (y + needed > ph - 15) { doc.addPage(); y = 15; } };

  // Header
  doc.setFillColor(...c.primary);
  doc.rect(0, 0, pw, 38, 'F');
  doc.setFillColor(...c.secondary);
  doc.rect(0, 34, pw, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SEED-IT Platform', 14, 14);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Performance & Placement Readiness Report', 14, 22);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 30);
  doc.text(`College: ${student.college || 'N/A'}`, pw - 60, 30);
  y = 48;

  // Student Profile
  doc.setFillColor(...c.light);
  doc.roundedRect(14, y, pw - 28, 40, 3, 3, 'F');
  doc.setDrawColor(...c.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, pw - 28, 40, 3, 3, 'S');
  doc.setTextColor(...c.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(student.name || 'Student', 22, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...c.gray);
  [
    [`Roll No: ${student.rollNumber || 'N/A'}`, `College: ${student.college || 'N/A'}`],
    [`Department: ${student.department || 'N/A'}`, `Year: ${student.year || 'N/A'}`],
    [`Email: ${student.email || 'N/A'}`, `Assessment: ${student.testName || 'N/A'}`],
  ].forEach((row, i) => {
    doc.text(row[0], 22, y + 18 + i * 7);
    doc.text(row[1], pw / 2, y + 18 + i * 7);
  });
  y += 50;

  // Placement Readiness
  const pct = student.percentage || 0;
  let category = '', catColor = c.error, pkg = '';
  if (pct >= 85) { category = 'Placement Ready – Elite'; catColor = c.primary; pkg = 'High chance for ₹10L+ (TCS Digital, Infosys SP, Wipro Elite)'; }
  else if (pct >= 70) { category = 'Placement Ready'; catColor = c.success; pkg = 'Well positioned for ₹4–8L packages (TCS, Infosys, CTS, Wipro)'; }
  else if (pct >= 55) { category = 'Near Placement Ready'; catColor = [234, 179, 8]; pkg = 'Needs focused prep; can target ₹3–5L packages'; }
  else if (pct >= 40) { category = 'Developing'; catColor = c.warning; pkg = 'Requires improvement; focus on fundamentals'; }
  else { category = 'Needs Intervention'; catColor = c.error; pkg = 'Immediate academic support recommended'; }

  doc.setFillColor(...catColor);
  doc.roundedRect(14, y, pw - 28, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PLACEMENT READINESS ASSESSMENT', 22, y + 8);
  doc.setFontSize(14);
  doc.text(category, 22, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(pkg, 22, y + 24);
  doc.setFillColor(255, 255, 255);
  doc.circle(pw - 30, y + 14, 12, 'F');
  doc.setTextColor(...catColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${Math.round(pct)}%`, pw - 37, y + 16);
  doc.setFontSize(7);
  doc.text('SCORE', pw - 35, y + 21);
  y += 36;

  // Summary Metrics
  checkPage(28);
  const metrics = [
    { label: 'Overall Score', value: `${student.score || 0}/${student.totalMarks || 100}`, color: c.primary },
    { label: 'Percentage', value: `${Math.round(pct)}%`, color: pct >= 70 ? c.success : pct >= 40 ? c.warning : c.error },
    { label: 'Time Taken', value: student.timeTaken || 'N/A', color: c.gray },
    { label: 'Violations', value: String(student.violationCount || 0), color: (student.violationCount || 0) > 0 ? c.error : c.success },
  ];
  const cardW = (pw - 28 - 9) / 4;
  metrics.forEach((m, i) => {
    const cx = 14 + i * (cardW + 3);
    doc.setFillColor(...m.color);
    doc.roundedRect(cx, y, cardW, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(m.value, cx + cardW / 2, y + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, cx + cardW / 2, y + 18, { align: 'center' });
  });
  y += 28;

  // Find matching assessment data
  const assessData = assessmentResults.find(a =>
    a.email?.toLowerCase() === student.email?.toLowerCase() ||
    a.rollNumber === student.rollNumber
  );

  // Section Performance
  if (assessData?.sections?.length > 0) {
    checkPage(40);
    doc.setTextColor(...c.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Section-wise Performance', 14, y);
    y += 6;
    doc.autoTable({
      startY: y,
      head: [['Section', 'Score', 'Max', 'Percentage', 'Time', 'Status']],
      body: assessData.sections.map(sec => [
        sec.name || sec.sectionName || 'Section',
        String(sec.score || 0),
        String(sec.totalMarks || 0),
        `${Math.round(((sec.score || 0) / Math.max(sec.totalMarks || 1, 1)) * 100)}%`,
        `${sec.timeTaken || sec.timeSpent || 0}s`,
        (sec.score || 0) >= (sec.totalMarks || 1) * 0.5 ? 'Pass' : 'Fail',
      ]),
      theme: 'grid',
      headStyles: { fillColor: c.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tag-based Strength/Weakness
  const questions = assessData?.questions || assessData?.answers || [];
  const tagStats = {};
  questions.forEach(q => {
    (q.tags || (q.topic ? [q.topic] : ['General'])).forEach(tag => {
      if (!tag) return;
      if (!tagStats[tag]) tagStats[tag] = { correct: 0, total: 0 };
      tagStats[tag].total++;
      if (q.isCorrect || q.correct || q.selectedAnswer === q.correctAnswer) tagStats[tag].correct++;
    });
  });
  const tagList = Object.entries(tagStats).map(([tag, s]) => ({
    tag, accuracy: Math.round((s.correct / s.total) * 100), total: s.total
  })).sort((a, b) => b.accuracy - a.accuracy);
  const strengths = tagList.filter(t => t.accuracy >= 70);
  const needsWork = tagList.filter(t => t.accuracy < 50);

  if (tagList.length > 0) {
    checkPage(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...c.dark);
    doc.text('Strength & Improvement Areas', 14, y);
    y += 8;
    const halfW = (pw - 31) / 2;
    const boxH = Math.max(Math.max(strengths.length, needsWork.length) * 7 + 18, 30);

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(...c.success);
    doc.roundedRect(14, y, halfW, boxH, 2, 2, 'FD');
    doc.setTextColor(...c.success);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('✓ STRENGTHS', 18, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...c.dark);
    (strengths.length > 0 ? strengths : [{ tag: 'Keep practicing', accuracy: 0 }]).slice(0, 6).forEach((t, i) => {
      doc.text(`• ${t.tag}${t.accuracy ? ` (${t.accuracy}%)` : ''}`, 18, y + 14 + i * 7);
    });

    const nx = 14 + halfW + 3;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(...c.error);
    doc.roundedRect(nx, y, halfW, boxH, 2, 2, 'FD');
    doc.setTextColor(...c.error);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('⚠ NEEDS ATTENTION', nx + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...c.dark);
    (needsWork.length > 0 ? needsWork : [{ tag: 'No critical weak areas!', accuracy: 0 }]).slice(0, 6).forEach((t, i) => {
      doc.text(`• ${t.tag}${t.accuracy ? ` (${t.accuracy}%)` : ''}`, nx + 4, y + 14 + i * 7);
    });
    y += boxH + 8;
  }

  // Question Analysis Table
  if (questions.length > 0) {
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...c.dark);
    doc.text('Question-by-Question Analysis', 14, y);
    y += 6;
    doc.autoTable({
      startY: y,
      head: [['#', 'Question', 'Tags', 'Result', 'Your Answer', 'Time', 'Difficulty']],
      body: questions.slice(0, 50).map((q, i) => [
        String(i + 1),
        (q.questionText || q.question || 'Question').substring(0, 40),
        (q.tags || [q.topic]).filter(Boolean).join(', ') || 'General',
        q.isCorrect || q.correct ? '✓' : '✗',
        q.selectedAnswer || q.answer || 'N/A',
        `${q.timeSpent || q.timeTaken || 0}s`,
        q.difficulty || 'Medium',
      ]),
      theme: 'striped',
      headStyles: { fillColor: c.primary, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 8 }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Coding Analysis
  const codingSubmissions = assessData?.codingSubmissions || assessData?.coding || [];
  if (codingSubmissions.length > 0) {
    checkPage(40);
    const sorted = [...codingSubmissions].sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0));
    const first = sorted[0];
    const approach = first?.difficulty === 'Hard' ? 'Prefers Challenges' :
      first?.difficulty === 'Easy' ? 'Starts Safe' : 'Balanced Approach';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...c.dark);
    doc.text('Coding Section Analysis', 14, y);
    y += 6;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(...c.primary);
    doc.roundedRect(14, y, pw - 28, 14, 2, 2, 'FD');
    doc.setTextColor(...c.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Coding Approach: ${approach}`, 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...c.gray);
    doc.text(`First submitted: Q${first?.questionNumber || 1} (${first?.difficulty || 'Medium'}) — Language: ${codingSubmissions[0]?.language || 'N/A'}`, 18, y + 12);
    y += 20;

    doc.autoTable({
      startY: y,
      head: [['Q#', 'Problem', 'Language', 'Time Complexity', 'Tests Passed', 'Time']],
      body: codingSubmissions.map((c2, i) => [
        `Q${c2.questionNumber || i + 1}`,
        (c2.problemTitle || c2.title || 'Problem').substring(0, 35),
        c2.language || 'N/A',
        c2.timeComplexity || 'N/A',
        `${c2.testsPassed || 0}/${c2.totalTests || 0}`,
        `${c2.timeTaken || 0}s`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Recommendations
  checkPage(40);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...c.primary);
  doc.roundedRect(14, y, pw - 28, 36, 3, 3, 'FD');
  doc.setTextColor(...c.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Recommendations & Action Plan', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...c.dark);
  const recs = [];
  if (pct < 50) recs.push('Focus on fundamentals – revisit core concepts in weak topics');
  if (pct >= 50 && pct < 70) recs.push('Target 70%+ by practicing topic-specific mock tests');
  if (needsWork.length > 0) recs.push(`Priority topics: ${needsWork.slice(0, 3).map(t => t.tag).join(', ')}`);
  if (strengths.length > 0) recs.push(`Build on strengths: ${strengths.slice(0, 2).map(t => t.tag).join(', ')}`);
  if (pct >= 70) recs.push('Start applying to companies – your profile is competitive');
  if (recs.length === 0) recs.push('Continue current preparation strategy – performance is on track');
  recs.slice(0, 4).forEach((rec, i) => { doc.text(`${i + 1}. ${rec}`, 18, y + 16 + i * 7); });

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SEED-IT Platform — Confidential Student Report', 14, ph - 4);
    doc.text(`Page ${p} of ${totalPages}`, pw - 30, ph - 4);
  }
  doc.save(`SEEDIT_${(student.name || 'Student').replace(/\s/g, '_')}_Report.pdf`);
};

// ─── Fetch Firestore Data (college-scoped) ──────────────────────────────────────
const fetchFirestoreForCollege = async (college) => {
  const mcqResults = [], codingResults = [], assessmentResults = [];
  try {
    const { collectionGroup, getDocs, query, where } = await import('firebase/firestore');

    // MCQ Results
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
    } catch (e) { console.warn('MCQ fetch error:', e); }

    // Coding Results
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
    } catch (e) { console.warn('Coding fetch error:', e); }

    // Assessment_Results
    try {
      const snap = await getDocs(query(collectionGroup(db, 'Assessments')));
      snap.forEach(d => {
        const r = d.data();
        if (r.college === college) assessmentResults.push({ ...r, id: d.id });
      });
    } catch (e) { console.warn('Assessment_Results fetch error:', e); }

  } catch (e) { console.error('Firestore fetch error:', e); }

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

// ─── DonutChart ────────────────────────────────────────────────────────────────
const DonutChart = ({ correct, total }) => {
  if (!total) return null;
  const pct = correct / total;
  const r = 38, cx = 56, cy = 56;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = pct >= 0.7 ? '#22c55e' : pct >= 0.4 ? '#6366f1' : '#ef4444';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={112} height={112}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4} strokeLinecap="round" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={15} fontWeight="bold" fill="#0f172a">{Math.round(pct * 100)}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#475569">Correct</text>
      </svg>
      <Typography variant="caption" color="text.secondary">{correct} / {total}</Typography>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StaffDashboardComponent = () => {
  const navigate = useNavigate();
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('auth_data')) || {}; } catch { return {}; } }, []);
  const college = user?.College || user?.college || 'KGKITE';

  const [activeTab, setActiveTab] = useState(0);
  const [reportTab, setReportTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [showLogout, setShowLogout] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Student drill-down states (Tab 2)
  const [studentView, setStudentView] = useState('list'); // 'list' | 'assessments' | 'analysis'
  const [drillStudent, setDrillStudent] = useState(null);
  const [drillAssessmentData, setDrillAssessmentData] = useState(null);


  // Filter states
  const [searchText, setSearchText] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [testFilter, setTestFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
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
        } catch (e) { console.warn(`Profile fetch failed for year ${yr}:`, e); }
      }
      setStudents(profiles);

      // 2. Supabase results
      let supaResults = [];
      try {
        const { data: mcqData } = await supabase.from('mcq_results').select('*').eq('college', college);
        if (mcqData) supaResults = [...supaResults, ...mcqData.map(r => ({ ...r, type: 'mcq' }))];
      } catch (e) { console.warn('Supabase MCQ error:', e); }
      try {
        const { data: codingData } = await supabase.from('coding_results').select('*').eq('college', college);
        if (codingData) supaResults = [...supaResults, ...codingData.map(r => ({ ...r, type: 'coding' }))];
      } catch (e) { console.warn('Supabase coding error:', e); }

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
      console.error('Error fetching data:', e);
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

    const testMap = {};
    filteredResults.forEach(r => {
      if (!r.testName) return;
      if (!testMap[r.testName]) testMap[r.testName] = { sum: 0, count: 0 };
      testMap[r.testName].sum += r.percentage;
      testMap[r.testName].count++;
    });
    const testData = Object.entries(testMap).map(([t, d]) => ({ label: t.length > 22 ? t.substring(0, 20) + '..' : t, value: parseFloat((d.sum / d.count).toFixed(1)), count: d.count }));

    const sectionMap = {};
    assessmentResults.forEach(r => {
      (r.sections || []).forEach(sec => {
        const n = sec.name || sec.sectionName || 'Section';
        if (!sectionMap[n]) sectionMap[n] = { sum: 0, count: 0 };
        const pct = sec.totalMarks ? (sec.score / sec.totalMarks) * 100 : 0;
        sectionMap[n].sum += pct; sectionMap[n].count++;
      });
    });
    const sectionData = Object.entries(sectionMap).map(([s, d]) => ({ label: s, value: parseFloat((d.sum / d.count).toFixed(1)), count: d.count }));

    const totalCorrect = filteredResults.reduce((s, r) => s + (r.correctAnswers || 0), 0);
    const totalQ = filteredResults.reduce((s, r) => s + (r.totalQuestions || 0), 0);

    return { total, avgPct, highAchievers, topPerformers, needsAttention, deptData, testData, sectionData, totalCorrect, totalQ };
  }, [filteredResults, assessmentResults]);




  // Export marks Excel
  const exportMarks = () => {
    const ws = XLSX.utils.json_to_sheet(filteredResults.map(r => ({
      'Roll Number': r.rollNumber, 'Name': r.name, 'Email': r.email,
      'Department': r.department, 'Year': r.year, 'Test Name': r.testName, 'Type': r.type,
      'Score': r.score, 'Total Marks': r.totalMarks, 'Percentage (%)': r.percentage.toFixed(1),
      'Correct': r.correctAnswers, 'Total Questions': r.totalQuestions,
      'Time Taken': r.timeTaken, 'Violations': r.violationCount,
      'Submitted At': new Date(r.submittedAt).toLocaleString(),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Report');
    XLSX.writeFile(wb, `${college}_Marks_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportSection = () => {
    const rows = [];
    assessmentResults.forEach(r => {
      (r.sections || []).forEach(sec => {
        rows.push({ 'Name': r.name, 'Roll': r.rollNumber, 'Section': sec.name || 'Section', 'Score': sec.score || 0, 'Max': sec.totalMarks || 0, 'Pct%': sec.totalMarks ? ((sec.score / sec.totalMarks) * 100).toFixed(1) : 0, 'Status': (sec.score || 0) >= (sec.totalMarks || 1) * 0.5 ? 'Pass' : 'Fail' });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ note: 'No section data' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sections');
    XLSX.writeFile(wb, `${college}_Sections_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePDF = async (student) => {
    try { setGeneratingPdf(true); await generateStudentPDF(student, assessmentResults); }
    catch (e) { console.error('PDF error:', e); alert('PDF generation failed.'); }
    finally { setGeneratingPdf(false); }
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
        </Tabs>

        {/* ══ REPORTS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Report Type sub-tabs */}
            <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Tabs value={reportTab} onChange={(_, v) => setReportTab(v)}
                sx={{ bgcolor: '#f8fafc', '& .MuiTab-root': { fontSize: 12, fontWeight: 700 } }}>
                <Tab icon={<BarChartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Marks Report" />
                <Tab icon={<AssessmentIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Section Analysis" />
                <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Student Analysis" />

              </Tabs>
            </Paper>

            {/* Shared Filters */}
            {reportTab < 2 && (
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Search" value={searchText} onChange={e => setSearchText(e.target.value)}
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
            )}

            {/* Marks Report */}
            {reportTab === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                  <Button variant="contained" startIcon={<CloudDownloadIcon />} onClick={exportMarks}
                    size="small" sx={{ bgcolor: '#6366f1' }}>Export Excel</Button>
                </Box>
                <TableContainer sx={{ maxHeight: 540, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                        {['Roll No', 'Name', 'Dept', 'Year', 'Test', 'Type', '% Score', 'Correct/Total', 'Time', 'Violations'].map(h => <TableCell key={h}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredResults.length === 0 ? (
                        <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>No results found. Ensure Firebase has data for college "{college}".</TableCell></TableRow>
                      ) : filteredResults.map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{r.rollNumber}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{r.name}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{r.department}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{r.year}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}><Tooltip title={r.testName}><span>{r.testName?.length > 18 ? r.testName.substring(0, 16) + '..' : r.testName}</span></Tooltip></TableCell>
                          <TableCell><Chip label={r.type.toUpperCase()} size="small" sx={{ fontSize: 10, height: 20, bgcolor: r.type === 'coding' ? '#ede9fe' : (r.type === 'assessment' || r.type === 'multisection') ? '#fce7f3' : '#e0f2fe', color: r.type === 'coding' ? '#7c3aed' : (r.type === 'assessment' || r.type === 'multisection') ? '#be185d' : '#0369a1' }} /></TableCell>
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
              </>
            )}

            {/* Section Analysis */}
            {reportTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2}>Overall Accuracy</Typography>
                    <DonutChart correct={stats.totalCorrect} total={stats.totalQ} />
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1}>
                      {[['Total Attempts', stats.total], ['Avg Score', `${stats.avgPct.toFixed(1)}%`], ['High Achievers', stats.highAchievers]].map(([l, v]) => (
                        <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption">{l}</Typography>
                          <Typography variant="caption" fontWeight={700}>{v}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={exportSection} size="small" fullWidth sx={{ mt: 2 }}>Export Sections</Button>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2}>Department Performance</Typography>
                    {stats.deptData.length === 0 ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No data</Box> : (
                      <Stack spacing={2}>
                        {stats.deptData.map(d => (
                          <Box key={d.label}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" fontWeight={600}>{d.label} <Typography component="span" variant="caption" color="text.secondary">({d.count})</Typography></Typography>
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

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2}>Test Performance</Typography>
                    {stats.testData.length === 0 ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No test data</Box> : (
                      <Stack spacing={1.5}>
                        {stats.testData.slice(0, 8).map(d => (
                          <Box key={d.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" noWrap>{d.label}</Typography>
                              <LinearProgress variant="determinate" value={Math.min(d.value, 100)}
                                sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#ec4899', borderRadius: 3 } }} />
                            </Box>
                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 36 }}>{d.value}%</Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid>

                {stats.sectionData.length > 0 && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="subtitle2" fontWeight={700} mb={2}>Assessment Section Averages</Typography>
                      <Grid container spacing={2}>
                        {stats.sectionData.map(sec => (
                          <Grid item xs={6} sm={4} md={3} key={sec.label}>
                            <Card sx={{ p: 2, borderRadius: 2, bgcolor: sec.value >= 70 ? '#f0fdf4' : sec.value >= 40 ? '#eff6ff' : '#fef2f2', border: '1px solid', borderColor: sec.value >= 70 ? '#bbf7d0' : sec.value >= 40 ? '#bfdbfe' : '#fecaca' }}>
                              <Typography variant="caption" fontWeight={600}>{sec.label}</Typography>
                              <Typography variant="h5" fontWeight={800} color={sec.value >= 70 ? 'success.main' : sec.value >= 40 ? 'primary.main' : 'error.main'}>{sec.value}%</Typography>
                              <Typography variant="caption" color="text.secondary">{sec.count} submissions</Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Top / Needs Attention */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEventsIcon sx={{ color: '#15803d' }} /><Typography fontWeight={700}>Top Performers</Typography>
                    </Box>
                    <Divider />
                    {stats.topPerformers.map((r, i) => (
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
                    {stats.needsAttention.length === 0
                      ? <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No students below 40% — Great!</Box>
                      : stats.needsAttention.slice(0, 8).map((r, i) => (
                        <Box key={i} sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: i < Math.min(stats.needsAttention.length, 8) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{r.rollNumber} · {r.department}</Typography>
                          </Box>
                          <Chip label={`${r.percentage.toFixed(0)}%`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700 }} />
                        </Box>
                      ))
                    }
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Student Analysis Tab */}
            {reportTab === 2 && (
              <Box>
                {/* View: Full Analysis */}
                {studentView === 'analysis' && drillStudent && (
                  <StudentAnalysisView
                    student={drillStudent}
                    assessmentData={drillAssessmentData}
                    allStudentResults={allResults}
                    onBack={() => setStudentView('assessments')}
                  />
                )}

                {/* View: Assessment list for student */}
                {studentView === 'assessments' && drillStudent && (() => {
                  const attempts = filteredResults.filter(
                    r => r.email?.toLowerCase() === drillStudent.email?.toLowerCase() ||
                         r.rollNumber === drillStudent.rollNumber
                  );
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Button startIcon={<PersonIcon />} variant="outlined" size="small"
                          onClick={() => { setStudentView('list'); setDrillStudent(null); }} sx={{ borderRadius: 2 }}>
                          All Students
                        </Button>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={800}>{drillStudent.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{drillStudent.rollNumber} · {drillStudent.department}</Typography>
                        </Box>
                        <Chip label={`${attempts.length} Assessments`} sx={{ bgcolor: '#ede9fe', color: '#6d28d9', fontWeight: 700 }} />
                      </Box>
                      {attempts.length === 0
                        ? <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}><Typography>No assessment records found.</Typography></Box>
                        : <Grid container spacing={2.5}>
                            {attempts.map((attempt, i) => {
                              const pct = attempt.percentage || 0;
                              const cc = pct >= 75 ? '#22c55e' : pct >= 40 ? '#6366f1' : '#ef4444';
                              const deepData = assessmentResults.find(
                                d => (d.testID === attempt.testID || d.testName === attempt.testName) &&
                                     (d.email?.toLowerCase() === attempt.email?.toLowerCase() || d.rollNumber === attempt.rollNumber)
                              );
                              return (
                                <Grid item xs={12} sm={6} md={4} key={i}>
                                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', transition: 'all 0.2s', '&:hover': { boxShadow: '0 8px 24px rgba(99,102,241,0.15)', transform: 'translateY(-2px)' } }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Chip label={(attempt.type || 'MCQ').toUpperCase()} size="small"
                                          sx={{ bgcolor: attempt.type === 'coding' ? '#ede9fe' : attempt.type === 'assessment' ? '#fce7f3' : '#e0f2fe', color: attempt.type === 'coding' ? '#6d28d9' : attempt.type === 'assessment' ? '#be185d' : '#0369a1', fontSize: 10, height: 20 }} />
                                        <Chip label={`${Math.round(pct)}%`} sx={{ fontWeight: 700, bgcolor: cc + '18', color: cc, fontSize: 12, height: 24 }} />
                                      </Box>
                                      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ mb: 0.5 }}>{attempt.testName || 'Assessment'}</Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">{attempt.correctAnswers || 0}/{attempt.totalQuestions || 0} correct · {attempt.timeTaken || 'N/A'}</Typography>
                                      {attempt.submittedAt && <Typography variant="caption" color="text.secondary" display="block">{new Date(attempt.submittedAt).toLocaleDateString('en-IN')}</Typography>}
                                      <Box sx={{ mt: 1.5 }}>
                                        <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                                          sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: cc, borderRadius: 3 } }} />
                                      </Box>
                                      {deepData && <Chip label="✓ Deep data" size="small" sx={{ mt: 1, bgcolor: '#f0fdf4', color: '#15803d', fontSize: 9, height: 18 }} />}
                                      <Button fullWidth variant="contained" startIcon={<AssessmentIcon />}
                                        onClick={() => { setDrillAssessmentData(deepData || null); setDrillStudent({ ...attempt }); setStudentView('analysis'); }}
                                        sx={{ mt: 1.5, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2, fontSize: 12 }}>
                                        Generate Analysis
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                      }
                    </Box>
                  );
                })()}

                {/* View: Student list */}
                {studentView === 'list' && (() => {
                  const seen = new Set();
                  const unique = [];
                  [...filteredResults].sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(r => {
                    const key = (r.email || r.rollNumber || '').toLowerCase();
                    if (key && !seen.has(key)) { seen.add(key); unique.push(r); }
                  });
                  const q = studentSearch.toLowerCase();
                  const filtered = unique.filter(s => !q || (s.name || '').toLowerCase().includes(q) || (s.rollNumber || '').toLowerCase().includes(q));

                  return (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>Student Analysis</Typography>
                          <Typography variant="caption" color="text.secondary">{unique.length} students · Click "Analysis" to view assessments</Typography>
                        </Box>
                        <TextField size="small" placeholder="Search name or roll no…" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: 'action.active' }} /> }} sx={{ width: 280 }} />
                      </Box>
                      {filtered.length === 0
                        ? <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}><PersonIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} /><Typography>No students found</Typography></Box>
                        : <Grid container spacing={2}>
                            {filtered.map((student, i) => {
                              const pct = student.percentage || 0;
                              const category = pct >= 85 ? 'Elite' : pct >= 70 ? 'Placement Ready' : pct >= 55 ? 'Near Ready' : pct >= 40 ? 'Developing' : 'Needs Support';
                              const catColor = pct >= 85 ? '#6366f1' : pct >= 70 ? '#22c55e' : pct >= 55 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';
                              const attempts = allResults.filter(r => r.email?.toLowerCase() === student.email?.toLowerCase() || r.rollNumber === student.rollNumber);
                              return (
                                <Grid item xs={12} sm={6} md={4} key={i}>
                                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', transition: 'all 0.2s', '&:hover': { boxShadow: '0 8px 24px rgba(99,102,241,0.12)', transform: 'translateY(-2px)' } }}>
                                    <CardContent sx={{ p: 2 }}>
                                      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                                        <Avatar sx={{ bgcolor: catColor + '20', color: catColor, fontWeight: 800, width: 40, height: 40 }}>{(student.name || 'S')[0].toUpperCase()}</Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="subtitle2" fontWeight={700} noWrap>{student.name}</Typography>
                                          <Typography variant="caption" color="text.secondary" noWrap>{student.rollNumber}</Typography>
                                        </Box>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 0.5 }}>{student.department} · {student.year}</Typography>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Chip label={category} size="small" sx={{ bgcolor: catColor + '15', color: catColor, fontWeight: 700, fontSize: 10, height: 20 }} />
                                        <Typography variant="caption" fontWeight={700} sx={{ color: catColor }}>{Math.round(pct)}%</Typography>
                                      </Box>
                                      <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                                        sx={{ height: 5, borderRadius: 3, mb: 1.5, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: catColor, borderRadius: 3 } }} />
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">{attempts.length} assessment{attempts.length !== 1 ? 's' : ''}</Typography>
                                        <Button size="small" variant="contained"
                                          onClick={() => { setDrillStudent(student); setStudentView('assessments'); }}
                                          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 1.5, fontSize: 11, py: 0.4, px: 1.5 }}>
                                          Analysis
                                        </Button>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                      }
                    </Box>
                  );
                })()}
              </Box>
            )}
          </Box>
        )}

        {/* ══ STUDENT DIRECTORY ════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={5}>
                <TextField fullWidth size="small" label="Search Student" value={dirSearch} onChange={e => setDirSearch(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: 'action.active' }} /> }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small"><InputLabel>Year</InputLabel>
                  <Select value={dirYear} label="Year" onChange={e => setDirYear(e.target.value)}>
                    {dirYears.map(y => <MenuItem key={y} value={y}>{y === 'All' ? 'All Years' : y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControl fullWidth size="small"><InputLabel>Department</InputLabel>
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
                    {['Roll Number', 'Name', 'Email', 'Department', 'Year', 'Premium'].map(h => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No students found</TableCell></TableRow>
                  ) : filteredStudents.map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{s['Roll Number'] || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{s.Name || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{s.Email || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{s.Department || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{s.Year || 'N/A'}</TableCell>
                      <TableCell>
                        {s.Premium === true || s.Premium === 'true' || s.Premium === 'Yes'
                          ? <Chip label="Premium" color="secondary" size="small" sx={{ fontWeight: 700, height: 20, fontSize: 10 }} />
                          : <Chip label="Free" size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ══ PERFORMANCE INSIGHTS ═════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 2, bgcolor: '#fdf4ff', display: 'flex', gap: 1, alignItems: 'center' }}>
                    <EmojiEventsIcon sx={{ color: '#9333ea' }} /><Typography fontWeight={700}>High Performers (≥80%)</Typography>
                  </Box>
                  <Divider />
                  {stats.topPerformers.filter(r => r.percentage >= 80).length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No high performers yet</Box>
                  ) : stats.topPerformers.filter(r => r.percentage >= 80).map((r, i) => (
                    <Box key={i} sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.rollNumber} | {r.department} | {r.testName}</Typography>
                      </Box>
                      <Chip label={`${r.percentage.toFixed(0)}%`} size="small" color="success" sx={{ fontWeight: 700 }} />
                    </Box>
                  ))}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>Department Avg Performance</Typography>
                  {stats.deptData.length === 0 ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No data</Box> : (
                    <Stack spacing={2}>
                      {stats.deptData.map(d => (
                        <Box key={d.label}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{d.label} <Typography component="span" variant="caption" color="text.secondary">({d.count})</Typography></Typography>
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
      </Paper>

      {/* Logout overlay */}
      {showLogout && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(15,23,42,0.75)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#fff', backdropFilter: 'blur(5px)' }}>
          <Typography variant="h5" fontWeight="bold" mb={1}>Goodbye, {user?.Name || 'Staff'}!</Typography>
          <Typography>Logging you out…</Typography>
        </Box>
      )}
    </Box>
  );
};

const StaffDashboard = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <StaffDashboardComponent />
  </ThemeProvider>
);

export default StaffDashboard;