import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, Avatar
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  CheckCircle as PassIcon,
  Warning as SupportIcon,
  ArrowForward as ArrowIcon,
  Star as TopIcon
} from '@mui/icons-material';
import AssessmentAdminService from '../../services/assessmentAdminService';
import DataService from '../../services/dataService';
import ReportService from '../../services/reportService';

const StaffDashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalAssessments: 0,
    publishedAssessments: 0,
    avgScore: 0,
    passRate: 0,
    needingSupportCount: 0
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [needsSupport, setNeedsSupport] = useState([]);
  const [deptStats, setDeptStats] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const staffAuthRaw = localStorage.getItem('auth_data');
        const staffAuth = staffAuthRaw ? JSON.parse(staffAuthRaw) : {};

        // 1. Load assessments from Firestore assessments collection
        const assessments = await AssessmentAdminService.listAssessments();
        const publishedCount = assessments.filter(a => a.status === 'Active' || a.status === 'Published' || a.status === 'active' || a.status === 'published').length;

        // 2. Fetch student attempt results strictly from Firestore assessmentResults/{assessmentId}/students/{userId}
        // NO GitHub fetch or hardcoded fallback
        const studentResults = await ReportService.fetchFirestoreResults(staffAuth);

        const totalStudentsSet = new Set(studentResults.map(s => s.userId || s.email).filter(Boolean));
        const totalStudents = totalStudentsSet.size;
        const totalAssessments = assessments.length;

        let totalScoreSum = 0;
        let passCount = 0;
        const supportList = [];
        const topList = [];
        const depts = {};

        studentResults.forEach(s => {
          const pct = Number(s.percentage || 0);
          totalScoreSum += pct;

          if (pct >= 40) passCount++;
          if (pct < 40) supportList.push(s);
          if (pct >= 75) topList.push(s);

          const dept = s.department || s.Department || 'General';
          if (!depts[dept]) depts[dept] = { total: 0, sum: 0 };
          depts[dept].total += 1;
          depts[dept].sum += pct;
        });

        const totalAttempts = studentResults.length;
        const avgScore = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;
        const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

        setStats({
          totalStudents,
          activeStudents: totalStudents,
          totalAssessments,
          publishedAssessments: publishedCount,
          avgScore,
          passRate,
          needingSupportCount: supportList.length
        });

        setTopPerformers(topList.sort((a, b) => b.percentage - a.percentage).slice(0, 5));
        setNeedsSupport(supportList.sort((a, b) => a.percentage - b.percentage).slice(0, 5));

        const deptList = Object.entries(depts).map(([name, d]) => ({
          name,
          avg: Math.round(d.sum / Math.max(1, d.total)),
          count: d.total
        }));
        setDeptStats(deptList);

      } catch (err) {
        console.error('[StaffDashboardHome] Error loading dashboard stats from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);


  return (
    <Box>
      <Box style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" style={{ fontWeight: 800, color: '#0f172a' }}>
            Staff Overview
          </Typography>

        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/staff/reports')}
          endIcon={<ArrowIcon />}
          style={{ background: '#6366f1', color: '#fff', fontWeight: 700, borderRadius: 10 }}
        >
          View Full Reports
        </Button>
      </Box>

      {loading && <LinearProgress style={{ marginBottom: 24, borderRadius: 4 }} />}

      {/* KPI Cards Grid */}
      <Grid container spacing={3} style={{ marginBottom: 32 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: 48, height: 48 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: '#64748b', fontWeight: 600 }}>Total Students</Typography>
                <Typography variant="h5" style={{ fontWeight: 800, color: '#0f172a' }}>{stats.totalStudents}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 48, height: 48 }}>
                <AssessmentIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: '#64748b', fontWeight: 600 }}>Total Assessments</Typography>
                <Typography variant="h5" style={{ fontWeight: 800, color: '#0f172a' }}>{stats.totalAssessments}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: 48, height: 48 }}>
                <PassIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: '#64748b', fontWeight: 600 }}>Pass Rate</Typography>
                <Typography variant="h5" style={{ fontWeight: 800, color: '#0f172a' }}>{stats.passRate}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 48, height: 48 }}>
                <SupportIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" style={{ color: '#64748b', fontWeight: 600 }}>Needs Support</Typography>
                <Typography variant="h5" style={{ fontWeight: 800, color: '#ef4444' }}>{stats.needingSupportCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid: Performance & Support */}
      <Grid container spacing={3}>
        {/* Department Performance */}
        <Grid item xs={12} md={6}>
          <Paper style={{ padding: 24, borderRadius: 16 }}>
            <Typography variant="h6" style={{ fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
              Performance by Department
            </Typography>
            {deptStats.map(dept => (
              <Box key={dept.name} style={{ marginBottom: 16 }}>
                <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Typography variant="body2" style={{ fontWeight: 600, color: '#334155' }}>{dept.name}</Typography>
                  <Typography variant="body2" style={{ fontWeight: 700, color: '#6366f1' }}>{dept.avg}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={dept.avg} style={{ height: 8, borderRadius: 4, background: '#f1f5f9' }} />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Action Shortcuts */}
        <Grid item xs={12} md={6}>
          <Paper style={{ padding: 24, borderRadius: 16 }}>
            <Typography variant="h6" style={{ fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
              Staff Workspace Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/staff/mcq-creator')}
                  style={{ padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', justifyContent: 'flex-start', color: '#0f172a', fontWeight: 700 }}
                >
                  + Create MCQ Assessment
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/staff/coding-creator')}
                  style={{ padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', justifyContent: 'flex-start', color: '#0f172a', fontWeight: 700 }}
                >
                  + Create Coding Assessment
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/staff/assessments')}
                  style={{ padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', justifyContent: 'flex-start', color: '#0f172a', fontWeight: 700 }}
                >
                  Manage Assessments
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/staff/students')}
                  style={{ padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', justifyContent: 'flex-start', color: '#0f172a', fontWeight: 700 }}
                >
                  View All Students
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StaffDashboardHome;
