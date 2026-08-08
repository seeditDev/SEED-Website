import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StudentAnalysisView from './StudentAnalysisView';
import TestCreator from './TestCreator';
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
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FolderZip as FolderZipIcon } from '@mui/icons-material';
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

// ─── PDF Sanitization Helper ──────────────────────────────────────────────────
const sanitizePDFText = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, '-').replace(/&mdash;/g, '-')
    .replace(/â€™/g, "'").replace(/â€˜/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"')
    .replace(/â€“/g, '-').replace(/â€”/g, '-')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1').replace(/\\[a-zA-Z]+/g, '')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[\u2713\u2714]/g, '[OK]')
    .replace(/[\u2717\u2718]/g, '[X]')
    .replace(/<[^>]*>/g, '')
    .replace(/[^\x20-\x7E\t\n]/g, '')
    .trim();
};

// ─── Coding Submissions Extraction Helper ────────────────────────────────────
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

const formatDateDisplay = (val, fallback = '—') => {
  if (!val) return fallback;
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try { return val.toDate().toLocaleDateString('en-IN'); } catch (_) {}
    }
    if (typeof val.seconds === 'number') {
      try { return new Date(val.seconds * 1000).toLocaleDateString('en-IN'); } catch (_) {}
    }
    return fallback;
  }
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-IN');
  } catch (_) {
    return fallback;
  }
};

const formatYear = (yearVal) => {
  if (!yearVal || yearVal === 'All') return yearVal || 'N/A';
  const str = String(yearVal).trim().toUpperCase();
  if (/^2K\d{2}$/.test(str)) return str;
  if (/^20\d{2}$/.test(str)) return `2K${str.slice(2)}`;
  const match20 = str.match(/20(\d{2})/);
  if (match20) return `2K${match20[1]}`;
  const match2k = str.match(/2K(\d{2})/);
  if (match2k) return `2K${match2k[1]}`;
  if (str === 'IV' || str === '4' || str === '4TH' || str === 'FINAL' || str === 'FOURTH') return '2K27';
  if (str === 'III' || str === '3' || str === '3RD' || str === 'THIRD') return '2K28';
  if (str === 'II' || str === '2' || str === '2ND' || str === 'SECOND') return '2K29';
  if (str === 'I' || str === '1' || str === '1ST' || str === 'FIRST') return '2K30';
  return str;
};

