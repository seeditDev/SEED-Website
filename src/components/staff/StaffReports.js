import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, MenuItem, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  CircularProgress, Alert, Card, CardContent
} from '@mui/material';
import {
  CloudDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import ReportService from '../../services/reportService';
import DataService from '../../services/dataService';
import { COLLEGES, ACADEMIC_YEARS } from '../../config/constants';

const StaffReports = () => {
  const [loading, setLoading] = useState(false);
  const [rawResults, setRawResults] = useState([]);
  const [staffAuth, setStaffAuth] = useState(null);

  // Filters
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const initStaff = () => {
      try {
        const raw = localStorage.getItem('auth_data');
        if (raw) {
          const auth = JSON.parse(raw);
          setStaffAuth(auth);
          const staffCollege = auth.College || auth.college || auth.tenantId || '';
          const staffRole = (auth.Role || auth.role || '').toLowerCase();
          
          // Tenant Security Rule (Part 22): If staff belongs to a specific college, lock filter to their college
          if (staffRole === 'staff' && staffCollege && staffCollege !== 'SEEDIT') {
            setSelectedCollege(staffCollege);
          }
        }
      } catch (_) {}
    };
    initStaff();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const collegeToFetch = selectedCollege !== 'All' ? selectedCollege : 'SEEDIT';
      const yearToFetch = selectedYear !== 'All' ? selectedYear : '2K26';

      // 1. Primary: Fetch from Firestore collectionGroup(db, 'students') at assessmentResults/{assessmentId}/students/{userId}
      let firestoreResults = await ReportService.fetchFirestoreResults();

      // 2. Secondary fallback: Load static legacy JSON scores if Firestore has no entries yet
      let legacyData = [];
      try {
        const scores = await DataService.getCollegeData(collegeToFetch, 'scores', yearToFetch);
        legacyData = Array.isArray(scores) ? scores : (scores.students || scores.data || []);
      } catch (_) {}

      const combinedData = firestoreResults.length > 0 ? firestoreResults : legacyData;

      // Apply tenant restriction security filter (Part 22)
      const tenantFiltered = ReportService.filterByTenant(combinedData, staffAuth);
      setRawResults(tenantFiltered);
    } catch (err) {
      console.error('[StaffReports] Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchReportData();
  }, [selectedCollege, selectedYear]);

  // Filtered dataset
  const filteredResults = useMemo(() => {
    return rawResults.filter(r => {
      if (selectedDept !== 'All' && (r.Department || r.department) !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.Name || r.name || '').toLowerCase();
        const roll = (r['Roll Number'] || r.rollNumber || '').toLowerCase();
        const email = (r.Email || r.email || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [rawResults, selectedDept, searchQuery]);

  const isCollegeLocked = useMemo(() => {
    if (!staffAuth) return false;
    const role = (staffAuth.Role || staffAuth.role || '').toLowerCase();
    const college = staffAuth.College || staffAuth.college || '';
    return role === 'staff' && college && college !== 'SEEDIT';
  }, [staffAuth]);

  // Export handlers (Part 19 - Canonical Report Engine)
  const handleExportExcel = () => {
    ReportService.exportMarksExcel(filteredResults, 'Staff_Assessment_Report.xlsx');
  };

  const handleExportCsv = () => {
    ReportService.exportCsv(filteredResults, 'Staff_Assessment_Report.csv');
  };

  const handleExportZip = () => {
    ReportService.generateBulkZip(filteredResults, 'Staff_Bulk_Report');
  };

  return (
    <Box>
      <Box style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" style={{ fontWeight: 800, color: '#0f172a' }}>
            Staff Reports & Analytics
          </Typography>
          <Typography variant="body2" style={{ color: '#64748b' }}>
            Canonical performance reports with Excel, CSV, PDF, and ZIP exports.
          </Typography>
        </Box>

        <Box style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="outlined"
            onClick={handleExportCsv}
            style={{ borderRadius: 10, borderColor: '#cbd5e1', color: '#334155', fontWeight: 600 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            startIcon={<ExcelIcon />}
            style={{ background: '#10b981', color: '#fff', fontWeight: 700, borderRadius: 10 }}
          >
            Excel Report
          </Button>
          <Button
            variant="contained"
            onClick={handleExportZip}
            startIcon={<ZipIcon />}
            style={{ background: '#6366f1', color: '#fff', fontWeight: 700, borderRadius: 10 }}
          >
            Bulk ZIP (PDFs)
          </Button>
        </Box>
      </Box>

      {/* Filter Strip */}
      <Paper style={{ padding: 20, borderRadius: 16, marginBottom: 24 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="College / Tenant"
              value={selectedCollege}
              onChange={e => setSelectedCollege(e.target.value)}
              disabled={isCollegeLocked}
            >
              <MenuItem value="All">All Colleges</MenuItem>
              {Object.entries(COLLEGES).map(([code, name]) => (
                <MenuItem key={code} value={code}>{code} - {name.substring(0, 24)}...</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Batch Year"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              <MenuItem value="All">All Years</MenuItem>
              {Object.entries(ACADEMIC_YEARS).map(([code, name]) => (
                <MenuItem key={code} value={code}>{name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <MenuItem value="All">All Departments</MenuItem>
              <MenuItem value="CSE">CSE</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="ECE">ECE</MenuItem>
              <MenuItem value="EEE">EEE</MenuItem>
              <MenuItem value="MECH">MECH</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search student..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon style={{ color: '#94a3b8', marginRight: 8 }} /> }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Report Table */}
      <TableContainer component={Paper} style={{ borderRadius: 16 }}>
        {loading && <Box style={{ padding: 32, textAlign: 'center' }}><CircularProgress /></Box>}
        {!loading && (
          <Table>
            <TableHead style={{ background: '#f8fafc' }}>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>#</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Student Name</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Roll Number</TableCell>
                <TableCell style={{ fontWeight: 700 }}>College</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Score</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Percentage</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" style={{ padding: 32, color: '#64748b' }}>
                    No student results found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((r, idx) => {
                  const score = r.score !== undefined ? r.score : (r.correctAnswers || 0);
                  const total = r.totalMarks || 100;
                  const pct = Math.round(r.percentage !== undefined ? r.percentage : (score / total) * 100);
                  const passed = pct >= 40;

                  return (
                    <TableRow key={idx} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{r.Name || r.name || 'N/A'}</TableCell>
                      <TableCell>{r['Roll Number'] || r.rollNumber || 'N/A'}</TableCell>
                      <TableCell>{r.College || r.college || 'N/A'}</TableCell>
                      <TableCell>{r.Department || r.department || 'N/A'}</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>{score} / {total}</TableCell>
                      <TableCell style={{ fontWeight: 700, color: passed ? '#10b981' : '#ef4444' }}>{pct}%</TableCell>
                      <TableCell>
                        <Chip
                          label={passed ? 'PASS' : 'FAIL'}
                          size="small"
                          style={{
                            background: passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: passed ? '#10b981' : '#ef4444',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Download Student PDF Scorecard">
                          <IconButton size="small" onClick={() => ReportService.generateStudentPdf(r)} style={{ color: '#6366f1' }}>
                            <PdfIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default StaffReports;
