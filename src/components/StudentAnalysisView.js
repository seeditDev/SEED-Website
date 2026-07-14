import React, { useState, useMemo } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Paper, Typography,
  Divider, Stack, Tabs, Tab, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, LinearProgress,
  CircularProgress, Tooltip, Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as TrophyIcon,
  Psychology as BrainIcon,
  Code as CodeIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  School as SchoolIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// ─── AI / Scoring Engine ──────────────────────────────────────────────────────

const COMPANY_PROFILES = [
  { name: 'Amazon',       tier: 'Product', minScore: 72, dsaW: 0.50, color: '#FF9900' },
  { name: 'Microsoft',    tier: 'Product', minScore: 75, dsaW: 0.45, color: '#00A4EF' },
  { name: 'Google',       tier: 'Product', minScore: 85, dsaW: 0.55, color: '#4285F4' },
  { name: 'Goldman Sachs',tier: 'Finance', minScore: 78, dsaW: 0.40, color: '#6699FF' },
  { name: 'Zoho',         tier: 'Product', minScore: 60, dsaW: 0.40, color: '#E42527' },
  { name: 'TCS Digital',  tier: 'Service', minScore: 65, dsaW: 0.30, color: '#0033A0' },
  { name: 'Accenture',    tier: 'Service', minScore: 50, dsaW: 0.25, color: '#A100FF' },
  { name: 'Infosys',      tier: 'Service', minScore: 45, dsaW: 0.20, color: '#007CC3' },
  { name: 'Cognizant',    tier: 'Service', minScore: 48, dsaW: 0.20, color: '#1597E5' },
  { name: 'Wipro',        tier: 'Service', minScore: 42, dsaW: 0.20, color: '#341E68' },
];

const computeTagStats = (questions = []) => {
  const map = {};
  questions.forEach(q => {
    const tags = q.tags?.length ? q.tags : (q.topic ? [q.topic] : ['General']);
    const correct = !!(q.isCorrect || q.correct || (q.selectedAnswer && q.selectedAnswer === q.correctAnswer));
    const skipped = !q.selectedAnswer && !q.answer;
    tags.forEach(tag => {
      if (!tag) return;
      if (!map[tag]) map[tag] = { correct: 0, wrong: 0, skipped: 0, total: 0, time: 0 };
      map[tag].total++;
      map[tag].time += (q.timeSpent || q.timeTaken || 0);
      if (skipped) map[tag].skipped++;
      else if (correct) map[tag].correct++;
      else map[tag].wrong++;
    });
  });
  return Object.entries(map).map(([tag, s]) => ({
    tag, ...s,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    avgTime: s.total > 0 ? Math.round(s.time / s.total) : 0,
  })).sort((a, b) => b.accuracy - a.accuracy);
};

const computePlacementScore = (student, tagStats, codingData = []) => {
  const mcq = (student.percentage || 0) * 0.30;
  const codingPassed = codingData.length
    ? (codingData.reduce((s, c) => s + (c.testsPassed || 0), 0) /
       codingData.reduce((s, c) => s + (c.totalTests || 1), 0)) * 100
    : (student.percentage || 0);
  const coding = codingPassed * 0.40;
  const tagMastery = tagStats.length
    ? tagStats.reduce((s, t) => s + t.accuracy, 0) / tagStats.length
    : (student.percentage || 0);
  const tag = tagMastery * 0.15;
  const time = (student.percentage || 0) * 0.15;
  return Math.min(100, Math.round(mcq + coding + tag + time));
};

const computeCompanyMatch = (student, placementScore, tagStats) => {
  const dsa = tagStats.length
    ? tagStats.reduce((s, t) => s + t.accuracy, 0) / tagStats.length / 100
    : (student.percentage || 0) / 100;
  return COMPANY_PROFILES.map(c => {
    const base = student.percentage || 0;
    const prob = base >= c.minScore
      ? Math.min(100, Math.round(base * (1 - c.dsaW) + dsa * c.dsaW * 100))
      : Math.max(0, Math.round(base * 0.5 * (1 - c.dsaW) + dsa * c.dsaW * 60));
    return { ...c, probability: prob };
  }).sort((a, b) => b.probability - a.probability);
};

const generateNarrative = (student, tagStats, placementScore, weakTopics, strongTopics) => {
  const name = (student.name || 'The student').split(' ')[0];
  const pct = Math.round(student.percentage || 0);
  const strong = strongTopics.slice(0, 2).map(t => t.tag).join(' and ') || 'core problem-solving';
  const weak = weakTopics.slice(0, 2).map(t => t.tag).join(' and ') || 'advanced topics';
  const tier = placementScore >= 85 ? 'highly suitable for both product and service-based companies'
    : placementScore >= 70 ? 'well-positioned for service companies with good product company potential'
    : placementScore >= 55 ? 'suitable for service companies with focused preparation'
    : 'in early placement readiness and requires structured study';
  const timeRemark = pct >= 80 ? 'Time management is excellent.' : pct >= 60 ? 'Time management is adequate.' : 'Time management needs improvement.';
  return `${name} demonstrates strong logical reasoning and performs consistently in ${strong}. Performance in ${weak} requires targeted improvement. ${timeRemark} With an overall score of ${pct}%, the candidate is ${tier}.`;
};

const generateLearningPath = (weakTopics) => {
  const topWeak = weakTopics.slice(0, 6).map(t => t.tag);
  if (!topWeak.length) {
    return [
      { week: 1, topics: ['Arrays', 'HashMap'] },
      { week: 2, topics: ['Sorting', 'Binary Search'] },
      { week: 3, topics: ['Stack', 'Queue', 'Recursion'] },
      { week: 4, topics: ['Trees', 'Graphs'] },
    ];
  }
  const weeks = [];
  for (let i = 0; i < topWeak.length; i += 2) {
    weeks.push({ week: weeks.length + 1, topics: topWeak.slice(i, i + 2) });
  }
  return weeks;
};

// ─── SVG Chart Components ─────────────────────────────────────────────────────

