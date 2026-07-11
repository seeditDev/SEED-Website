import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem, Button,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, FormControlLabel, Chip, IconButton, CircularProgress,
  Divider, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Stepper, Step, StepLabel, Tabs, Tab, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CloudUpload as CloudUploadIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Quiz as QuizIcon,
  Code as CodeIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// ─── GitHub API Configuration ────────────────────────────────────────────────
const GITHUB_TOKEN = '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';
const SEED_CONTENTS_API_URL = 'https://api.github.com/repos/seeditDev/seed-contents/contents';

const safeBtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtob = (str) => decodeURIComponent(escape(atob(str)));

// Helper to write to seed-contents repo
const uploadFileToRepo = async (path, content, message) => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // 1. Check if file exists to get its SHA
  let sha;
  try {
    const res = await fetch(`${SEED_CONTENTS_API_URL}/${cleanPath}?_t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch (e) {
    console.log('File does not exist yet, will create new file.');
  }

  // 2. Commit PUT request
  const requestData = {
    message,
    content: safeBtoa(typeof content === 'string' ? content : JSON.stringify(content, null, 2)),
    branch: 'main'
  };
  if (sha) {
    requestData.sha = sha;
  }

  const putRes = await fetch(`${SEED_CONTENTS_API_URL}/${cleanPath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(requestData)
  });

  if (!putRes.ok) {
    const errorData = await putRes.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub error: HTTP ${putRes.status}`);
  }

  return await putRes.json();
};

// Fetch published tests list from repo folder
const fetchPublishedTests = async (folder) => {
  try {
    const res = await fetch(`${SEED_CONTENTS_API_URL}/${folder}?_t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    
    const list = [];
    for (const item of data) {
      if (item.type === 'file' && item.name.endsWith('.json')) {
        if (item.name !== 'questions_index.json' && item.name !== 'index.json' && item.name !== 'series.json') {
          list.push({
            name: item.name.replace('.json', ''),
            path: item.path,
            download_url: item.download_url
          });
        }
      }
    }
    return list;
  } catch (err) {
    console.error('Error fetching published list:', err);
    return [];
  }
};

