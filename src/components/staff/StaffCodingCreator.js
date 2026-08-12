import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, MenuItem, Switch,
  FormControlLabel, Card, CardContent, IconButton, Alert, Chip, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Code as CodeIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import AssessmentAdminService from '../../services/assessmentAdminService';
import { COLLEGES, ACADEMIC_YEARS } from '../../config/constants';

const StaffCodingCreator = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State according to Data Contract (Part 9)
  const [formData, setFormData] = useState({
    id: `coding_${Date.now()}`,
    title: '',
    description: '',
    durationMinutes: 90,
    totalMarks: 100,
    passPercentage: 40,
    status: 'Draft',
    college: '',
    year: '2K26',
    proctored: true,
    audioProctored: false,
    maxViolations: 5,
    maxAudioViolations: 3,
    challenges: [
      {
        id: `Q101_${Date.now()}`,
        title: '',
        problemStatement: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '1 <= N <= 10^5',
        questionWeight: 50, // Separate from test case weights (Part 9)
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        allowedLanguages: ['C', 'CPP', 'Java', 'Python3'],
        sampleTestCases: [
          { input: '5\n1 2 3 4 5', expectedOutput: '15' }
        ],
        hiddenTestCases: [
          { input: '10\n1 2 3 4 5 6 7 8 9 10', expectedOutput: '55', weight: 10 }
        ]
      }
    ]
  });

  const handleChallengeChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.challenges];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, challenges: updated };
    });
  };

  const addChallenge = () => {
    setFormData(prev => ({
      ...prev,
      challenges: [
        ...prev.challenges,
        {
          id: `Q${prev.challenges.length + 1}_${Date.now()}`,
          title: '',
          problemStatement: '',
          inputFormat: '',
          outputFormat: '',
          constraints: '1 <= N <= 10^5',
          questionWeight: 50,
          timeLimitMs: 2000,
          memoryLimitMb: 256,
          allowedLanguages: ['C', 'CPP', 'Java', 'Python3'],
          sampleTestCases: [{ input: '', expectedOutput: '' }],
          hiddenTestCases: [{ input: '', expectedOutput: '', weight: 10 }]
        }
      ]
    }));
  };

  const removeChallenge = (index) => {
    if (formData.challenges.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.filter((_, i) => i !== index)
    }));
  };

  const handleSaveAssessment = async (targetStatus = 'Draft') => {
    if (!formData.title.trim()) {
      setErrorMsg('Please enter an Assessment Title');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        status: targetStatus,
        questionIds: formData.challenges.map(c => c.id),
        totalMarks: formData.challenges.reduce((sum, c) => sum + (Number(c.questionWeight) || 50), 0)
      };

      // Save directly to Firestore assessments collection according to Data Contract
      const saved = await AssessmentAdminService.saveCodingAssessment(payload);
      setSuccessMsg(`🎉 Coding Assessment successfully saved as ${targetStatus}! (ID: ${saved.id})`);

      setTimeout(() => {
        navigate('/staff/assessments');
      }, 1500);
    } catch (err) {
      console.error('[StaffCodingCreator] Save error:', err);
      setErrorMsg(err.message || 'Failed to save Coding Assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconButton onClick={() => navigate('/staff/assessments')} style={{ background: '#e2e8f0' }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" style={{ fontWeight: 800, color: '#0f172a' }}>
              Coding Assessment Creator
            </Typography>
            <Typography variant="body2" style={{ color: '#64748b' }}>
              Create and configure coding challenges, test cases, and time/memory limits.
            </Typography>
          </Box>
        </Box>

        <Box style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="outlined"
            onClick={() => handleSaveAssessment('Draft')}
            disabled={loading}
            style={{ borderRadius: 10, borderColor: '#cbd5e1', color: '#334155', fontWeight: 600 }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSaveAssessment('Active')}
            disabled={loading}
            startIcon={<SaveIcon />}
            style={{ background: '#10b981', color: '#fff', fontWeight: 700, borderRadius: 10 }}
          >
            Publish Coding Assessment
          </Button>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" style={{ marginBottom: 20, borderRadius: 12 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" style={{ marginBottom: 20, borderRadius: 12 }}>{errorMsg}</Alert>}

      {/* Assessment Settings Card */}
      <Paper style={{ padding: 24, borderRadius: 16, marginBottom: 24 }}>
        <Typography variant="h6" style={{ fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
          Coding Assessment Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Assessment Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Advanced Algorithms Coding Challenge"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Target College"
              value={formData.college}
              onChange={e => setFormData({ ...formData, college: e.target.value })}
            >
              <MenuItem value="">All Partner Colleges</MenuItem>
              {Object.entries(COLLEGES).map(([code, name]) => (
                <MenuItem key={code} value={code}>{code} - {name.substring(0, 24)}...</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter instructions for students..."
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              fullWidth
              label="Duration (minutes)"
              value={formData.durationMinutes}
              onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              fullWidth
              label="Pass Percentage (%)"
              value={formData.passPercentage}
              onChange={e => setFormData({ ...formData, passPercentage: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Batch Year"
              value={formData.year}
              onChange={e => setFormData({ ...formData, year: e.target.value })}
            >
              {Object.entries(ACADEMIC_YEARS).map(([code, name]) => (
                <MenuItem key={code} value={code}>{name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Proctoring Toggles */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8, color: '#334155' }}>
              Proctoring & Anti-Cheating Controls
            </Typography>
            <Box style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Switch checked={formData.proctored} onChange={e => setFormData({ ...formData, proctored: e.target.checked })} color="primary" />}
                label="Camera Proctoring"
              />
              <FormControlLabel
                control={<Switch checked={formData.audioProctored} onChange={e => setFormData({ ...formData, audioProctored: e.target.checked })} color="primary" />}
                label="Audio Proctoring"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Challenges Editor Block */}
      <Box style={{ marginBottom: 24 }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography variant="h6" style={{ fontWeight: 700, color: '#0f172a' }}>
            Coding Challenges ({formData.challenges.length})
          </Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={addChallenge} style={{ borderRadius: 10 }}>
            Add Challenge
          </Button>
        </Box>

        {formData.challenges.map((c, cIdx) => (
          <Card key={cIdx} style={{ borderRadius: 16, marginBottom: 20, border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Chip label={`Challenge ${cIdx + 1}`} style={{ background: '#6366f1', color: '#fff', fontWeight: 700 }} />
                {formData.challenges.length > 1 && (
                  <IconButton color="error" size="small" onClick={() => removeChallenge(cIdx)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Challenge Title"
                    value={c.title}
                    onChange={e => handleChallengeChange(cIdx, 'title', e.target.value)}
                    placeholder="e.g. Sum of Array Elements"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    type="number"
                    fullWidth
                    label="Question Weight (Marks)"
                    value={c.questionWeight}
                    onChange={e => handleChallengeChange(cIdx, 'questionWeight', e.target.value)}
                    helperText="Assessment-level weight"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Problem Statement"
                    value={c.problemStatement}
                    onChange={e => handleChallengeChange(cIdx, 'problemStatement', e.target.value)}
                    placeholder="Describe the problem, input/output specifications..."
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Input Format"
                    value={c.inputFormat}
                    onChange={e => handleChallengeChange(cIdx, 'inputFormat', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Output Format"
                    value={c.outputFormat}
                    onChange={e => handleChallengeChange(cIdx, 'outputFormat', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    fullWidth
                    label="Time Limit (ms)"
                    value={c.timeLimitMs}
                    onChange={e => handleChallengeChange(cIdx, 'timeLimitMs', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    fullWidth
                    label="Memory Limit (MB)"
                    value={c.memoryLimitMb}
                    onChange={e => handleChallengeChange(cIdx, 'memoryLimitMb', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default StaffCodingCreator;