const PieChart = ({ data, size = 190 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>No data</Box>;
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const a = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + a), y2 = cy + r * Math.sin(angle + a);
    const lx = cx + r * 0.62 * Math.cos(angle + a / 2);
    const ly = cy + r * 0.62 * Math.sin(angle + a / 2);
    const slice = { path: `M${cx},${cy}L${x1},${y1}A${r},${r},0,${a > Math.PI ? 1 : 0},1,${x2},${y2}Z`, color: d.color, lx, ly, pct: Math.round(d.value / total * 100), label: d.label, value: d.value };
    angle += a;
    return slice;
  });
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <svg width={size} height={size}>
        {slices.map((s, i) => <g key={i}><path d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} />{s.pct > 7 && <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.07} fontWeight="bold" fill="#fff">{s.pct}%</text>}</g>)}
        <circle cx={cx} cy={cy} r={r * 0.42} fill="#fff" />
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize={size * 0.09} fontWeight="bold" fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={size * 0.065} fill="#475569">Total</text>
      </svg>
      <Stack spacing={1}>
        {slices.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: s.color }} />
            <Typography variant="caption">{s.label}</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ ml: 0.5 }}>{s.value}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const RadarChart = ({ data, size = 240, color = '#6366f1' }) => {
  if (!data || data.length < 3) return null;
  const n = data.length, cx = size / 2, cy = size / 2, r = size * 0.33, lr = r + size * 0.14;
  const pt = (i, val, max = 100) => {
    const a = (2 * Math.PI * i / n) - Math.PI / 2;
    const rv = (Math.min(val, max) / max) * r;
    return { x: cx + rv * Math.cos(a), y: cy + rv * Math.sin(a) };
  };
  const lpt = (i) => { const a = (2 * Math.PI * i / n) - Math.PI / 2; return { x: cx + lr * Math.cos(a), y: cy + lr * Math.sin(a) }; };
  const gridPts = (level) => data.map((_, i) => { const p = pt(i, level); return `${p.x},${p.y}`; }).join(' ');
  const dataPts = data.map((d, i) => { const p = pt(i, d.value); return `${p.x},${p.y}`; }).join(' ');
  return (
    <svg width={size} height={size}>
      {[25, 50, 75, 100].map(l => <polygon key={l} points={gridPts(l)} fill="none" stroke="#e2e8f0" strokeWidth={1} />)}
      {data.map((_, i) => { const e = pt(i, 100); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#e2e8f0" strokeWidth={1} />; })}
      <polygon points={dataPts} fill={color + '28'} stroke={color} strokeWidth={2.5} />
      {data.map((d, i) => { const p = pt(i, d.value); return <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={color} stroke="#fff" strokeWidth={2} />; })}
      {data.map((d, i) => { const lp = lpt(i); return <g key={i}><text x={lp.x} y={lp.y - 4} textAnchor="middle" fontSize={size * 0.045} fontWeight="bold" fill="#1e293b">{d.label}</text><text x={lp.x} y={lp.y + 9} textAnchor="middle" fontSize={size * 0.042} fill={color}>{d.value}%</text></g>; })}
    </svg>
  );
};

const BarChart = ({ data, height = 180, color = '#6366f1' }) => {
  if (!data?.length) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const bw = Math.min(58, Math.floor(380 / data.length) - 8);
  const cw = data.length * (bw + 8) + 28;
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg width={cw} height={height + 48}>
        {[0, 25, 50, 75, 100].map(l => { const y = height - (l / 100) * height; return <g key={l}><line x1={18} y1={y} x2={cw - 8} y2={y} stroke="#f1f5f9" strokeWidth={1} /><text x={14} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{l}</text></g>; })}
        {data.map((d, i) => {
          const bh = Math.max(4, (d.value / maxVal) * height);
          const x = 22 + i * (bw + 8), y = height - bh;
          const bc = d.color || (d.value >= 75 ? '#22c55e' : d.value >= 40 ? color : '#ef4444');
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={bh} rx={5} fill={bc} opacity={0.9} />
              <text x={x + bw / 2} y={height + 15} textAnchor="middle" fontSize={9} fill="#475569">{(d.label || '').length > 9 ? (d.label || '').substring(0, 8) + '.' : d.label}</text>
              <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="bold" fill={bc}>{d.value}{d.suffix || '%'}</text>
            </g>
          );
        })}
        <line x1={16} y1={0} x2={16} y2={height} stroke="#e2e8f0" strokeWidth={1} />
        <line x1={16} y1={height} x2={cw - 8} y2={height} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
    </Box>
  );
};

const GaugeMeter = ({ value, size = 220 }) => {
  const cx = size / 2, cy = size * 0.58, r = size * 0.38;
  const toRad = d => (d * Math.PI) / 180;
  const polar = (deg, radius = r) => ({
    x: cx + radius * Math.cos(toRad(deg - 90)),
    y: cy + radius * Math.sin(toRad(deg - 90)),
  });
  const arc = (s, e, radius = r) => {
    const sp = polar(s, radius), ep = polar(e, radius);
    const large = (e - s) > 180 ? 1 : 0;
    return `M${sp.x},${sp.y} A${radius},${radius},0,${large},1,${ep.x},${ep.y}`;
  };
  const totalArc = 210; // 210° from 210° to 420° (= 60°)
  const valAngle = 210 + (Math.min(value, 100) / 100) * totalArc;
  const zones = [
    { s: 210, e: 294, color: '#ef4444' },
    { s: 294, e: 336, color: '#f59e0b' },
    { s: 336, e: 378, color: '#22c55e' },
    { s: 378, e: 420, color: '#6366f1' },
  ];
  const needleTip = polar(valAngle, r * 0.75);
  let cat = 'Needs Improvement', catColor = '#ef4444';
  if (value >= 85) { cat = 'Excellent'; catColor = '#6366f1'; }
  else if (value >= 70) { cat = 'Good'; catColor = '#22c55e'; }
  else if (value >= 55) { cat = 'Average'; catColor = '#f59e0b'; }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size * 0.72}>
        <path d={arc(210, 420)} fill="none" stroke="#e2e8f0" strokeWidth={22} strokeLinecap="round" />
        {zones.map((z, i) => <path key={i} d={arc(z.s, z.e)} fill="none" stroke={z.color} strokeWidth={22} strokeLinecap="butt" />)}
        <path d={arc(210, Math.min(valAngle, 420))} fill="none" stroke={catColor} strokeWidth={22} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#1e293b" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={9} fill="#1e293b" />
        <circle cx={cx} cy={cy} r={4} fill="#fff" />
        <text x={cx} y={cy - r * 0.22} textAnchor="middle" fontSize={size * 0.115} fontWeight="bold" fill={catColor}>{value}</text>
        <text x={cx} y={cy - r * 0.22 + size * 0.1} textAnchor="middle" fontSize={size * 0.065} fill="#64748b">/100</text>
      </svg>
      <Chip label={cat} sx={{ bgcolor: catColor + '20', color: catColor, fontWeight: 700, fontSize: 13, px: 1.5, mt: 0.5 }} />
    </Box>
  );
};

