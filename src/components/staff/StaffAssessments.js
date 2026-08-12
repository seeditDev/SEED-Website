import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  ContentCopy as DuplicateIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Quiz as QuizIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import AssessmentAdminService from '../../services/assessmentAdminService';

const StaffAssessments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [previewJson, setPreviewJson] = useState(null);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const list = await AssessmentAdminService.listAssessments();
      setAssessments(list);
    } catch (err) {
      console.error('[StaffAssessments] Error listing assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await AssessmentAdminService.updateStatus(id, newStatus);
      fetchAssessments();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await AssessmentAdminService.duplicateAssessment(id);
      fetchAssessments();
    } catch (err) {
      alert('Failed to duplicate assessment: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await AssessmentAdminService.deleteAssessment(id);
      fetchAssessments();
    } catch (err) {
      alert('Failed to delete assessment: ' + err.message);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (typeFilter !== 'All' && (a.type || 'mcq').toLowerCase() !== typeFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <Box>
      <Box style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" style={{ fontWeight: 800, color: '#0f172a' }}>
            Assessments Directory
          </Typography>
          <Typography variant="body2" style={{ color: '#64748b' }}>
            Manage, publish, duplicate, and configure assessment modules.
          </Typography>
        </Box>

        <Box style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/staff/mcq-creator')}
            startIcon={<QuizIcon />}
            style={{ borderRadius: 10, borderColor: '#6366f1', color: '#6366f1', fontWeight: 600 }}
          >
            + Create MCQ
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/staff/coding-creator')}
            startIcon={<CodeIcon />}
            style={{ background: '#6366f1', color: '#fff', fontWeight: 700, borderRadius: 10 }}
          >
            + Create Coding
          </Button>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Paper style={{ padding: 16, borderRadius: 16, marginBottom: 24 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status Filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Active">Active / Published</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type Filter"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="mcq">MCQ</MenuItem>
              <MenuItem value="coding">Coding</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} style={{ textAlign: 'right' }}>
            <Button startIcon={<RefreshIcon />} onClick={fetchAssessments} style={{ color: '#64748b' }}>
              Refresh
            </Button>
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
                <TableCell style={{ fontWeight: 700 }}>Assessment Title</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Duration</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Marks</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Version</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Questions</TableCell>
                <TableCell style={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" style={{ padding: 32, color: '#64748b' }}>
                    No assessments found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssessments.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell style={{ fontWeight: 700, color: '#0f172a' }}>{a.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={(a.type || 'mcq').toUpperCase()}
                        size="small"
                        style={{
                          background: a.type === 'coding' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                          color: a.type === 'coding' ? '#10b981' : '#6366f1',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.status || 'Draft'}
                        size="small"
                        style={{
                          background: a.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                          color: a.status === 'Active' ? '#10b981' : '#64748b',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell>{a.durationMinutes} mins</TableCell>
                    <TableCell>{a.totalMarks} pts</TableCell>
                    <TableCell>v{a.version}</TableCell>
                    <TableCell>{a.questionsCount}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview JSON">
                        <IconButton size="small" onClick={() => setPreviewJson(a)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicate">
                        <IconButton size="small" onClick={() => handleDuplicate(a.id)}>
                          <DuplicateIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {a.status !== 'Active' && (
                        <Tooltip title="Publish">
                          <IconButton size="small" color="success" onClick={() => handleStatusChange(a.id, 'Active')}>
                            <PublishIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {a.status === 'Active' && (
                        <Tooltip title="Archive">
                          <IconButton size="small" color="warning" onClick={() => handleStatusChange(a.id, 'Archived')}>
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* JSON Preview Dialog */}
      <Dialog open={Boolean(previewJson)} onClose={() => setPreviewJson(null)} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontWeight: 700 }}>
          Assessment Data Preview ({previewJson?.id})
        </DialogTitle>
        <DialogContent dividers>
          <pre style={{ background: '#0f172a', color: '#38bdf8', padding: 16, borderRadius: 8, overflowX: 'auto', fontSize: '0.85rem' }}>
            {JSON.stringify(previewJson, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewJson(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAssessments;