// ─── Individual Student PDF Document Builder ─────────────────────────────────
const createStudentPDFDoc = async (student, assessmentResults) => {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 0;

  const colors = {
    primary: [99, 102, 241],
    secondary: [236, 72, 153],
    success: [34, 197, 94],
    warning: [251, 191, 36],
    error: [239, 68, 68],
    dark: [15, 23, 42],
    light: [248, 250, 252],
    gray: [71, 85, 105],
  };

  const addPage = () => { doc.addPage(); y = 15; };
  const checkPage = (needed = 20) => { if (y + needed > ph - 15) addPage(); };

  // ── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pw, 38, 'F');
  doc.setFillColor(...colors.secondary);
  doc.rect(0, 34, pw, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SEED SEB COMPANY READINESS REPORT', pw / 2, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Performance & Placement Readiness Report', pw / 2, 22, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 30);
  doc.text(`Report ID: RPT-${Date.now().toString(36).toUpperCase()}`, pw - 60, 30);

  y = 48;

  // ── Student Profile Card ───────────────────────────────────────────────────
  doc.setFillColor(...colors.light);
  doc.roundedRect(14, y, pw - 28, 40, 3, 3, 'F');
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, pw - 28, 40, 3, 3, 'S');

  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(sanitizePDFText(student.name || 'Student Name'), 22, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.gray);
  const profileFields = [
    [`Roll No: ${sanitizePDFText(student.rollNumber || 'N/A')}`, `College: ${sanitizePDFText(student.college || 'N/A')}`],
    [`Department: ${sanitizePDFText(student.department || 'N/A')}`, `Year: ${formatYear(student.year || 'N/A')}`],
    [`Email: ${sanitizePDFText(student.email || 'N/A')}`, `Assessment: ${sanitizePDFText(student.testName || 'N/A')}`],
  ];
  profileFields.forEach((row, idx) => {
    doc.text(row[0], 22, y + 18 + idx * 7);
    doc.text(row[1], pw / 2, y + 18 + idx * 7);
  });

  y += 50;

  // ── Placement Readiness Score ──────────────────────────────────────────────
  const pct = student.percentage || 0;
  let category = '', categoryColor = colors.error, pkg = '';
  if (pct >= 85) { category = 'Placement Ready - Elite'; categoryColor = colors.primary; pkg = 'High chance of cracking Rs.10L+ packages'; }
  else if (pct >= 70) { category = 'Placement Ready'; categoryColor = colors.success; pkg = 'Well-positioned for Rs.4-8L packages'; }
  else if (pct >= 55) { category = 'Near Placement Ready'; categoryColor = [234, 179, 8]; pkg = 'Needs focused prep in weak areas'; }
  else if (pct >= 40) { category = 'Developing'; categoryColor = colors.warning; pkg = 'Requires significant improvement'; }
  else { category = 'Needs Intervention'; categoryColor = colors.error; pkg = 'Immediate academic support recommended'; }

  doc.setFillColor(...categoryColor);
  doc.roundedRect(14, y, pw - 28, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PLACEMENT READINESS ASSESSMENT', 22, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(category, 22, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(pkg, 22, y + 24);

  doc.setFillColor(255, 255, 255);
  doc.circle(pw - 30, y + 14, 12, 'F');
  doc.setTextColor(...categoryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${Math.round(pct)}%`, pw - 37, y + 16);
  doc.setFontSize(7);
  doc.text('SCORE', pw - 35, y + 21);

  y += 36;

  // Summary Metrics Cards
  checkPage(30);
  const summaryItems = [
    { label: 'Overall Score', value: `${student.score || 0}/${student.totalMarks || 100}`, color: colors.primary },
    { label: 'Percentage', value: `${Math.round(pct)}%`, color: pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.error },
    { label: 'Time Taken', value: student.timeTaken || 'N/A', color: colors.gray },
    { label: 'Violations', value: String(student.violationCount || 0), color: (student.violationCount || 0) > 0 ? colors.error : colors.success },
  ];
  const cardW = (pw - 28 - (summaryItems.length - 1) * 3) / summaryItems.length;
  summaryItems.forEach((item, idx) => {
    const cx = 14 + idx * (cardW + 3);
    doc.setFillColor(...item.color);
    doc.roundedRect(cx, y, cardW, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(item.value, cx + cardW / 2, y + 10, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, cx + cardW / 2, y + 16, { align: 'center' });
  });

  y += 28;

  const foundAssess = (assessmentResults || []).find(a =>
    (a.email?.toLowerCase() === student.email?.toLowerCase() || a.rollNumber === student.rollNumber)
  );
  const assessData = foundAssess || student;
  const pdfSecs = Array.isArray(assessData?.sections) ? assessData.sections : (Array.isArray(assessData?.sectionsArray) ? assessData.sectionsArray : []);

  if (pdfSecs.length > 0) {
    checkPage(40);
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Section-wise Performance', 14, y);
    y += 6;

    const sectionRows = pdfSecs.map(sec => [
      sanitizePDFText(sec.name || sec.sectionName || 'Section'),
      String(sec.score !== undefined ? sec.score : 0),
      String(sec.totalMarks || sec.maxScore || 0),
      `${Math.round(((sec.score || 0) / Math.max(sec.totalMarks || 1, 1)) * 100)}%`,
      formatHrMinSec(sec.timeTaken || sec.timeSpent),
      (sec.score || 0) >= (sec.totalMarks || 1) * 0.5 ? 'PASS' : 'FAIL',
    ]);

    doc.autoTable({
      startY: y,
      head: [['Section', 'Score', 'Max', 'Percentage', 'Time Taken', 'Status']],
      body: sectionRows,
      theme: 'grid',
      headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Question-by-Question Analysis
  const questions = assessData?.questions || assessData?.answers || [];
  if (questions.length > 0) {
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...colors.dark);
    doc.text('Question-by-Question Analysis (MCQ)', 14, y);
    y += 6;

    doc.autoTable({
      startY: y,
      head: [['#', 'Question', 'Tags/Topic', 'Result', 'Your Answer', 'Time', 'Difficulty']],
      body: questions.slice(0, 50).map((q, idx) => [
        String(idx + 1),
        sanitizePDFText(q.questionText || q.question || 'Question').substring(0, 45),
        sanitizePDFText((q.tags || [q.topic]).filter(Boolean).join(', ') || 'General'),
        q.isCorrect || q.correct ? 'PASS' : 'FAIL',
        sanitizePDFText(q.selectedAnswer || q.answer || 'N/A').substring(0, 30),
        formatHrMinSec(q.timeSpent || q.timeTaken),
        q.difficulty || 'Medium',
      ]),
      theme: 'striped',
      headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 8 }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Coding Submissions with Code Blocks
  const codingSubmissions = getCodingSubmissions(student, assessData);
  if (codingSubmissions.length > 0) {
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...colors.dark);
    doc.text('Coding Submissions & Code Blocks', 14, y);
    y += 6;

    codingSubmissions.forEach((cSub, idx) => {
      checkPage(40);
      const qNum = cSub.questionNumber || idx + 1;
      const title = sanitizePDFText(cSub.problemTitle || cSub.title || `Problem ${qNum}`);
      const lang = cSub.language || 'Code';
      const tests = `${cSub.testsPassed || 0}/${cSub.totalTests || 0}`;
      const code = cSub.code || cSub.submittedCode || cSub.solutionCode || cSub.solution || '';

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, y, pw - 28, 10, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Q${qNum}: ${title} (${lang})`, 18, y + 6.5);
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Tests Passed: ${tests}`, pw - 50, y + 6.5);
      y += 12;

      if (code) {
        const lines = code.split('\n').slice(0, 60);
        const codeBoxH = Math.min(lines.length * 5.5 + 6, 80);
        checkPage(codeBoxH + 10);
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(14, y, pw - 28, codeBoxH, 2, 2, 'F');
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);

        lines.forEach((line, li) => {
          if (li % 2 === 0) { doc.setFillColor(30, 41, 59); doc.rect(14, y - 1, pw - 28, 5.5, 'F'); }
          doc.setTextColor(148, 163, 184);
          doc.text(String(li + 1).padStart(3, ' '), 16, y + 3.5);
          doc.setTextColor(248, 250, 252);
          doc.text(sanitizePDFText(line).substring(0, 95), 26, y + 3.5);
          y += 5.5;
        });
        y += 4;
      }
    });
  }

  // Recommendations & Action Plan
  checkPage(40);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, y, pw - 28, 36, 3, 3, 'FD');

  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Recommendations & Action Plan', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.dark);

  const recs = [];
  if (pct < 50) recs.push('Focus on fundamentals - revisit core concepts in weak topics');
  if (pct >= 50 && pct < 70) recs.push('Target 70%+ by practicing topic-specific mock tests');
  if (pct >= 70) recs.push('Start applying to companies - profile is competitive');
  if (codingSubmissions.length > 0) recs.push(`Practice more ${codingSubmissions[0]?.language || 'coding'} problems with optimized solutions`);
  if (recs.length === 0) recs.push('Continue current preparation strategy - performance is on track');

  recs.slice(0, 4).forEach((rec, idx) => {
    doc.text(`${idx + 1}. ${rec}`, 18, y + 16 + idx * 7);
  });

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SEED SEB COMPANY READINESS REPORT - Confidential', 14, ph - 4);
    doc.text(`Page ${p} of ${totalPages}`, pw - 30, ph - 4);
  }

  return doc;
};

const generateStudentPDF = async (student, assessmentResults) => {
  const doc = await createStudentPDFDoc(student, assessmentResults);
  if (!doc) return;
  const cleanTestName = (student.testName || 'Assessment').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanCollege = (student.college || 'KGKITE').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanYear = formatYear(student.year || 'All').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanName = (student.name || student.rollNumber || 'Student').replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`SEED-${cleanTestName}-${cleanCollege}-${cleanYear}-${cleanName}.pdf`);
};

// ─── Fetch Firestore Data (college-scoped) ──────────────────────────────────────
const fetchFirestoreForCollege = async (college) => {
  const mcqResults = [], codingResults = [], assessmentResults = [];
  try {
    const { collectionGroup, getDocs, query, where } = await import('firebase/firestore');

    // 1. Full Assessment Results (students subcollection under AssessmentResults)
    try {
      const q = query(collectionGroup(db, 'students'));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const r = d.data();
        if (!r) return;
        const studentCollege = (r.college || r.College || '').toUpperCase().trim();
        const targetCollege = (college || '').toUpperCase().trim();
        if (targetCollege && studentCollege && studentCollege !== targetCollege) return;

        // Skip non-submitted / in-progress docs unless completed or submitted flag is set
        const isStartedOnly = (r.status === 'started' || r.status === 'in_progress') && !r.completed && !r.submitted;
        if (isStartedOnly) return;

        const type = r.type || r.testType || 'multisection';
        const pct = r.percentage !== undefined
          ? (r.percentage > 1 ? r.percentage : (r.percentage || 0) * 100)
          : (r.score && r.totalMarks ? (r.score / r.totalMarks) * 100 : 0);

        const normalizedDoc = {
          ...r,
          id: d.id,
          type,
          percentage: isNaN(pct) ? 0 : pct,
          testName: r.testName || r.assessmentName || r.test_name || 'Assessment',
          testID: r.testID || r.assessmentID || r.assessmentId || r.test_id || d.id,
          startedAt: r.startedAt || r.timeStartedISO || r.started_at,
          submittedAt: r.submittedAt || r.submittedAtISO || r.submitted_at,
          sections: Array.isArray(r.sectionsArray) && r.sectionsArray.length > 0
            ? r.sectionsArray
            : (Array.isArray(r.sections)
              ? r.sections
              : (r.sections && typeof r.sections === 'object' ? Object.values(r.sections) : []))
        };

        assessmentResults.push(normalizedDoc);
        if (type === 'coding') {
          codingResults.push(normalizedDoc);
        } else {
          mcqResults.push(normalizedDoc);
        }
      });
    } catch (err) {
      /* console.warn('Error querying AssessmentResults (students):', err) */ void 0;
    }

    // 2. MCQ Results (legacy fallback)
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
    } catch (e) { /* console.warn('MCQ fetch error:', e) */ void 0; }

    // 3. Coding Results (legacy fallback)
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
    } catch (e) { /* console.warn('Coding fetch error:', e) */ void 0; }

    // 4. Assessment_Results (legacy fallback)
    try {
      const snap = await getDocs(query(collectionGroup(db, 'Assessments')));
      snap.forEach(d => {
        const r = d.data();
        if (r.college === college) assessmentResults.push({ ...r, id: d.id });
      });
    } catch (e) { /* console.warn('Assessment_Results fetch error:', e) */ void 0; }

  } catch (e) { /* console.error('Firestore fetch error:', e) */ void 0; }

  return { mcqResults, codingResults, assessmentResults };
};

// ─── Normalize result to unified format ─────────────────────────────────────────
const normalize = (r, college) => {
  const scoreVal = typeof r.score === 'number' ? r.score : (Number(r.score) || 0);
  const totalMarks = r.totalMarks !== undefined ? Number(r.totalMarks) : (r.totalQuestions !== undefined ? Number(r.totalQuestions) : 100);
  const pct = r.percentage !== undefined
    ? (r.percentage > 1 ? r.percentage : r.percentage * 100)
    : (totalMarks > 0 ? (scoreVal / totalMarks) * 100 : 0);

  return {
    ...r,
    rollNumber: r.rollNumber || r.roll_number || r['Roll Number'] || 'N/A',
    name: r.name || r.Name || 'Student',
    email: r.email || r.Email || '',
    year: formatYear(r.year || r.Year || 'N/A'),
    department: r.department || r.Department || 'N/A',
    college: r.college || r.College || college,
    testName: r.testName || r.assessmentName || r.test_name || r['Test Name'] || 'Test',
    testID: r.testID || r.assessmentID || r.test_id || '',
    type: r.type || r.testType || 'mcq',
    score: scoreVal,
    totalMarks: totalMarks,
    percentage: isNaN(pct) ? 0 : Math.min(100, Math.max(0, Math.round(pct * 100) / 100)),
    correctAnswers: typeof r.correctAnswers === 'number' ? r.correctAnswers : (typeof r.correct_answers === 'number' ? r.correct_answers : scoreVal),
    totalQuestions: r.totalQuestions || r.total_questions || totalMarks,
    timeTaken: r.timeTakenFormatted || r.time_taken_formatted || (r.timeTakenSeconds ? `${r.timeTakenSeconds}s` : (r.timeTaken ? `${r.timeTaken}s` : 'N/A')),
    submittedAt: r.submittedAt || r.submitted_at || new Date().toISOString(),
    autoSubmitted: r.autoSubmitted || false,
    violationCount: r.violationCount || r.violation_count || 0,
    sections: Array.isArray(r.sectionsArray) && r.sectionsArray.length > 0 ? r.sectionsArray : (Array.isArray(r.sections) ? r.sections : []),
    questions: Array.isArray(r.questions) ? r.questions : (Array.isArray(r.answers) ? r.answers : []),
    codingSubmissions: Array.isArray(r.codingSubmissions) ? r.codingSubmissions : (Array.isArray(r.coding) ? r.coding : []),
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
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Student drill-down states (Tab 2)
  const [studentView, setStudentView] = useState('list'); // 'list' | 'assessments' | 'analysis'
  const [drillStudent, setDrillStudent] = useState(null);
  const [drillAssessmentData, setDrillAssessmentData] = useState(null);

  const downloadAllPDFsAsZip = async () => {
    if (!filteredResults || filteredResults.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();
      const results = filteredResults;
      const total = results.length;

      for (let i = 0; i < total; i++) {
        const student = results[i];
        const doc = await createStudentPDFDoc(student, assessmentResults);
        const pdfBlob = doc.output('blob');

        const cleanTestName = (student.testName || (testFilter !== 'All' ? testFilter : 'Assessment')).replace(/[/\\?%*:|"<>]/g, '_');
        const cleanCollege = (student.college || college || 'COLLEGE').replace(/[/\\?%*:|"<>]/g, '_');
        const cleanYear = formatYear(student.year || 'All').replace(/[/\\?%*:|"<>]/g, '_');
        const cleanName = (student.name || student.rollNumber || `Student_${i + 1}`).replace(/[/\\?%*:|"<>]/g, '_');
        const fileName = `SEED-${cleanTestName}-${cleanCollege}-${cleanYear}-${cleanName}.pdf`;

        zip.file(fileName, pdfBlob);
        setZipProgress(Math.round(((i + 1) / total) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const cleanTestName = (testFilter !== 'All' ? testFilter : 'Assessment').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanCollege = (college || 'COLLEGE').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanYear = (yearFilter !== 'All' ? yearFilter : 'All').replace(/[/\\?%*:|"<>]/g, '_');
      saveAs(content, `SEED-${cleanTestName}-${cleanCollege}-${cleanYear}-All_Student_PDFs.zip`);
    } catch (err) {
      console.error('Error generating ZIP:', err);
      alert(`Error generating ZIP: ${err.message}`);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

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
        } catch (e) { /* console.warn(`Profile fetch failed for year ${yr}:`, e) */ void 0; }
      }
      setStudents(profiles);

      // 2. Supabase results
      let supaResults = [];
      try {
        const { data: mcqData } = await supabase.from('mcq_results').select('*').eq('college', college);
        if (mcqData) supaResults = [...supaResults, ...mcqData.map(r => ({ ...r, type: 'mcq' }))];
      } catch (e) { /* console.warn('Supabase MCQ error:', e) */ void 0; }
      try {
        const { data: codingData } = await supabase.from('coding_results').select('*').eq('college', college);
        if (codingData) supaResults = [...supaResults, ...codingData.map(r => ({ ...r, type: 'coding' }))];
      } catch (e) { /* console.warn('Supabase coding error:', e) */ void 0; }

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
      /* console.error('Error fetching data:', e) */ void 0;
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
      const secs = Array.isArray(r.sections)
        ? r.sections
        : (Array.isArray(r.sectionsArray)
          ? r.sectionsArray
          : (r.sections && typeof r.sections === 'object' ? Object.values(r.sections) : []));

      secs.forEach(sec => {
        const n = sec.name || sec.sectionName || 'Section';
        if (!sectionMap[n]) sectionMap[n] = { sum: 0, count: 0 };
        const scoreVal = sec.score !== undefined ? sec.score : (sec.data?.score || 0);
        const totalVal = sec.totalMarks || sec.maxScore || sec.data?.totalMarks || 0;
        const pct = totalVal ? (scoreVal / totalVal) * 100 : 0;
        sectionMap[n].sum += pct; sectionMap[n].count++;
      });
    });
    const sectionData = Object.entries(sectionMap).map(([s, d]) => ({ label: s, value: parseFloat((d.sum / d.count).toFixed(1)), count: d.count }));

    const totalCorrect = filteredResults.reduce((s, r) => s + (r.correctAnswers || 0), 0);
    const totalQ = filteredResults.reduce((s, r) => s + (r.totalQuestions || 0), 0);

    return { total, avgPct, highAchievers, topPerformers, needsAttention, deptData, testData, sectionData, totalCorrect, totalQ };
  }, [filteredResults, assessmentResults]);

  // Export marks Excel – 2-row aligned structured report
  const exportMarks = () => {
    if (!filteredResults || filteredResults.length === 0) return;

    // Detect coding questions
    const allCodingQs = new Map();
    filteredResults.forEach(r => {
      const cSubs = getCodingSubmissions(r);
      cSubs.forEach((c, idx) => {
        const qNum = c.questionNumber || idx + 1;
        const qKey = `Q${qNum}`;
        if (!allCodingQs.has(qKey)) {
          allCodingQs.set(qKey, {
            qNum,
            qKey,
            title: c.problemTitle || c.title || `Problem ${qNum}`,
          });
        }
      });
    });
    const codingQList = Array.from(allCodingQs.values()).sort((a, b) => a.qNum - b.qNum);
    const codingSecTotalMarks = 40;
    const defaultQMax = Math.max(1, Math.round(codingSecTotalMarks / Math.max(1, codingQList.length || 1)));

    const baseHeaders1 = ['#', 'Roll Number', 'Candidate Name', 'Email', 'College', 'Department', 'Year',
      'Start Time', 'End Time', 'Total Time Taken', 'Violations', 'Auto Submitted'];
    const baseHeaders2 = ['#', 'Roll Number', 'Candidate Name', 'Email', 'College', 'Department', 'Year',
      'Start Time', 'End Time', 'Total Time Taken', 'Violations', 'Auto Submitted'];

    const sectionHeaders1 = ['Section Scores', '', '', ''];
    const sectionHeaders2 = ['Score', 'Total Marks', 'Percentage', 'Time Taken'];

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

    const dataRowCells = filteredResults.map((r, idx) => {
      const base = [
        idx + 1, r.rollNumber || 'N/A', r.name || 'N/A', r.email || 'N/A',
        r.college || college, r.department || 'N/A', formatYear(r.year),
        formatTime(r.startedAt || r.started_at), formatTime(r.submittedAt || r.submitted_at),
        r.timeTaken || 'N/A', r.violationCount || 0,
        r.autoSubmitted ? 'Yes' : 'No',
      ];

      const secCells = [r.score || 0, r.totalMarks || 100, `${r.percentage ? r.percentage.toFixed(0) : 0}%`, r.timeTaken || 'N/A'];

      let codingCells = [];
      if (codingQList.length > 0) {
        const cSubs = getCodingSubmissions(r);
        codingQList.forEach(cq => {
          const cSub = cSubs.find(c => (c.questionNumber || 0) === cq.qNum || (c.problemTitle && c.problemTitle === cq.title));
          const isAttempted = !!(cSub && (cSub.submitted || cSub.code || cSub.testsPassed !== undefined || cSub.score !== undefined || cSub.timeTaken || cSub.timeSpent));
          if (isAttempted) {
            const max = (cSub.totalMarks && cSub.totalMarks < codingSecTotalMarks) ? cSub.totalMarks : ((cSub.maxMarks && cSub.maxMarks < codingSecTotalMarks) ? cSub.maxMarks : defaultQMax);
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
      const overall = [r.score !== undefined ? r.score : 0, r.totalMarks || 100, `${pct}%`, pct >= 50 ? 'PASS' : 'FAIL', formatDateDisplay(r.submittedAt)];
      const perf = [ic.insight, ic.category];

      return [...base, ...secCells, ...codingCells, ...overall, ...perf];
    });

    const dataAoa = [row1Names, row2Names, ...dataRowCells];
    const ws = XLSX.utils.aoa_to_sheet(dataAoa);

    const merges = [];
    // Vertical merges for Base Headers (Row 0 to Row 1)
    for (let c = 0; c < baseHeaders1.length; c++) {
      merges.push({ s: { r: 0, c }, e: { r: 1, c } });
    }

    let colIdx = baseHeaders1.length;
    // Section Headers
    merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 3 } });
    colIdx += 4;

    // Coding Question Headers
    if (codingQList.length > 0) {
      codingQList.forEach(() => {
        merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 3 } });
        colIdx += 4;
      });
    }

    // Overall
    merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 4 } });
    colIdx += 5;

    // Performance
    merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 1 } });

    ws['!merges'] = merges;
    ws['!cols'] = row1Names.map((_, ci) => ({
      wch: Math.max(14, ...dataAoa.map(r => String(r[ci] || '').length + 2))
    }));

    const cleanTestName = (testFilter !== 'All' ? testFilter : 'All_Assessments').replace(/[/\\?%*:|"<>]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Report');
    XLSX.writeFile(wb, `SEED-${cleanTestName}-${college}-${dateStr}.xlsx`);
  };

  const exportSection = () => {
    const rows = [];
    assessmentResults.forEach(r => {
      const secs = Array.isArray(r.sections)
        ? r.sections
        : (Array.isArray(r.sectionsArray)
          ? r.sectionsArray
          : (r.sections && typeof r.sections === 'object' ? Object.values(r.sections) : []));

      secs.forEach(sec => {
        const scoreVal = sec.score !== undefined ? sec.score : (sec.data?.score || 0);
        const totalVal = sec.totalMarks || sec.maxScore || sec.data?.totalMarks || 0;
        rows.push({ 'Name': r.name, 'Roll': r.rollNumber, 'Section': sec.name || sec.sectionName || 'Section', 'Score': scoreVal, 'Max': totalVal, 'Pct%': totalVal ? ((scoreVal / totalVal) * 100).toFixed(1) : 0, 'Status': scoreVal >= (totalVal || 1) * 0.5 ? 'Pass' : 'Fail' });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ note: 'No section data' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sections');
    XLSX.writeFile(wb, `${college}_Sections_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePDF = async (student) => {
    try { setGeneratingPdf(true); await generateStudentPDF(student, assessmentResults); }
    catch (e) { /* console.error('PDF error:', e) */ void 0; alert('PDF generation failed.'); }
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
          <Tab label="Test Creator" sx={{ fontWeight: 700 }} />
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
                <Tab icon={<AssessmentIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Spoken English Reports" />
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mb: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<FolderZipIcon />}
                    onClick={downloadAllPDFsAsZip}
                    disabled={isZipping}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    {isZipping ? `ZIP (${zipProgress}%)...` : 'ZIP Download'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    onClick={exportMarks}
                    size="small"
                    sx={{ bgcolor: '#6366f1' }}
                  >
                    Export Excel
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 540, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                        {['Roll No', 'Name', 'Dept', 'Year', 'Test', 'Type', '% Score', 'Total Marks', 'Time', 'Violations', 'Actions'].map(h => <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredResults.length === 0 ? (
                        <TableRow><TableCell colSpan={11} align="center" sx={{ py: 5, color: 'text.secondary' }}>No results found. Ensure Firebase has data for college "{college}".</TableCell></TableRow>
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
                          <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{r.score !== undefined && r.totalMarks ? `${r.score} / ${r.totalMarks}` : `${r.correctAnswers}/${r.totalQuestions}`}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{r.timeTaken}</TableCell>
                          <TableCell>
                            {(r.violationCount || 0) > 0
                              ? <Chip label={r.violationCount} size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />
                              : <Chip label="Clear" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PdfIcon />}
                              onClick={() => handlePDF(r)}
                              disabled={generatingPdf}
                              sx={{ fontSize: 10, py: 0.2, px: 1, borderRadius: 1.5 }}
                            >
                              PDF
                            </Button>
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

            {/* Spoken English Reports Tab */}
            {reportTab === 3 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Spoken English & Communication Reports
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => {
                      const rows = allResults.filter(r => r.testType === 'spoken_english' || r.cefrLevel).map(r => ({
                        'Roll Number': r.rollNumber || 'N/A',
                        'Student Name': r.studentName || r.name || 'N/A',
                        'Email': r.email || 'N/A',
                        'College': r.college || 'N/A',
                        'Department': r.department || 'N/A',
                        'Year': r.year || 'N/A',
                        'Test Name': r.testName || 'Spoken English Assessment',
                        'CEFR Level': r.cefrLevel || 'N/A',
                        'CEFR Rating': r.cefrName || 'N/A',
                        'Accuracy (%)': r.percentage || r.score || 0,
                        'Speaking Pace (WPM)': r.wpm || 0,
                        'Fillers Used': r.fillerCount || 0,
                      }));
                      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ note: 'No spoken English data' }]);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Spoken English Reports');
                      XLSX.writeFile(wb, `SEEDIT_Spoken_English_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
                    }}
                    sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                  >
                    Export Spoken English Excel
                  </Button>
                </Box>

                <TableContainer sx={{ maxHeight: 550, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#0f172a', color: '#38bdf8', fontWeight: 800, fontSize: 11 } }}>
                        <TableCell>#</TableCell>
                        <TableCell>Roll Number</TableCell>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Year</TableCell>
                        <TableCell align="center">CEFR Level</TableCell>
                        <TableCell align="center">Accuracy Score</TableCell>
                        <TableCell align="center">Speaking Pace</TableCell>
                        <TableCell align="center">Fillers Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allResults.filter(r => r.testType === 'spoken_english' || r.cefrLevel).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No spoken English assessment records found for this cohort.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allResults.filter(r => r.testType === 'spoken_english' || r.cefrLevel).map((row, idx) => {
                          const cefrColor = row.cefrLevel === 'C2' ? '#10b981' : row.cefrLevel === 'C1' ? '#3b82f6' : row.cefrLevel === 'B2' ? '#8b5cf6' : row.cefrLevel === 'B1' ? '#f59e0b' : '#ef4444';
                          return (
                            <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                              <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{idx + 1}</TableCell>
                              <TableCell sx={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{row.rollNumber || 'N/A'}</TableCell>
                              <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{row.studentName || row.name || 'N/A'}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{row.department || 'N/A'}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{row.year || 'N/A'}</TableCell>
                              <TableCell align="center">
                                <Chip label={`${row.cefrLevel || 'B2'} (${row.cefrName || 'Upper Inter'})`} size="small" sx={{ bgcolor: cefrColor + '20', color: cefrColor, fontWeight: 900, fontSize: 11 }} />
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: 12, fontWeight: 800, color: '#0284c7' }}>{row.percentage || row.score || 0}%</TableCell>
                              <TableCell align="center" sx={{ fontSize: 12, fontWeight: 700 }}>{row.wpm || 0} WPM</TableCell>
                              <TableCell align="center">
                                <Chip label={`${row.fillerCount || 0} fillers`} size="small" sx={{ bgcolor: (row.fillerCount || 0) > 3 ? '#fef3c7' : '#dcfce7', color: (row.fillerCount || 0) > 3 ? '#b45309' : '#15803d', fontWeight: 800, fontSize: 10 }} />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
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
        
        {/* ══ TEST CREATOR TAB ══════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <Box sx={{ p: 1 }}>
            <TestCreator college={college} />
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