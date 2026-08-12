import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, MenuItem, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  CircularProgress, Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  PersonSearch as AnalysisIcon
} from '@mui/icons-material';
import DataService from '../../services/dataService';
import ReportService from '../../services/reportService';
import { COLLEGES, ACADEMIC_YEARS } from '../../config/constants';

const StaffStudents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [staffAuth, setStaffAuth] = useState(null);

  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth_data');
      if (raw) {
        const auth = JSON.parse(raw);
        setStaffAuth(auth);
        const staffCollege = auth.College || auth.college || auth.tenantId || '';
        const staffRole = (auth.Role || auth.role || '').toLowerCase();
        if (staffRole === 'staff' && staffCollege && staffCollege !== 'SEEDIT') {
          setSelectedCollege(staffCollege);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const collegeToFetch = selectedCollege !== 'All' ? selectedCollege : 'SEEDIT';
        const yearToFetch = selectedYear !== 'All' ? selectedYear : '2K26';

        let list = [];
        try {
          const raw = await DataService.getCollegeData(collegeToFetch, 'profiles', yearToFetch);
          list = Array.isArray(raw) ? raw : (raw.students || raw.profiles || []);
        } catch (_) {}

        // Enforce tenant isolation (Part 22)
        const tenantFiltered = ReportService.filterByTenant(list, staffAuth);
        setStudents(tenantFiltered);
      } catch (err) {
        console.error('[StaffStudents] Error fetching student profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedCollege, selectedYear]);

  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (s.Name || s.name || '').toLowerCase();
    const roll = (s['Roll Number'] || s.rollNumber || '').toLowerCase();
    const email = (s.Email || s.email || '').toLowerCase();
    return name.includes(q) || roll.includes(q) || email.includes(q);
  });

  return (
    <Box>
      <Box style={{ marginBottom: 24 }}>
        <Typography variant="h4" style={{ fontWeight: 800, color: '#0f172a' }}>
          Student Directory
        </Typography>
        <Typography variant="body2" style={{ color: '#64748b' }}>
          View and analyze student profiles, placement readiness, and progress.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper style={{ padding: 16, borderRadius: 16, marginBottom: 24 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="College / Tenant"
              value={selectedCollege}
              onChange={e => setSelectedCollege(e.target.value)}
              disabled={staffAuth && (staffAuth.Role || staffAuth.role || '').toLowerCase() === 'staff' && (staffAuth.College || staffAuth.college) && (staffAuth.College || staffAuth.college) !== 'SEEDIT'}
            >
              <MenuItem value="All">All Colleges</MenuItem>
              {Object.entries(COLLEGES).map(([code, name]) => (
                <MenuItem key={code} value={code}>{code} - {name.substring(0, 24)}...</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

      {/* Table */}
      <TableContainer component={Paper} style={{ borderRadius: 16 }}>
        {loading && <Box style={{ padding: 32, textAlign: 'center' }}><CircularProgress /></Box>}
        {!loading && (
          <Table>
            <TableHead style={{ background: '#f8fafc' }}>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Student Name</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Roll Number</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell style={{ fontWeight: 700 }}>College</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Batch Year</TableCell>
                <TableCell style={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" style={{ padding: 32, color: '#64748b' }}>
                    No students found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((s, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell style={{ fontWeight: 700, color: '#0f172a' }}>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar style={{ width: 32, height: 32, fontSize: '0.85rem', background: '#6366f1' }}>
                          {(s.Name || s.name || 'S')[0].toUpperCase()}
                        </Avatar>
                        {s.Name || s.name || 'Student'}
                      </Box>
                    </TableCell>
                    <TableCell>{s['Roll Number'] || s.rollNumber || 'N/A'}</TableCell>
                    <TableCell>{s.Email || s.email || 'N/A'}</TableCell>
                    <TableCell>{s.College || s.college || 'N/A'}</TableCell>
                    <TableCell>{s.Department || s.department || 'N/A'}</TableCell>
                    <TableCell>{s.Year || s.year || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AnalysisIcon />}
                        onClick={() => navigate(`/staff/students/${s['Roll Number'] || s.Email || idx}`)}
                        style={{ borderRadius: 8, borderColor: '#6366f1', color: '#6366f1', textTransform: 'none', fontWeight: 600 }}
                      >
                        Analysis
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default StaffStudents;