const Timeline = ({ events }) => {
  if (!events?.length) return <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No timeline data</Box>;
  return (
    <Box sx={{ position: 'relative', pl: 4 }}>
      <Box sx={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, bgcolor: '#e2e8f0', borderRadius: 1 }} />
      <Stack spacing={2.5}>
        {events.map((ev, i) => (
          <Box key={i} sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ position: 'absolute', left: -26, top: 3, width: 14, height: 14, borderRadius: '50%', bgcolor: ev.color || '#6366f1', border: '2px solid #fff', boxShadow: `0 0 0 2px ${ev.color || '#6366f1'}40` }} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{ev.time}</Typography>
              <Typography variant="body2" fontWeight={600}>{ev.label}</Typography>
              {ev.detail && <Typography variant="caption" color="text.secondary" display="block">{ev.detail}</Typography>}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

// ─── PDF: Report 1 (Summary) ──────────────────────────────────────────────────

// ─── PDF: Unified Multi-Page Report (Summary + Analytics + AI Readiness) ────────

const downloadUnifiedPDF = async (student, assessmentData, rank, totalStudents, allStudentResults) => {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
  let y = 0;
  
  const P = [99, 102, 241];    // Primary Indigo
  const S = [236, 72, 153];    // Secondary Pink
  const G = [34, 197, 94];     // Success Green
  const R = [239, 68, 68];     // Error Red
  const D = [15, 23, 42];      // Dark Charcoal
  const Gr = [71, 85, 105];    // Gray
  const LGr = [241, 245, 249]; // Light Gray
  
  const chk = (n = 20) => { if (y + n > ph - 14) { doc.addPage(); y = 14; } };
  
  // ───────────────────────────────────────────────────────────────────────────
  // PAGE 1: MARKS SUMMARY REPORT
  // ───────────────────────────────────────────────────────────────────────────
  
  // Header
  doc.setFillColor(...P); doc.rect(0, 0, pw, 36, 'F');
  doc.setFillColor(...S); doc.rect(0, 32, pw, 4, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
  doc.setFontSize(17); doc.text('SEED-SEB Assessment Platform', 14, 13);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Report 1 — Assessment Summary & Scorecard', 14, 21);
  doc.setFontSize(8); doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 29);
  y = 43;

  // Assessment Info
  doc.setFillColor(239, 246, 255); doc.setDrawColor(...P);
  doc.roundedRect(14, y, pw - 28, 30, 2, 2, 'FD');
  doc.setTextColor(...D); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(student.testName || 'Assessment', 18, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...Gr);
  [
    [`College: ${student.college || 'N/A'}`, `Department: ${student.department || 'N/A'}`],
    [`Date: ${new Date().toLocaleDateString('en-IN')}`, `Duration: ${student.timeTaken || 'N/A'}`],
    [`Type: ${(student.type || 'MCQ').toUpperCase()}`, `Company Pattern: General`],
  ].forEach((row, i) => { doc.text(row[0], 18, y + 16 + i * 5.5); doc.text(row[1], pw / 2, y + 16 + i * 5.5); });
  y += 37;

  // Student Info
  doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pw - 28, 30, 2, 2, 'FD');
  doc.setTextColor(...D); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Student Information', 18, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...Gr);
  [
    [`Name: ${student.name || 'N/A'}`, `Roll No: ${student.rollNumber || 'N/A'}`],
    [`Email: ${student.email || 'N/A'}`, `Year: ${student.year || 'N/A'}`],
    [`Department: ${student.department || 'N/A'}`, `Section: ${student.section || 'N/A'}`],
  ].forEach((row, i) => { doc.text(row[0], 18, y + 16 + i * 5.5); doc.text(row[1], pw / 2, y + 16 + i * 5.5); });
  y += 37;

  // Overall Result Banner
  const pct = Math.round(student.percentage || 0), pass = pct >= 50;
  doc.setFillColor(...(pass ? G : R));
  doc.roundedRect(14, y, pw - 28, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
  doc.setFontSize(16); doc.text(pass ? 'PASS' : 'FAIL', pw - 30, y + 17);
  doc.setFontSize(10); doc.text('Overall Result', 18, y + 9);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`Total Marks: ${student.score || 0} / ${student.totalMarks || 100}   ·   Percentage: ${pct}%   ·   Rank: ${rank} / ${totalStudents}`, 18, y + 19);
  y += 36;

  // Section-wise Table
  const sections = assessmentData?.sections || [];
  chk(40);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
  doc.text('Section-wise Marks', 14, y); y += 5;
  doc.autoTable({
    startY: y,
    head: [['Section', 'Marks Obtained', 'Total Marks', 'Percentage', 'Status']],
    body: sections.length ? sections.map(s => {
      const sp = Math.round(((s.score || 0) / Math.max(s.totalMarks || s.maxScore || 1, 1)) * 100);
      return [s.name || s.sectionName || 'Section', String(s.score || 0), String(s.totalMarks || s.maxScore || 0), `${sp}%`, sp >= 50 ? 'Pass' : 'Fail'];
    }) : [['No section data', '—', '—', '—', '—']],
    theme: 'grid', headStyles: { fillColor: P, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 }, margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 7;

  // Coding Summary (if coding data exists)
  const codingData = assessmentData?.codingSubmissions || assessmentData?.coding || [];
  if (codingData.length) {
    chk(30); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
    doc.text('Coding Summary', 14, y); y += 5;
    doc.autoTable({
      startY: y,
      head: [['Q#', 'Problem', 'Language', 'Status', 'Marks', 'Test Cases']],
      body: codingData.map((c, i) => [`Q${c.questionNumber || i + 1}`, (c.problemTitle || c.title || 'Problem').substring(0, 32), c.language || 'N/A', c.status || 'Attempted', String(c.score || c.marks || 0), `${c.testsPassed || 0}/${c.totalTests || 0}`]),
      theme: 'striped', headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 }, margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PAGE 2: PERFORMANCE ANALYTICS REPORT
  // ───────────────────────────────────────────────────────────────────────────
  doc.addPage();
  
  // Header
  doc.setFillColor(...P); doc.rect(0, 0, pw, 18, 'F');
  doc.setFillColor(...S); doc.rect(0, 16, pw, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Report 2 — Detailed Performance Analytics', 14, 11);
  y = 26;

  // Questions metrics
  const questions = assessmentData?.questions || assessmentData?.answers || [];
  const correct = questions.filter(q => q.isCorrect || q.correct || (q.selectedAnswer && q.selectedAnswer === q.correctAnswer)).length;
  const skipped = questions.filter(q => !q.selectedAnswer && !q.answer).length;
  const wrong = questions.length - correct - skipped;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
  doc.text('Questions Outcome Summary', 14, y); y += 5;
  doc.setFillColor(...LGr); doc.roundedRect(14, y, pw - 28, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...Gr);
  doc.text(`Total Questions: ${questions.length}    ·    Correct: ${correct}    ·    Wrong: ${wrong}    ·    Skipped: ${skipped}`, 18, y + 8.5);
  y += 21;

  // Peer comparison (Horizontal Progress Bars)
  const sameTest = allStudentResults.filter(r => r.testName === student.testName || r.testID === student.testID);
  const collegeAvg = sameTest.length ? sameTest.reduce((s, r) => s + r.percentage, 0) / sameTest.length : 0;
  const deptSame = sameTest.filter(r => r.department === student.department);
  const deptAvg = deptSame.length ? deptSame.reduce((s, r) => s + r.percentage, 0) / deptSame.length : 0;
  const top10 = [...sameTest].sort((a, b) => b.percentage - a.percentage).slice(0, Math.max(1, Math.floor(sameTest.length * 0.1)));
  const top10Avg = top10.length ? top10.reduce((s, r) => s + r.percentage, 0) / top10.length : 0;

  chk(40);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
  doc.text('Peer Benchmark Comparison', 14, y); y += 6;
  [
    { l: 'Student Percentage', v: pct, color: P },
    { l: 'College Average', v: Math.round(collegeAvg), color: S },
    { l: 'Department Average', v: Math.round(deptAvg), color: G },
    { l: 'Top 10% Score Average', v: Math.round(top10Avg), color: [168, 85, 247] }
  ].forEach((item) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...D);
    doc.text(item.l, 14, y + 4);
    doc.text(`${item.v}%`, pw - 24, y + 4);
    
    // Draw bar background
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(65, y, 100, 4.5, 1, 1, 'F');
    // Draw bar fill
    if (item.v > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(65, y, Math.min(item.v, 100), 4.5, 1, 1, 'F');
    }
    y += 8;
  });
  y += 6;

  // Difficulty Distribution
  const diff = { easy: 0, medium: 0, hard: 0, ec: 0, mc: 0, hc: 0 };
  questions.forEach(q => {
    const d = (q.difficulty || 'medium').toLowerCase();
    const ok = !!(q.isCorrect || q.correct || (q.selectedAnswer && q.selectedAnswer === q.correctAnswer));
    if (d === 'easy') { diff.easy++; if (ok) diff.ec++; }
    else if (d === 'hard') { diff.hard++; if (ok) diff.hc++; }
    else { diff.medium++; if (ok) diff.mc++; }
  });

  chk(30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
  doc.text('Accuracy vs Question Difficulty', 14, y); y += 6;
  [
    { l: 'Easy Questions', t: diff.easy, c2: diff.ec, color: G },
    { l: 'Medium Questions', t: diff.medium, c2: diff.mc, color: S },
    { l: 'Hard Questions', t: diff.hard, c2: diff.hc, color: R }
  ].forEach(d => {
    const accuracy = d.t > 0 ? Math.round(d.c2 / d.t * 100) : 0;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...D);
    doc.text(d.l, 14, y + 4);
    doc.text(`${d.c2}/${d.t} (${accuracy}%)`, pw - 34, y + 4);
    
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(65, y, 100, 4.5, 1, 1, 'F');
    if (accuracy > 0) {
      doc.setFillColor(...d.color);
      doc.roundedRect(65, y, accuracy, 4.5, 1, 1, 'F');
    }
    y += 8;
  });
  y += 6;

  // Topic mastery table
  const tagStats = computeTagStats(questions);
  if (tagStats.length) {
    chk(35);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
    doc.text('Topic Mastery Tag Analytics', 14, y); y += 5;
    doc.autoTable({
      startY: y,
      head: [['Topic / Tag', 'Questions', 'Correct', 'Wrong', 'Skipped', 'Accuracy', 'Avg Time']],
      body: tagStats.slice(0, 10).map(t => [t.tag, String(t.total), String(t.correct), String(t.wrong), String(t.skipped), `${t.accuracy}%`, t.avgTime > 0 ? `${t.avgTime}s` : '—']),
      theme: 'grid', headStyles: { fillColor: P, textColor: [255, 255, 255], fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5 }, margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PAGE 3: AI PLACEMENT READINESS REPORT
  // ───────────────────────────────────────────────────────────────────────────
  doc.addPage();

  // Header
  doc.setFillColor(...P); doc.rect(0, 0, pw, 18, 'F');
  doc.setFillColor(...S); doc.rect(0, 16, pw, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Report 3 — AI Placement Readiness & Reaction Plan', 14, 11);
  y = 26;

  // Calculations for report 3
  const placementScore = computePlacementScore(student, tagStats, codingData);
  const companyMatch = computeCompanyMatch(student, placementScore, tagStats);
  const weakTopics = tagStats.filter(t => t.accuracy < 50);
  const strongTopics = tagStats.filter(t => t.accuracy >= 70);
  const narrative = generateNarrative(student, tagStats, placementScore, weakTopics, strongTopics);
  const learningPath = generateLearningPath(weakTopics);

  let category = 'Needs Support', catColor = R, salary = '₹3–4L (Entry Level)';
  if (pct >= 85) { category = 'Placement Ready – Elite'; catColor = P; salary = '₹10L+ (Zoho, Google, Infosys SP)'; }
  else if (pct >= 70) { category = 'Placement Ready'; catColor = G; salary = '₹5–8L (TCS Digital, CTS, Wipro Turbo)'; }
  else if (pct >= 55) { category = 'Near Placement Ready'; catColor = S; salary = '₹4–5L (Infosys SE, Wipro)'; }
  else if (pct >= 40) { category = 'Developing'; catColor = [249, 115, 22]; salary = '₹3–4L (Needs Core Review)'; }

  // Narrative
  doc.setFillColor(243, 244, 246); doc.setDrawColor(...P);
  doc.roundedRect(14, y, pw - 28, 22, 1.5, 1.5, 'FD');
  doc.setTextColor(...D); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('AI ASSESSMENT SUMMARY & CAREER PROFILE', 18, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...Gr);
  const lines = doc.splitTextToSize(narrative, pw - 36).slice(0, 3);
  lines.forEach((line, idx) => doc.text(line, 18, y + 11.5 + idx * 4));
  y += 28;

  // Score details
  chk(20);
  doc.setFillColor(239, 246, 255); doc.roundedRect(14, y, pw - 28, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...D);
  doc.text(`Placement Readiness Score: ${placementScore}/100`, 18, y + 9);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...Gr);
  doc.text(`Category: ${category}    ·    Predicted Package: ${salary}`, 96, y + 9);
  y += 20;

  // Company Match Table
  chk(40);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
  doc.text('Company Compatibility Compatibility Matrix', 14, y); y += 5;
  doc.autoTable({
    startY: y,
    head: [['Company', 'Tier Type', 'Match Probability', 'Fit Rating']],
    body: companyMatch.slice(0, 7).map(co => [co.name, co.tier, `${co.probability}%`, co.probability >= 80 ? 'Highly Recommended' : co.probability >= 60 ? 'Good Fit' : co.probability >= 40 ? 'Possible Match' : 'Requires Preparation']),
    theme: 'grid', headStyles: { fillColor: P, textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 }, margin: { left: 14, right: 14 }
  });
  y = doc.lastAutoTable.finalY + 7;

  // Recommended learning path
  if (learningPath.length) {
    chk(35);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...D);
    doc.text('Recommended Weekly Remediation Path', 14, y); y += 5;
    doc.autoTable({
      startY: y,
      head: [['Timeline', 'Recommended Study Focus Area', 'Remedial Action']],
      body: learningPath.map((w, idx) => [`Week ${w.week}`, w.topics.join(', '), idx === 0 ? 'Review fundamental concepts' : 'Solve medium & hard challenges']),
      theme: 'striped', headStyles: { fillColor: G, textColor: [255, 255, 255], fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5 }, margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  // Summary Footer on all pages
  const tp = doc.internal.getNumberOfPages();
  for (let p = 1; p <= tp; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 23, 42); doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('SEED-SEB Unified Assessment Diagnostics Report · Confidential', 14, ph - 4.5);
    doc.text(`Page ${p} of ${tp}`, pw - 26, ph - 4.5);
  }
  
  doc.save(`SEEDSEB_Unified_Report_${(student.name || 'Student').replace(/\s+/g, '_')}.pdf`);
};

// ─── Report 1: Summary ────────────────────────────────────────────────────────

const SummaryReport = ({ student, assessmentData, rank, totalStudents, allStudentResults }) => {
  const pct = Math.round(student.percentage || 0);
  const pass = pct >= 50;
  const sections = assessmentData?.sections || [];
  const codingData = assessmentData?.codingSubmissions || assessmentData?.coding || [];
  const [busy, setBusy] = useState(false);

  const handlePDF = async () => {
    setBusy(true);
    try { await downloadUnifiedPDF(student, assessmentData, rank, totalStudents, allStudentResults); }
    catch (e) { /* console.error(e) */ void 0; alert('PDF generation failed. Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <Box>
      {/* Assessment header */}
      <Paper sx={{ p: 2.5, mb: 2.5, background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2, fontSize: 10 }}>SEED-SEB ASSESSMENT</Typography>
            <Typography variant="h5" fontWeight={800}>{student.testName || 'Assessment'}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              {[student.college, student.department, student.year, new Date().toLocaleDateString('en-IN')].filter(Boolean).map((v, i) => (
                <Chip key={i} label={v} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10 }} />
              ))}
            </Stack>
          </Box>
          <Button variant="contained" startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <PdfIcon />}
            onClick={handlePDF} disabled={busy}
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
            {busy ? 'Generating…' : 'Download PDF'}
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2.5}>
        {/* Student Info */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary" textTransform="uppercase" sx={{ letterSpacing: 1, fontSize: 11 }}>Student Information</Typography>
            <Stack spacing={1.5}>
              {[['Full Name', student.name], ['Roll Number', student.rollNumber], ['Email', student.email], ['Department', student.department], ['Year', student.year], ['College', student.college]].map(([l, v]) => (
                <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{l}</Typography>
                  <Typography variant="body2" fontWeight={600}>{v || 'N/A'}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Overall Result */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2.5} color="text.secondary" textTransform="uppercase" sx={{ letterSpacing: 1, fontSize: 11 }}>Overall Result</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={900} color={pass ? 'success.main' : 'error.main'}>{pct}%</Typography>
                <Typography variant="caption" color="text.secondary">Overall Percentage</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} color="primary">{student.score || 0} / {student.totalMarks || 100}</Typography>
                <Typography variant="caption" color="text.secondary">Total Marks</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800}>{rank}</Typography>
                <Typography variant="caption" color="text.secondary">Rank / {totalStudents}</Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Chip label={pass ? '✓  PASS' : '✗  FAIL'} sx={{ fontSize: 15, fontWeight: 900, px: 3, py: 0.5, height: 38, bgcolor: pass ? '#dcfce7' : '#fee2e2', color: pass ? '#15803d' : '#dc2626', border: '2px solid', borderColor: pass ? '#22c55e' : '#ef4444' }} />
            </Box>
          </Paper>
        </Grid>

        {/* Section-wise */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight={700}>Section-wise Marks</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                    {['Section', 'Marks Obtained', 'Total Marks', 'Percentage', 'Status'].map(h => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sections.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No section data available for this assessment</TableCell></TableRow>
                  ) : sections.map((sec, i) => {
                    const sp = Math.round(((sec.score || 0) / Math.max(sec.totalMarks || sec.maxScore || 1, 1)) * 100);
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{sec.name || sec.sectionName || `Section ${i + 1}`}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{sec.score || 0}</TableCell>
                        <TableCell>{sec.totalMarks || sec.maxScore || 0}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress variant="determinate" value={Math.min(sp, 100)}
                              sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: sp >= 75 ? '#22c55e' : sp >= 40 ? '#6366f1' : '#ef4444', borderRadius: 3 } }} />
                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 36 }}>{sp}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={sp >= 50 ? 'Pass' : 'Fail'} size="small" sx={{ bgcolor: sp >= 50 ? '#dcfce7' : '#fee2e2', color: sp >= 50 ? '#15803d' : '#dc2626', fontWeight: 700, fontSize: 10, height: 22 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Coding Summary */}
        {codingData.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f5f3ff', borderBottom: '1px solid #ddd6fe', display: 'flex', gap: 1, alignItems: 'center' }}>
                <CodeIcon sx={{ color: '#6d28d9', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700}>Coding Summary</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                      {['Question', 'Problem', 'Language', 'Status', 'Marks', 'Test Cases'].map(h => <TableCell key={h}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {codingData.map((c, i) => {
                      const sc = c.status === 'Accepted' ? '#dcfce7' : c.status === 'Partial' ? '#fef9c3' : '#fee2e2';
                      const tc = c.status === 'Accepted' ? '#15803d' : c.status === 'Partial' ? '#92400e' : '#dc2626';
                      return (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{`Q${c.questionNumber || i + 1}`}</TableCell>
                          <TableCell>{c.problemTitle || c.title || 'Problem'}</TableCell>
                          <TableCell><Chip label={c.language || 'N/A'} size="small" sx={{ height: 20, fontSize: 10 }} /></TableCell>
                          <TableCell><Chip label={c.status || 'Attempted'} size="small" sx={{ bgcolor: sc, color: tc, fontWeight: 700, fontSize: 10, height: 22 }} /></TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{c.score || c.marks || 0}</TableCell>
                          <TableCell>{c.testsPassed || 0}/{c.totalTests || 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// ─── Report 2: Analytics ──────────────────────────────────────────────────────

const AnalyticsReport = ({ student, assessmentData, allStudentResults }) => {
  const questions = assessmentData?.questions || assessmentData?.answers || [];
  const codingData = assessmentData?.codingSubmissions || assessmentData?.coding || [];
  const sections = assessmentData?.sections || [];

  const tagStats = useMemo(() => computeTagStats(questions), [questions]);

  const correct = questions.filter(q => q.isCorrect || q.correct || (q.selectedAnswer && q.selectedAnswer === q.correctAnswer)).length;
  const skipped = questions.filter(q => !q.selectedAnswer && !q.answer).length;
  const wrong = questions.length - correct - skipped;

  const sameTest = allStudentResults.filter(r => r.testName === student.testName || r.testID === student.testID);
  const collegeAvg = sameTest.length ? sameTest.reduce((s, r) => s + r.percentage, 0) / sameTest.length : 0;
  const deptSame = sameTest.filter(r => r.department === student.department);
  const deptAvg = deptSame.length ? deptSame.reduce((s, r) => s + r.percentage, 0) / deptSame.length : 0;
  const top10 = [...sameTest].sort((a, b) => b.percentage - a.percentage).slice(0, Math.max(1, Math.floor(sameTest.length * 0.1)));
  const top10Avg = top10.length ? top10.reduce((s, r) => s + r.percentage, 0) / top10.length : 0;

  const strongTopics = tagStats.filter(t => t.accuracy >= 70);
  const weakTopics = tagStats.filter(t => t.accuracy < 50);

  const radarData = [
    { label: 'Programming', value: Math.min(100, Math.round((correct / Math.max(questions.length, 1)) * 110)) },
    { label: 'Logical', value: Math.round((student.percentage || 0) * 0.95) },
    { label: 'Math', value: tagStats.find(t => /math/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.85) },
    { label: 'Problem Solving', value: codingData.length ? Math.round((codingData.reduce((s, c) => s + (c.testsPassed || 0), 0) / codingData.reduce((s, c) => s + (c.totalTests || 1), 0)) * 100) : Math.round((student.percentage || 0) * 0.9) },
    { label: 'Debugging', value: tagStats.find(t => /debug/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.8) },
    { label: 'Speed', value: Math.min(100, Math.round((student.percentage || 0) * 1.05)) },
  ];

  const diff = { easy: 0, medium: 0, hard: 0, ec: 0, mc: 0, hc: 0 };
  questions.forEach(q => {
    const d = (q.difficulty || 'medium').toLowerCase();
    const ok = !!(q.isCorrect || q.correct || (q.selectedAnswer && q.selectedAnswer === q.correctAnswer));
    if (d === 'easy') { diff.easy++; if (ok) diff.ec++; }
    else if (d === 'hard') { diff.hard++; if (ok) diff.hc++; }
    else { diff.medium++; if (ok) diff.mc++; }
  });

  const sectionBar = sections.map(s => ({
    label: s.name || s.sectionName || 'Sec',
    value: Math.round(((s.score || 0) / Math.max(s.totalMarks || s.maxScore || 1, 1)) * 100),
  }));

  return (
    <Box>
      {/* Dashboard metric chips */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { l: 'Total Score', v: `${Math.round(student.percentage || 0)}%`, c: '#6366f1' },
          { l: 'College Rank', v: sameTest.length ? `#${[...sameTest].sort((a, b) => b.percentage - a.percentage).findIndex(r => r.email === student.email) + 1 || '—'}` : '—', c: '#22c55e' },
          { l: 'Dept Rank', v: deptSame.length ? `#${deptSame.sort((a, b) => b.percentage - a.percentage).findIndex(r => r.email === student.email) + 1 || '—'}` : '—', c: '#f59e0b' },
          { l: 'Time Taken', v: student.timeTaken || 'N/A', c: '#ec4899' },
          { l: 'Correct', v: String(correct), c: '#22c55e' },
          { l: 'Wrong', v: String(wrong), c: '#ef4444' },
          { l: 'Skipped', v: String(skipped), c: '#94a3b8' },
          { l: 'Total Qs', v: String(questions.length || student.totalQuestions || 0), c: '#6366f1' },
        ].map((m, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card sx={{ borderLeft: `4px solid ${m.c}` }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" sx={{ fontSize: 10, letterSpacing: 0.5 }}>{m.l}</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: m.c }}>{m.v}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Pie */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Result Breakdown</Typography>
            <PieChart data={[{ label: 'Correct', value: correct, color: '#22c55e' }, { label: 'Wrong', value: wrong, color: '#ef4444' }, { label: 'Skipped', value: skipped, color: '#94a3b8' }]} size={185} />
          </Paper>
        </Grid>

        {/* Radar */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Skill Radar</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}><RadarChart data={radarData} size={230} color="#6366f1" /></Box>
          </Paper>
        </Grid>

        {/* Section Bar */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Section Performance</Typography>
            {sectionBar.length ? <BarChart data={sectionBar} height={170} /> : <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>No section data</Box>}
          </Paper>
        </Grid>

        {/* Difficulty */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Question Difficulty Distribution</Typography>
            <Stack spacing={2}>
              {[{ l: 'Easy', t: diff.easy, c2: diff.ec, color: '#22c55e' }, { l: 'Medium', t: diff.medium, c2: diff.mc, color: '#f59e0b' }, { l: 'Hard', t: diff.hard, c2: diff.hc, color: '#ef4444' }].map(d => (
                <Box key={d.l}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={d.l} size="small" sx={{ bgcolor: d.color + '20', color: d.color, fontWeight: 700, fontSize: 10, height: 20 }} />
                      <Typography variant="caption" color="text.secondary">{d.t} questions</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={700} color={d.color}>{d.c2}/{d.t} ({d.t > 0 ? Math.round(d.c2 / d.t * 100) : 0}%)</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={d.t > 0 ? (d.c2 / d.t) * 100 : 0}
                    sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: d.color, borderRadius: 4 } }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Comparison */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Performance Comparison</Typography>
            <Stack spacing={2}>
              {[
                { l: 'Your Score', v: Math.round(student.percentage || 0), c: '#6366f1' },
                { l: 'College Average', v: Math.round(collegeAvg), c: '#f59e0b' },
                { l: 'Dept Average', v: Math.round(deptAvg), c: '#22c55e' },
                { l: 'Top 10%', v: Math.round(top10Avg), c: '#ec4899' },
              ].map(d => (
                <Box key={d.l}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{d.l}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: d.c }}>{d.v}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(d.v, 100)}
                    sx={{ height: 10, borderRadius: 5, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: d.c, borderRadius: 5 } }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Tag Analysis */}
        {tagStats.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Tag / Topic Analysis</Typography>
                <Stack direction="row" spacing={1}>
                  {[['Strong ≥70%', '#dcfce7', '#15803d'], ['Average 50–70%', '#ede9fe', '#6d28d9'], ['Weak <50%', '#fee2e2', '#dc2626']].map(([l, bg, c]) => (
                    <Chip key={l} label={l} size="small" sx={{ bgcolor: bg, color: c, fontSize: 10, height: 20 }} />
                  ))}
                </Stack>
              </Box>
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                      {['Tag / Topic', 'Questions', 'Correct', 'Wrong', 'Skipped', 'Accuracy', 'Avg Time'].map(h => <TableCell key={h}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tagStats.map((t, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{t.tag}</TableCell>
                        <TableCell>{t.total}</TableCell>
                        <TableCell sx={{ color: '#15803d', fontWeight: 600 }}>{t.correct}</TableCell>
                        <TableCell sx={{ color: '#dc2626', fontWeight: 600 }}>{t.wrong}</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>{t.skipped}</TableCell>
                        <TableCell>
                          <Chip label={`${t.accuracy}%`} size="small" sx={{ fontWeight: 700, fontSize: 11, height: 22, bgcolor: t.accuracy >= 70 ? '#dcfce7' : t.accuracy >= 50 ? '#ede9fe' : '#fee2e2', color: t.accuracy >= 70 ? '#15803d' : t.accuracy >= 50 ? '#6d28d9' : '#dc2626' }} />
                        </TableCell>
                        <TableCell>{t.avgTime > 0 ? `${t.avgTime}s` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Coding Analytics */}
        {codingData.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f5f3ff', borderBottom: '1px solid #ddd6fe', display: 'flex', gap: 1, alignItems: 'center' }}>
                <CodeIcon sx={{ color: '#6d28d9', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700}>Coding Analytics</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                      {['Q#', 'Problem', 'Difficulty', 'Language', 'Attempts', 'Tests Passed', 'Status', 'Complexity'].map(h => <TableCell key={h}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {codingData.map((c, i) => {
                      const sc = c.status === 'Accepted' ? '#dcfce7' : c.status === 'Partial' ? '#fef9c3' : '#fee2e2';
                      const tc = c.status === 'Accepted' ? '#15803d' : c.status === 'Partial' ? '#92400e' : '#dc2626';
                      return (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{`Q${c.questionNumber || i + 1}`}</TableCell>
                          <TableCell sx={{ maxWidth: 130 }}><Tooltip title={c.problemTitle || ''}><span>{(c.problemTitle || 'Problem').substring(0, 22)}</span></Tooltip></TableCell>
                          <TableCell><Chip label={c.difficulty || 'Medium'} size="small" sx={{ height: 20, fontSize: 10, bgcolor: c.difficulty === 'Hard' ? '#fee2e2' : c.difficulty === 'Easy' ? '#dcfce7' : '#fef9c3', color: c.difficulty === 'Hard' ? '#dc2626' : c.difficulty === 'Easy' ? '#15803d' : '#92400e' }} /></TableCell>
                          <TableCell><Chip label={c.language || 'N/A'} size="small" sx={{ height: 20, fontSize: 10 }} /></TableCell>
                          <TableCell>{c.compilationCount || c.attempts || 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{c.testsPassed || 0}/{c.totalTests || 0}</TableCell>
                          <TableCell><Chip label={c.status || 'Attempted'} size="small" sx={{ bgcolor: sc, color: tc, fontWeight: 700, fontSize: 10, height: 22 }} /></TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{c.timeComplexity || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Strongest / Weakest */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', gap: 1, alignItems: 'center' }}>
              <TrendingUpIcon sx={{ color: '#15803d', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#15803d">Strongest Topics</Typography>
            </Box>
            {strongTopics.length === 0
              ? <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>Keep practicing — strengths will appear here</Box>
              : strongTopics.map((t, i) => (
                <Box key={i} sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="body2" fontWeight={600}>{t.tag}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">{t.correct}/{t.total}</Typography>
                    <Chip label={`${t.accuracy}%`} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 20, fontSize: 10 }} />
                  </Stack>
                </Box>
              ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', gap: 1, alignItems: 'center' }}>
              <TrendingDownIcon sx={{ color: '#dc2626', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#dc2626">Weakest Topics</Typography>
            </Box>
            {weakTopics.length === 0
              ? <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No critical weak areas — Great!</Box>
              : weakTopics.map((t, i) => (
                <Box key={i} sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="body2" fontWeight={600}>{t.tag}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">{t.correct}/{t.total}</Typography>
                    <Chip label={`${t.accuracy}%`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700, height: 20, fontSize: 10 }} />
                  </Stack>
                </Box>
              ))}
          </Paper>
        </Grid>

        {/* Heatmap */}
        {questions.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>Question Heatmap</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {questions.map((q, i) => {
                  const ok = !!(q.isCorrect || q.correct || (q.selectedAnswer && q.selectedAnswer === q.correctAnswer));
                  const sk = !q.selectedAnswer && !q.answer;
                  return (
                    <Tooltip key={i} title={`Q${i + 1}: ${ok ? 'Correct ✓' : sk ? 'Skipped —' : 'Wrong ✗'} · Tags: ${(q.tags || [q.topic]).filter(Boolean).join(', ') || 'General'}`} placement="top">
                      <Box sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: ok ? '#22c55e' : sk ? '#94a3b8' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.2)', zIndex: 10 } }}>
                        <Typography variant="caption" sx={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{i + 1}</Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
              <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                {[['Correct', '#22c55e'], ['Wrong', '#ef4444'], ['Skipped', '#94a3b8']].map(([l, c]) => (
                  <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: c }} />
                    <Typography variant="caption" color="text.secondary">{l}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// ─── Report 3: AI Placement ───────────────────────────────────────────────────

const PlacementReport = ({ student, assessmentData, allStudentResults }) => {
  const questions = assessmentData?.questions || assessmentData?.answers || [];
  const codingData = assessmentData?.codingSubmissions || assessmentData?.coding || [];
  const [busy, setBusy] = useState(false);

  const tagStats = useMemo(() => computeTagStats(questions), [questions]);
  const weakTopics = tagStats.filter(t => t.accuracy < 50);
  const strongTopics = tagStats.filter(t => t.accuracy >= 70);
  const placementScore = useMemo(() => computePlacementScore(student, tagStats, codingData), [student, tagStats, codingData]);
  const companyMatch = useMemo(() => computeCompanyMatch(student, placementScore, tagStats), [student, placementScore, tagStats]);
  const narrative = useMemo(() => generateNarrative(student, tagStats, placementScore, weakTopics, strongTopics), [student, tagStats, placementScore, weakTopics, strongTopics]);
  const learningPath = useMemo(() => generateLearningPath(weakTopics), [weakTopics]);

  const sameTest = allStudentResults.filter(r => r.testName === student.testName || r.testID === student.testID);
  const rank = [...sameTest].sort((a, b) => b.percentage - a.percentage).findIndex(r => r.email === student.email) + 1 || '—';

  let category = 'Needs Intervention', catColor = '#ef4444', catDesc = 'Focus on core fundamentals.';
  if (placementScore >= 85) { category = 'Elite – Product Ready'; catColor = '#6366f1'; catDesc = 'Ready for top product companies. Focus on competitive coding.'; }
  else if (placementScore >= 70) { category = 'Placement Ready'; catColor = '#22c55e'; catDesc = 'Good for service companies. Work on DSA for product companies.'; }
  else if (placementScore >= 55) { category = 'Near Ready'; catColor = '#f59e0b'; catDesc = 'Targeted prep in weak areas will make you placement-ready.'; }

  let salary = '< 4 LPA', salaryColor = '#ef4444';
  if (placementScore >= 85) { salary = '12–20 LPA'; salaryColor = '#6366f1'; }
  else if (placementScore >= 70) { salary = '6–12 LPA'; salaryColor = '#22c55e'; }
  else if (placementScore >= 55) { salary = '4–6 LPA'; salaryColor = '#f59e0b'; }

  const badges = [];
  if ((student.percentage || 0) >= 90) badges.push({ label: 'Accuracy King', icon: '👑', bg: '#6366f1' });
  if (codingData.every(c => c.status === 'Accepted') && codingData.length > 0) badges.push({ label: 'Problem Solver', icon: '🏆', bg: '#22c55e' });
  if (codingData.some(c => c.timeComplexity?.includes('log'))) badges.push({ label: 'Fast Coder', icon: '⚡', bg: '#f59e0b' });

  const radarData = [
    { label: 'Arrays', value: tagStats.find(t => /array/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.95) },
    { label: 'DP', value: tagStats.find(t => /^dp$|dynamic/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.7) },
    { label: 'Graph', value: tagStats.find(t => /graph/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.6) },
    { label: 'Math', value: tagStats.find(t => /math/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.85) },
    { label: 'HashMap', value: tagStats.find(t => /hash/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.88) },
    { label: 'Strings', value: tagStats.find(t => /string/i.test(t.tag))?.accuracy || Math.round((student.percentage || 0) * 0.92) },
  ];

  const events = [];
  if (assessmentData?.startedAt) events.push({ time: new Date(assessmentData.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), label: 'Assessment Started', color: '#6366f1' });
  questions.slice(0, 8).forEach((q, i) => {
    if (q.startedAt || q.submittedAt) events.push({ time: new Date(q.startedAt || q.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), label: `Q${i + 1} — ${q.difficulty || 'Medium'}`, detail: (q.tags || []).slice(0, 2).join(', '), color: (q.isCorrect || q.correct) ? '#22c55e' : '#ef4444' });
  });
  codingData.forEach((c, i) => {
    if (c.submittedAt) events.push({ time: new Date(c.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), label: `Coding Q${c.questionNumber || i + 1} Submitted`, detail: `${c.language || ''} · ${c.status || ''} · ${c.testsPassed || 0}/${c.totalTests || 0} tests`, color: c.status === 'Accepted' ? '#22c55e' : '#f59e0b' });
  });
  if (assessmentData?.submittedAt) events.push({ time: new Date(assessmentData.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), label: 'Assessment Submitted', color: '#ec4899' });

  const handlePDF = async () => {
    setBusy(true);
    try { await downloadUnifiedPDF(student, assessmentData, rank, sameTest.length || 1, allStudentResults); }
    catch (e) { /* console.error(e) */ void 0; alert('PDF generation failed.'); }
    finally { setBusy(false); }
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)', color: '#fff', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Chip label="🤖 AI-Powered Analysis" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', mb: 1, fontSize: 10 }} />
            <Typography variant="h5" fontWeight={800}>{student.name}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>{student.rollNumber} · {student.department} · {student.college}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.65 }}>Assessment: {student.testName}</Typography>
          </Box>
          <Button variant="contained" startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <PdfIcon />}
            onClick={handlePDF} disabled={busy}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            {busy ? 'Generating…' : 'Download PDF'}
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Gauge */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Placement Readiness Score</Typography>
            <GaugeMeter value={placementScore} size={220} />
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: catColor + '12', border: '1px solid', borderColor: catColor + '40' }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: catColor }}>{category}</Typography>
              <Typography variant="caption" color="text.secondary">{catDesc}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* AI Summary */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <BrainIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle2" fontWeight={700}>AI Assessment Summary</Typography>
              <Chip label="AI Generated" size="small" sx={{ ml: 'auto', bgcolor: '#ede9fe', color: '#6d28d9', fontSize: 10, height: 20 }} />
            </Box>
            <Alert severity="info" icon={false} sx={{ mb: 2, borderRadius: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.75, color: '#0c4a6e' }}>"{narrative}"</Typography>
            </Alert>
            <Grid container spacing={1.5}>
              {[
                { l: '💰 Predicted Salary', v: salary, c: salaryColor },
                { l: '🎯 Placement Score', v: `${placementScore}/100`, c: catColor },
                { l: '📊 Overall Score', v: `${Math.round(student.percentage || 0)}%`, c: '#6366f1' },
                { l: '🏆 Rank', v: typeof rank === 'number' ? `#${rank}` : 'N/A', c: '#22c55e' },
              ].map(m => (
                <Grid item xs={6} key={m.l}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="text.secondary">{m.l}</Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ color: m.c }}>{m.v}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Company Match */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight={700}>Predicted Company Match</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 340 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                    {['Company', 'Tier', 'Match %', 'Fit'].map(h => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companyMatch.map((co, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{co.name}</TableCell>
                      <TableCell><Chip label={co.tier} size="small" sx={{ height: 20, fontSize: 10, bgcolor: co.tier === 'Product' ? '#ede9fe' : co.tier === 'Finance' ? '#fef3c7' : '#e0f2fe', color: co.tier === 'Product' ? '#6d28d9' : co.tier === 'Finance' ? '#92400e' : '#0369a1' }} /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={co.probability}
                            sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: co.probability >= 75 ? '#22c55e' : co.probability >= 50 ? '#6366f1' : '#f59e0b', borderRadius: 3 } }} />
                          <Typography variant="caption" fontWeight={700} sx={{ minWidth: 32 }}>{co.probability}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={co.probability >= 80 ? 'Recommended' : co.probability >= 60 ? 'Good Fit' : co.probability >= 40 ? 'Possible' : 'Prep More'}
                          sx={{ height: 20, fontSize: 10, bgcolor: co.probability >= 80 ? '#dcfce7' : co.probability >= 60 ? '#ede9fe' : co.probability >= 40 ? '#fef9c3' : '#fee2e2', color: co.probability >= 80 ? '#15803d' : co.probability >= 60 ? '#6d28d9' : co.probability >= 40 ? '#92400e' : '#dc2626' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Topic Mastery Radar */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Topic Mastery</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}><RadarChart data={radarData} size={240} color="#6366f1" /></Box>
          </Paper>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, maxHeight: 380, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <TimerIcon sx={{ color: '#6366f1', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700}>Question Timeline</Typography>
            </Box>
            <Timeline events={events.length > 0 ? events : [
              { time: '—', label: 'Timestamps not stored for this assessment', color: '#94a3b8' },
              { time: '—', label: 'Per-question timing requires assessment to record start/submit times', color: '#94a3b8' },
            ]} />
          </Paper>
        </Grid>

        {/* Learning Path */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <SchoolIcon sx={{ color: '#22c55e', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700}>Recommended Learning Path</Typography>
            </Box>
            <Stack spacing={1.5}>
              {learningPath.map((w, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ minWidth: 64, py: 0.5, px: 1, bgcolor: '#6366f1', color: '#fff', borderRadius: 1, textAlign: 'center', flexShrink: 0 }}>
                    <Typography variant="caption" fontWeight={700} fontSize={11}>Week {w.week}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {w.topics.map(t => <Chip key={t} label={t} size="small" sx={{ height: 22, fontSize: 10, bgcolor: '#f1f5f9' }} />)}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Badges */}
        {badges.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle2" fontWeight={700}>Achievement Badges</Typography>
              </Box>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {badges.map((b, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 2, bgcolor: b.bg + '18', border: '1px solid', borderColor: b.bg + '40', textAlign: 'center', minWidth: 110 }}>
                    <Typography sx={{ fontSize: 30 }}>{b.icon}</Typography>
                    <Typography variant="caption" fontWeight={700}>{b.label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Coding Behaviour */}
        {codingData.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ color: '#6366f1', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700}>Coding Behaviour Analysis</Typography>
              </Box>
              <Grid container spacing={2}>
                {[
                  { l: 'Languages Used', v: [...new Set(codingData.map(c => c.language).filter(Boolean))].join(', ') || 'N/A' },
                  { l: 'Strategy', v: [...codingData].sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0))[0]?.difficulty === 'Hard' ? '⚡ Started with Hard — High Confidence' : '📈 Started with Easier Questions' },
                  { l: 'Avg Compilations', v: `${Math.round(codingData.reduce((s, c) => s + (c.compilationCount || 1), 0) / codingData.length)} per problem` },
                  { l: 'Acceptance Rate', v: `${codingData.filter(c => c.status === 'Accepted').length} / ${codingData.length} accepted` },
                ].map(m => (
                  <Grid item xs={12} sm={6} key={m.l}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" color="text.secondary">{m.l}</Typography>
                      <Typography variant="body2" fontWeight={600}>{m.v}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// ─── Main StudentAnalysisView ─────────────────────────────────────────────────

const StudentAnalysisView = ({ student, assessmentData, allStudentResults = [], onBack }) => {
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const sameTest = allStudentResults.filter(r => r.testName === student.testName || r.testID === student.testID);
  const rank = [...sameTest].sort((a, b) => b.percentage - a.percentage).findIndex(r => r.email?.toLowerCase() === student.email?.toLowerCase()) + 1 || '—';

  const handleDownloadUnified = async () => {
    setBusy(true);
    try {
      await downloadUnifiedPDF(student, assessmentData, rank, sameTest.length || 1, allStudentResults);
    } catch (e) {
      /* console.error(e) */ void 0;
      alert('PDF generation failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      {/* Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} variant="outlined" size="small" sx={{ borderRadius: 2 }}>Back</Button>
        <Button
          variant="contained"
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <PdfIcon />}
          onClick={handleDownloadUnified}
          disabled={busy}
          sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
        >
          {busy ? 'Generating PDF…' : 'Download Complete Report (PDF)'}
        </Button>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} noWrap>{student.name}</Typography>
          <Typography variant="caption" color="text.secondary">{student.rollNumber} · {student.testName}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip label={`${Math.round(student.percentage || 0)}%`} sx={{ fontWeight: 700, bgcolor: (student.percentage || 0) >= 75 ? '#dcfce7' : (student.percentage || 0) >= 40 ? '#ede9fe' : '#fee2e2', color: (student.percentage || 0) >= 75 ? '#15803d' : (student.percentage || 0) >= 40 ? '#6d28d9' : '#dc2626' }} />
          {typeof rank === 'number' && <Chip label={`Rank #${rank}`} sx={{ fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }} />}
        </Stack>
      </Box>

      {/* Report Type Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', '& .MuiTab-root': { fontWeight: 700, fontSize: 13, py: 1.5 } }}>
          <Tab label="📄  Summary Report" />
          <Tab label="📊  Analytics Report" />
          <Tab label="🤖  AI Placement Report" />
        </Tabs>
      </Paper>

      {tab === 0 && <SummaryReport student={student} assessmentData={assessmentData} rank={typeof rank === 'number' ? rank : '—'} totalStudents={sameTest.length || 1} allStudentResults={allStudentResults} />}
      {tab === 1 && <AnalyticsReport student={student} assessmentData={assessmentData} allStudentResults={allStudentResults} />}
      {tab === 2 && <PlacementReport student={student} assessmentData={assessmentData} allStudentResults={allStudentResults} />}
    </Box>
  );
};

export default StudentAnalysisView;
