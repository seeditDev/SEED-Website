import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, MenuItem, Switch,
  FormControlLabel, Divider, Card, CardContent, IconButton, Alert, CircularProgress, Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Quiz as QuizIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import AssessmentAdminService from '../../services/assessmentAdminService';
import { COLLEGES, ACADEMIC_YEARS } from '../../config/constants';

const StaffMcqCreator = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State according to Data Contract (Part 8)
  const [formData, setFormData] = useState({
    id: `mcq_${Date.now()}`,
    title: '',
    description: '',
    durationMinutes: 60,
    totalMarks: 30,
    passPercentage: 40,
    negativeMarking: 0,
    shuffleQuestions: false,
    shuffleOptions: false,
    status: 'Draft',
    college: '',
    year: '2K26',
    proctored: true,
    audioProctored: false,
    maxViolations: 5,
    maxAudioViolations: 3,
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        topic: 'General',
        difficulty: 'Medium',
        explanation: ''
      }
    ]
  });

  const handleQuestionChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setFormData(prev => {
      const updated = [...prev.questions];
      const opts = [...updated[qIndex].options];
      opts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return { ...prev, questions: updated };
    });
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: '', options: ['', '', '', ''], correctAnswer: '', topic: 'General', difficulty: 'Medium', explanation: '' }
      ]
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
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
        totalMarks: Number(formData.totalMarks || formData.questions.length * 1)
      };

      // Save directly to Firestore assessments collection according to Data Contract
      const saved = await AssessmentAdminService.saveMcqAssessment(payload);
      setSuccessMsg(`🎉 MCQ Assessment successfully saved as ${targetStatus}! (ID: ${saved.id})`);

      setTimeout(() => {
        navigate('/staff/assessments');
      }, 1500);
    } catch (err) {
      console.error('[StaffMcqCreator] Save error:', err);
      setErrorMsg(err.message || 'Failed to save MCQ Assessment');
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
              MCQ Assessment Creator
            </Typography>
            <Typography variant="body2" style={{ color: '#64748b' }}>
              Create and configure multi-choice question assessments.
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
            Publish Assessment
          </Button>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" style={{ marginBottom: 20, borderRadius: 12 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" style={{ marginBottom: 20, borderRadius: 12 }}>{errorMsg}</Alert>}

      {/* Assessment Settings Card */}
      <Paper style={{ padding: 24, borderRadius: 16, marginBottom: 24 }}>
        <Typography variant="h6" style={{ fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
          Assessment Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Assessment Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Data Structures & Algorithms MCQ Test"
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

          <Grid item xs={12} sm={3}>
            <TextField
              type="number"
              fullWidth
              label="Duration (minutes)"
              value={formData.durationMinutes}
              onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              type="number"
              fullWidth
              label="Total Marks"
              value={formData.totalMarks}
              onChange={e => setFormData({ ...formData, totalMarks: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              type="number"
              fullWidth
              label="Pass Percentage (%)"
              value={formData.passPercentage}
              onChange={e => setFormData({ ...formData, passPercentage: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
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
              <FormControlLabel
                control={<Switch checked={formData.shuffleQuestions} onChange={e => setFormData({ ...formData, shuffleQuestions: e.target.checked })} color="primary" />}
                label="Shuffle Questions"
              />
              <FormControlLabel
                control={<Switch checked={formData.shuffleOptions} onChange={e => setFormData({ ...formData, shuffleOptions: e.target.checked })} color="primary" />}
                label="Shuffle Options"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Questions Editor Block */}
      <Box style={{ marginBottom: 24 }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography variant="h6" style={{ fontWeight: 700, color: '#0f172a' }}>
            Questions ({formData.questions.length})
          </Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={addQuestion} style={{ borderRadius: 10 }}>
            Add Question
          </Button>
        </Box>

        {formData.questions.map((q, qIdx) => (
          <Card key={qIdx} style={{ borderRadius: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Chip label={`Question ${qIdx + 1}`} style={{ background: '#6366f1', color: '#fff', fontWeight: 700 }} />
                {formData.questions.length > 1 && (
                  <IconButton color="error" size="small" onClick={() => removeQuestion(qIdx)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Question Text"
                    value={q.question}
                    onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                    placeholder="Enter question prompt..."
                    required
                  />
                </Grid>

                {q.options.map((opt, oIdx) => (
                  <Grid item xs={12} sm={6} key={oIdx}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Option ${String.fromCharCode(65 + oIdx)}`}
                      value={opt}
                      onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                      required
                    />
                  </Grid>
                ))}

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Correct Answer"
                    value={q.correctAnswer}
                    onChange={e => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                    required
                  >
                    {q.options.map((opt, oIdx) => (
                      <MenuItem key={oIdx} value={opt || `Option ${String.fromCharCode(65 + oIdx)}`}>
                        Option {String.fromCharCode(65 + oIdx)}: {opt || '(empty)'}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Topic Tag"
                    value={q.topic}
                    onChange={e => handleQuestionChange(qIdx, 'topic', e.target.value)}
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

export default StaffMcqCreator;