const TestCreator = ({ college }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [testType, setTestType] = useState('mcq'); // 'mcq' | 'coding'
  const [existingTests, setExistingTests] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Stepper steps
  const steps = ['Test Details', 'Add Questions', 'Preview & Verify', 'Publish'];

  // UI status feedback
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [busy, setBusy] = useState(false);

  // Step 1: Test Details Metadata
  const [testDetails, setTestDetails] = useState({
    id: '',          // User-input slug (prefix college_ will be appended)
    title: '',
    duration: 30,
    difficulty: 'Medium',
    proctored: true,
    premium: false,
    passkey: '',
    section: '',
    topic: ''
  });

  // Step 2: Custom Questions lists
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [codingChallenges, setCodingChallenges] = useState([]);

  // MCQ custom question editor state
  const [customMcq, setCustomMcq] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    difficulty: 'Easy',
    topic: ''
  });

  // Coding challenge custom editor state
  const [customCoding, setCustomCoding] = useState({
    id: '', // Slug of challenge
    title: '',
    difficulty: 'Easy',
    description: '',
    instructions: '',
    constraints: 'Time Limit: 2.0s',
    testCases: [{ input: '', expected: '' }],
    boilerplates: {
      python: 'import sys\n\ndef main():\n    # Read input from stdin\n    # Process data and write to stdout\n    pass\n\nif __name__ == "__main__":\n    main()',
      c: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}'
    }
  });

  // Load existing tests starting with college name
  const loadExistingTests = async () => {
    setLoadingExisting(true);
    try {
      const folder = testType === 'mcq' ? 'mcqs' : 'coding';
      const list = await fetchPublishedTests(folder);
      // Filter list: only display tests starting with college prefix (e.g. "KGKITE_")
      const filtered = list.filter(item => item.name.startsWith(`${college}_`));
      setExistingTests(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    loadExistingTests();
  }, [testType]);

  const showMsg = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  // Step 1 validation
  const validateStep1 = () => {
    const { id, title, section, topic } = testDetails;
    if (!id || !title) {
      showMsg('Test ID and Title are required.', 'warning');
      return false;
    }
    if (testType === 'mcq' && (!section || !topic)) {
      showMsg('Section and Topic are required for MCQ tests.', 'warning');
      return false;
    }
    if (!/^[a-z0-9-_]+$/i.test(id)) {
      showMsg('Test ID must only contain alphanumeric characters, hyphens, and underscores (no spaces).', 'warning');
      return false;
    }
    return true;
  };

  // Move steps
  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1) {
      if (testType === 'mcq' && mcqQuestions.length === 0) {
        showMsg('Please add at least one question.', 'warning');
        return;
      }
      if (testType === 'coding' && codingChallenges.length === 0) {
        showMsg('Please add at least one coding challenge.', 'warning');
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // MCQ handlers
  const handleAddMcq = () => {
    const { questionText, optionA, optionB, optionC, optionD, correctOption, difficulty, topic } = customMcq;
    if (!questionText || !optionA || !optionB || !optionC || !optionD) {
      showMsg('Please fill in question text and all options A, B, C, and D.', 'warning');
      return;
    }
    const questionObj = {
      id: String(mcqQuestions.length + 1),
      questionText,
      options: [optionA, optionB, optionC, optionD],
      correctOption,
      correctAnswer: correctOption === 'A' ? optionA : correctOption === 'B' ? optionB : correctOption === 'C' ? optionC : optionD,
      difficulty: difficulty.toLowerCase(),
      topic: topic || testDetails.topic || 'General'
    };
    setMcqQuestions([...mcqQuestions, questionObj]);
    setCustomMcq({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      difficulty: 'Easy',
      topic: testDetails.topic || ''
    });
    showMsg('Question added successfully!', 'success');
  };

  const handleRemoveMcq = (idx) => {
    const list = [...mcqQuestions];
    list.splice(idx, 1);
    // Reindex
    const reindexed = list.map((q, i) => ({ ...q, id: String(i + 1) }));
    setMcqQuestions(reindexed);
  };

  // Coding handlers
  const handleAddTestCase = () => {
    setCustomCoding(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expected: '' }]
    }));
  };

  const handleRemoveTestCase = (idx) => {
    if (customCoding.testCases.length === 1) return;
    const list = [...customCoding.testCases];
    list.splice(idx, 1);
    setCustomCoding(prev => ({ ...prev, testCases: list }));
  };

  const handleTestCaseChange = (idx, field, val) => {
    const list = [...customCoding.testCases];
    list[idx][field] = val;
    setCustomCoding(prev => ({ ...prev, testCases: list }));
  };

  const handleBoilerplateChange = (lang, val) => {
    setCustomCoding(prev => ({
      ...prev,
      boilerplates: {
        ...prev.boilerplates,
        [lang]: val
      }
    }));
  };

  const handleAddCodingChallenge = () => {
    const { id, title, difficulty, description, instructions, constraints, testCases, boilerplates } = customCoding;
    if (!id || !title || !description) {
      showMsg('Challenge ID, Title, and Description are required.', 'warning');
      return;
    }
    if (!/^[a-z0-9-_]+$/i.test(id)) {
      showMsg('Challenge ID must only contain alphanumeric characters, hyphens, and underscores.', 'warning');
      return;
    }
    // Validate test cases
    if (testCases.some(tc => !tc.input || !tc.expected)) {
      showMsg('Please complete all test cases (input and output cannot be blank).', 'warning');
      return;
    }

    // Challenge ID is unique prefix
    const finalChallId = `${college}_${id}`;
    const challengeObj = {
      id: finalChallId,
      title,
      difficulty,
      description,
      instructions,
      constraints,
      testCases,
      boilerplates
    };

    setCodingChallenges([...codingChallenges, challengeObj]);
    // Reset form
    setCustomCoding({
      id: '',
      title: '',
      difficulty: 'Easy',
      description: '',
      instructions: '',
      constraints: 'Time Limit: 2.0s',
      testCases: [{ input: '', expected: '' }],
      boilerplates: {
        python: 'import sys\n\ndef main():\n    # Read input from stdin\n    pass\n\nif __name__ == "__main__":\n    main()',
        c: '#include <stdio.h>\n\nint main() {\n    return 0;\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}',
        java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n    }\n}'
      }
    });
    showMsg('Coding challenge added!', 'success');
  };

  const handleRemoveCoding = (idx) => {
    const list = [...codingChallenges];
    list.splice(idx, 1);
    setCodingChallenges(list);
  };

  // Final Publish handler
  const handlePublishAssessment = async () => {
    setBusy(true);
    const finalTestId = `${college}_${testDetails.id}`;
    try {
      if (testType === 'mcq') {
        const mcqData = {
          id: finalTestId,
          name: testDetails.title,
          section: testDetails.section,
          topic: testDetails.topic,
          difficulty: testDetails.difficulty.toLowerCase(),
          duration: parseInt(testDetails.duration, 10),
          totalQuestions: mcqQuestions.length,
          questions: mcqQuestions.map(q => ({
            id: q.id,
            question: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            explanation: ''
          }))
        };

        const path = `mcqs/${finalTestId}.json`;
        await uploadFileToRepo(path, mcqData, `Create MCQ test: ${testDetails.title}`);
        showMsg(`✅ MCQ test successfully published under: ${path}`, 'success');
      } else {
        // Publish coding
        const questionIds = [];
        for (const challenge of codingChallenges) {
          const qPath = `coding/questions/${challenge.id}.json`;
          const questionData = {
            questionId: challenge.id,
            title: challenge.title,
            description: challenge.description,
            instructions: challenge.instructions,
            constraints: challenge.constraints,
            testCases: challenge.testCases.map(tc => ({
              input: tc.input,
              expected: tc.expected
            })),
            boilerplates: challenge.boilerplates,
            metadata: {
              category: 'General',
              difficulty: challenge.difficulty,
              isPremium: testDetails.premium,
              tags: []
            },
            createdAt: new Date().toISOString().split('T')[0]
          };

          await uploadFileToRepo(qPath, questionData, `Publish Coding challenge: ${challenge.title}`);
          questionIds.push(challenge.id);
        }

        const testData = {
          id: finalTestId,
          name: testDetails.title,
          type: 'coding',
          difficulty: testDetails.difficulty,
          duration: Number(testDetails.duration) || 60,
          totalQuestions: questionIds.length,
          questionIds,
          isPremium: testDetails.premium,
          proctored: testDetails.proctored,
          maxViolations: 5,
          passkey: testDetails.passkey,
          createdAt: new Date().toISOString().split('T')[0]
        };

        const path = `coding/${finalTestId}.json`;
        await uploadFileToRepo(path, testData, `Publish Coding test: ${testDetails.title}`);
        showMsg(`✅ Coding test successfully published under: ${path}`, 'success');
      }

      // Reset Wizard
      setActiveStep(0);
      setTestDetails({
        id: '',
        title: '',
        duration: 30,
        difficulty: 'Medium',
        proctored: true,
        premium: false,
        passkey: '',
        section: '',
        topic: ''
      });
      setMcqQuestions([]);
      setCodingChallenges([]);
      loadExistingTests(); // Reload list
    } catch (err) {
      console.error(err);
      showMsg(err.message || 'Error occurred while saving.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Selector and Stepper Header */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>Select Test Type</Typography>
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant={testType === 'mcq' ? 'contained' : 'outlined'}
                onClick={() => { if (activeStep === 0) setTestType('mcq'); }}
                disabled={activeStep > 0} startIcon={<QuizIcon />}>MCQ Test</Button>
              <Button fullWidth variant={testType === 'coding' ? 'contained' : 'outlined'}
                onClick={() => { if (activeStep === 0) setTestType('coding'); }}
                disabled={activeStep > 0} startIcon={<CodeIcon />}>Coding Test</Button>
            </Stack>
            {activeStep > 0 && (
              <Alert severity="info" size="small" icon={false} sx={{ py: 0.5, fontSize: 11 }}>
                Type locked during creation workflow.
              </Alert>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map(label => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
      </Grid>

      {alert.open && (
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })} sx={{ mb: 3, borderRadius: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* ── STEP 1: TEST DETAILS ──────────────────────────────────────────────── */}
      {activeStep === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} mb={3}>Assessment Configuration</Typography>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                    TEST ID / SLUG (Pre-fixed with College Name)
                  </Typography>
                  <TextField fullWidth size="small" placeholder="slug-name-here" name="id"
                    value={testDetails.id} onChange={e => setTestDetails({ ...testDetails, id: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ bgcolor: 'action.selected', px: 1.5, py: 0.5, mr: 1, borderRadius: 1, border: '1px solid #ddd', fontSize: 12, fontWeight: 700 }}>
                          {college}_
                        </Box>
                      )
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Final slug stored will be: <strong>{college}_{testDetails.id || 'slug'}</strong>
                  </Typography>
                </Box>

                <TextField fullWidth size="small" label="Test Title" value={testDetails.title}
                  onChange={e => setTestDetails({ ...testDetails, title: e.target.value })} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField fullWidth size="small" type="number" label="Duration (mins)" value={testDetails.duration}
                      onChange={e => setTestDetails({ ...testDetails, duration: e.target.value })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth select size="small" label="Difficulty" value={testDetails.difficulty}
                      onChange={e => setTestDetails({ ...testDetails, difficulty: e.target.value })}>
                      {['Easy', 'Medium', 'Hard'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>

                {testType === 'mcq' && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField fullWidth size="small" label="Section Name" placeholder="e.g. Aptitude" value={testDetails.section}
                        onChange={e => setTestDetails({ ...testDetails, section: e.target.value })} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth size="small" label="Topic / Tag" placeholder="e.g. Math" value={testDetails.topic}
                        onChange={e => setTestDetails({ ...testDetails, topic: e.target.value })} />
                    </Grid>
                  </Grid>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField fullWidth size="small" label="Passkey (optional)" placeholder="Access Pin" value={testDetails.passkey}
                      onChange={e => setTestDetails({ ...testDetails, passkey: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel control={<Checkbox checked={testDetails.proctored} onChange={e => setTestDetails({ ...testDetails, proctored: e.target.checked })} />} label="Proctored" />
                    <FormControlLabel control={<Checkbox checked={testDetails.premium} onChange={e => setTestDetails({ ...testDetails, premium: e.target.checked })} />} label="Premium" />
                  </Grid>
                </Grid>
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button variant="contained" endIcon={<NextIcon />} onClick={handleNext}>
                  Next: Add Questions
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Existing tests list */}
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={800} mb={2}>
                Existing {testType.toUpperCase()} Tests for {college}
              </Typography>
              {loadingExisting ? (
                <Box sx={{ display: 'flex', py: 4, justifyContent: 'center' }}><CircularProgress size={24} /></Box>
              ) : existingTests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No existing published tests start with college name prefix.</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700 } }}>
                        <TableCell>Test Name</TableCell>
                        <TableCell align="right">Slug ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {existingTests.map((t, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{t.name.replace(`${college}_`, '')}</TableCell>
                          <TableCell align="right" sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{t.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── STEP 2: ADD QUESTIONS ────────────────────────────────────────────── */}
      {activeStep === 1 && (
        <Box>
          {testType === 'mcq' ? (
            <Grid container spacing={3}>
              {/* Question creator Form */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight={800} mb={2}>Custom MCQ Question Input</Typography>
                  <Stack spacing={2}>
                    <TextField fullWidth multiline rows={3} placeholder="Type question content here..." label="Question Text"
                      value={customMcq.questionText} onChange={e => setCustomMcq({ ...customMcq, questionText: e.target.value })} />

                    <Grid container spacing={1.5}>
                      {['A', 'B', 'C', 'D'].map(letter => (
                        <Grid item xs={6} key={letter}>
                          <TextField fullWidth size="small" label={`Option ${letter}`}
                            value={customMcq[`option${letter}`]} onChange={e => setCustomMcq({ ...customMcq, [`option${letter}`]: e.target.value })} />
                        </Grid>
                      ))}
                    </Grid>

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField fullWidth select size="small" label="Correct Option" value={customMcq.correctOption}
                          onChange={e => setCustomMcq({ ...customMcq, correctOption: e.target.value })}>
                          {['A', 'B', 'C', 'D'].map(l => <MenuItem key={l} value={l}>Option {l}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth select size="small" label="Difficulty" value={customMcq.difficulty}
                          onChange={e => setCustomMcq({ ...customMcq, difficulty: e.target.value })}>
                          {['Easy', 'Medium', 'Hard'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </TextField>
                      </Grid>
                    </Grid>

                    <TextField fullWidth size="small" label="Topic / Tag (Specific)" value={customMcq.topic}
                      onChange={e => setCustomMcq({ ...customMcq, topic: e.target.value })} />

                    <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleAddMcq}>
                      Add Question to List
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              {/* MCQ List preview */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={800} mb={2}>Added MCQ Questions ({mcqQuestions.length})</Typography>
                  {mcqQuestions.length === 0 ? (
                    <Box sx={{ py: 6, textAlgin: 'center', color: 'text.secondary' }}>
                      <Typography align="center">No questions added yet. Use the left panel to type and insert questions.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2} sx={{ maxHeight: 450, overflow: 'auto', pr: 1 }}>
                      {mcqQuestions.map((q, idx) => (
                        <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="body2" fontWeight={700}>Q{q.id}. {q.questionText}</Typography>
                              <IconButton size="small" color="error" onClick={() => handleRemoveMcq(idx)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                              {q.options.map((opt, oIdx) => {
                                const l = String.fromCharCode(65 + oIdx);
                                const isCorrect = q.correctOption === l;
                                return (
                                  <Grid item xs={6} key={l}>
                                    <Typography variant="caption" sx={{ color: isCorrect ? 'success.main' : 'text.secondary', fontWeight: isCorrect ? 700 : 400 }}>
                                      {l}. {opt} {isCorrect && '✓'}
                                    </Typography>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {/* Coding Challenge manual input */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight={800} mb={2}>Custom Coding Challenge Input</Typography>
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" placeholder="challenge-id" label="Challenge ID Slug"
                          value={customCoding.id} onChange={e => setCustomCoding({ ...customCoding, id: e.target.value })}
                          InputProps={{ startAdornment: <Box sx={{ fontSize: 11, mr: 0.5, fontWeight: 700, opacity: 0.7 }}>{college}_</Box> }} />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Challenge Title" value={customCoding.title}
                          onChange={e => setCustomCoding({ ...customCoding, title: e.target.value })} />
                      </Grid>
                    </Grid>

                    <TextField fullWidth select size="small" label="Difficulty" value={customCoding.difficulty}
                      onChange={e => setCustomCoding({ ...customCoding, difficulty: e.target.value })}>
                      {['Easy', 'Medium', 'Hard'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>

                    <TextField fullWidth multiline rows={3} label="Problem Description" value={customCoding.description}
                      onChange={e => setCustomCoding({ ...customCoding, description: e.target.value })} />

                    <TextField fullWidth multiline rows={2} label="Instructions (Input/Output format)" value={customCoding.instructions}
                      onChange={e => setCustomCoding({ ...customCoding, instructions: e.target.value })} />

                    {/* Test Cases */}
                    <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight={700}>Test Cases (Standard inputs & expected outputs)</Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={handleAddTestCase}>Add Case</Button>
                      </Box>
                      <Stack spacing={1.5} sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {customCoding.testCases.map((tc, tcIdx) => (
                          <Box key={tcIdx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField size="small" placeholder="Input" value={tc.input} onChange={e => handleTestCaseChange(tcIdx, 'input', e.target.value)} sx={{ flex: 1 }} />
                            <TextField size="small" placeholder="Expected Output" value={tc.expected} onChange={e => handleTestCaseChange(tcIdx, 'expected', e.target.value)} sx={{ flex: 1 }} />
                            <IconButton size="small" color="error" disabled={customCoding.testCases.length === 1} onClick={() => handleRemoveTestCase(tcIdx)}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    {/* Boilerplates (C++ / Python) */}
                    <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2 }}>
                      <Typography variant="caption" fontWeight={700} display="block" mb={1}>Languages Boilerplates (Templates for Students)</Typography>
                      <Grid container spacing={1.5}>
                        {['python', 'c', 'cpp', 'java'].map(lang => (
                          <Grid item xs={6} key={lang}>
                            <TextField fullWidth multiline rows={4} label={lang.toUpperCase()} value={customCoding.boilerplates[lang]}
                              onChange={e => handleBoilerplateChange(lang, e.target.value)} inputProps={{ style: { fontFamily: 'monospace', fontSize: 10 } }} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleAddCodingChallenge}>
                      Add Challenge to List
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              {/* Coding Challenges preview list */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={800} mb={2}>Added Coding Challenges ({codingChallenges.length})</Typography>
                  {codingChallenges.length === 0 ? (
                    <Box sx={{ py: 6, color: 'text.secondary', textAlign: 'center' }}>
                      <Typography>No challenges added. Insert manually using the form on the left.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2} sx={{ maxHeight: 600, overflow: 'auto' }}>
                      {codingChallenges.map((c, idx) => (
                        <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={700}>
                                {idx + 1}. {c.title} <Chip label={c.difficulty} size="small" sx={{ ml: 1, height: 18, fontSize: 9 }} />
                              </Typography>
                              <IconButton size="small" color="error" onClick={() => handleRemoveCoding(idx)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              ID: <code>{c.id}</code>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontSize: 12 }}>{c.description}</Typography>
                            <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                              {c.testCases.length} Test cases configured
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button startIcon={<PrevIcon />} onClick={handleBack}>Back: Details</Button>
            <Button variant="contained" endIcon={<NextIcon />} onClick={handleNext}>Next: Preview & Verify</Button>
          </Box>
        </Box>
      )}

      {/* ── STEP 3: PREVIEW & VERIFY ─────────────────────────────────────────── */}
      {activeStep === 2 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={800} mb={3}>Verify Assessment Details</Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">Final Assessment ID</Typography>
              <Typography variant="body1" fontWeight={700}>{college}_{testDetails.id}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">Title</Typography>
              <Typography variant="body1" fontWeight={700}>{testDetails.title}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">Duration</Typography>
              <Typography variant="body1" fontWeight={700}>{testDetails.duration} minutes</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" color="text.secondary">Difficulty</Typography>
              <Typography variant="body1" fontWeight={700}>{testDetails.difficulty}</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" color="text.secondary">Proctored</Typography>
              <Typography variant="body1" fontWeight={700}>{testDetails.proctored ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" color="text.secondary">Premium</Typography>
              <Typography variant="body1" fontWeight={700}>{testDetails.premium ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" color="text.secondary">Passkey</Typography>
              <Typography variant="body1" fontWeight={700}>{testDetails.passkey || 'None'}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight={700} mb={2}>Questions Review</Typography>

          {testType === 'mcq' ? (
            <Stack spacing={2}>
              {mcqQuestions.map((q, idx) => (
                <Box key={idx} sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={700}>{q.id}. {q.questionText}</Typography>
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    {q.options.map((opt, oIdx) => {
                      const l = String.fromCharCode(65 + oIdx);
                      const isCorrect = q.correctOption === l;
                      return (
                        <Grid item xs={6} key={l}>
                          <Typography variant="caption" sx={{ color: isCorrect ? 'success.main' : 'text.secondary', fontWeight: isCorrect ? 700 : 400 }}>
                            {l}. {opt} {isCorrect && '✓'}
                          </Typography>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ))}
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              {codingChallenges.map((c, idx) => (
                <Box key={idx} sx={{ p: 2.5, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={700}>{idx + 1}. {c.title} (ID: {c.id})</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">Difficulty: {c.difficulty}</Typography>
                  <Typography variant="body2" sx={{ my: 1 }}>{c.description}</Typography>
                  <Typography variant="caption" display="block">Instructions: {c.instructions}</Typography>
                  <Typography variant="caption" display="block">Constraints: {c.constraints}</Typography>

                  <Typography variant="subtitle2" sx={{ mt: 1.5, fontSize: 11, fontWeight: 700 }}>Test Cases:</Typography>
                  <Stack spacing={1}>
                    {c.testCases.map((tc, tIdx) => (
                      <Typography key={tIdx} variant="caption" display="block" sx={{ fontFamily: 'monospace', bgcolor: '#f8fafc', p: 0.5, borderRadius: 1 }}>
                        Case {tIdx + 1}: Input: <code>{tc.input}</code> | Expected: <code>{tc.expected}</code>
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button startIcon={<PrevIcon />} onClick={handleBack}>Back: Edit Questions</Button>
            <Button variant="contained" color="success" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
              onClick={handlePublishAssessment} disabled={busy}>
              {busy ? 'Publishing…' : 'Publish Assessment'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TestCreator;
