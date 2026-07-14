import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem, Button,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, FormControlLabel, Chip, IconButton, CircularProgress,
  Divider, Alert, Stack, Stepper, Step, StepLabel, Tabs, Tab, Tooltip
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
  Edit as EditIcon,
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
    /* console.log('File does not exist yet, will create new file.') */ void 0;
  }

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

// Fetch published list
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
    return [];
  }
};

// Fetch test file content
const fetchAssessmentDetails = async (path) => {
  try {
    const res = await fetch(`${SEED_CONTENTS_API_URL}/${path}?_t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = safeAtob(json.content);
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
};

// Fetch coding challenge detail
const fetchCodingQuestion = async (qId) => {
  try {
    const res = await fetch(`${SEED_CONTENTS_API_URL}/coding/questions/${qId}.json?_t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = safeAtob(json.content);
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
};

// Replicate central questions index logic
const updateQuestionsIndex = async (questionId, data) => {
  let indexData = [];
  let sha = null;
  try {
    const res = await fetch(`${SEED_CONTENTS_API_URL}/coding/questions_index.json?_t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (res.ok) {
      const resJson = await res.json();
      sha = resJson.sha;
      const content = safeAtob(resJson.content);
      indexData = JSON.parse(content);
      if (!Array.isArray(indexData)) indexData = [];
    }
  } catch (_) {}

  const summary = {
    questionId,
    title: data.title,
    category: data.metadata?.category || 'General',
    difficulty: data.metadata?.difficulty || 'Easy',
    isPremium: !!data.metadata?.isPremium,
    tags: data.metadata?.tags || [],
    topicTags: data.metadata?.topicTags || [],
    companyTags: data.metadata?.companyTags || []
  };

  const idx = indexData.findIndex(q => q.questionId === questionId);
  if (idx !== -1) {
    indexData[idx] = summary;
  } else {
    indexData.push(summary);
  }
  indexData.sort((a, b) => a.questionId.localeCompare(b.questionId));

  await fetch(`${SEED_CONTENTS_API_URL}/coding/questions_index.json`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message: `Update questions index for ${questionId}`,
      content: safeBtoa(JSON.stringify(indexData, null, 2)),
      branch: 'main',
      sha: sha || undefined
    })
  });
};

// Add to category collection
const addQuestionToCategory = async (category, questionId) => {
  let catData = { category, questionIds: [] };
  let sha = null;
  const catPath = `coding/categories/${category}.json`;
  try {
    const res = await fetch(`${SEED_CONTENTS_API_URL}/${catPath}?_t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (res.ok) {
      const resJson = await res.json();
      sha = resJson.sha;
      const content = safeAtob(resJson.content);
      catData = JSON.parse(content);
      if (!catData.questionIds) catData.questionIds = [];
    }
  } catch (_) {}

  catData.questionIds = [...new Set([...(catData.questionIds || []), questionId])];
  catData.updatedAt = new Date().toISOString().split('T')[0];

  await fetch(`${SEED_CONTENTS_API_URL}/${catPath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message: `Update category collection for ${category}`,
      content: safeBtoa(JSON.stringify(catData, null, 2)),
      branch: 'main',
      sha: sha || undefined
    })
  });
};

const TestCreator = ({ college }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [testType, setTestType] = useState('mcq'); // 'mcq' | 'coding'
  const [existingTests, setExistingTests] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Challenge Editor Form Tab
  const [editorTab, setEditorTab] = useState(0);
  // Code editor language Tab
  const [codeLangTab, setCodeLangTab] = useState(0);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [originalTestId, setOriginalTestId] = useState('');

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

  // Coding challenge custom editor state - Combines all fields from both templates
  const [customCoding, setCustomCoding] = useState({
    id: '', // Slug of challenge
    title: '',
    difficulty: 'Easy',
    category: 'Arrays',
    qbCategory: 'customCoding',
    description: '',
    instructions: '',
    constraints: '1 <= N <= 10^5',
    inputFormat: '',
    outputFormat: '',
    topicTags: '',
    companyTags: '',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    methodName: '',
    methodParams: '', // comma-separated e.g. "forts:integer[]"
    sampleTestCases: [{ id: 'sample_1', input: '', output: '', explanation: '' }],
    testCases: [{ id: 'tc_1', label: 'general case', input: '', expectedOutput: '', weight: 2 }],
    boilerplates: {
      Python3: 'class Solution:\n    def methodName(self, params):\n        return 0',
      C: '#include <stdio.h>\n\nint methodName() {\n    return 0;\n}',
      'C++': '#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int methodName() {\n        return 0;\n    }\n};',
      Java: 'class Solution {\n    public int methodName() {\n        return 0;\n    }\n}',
      JavaScript: '/**\n * @return {number}\n */\nvar methodName = function() {\n    return 0;\n};'
    },
    solutionCodes: {
      Python3: '',
      C: '',
      'C++': '',
      Java: '',
      JavaScript: ''
    },
    approach: '',
    timeComplexity: '',
    spaceComplexity: ''
  });

  // Load existing tests starting with college name
  const loadExistingTests = async () => {
    setLoadingExisting(true);
    try {
      const folder = testType === 'mcq' ? 'mcqs' : 'coding';
      const list = await fetchPublishedTests(folder);
      const filtered = list.filter(item => item.name.startsWith(`${college}_`));
      setExistingTests(filtered);
    } catch (e) {
      /* console.error(e) */ void 0;
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

  // Click edit handler
  const handleEditTest = async (testItem) => {
    setBusy(true);
    showMsg(`Loading test details for ${testItem.name}...`, 'info');
    try {
      const folder = testType === 'mcq' ? 'mcqs' : 'coding';
      const path = `${folder}/${testItem.name}.json`;
      const data = await fetchAssessmentDetails(path);
      if (!data) {
        showMsg('Failed to load test contents.', 'error');
        return;
      }

      setIsEditing(true);
      setOriginalTestId(testItem.name);

      setTestDetails({
        id: testItem.name.replace(`${college}_`, ''),
        title: data.name || data.title || '',
        duration: data.duration || 60,
        difficulty: data.difficulty || 'Medium',
        proctored: data.proctored !== false,
        premium: !!data.isPremium,
        passkey: data.passkey || '',
        section: data.section || '',
        topic: data.topic || ''
      });

      if (testType === 'mcq') {
        const parsedMcqs = (data.questions || []).map((q, idx) => ({
          id: String(idx + 1),
          questionText: q.question || '',
          options: q.options || [],
          correctOption: q.correctAnswer === q.options?.[0] ? 'A' : q.correctAnswer === q.options?.[1] ? 'B' : q.correctAnswer === q.options?.[2] ? 'C' : 'D',
          correctAnswer: q.correctAnswer || '',
          difficulty: q.difficulty || 'easy',
          topic: q.topic || data.topic || 'General'
        }));
        setMcqQuestions(parsedMcqs);
        setCodingChallenges([]);
      } else {
        const parsedCoding = [];
        const qIds = data.questionIds || [];
        for (const qId of qIds) {
          const q = await fetchCodingQuestion(qId);
          if (q) {
            parsedCoding.push({
              id: qId.startsWith(`${college}_`) ? qId.replace(`${college}_`, '') : qId,
              isMapped: !qId.startsWith(`${college}_`),
              title: q.title || '',
              difficulty: q.metadata?.difficulty || 'Easy',
              category: q.metadata?.category || 'Arrays',
              qbCategory: q.QBCategory || q.metadata?.QBCategory || 'customCoding',
              topicTags: (q.metadata?.tags || q.metadata?.topicTags || []).join(', '),
              companyTags: (q.metadata?.companyTags || []).join(', '),
              description: q.content?.problemStatement || q.description || '',
              constraints: Array.isArray(q.content?.constraints) ? q.content.constraints.join('\n') : (q.constraints || ''),
              inputFormat: q.content?.inputFormat || '',
              outputFormat: q.content?.outputFormat || '',
              sampleTestCases: q.content?.sampleTestCases || [{ id: 'sample_1', input: '', output: '', explanation: '' }],
              timeLimitMs: q.judging?.timeLimitMs || 2000,
              memoryLimitMb: q.judging?.memoryLimitMb || 256,
              supportedLanguages: q.judging?.supportedLanguages || ["C", "C++", "Java", "Python3", "JavaScript"],
              methodName: q._internal?.methodName || '',
              methodParams: (q._internal?.params || []).map(p => `${p.name}:${p.type}`).join(', '),
              testCases: (q.testCases?.hidden || q.testCases || []).map((tc, tcIdx) => ({
                id: tc.id || `tc_${tcIdx + 1}`,
                label: tc.label || '',
                input: tc.input || '',
                expectedOutput: tc.expectedOutput || tc.expected || '',
                weight: tc.weight || 2
              })),
              boilerplates: q.boilerPlates || q.boilerplates || {},
              approach: q.solution?.approach || '',
              timeComplexity: q.solution?.timeComplexity || '',
              spaceComplexity: q.solution?.spaceComplexity || '',
              solutionCodes: q.solution?.code || q.solution?.solutionCodes || {},
              createdAt: q.createdAt
            });
          }
        }
        setCodingChallenges(parsedCoding);
        setMcqQuestions([]);
      }

      showMsg('Test data successfully loaded! You are now in edit/update mode.', 'success');
      setActiveStep(0);
    } catch (e) {
      /* console.error(e) */ void 0;
      showMsg('Error loading test data: ' + e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleResetCreator = () => {
    setIsEditing(false);
    setOriginalTestId('');
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
  };

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
    const reindexed = list.map((q, i) => ({ ...q, id: String(i + 1) }));
    setMcqQuestions(reindexed);
  };

  // Coding handlers
  const handleAddTestCase = () => {
    setCustomCoding(prev => ({
      ...prev,
      testCases: [...prev.testCases, { id: `tc_${prev.testCases.length + 1}`, label: '', input: '', expectedOutput: '', weight: 2 }]
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

  const handleAddSampleCase = () => {
    setCustomCoding(prev => ({
      ...prev,
      sampleTestCases: [...prev.sampleTestCases, { id: `sample_${prev.sampleTestCases.length + 1}`, input: '', output: '', explanation: '' }]
    }));
  };

  const handleRemoveSampleCase = (idx) => {
    if (customCoding.sampleTestCases.length === 1) return;
    const list = [...customCoding.sampleTestCases];
    list.splice(idx, 1);
    setCustomCoding(prev => ({ ...prev, sampleTestCases: list }));
  };

  const handleSampleCaseChange = (idx, field, val) => {
    const list = [...customCoding.sampleTestCases];
    list[idx][field] = val;
    setCustomCoding(prev => ({ ...prev, sampleTestCases: list }));
  };

  const handleBoilerplateChange = (lang, val) => {
    setCustomCoding(prev => ({
      ...prev,
      boilerplates: { ...prev.boilerplates, [lang]: val }
    }));
  };

  const handleSolutionChange = (lang, val) => {
    setCustomCoding(prev => ({
      ...prev,
      solutionCodes: { ...prev.solutionCodes, [lang]: val }
    }));
  };

  const handleAddCodingChallenge = () => {
    const { id, title, difficulty, category, description, testCases } = customCoding;
    if (!id || !title || !description) {
      showMsg('Challenge ID, Title, and Description are required.', 'warning');
      return;
    }
    if (!/^[a-z0-9-_]+$/i.test(id)) {
      showMsg('Challenge ID must only contain alphanumeric characters, hyphens, and underscores.', 'warning');
      return;
    }
    if (testCases.some(tc => !tc.input || !tc.expectedOutput)) {
      showMsg('Please complete all test cases (input and expectedOutput cannot be blank).', 'warning');
      return;
    }

    const finalChallId = `${college}_${id}`;
    const challengeObj = {
      ...customCoding,
      id: finalChallId
    };

    setCodingChallenges([...codingChallenges, challengeObj]);
    
    // Reset to defaults
    setCustomCoding({
      id: '',
      title: '',
      difficulty: 'Easy',
      category: 'Arrays',
      qbCategory: 'customCoding',
      description: '',
      instructions: '',
      constraints: '1 <= N <= 10^5',
      inputFormat: '',
      outputFormat: '',
      topicTags: '',
      companyTags: '',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      methodName: '',
      methodParams: '',
      sampleTestCases: [{ id: 'sample_1', input: '', output: '', explanation: '' }],
      testCases: [{ id: 'tc_1', label: 'general case', input: '', expectedOutput: '', weight: 2 }],
      boilerplates: {
        Python3: 'class Solution:\n    def methodName(self, params):\n        return 0',
        C: '#include <stdio.h>\n\nint methodName() {\n    return 0;\n}',
        'C++': '#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int methodName() {\n        return 0;\n    }\n};',
        Java: 'class Solution {\n    public int methodName() {\n        return 0;\n    }\n}',
        JavaScript: '/**\n * @return {number}\n */\nvar methodName = function() {\n    return 0;\n};'
      },
      solutionCodes: { Python3: '', C: '', 'C++': '', Java: '', JavaScript: '' },
      approach: '',
      timeComplexity: '',
      spaceComplexity: ''
    });
    setEditorTab(0);
    showMsg('Coding challenge added!', 'success');
  };

  const handleRemoveCoding = (idx) => {
    const list = [...codingChallenges];
    list.splice(idx, 1);
    setCodingChallenges(list);
  };

  // Final Publish/Update handler
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
        await uploadFileToRepo(path, mcqData, `${isEditing ? 'Update' : 'Create'} MCQ test: ${testDetails.title}`);
        showMsg(`✅ MCQ test successfully saved under: ${path}`, 'success');
      } else {
        const questionIds = [];
        for (const challenge of codingChallenges) {
          if (challenge.isMapped) {
            questionIds.push(challenge.id);
            continue;
          }

          const qId = challenge.id.startsWith(`${college}_`) ? challenge.id : `${college}_${challenge.id}`;
          const parsedTopicTags = challenge.topicTags ? challenge.topicTags.split(',').map(t => t.trim()).filter(Boolean) : [];
          const parsedCompanyTags = challenge.companyTags ? challenge.companyTags.split(',').map(t => t.trim()).filter(Boolean) : [];
          const parsedConstraints = challenge.constraints ? challenge.constraints.split('\n').map(c => c.trim()).filter(Boolean) : [];

          const parsedParams = [];
          if (challenge.methodParams) {
            challenge.methodParams.split(',').forEach(p => {
              const parts = p.split(':');
              if (parts.length === 2) {
                parsedParams.push({ name: parts[0].trim(), type: parts[1].trim() });
              }
            });
          }

          const totalWeight = challenge.testCases.reduce((sum, tc) => sum + (Number(tc.weight) || 2), 0);

          const questionData = {
            questionId: qId,
            title: challenge.title,
            slug: challenge.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            version: 1,
            createdAt: challenge.createdAt || new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
            QBCategory: challenge.qbCategory || 'customCoding',
            metadata: {
              category: challenge.category || 'General',
              difficulty: challenge.difficulty || 'Easy',
              isPremium: !!testDetails.premium,
              tags: parsedTopicTags,
              companyTags: parsedCompanyTags,
              topicTags: parsedTopicTags,
              QBCategory: challenge.qbCategory || 'customCoding'
            },
            content: {
              problemStatement: challenge.description || '',
              constraints: parsedConstraints,
              inputFormat: challenge.inputFormat || '',
              outputFormat: challenge.outputFormat || '',
              sampleTestCases: challenge.sampleTestCases || []
            },
            testCases: {
              hidden: challenge.testCases.map(tc => ({
                id: tc.id,
                label: tc.label || 'testcase',
                input: tc.input || '',
                expectedOutput: tc.expectedOutput || '',
                weight: Number(tc.weight) || 2
              })),
              totalTestCases: challenge.testCases.length,
              totalWeight: totalWeight
            },
            scoring: {
              defaultScoringType: 'PARTIAL_SCORE',
              testCaseWeights: challenge.testCases.map(tc => Number(tc.weight) || 2),
              maxScore: totalWeight
            },
            judging: {
              timeLimitMs: Number(challenge.timeLimitMs) || 2000,
              memoryLimitMb: Number(challenge.memoryLimitMb) || 256,
              supportedLanguages: challenge.supportedLanguages || ["C", "C++", "Java", "Python3", "JavaScript"]
            },
            boilerPlates: challenge.boilerplates || {},
            solution: {
              approach: challenge.approach || '',
              timeComplexity: challenge.timeComplexity || '',
              spaceComplexity: challenge.spaceComplexity || '',
              code: challenge.solutionCodes || {}
            },
            _internal: {
              methodName: challenge.methodName || '',
              params: parsedParams
            }
          };

          // 1. Save question JSON file
          const qPath = `coding/questions/${qId}.json`;
          await uploadFileToRepo(qPath, questionData, `Save coding challenge: ${challenge.title}`);

          // 2. Register manifest indexes
          try {
            await updateQuestionsIndex(qId, questionData);
            if (questionData.metadata.category) {
              await addQuestionToCategory(questionData.metadata.category, qId);
            }
          } catch (indexErr) {
            /* console.warn('Index registry warning:', indexErr) */ void 0;
          }

          questionIds.push(qId);
        }

        // Write assessment file
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
        await uploadFileToRepo(path, testData, `${isEditing ? 'Update' : 'Publish'} Coding test: ${testDetails.title}`);
        showMsg(`✅ Coding test successfully saved under: ${path}`, 'success');
      }

      handleResetCreator();
      loadExistingTests();
    } catch (err) {
      /* console.error(err) */ void 0;
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>Select Test Type</Typography>
              {isEditing && (
                <Chip label="EDIT MODE" size="small" color="warning" sx={{ fontWeight: 700, height: 20, fontSize: 10 }} />
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant={testType === 'mcq' ? 'contained' : 'outlined'}
                onClick={() => { if (activeStep === 0) setTestType('mcq'); }}
                disabled={activeStep > 0 || isEditing} startIcon={<QuizIcon />}>MCQ Test</Button>
              <Button fullWidth variant={testType === 'coding' ? 'contained' : 'outlined'}
                onClick={() => { if (activeStep === 0) setTestType('coding'); }}
                disabled={activeStep > 0 || isEditing} startIcon={<CodeIcon />}>Coding Test</Button>
            </Stack>
            {isEditing && (
              <Button size="small" color="error" variant="outlined" onClick={handleResetCreator} sx={{ py: 0.5, fontSize: 11 }}>
                Cancel Edit Mode
              </Button>
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
              <Typography variant="h6" fontWeight={800} mb={3}>
                {isEditing ? 'Edit' : 'New'} Assessment Configuration
              </Typography>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                    TEST ID / SLUG (Pre-fixed with College Name)
                  </Typography>
                  <TextField fullWidth size="small" placeholder="slug-name-here" name="id"
                    disabled={isEditing}
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
                  Next: Add/Edit Questions
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Existing tests list */}
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={800} mb={2}>
                Existing {testType.toUpperCase()} Tests for {college} (Edit available)
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
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {existingTests.map((t, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
                            {t.name.replace(`${college}_`, '')}
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
                              {t.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit this test">
                              <IconButton size="small" color="primary" onClick={() => handleEditTest(t)} disabled={busy}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
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
                    <Box sx={{ py: 6, color: 'text.secondary' }}>
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
              {/* Coding Challenge manual input wizard tabs */}
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight={800} mb={1.5}>Custom Coding Challenge Form</Typography>
                  
                  <Tabs value={editorTab} onChange={(_, v) => setEditorTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="1. Metadata" sx={{ fontSize: 11, fontWeight: 700 }} />
                    <Tab label="2. Content" sx={{ fontSize: 11, fontWeight: 700 }} />
                    <Tab label="3. Cases" sx={{ fontSize: 11, fontWeight: 700 }} />
                    <Tab label="4. Setup" sx={{ fontSize: 11, fontWeight: 700 }} />
                    <Tab label="5. Code templates" sx={{ fontSize: 11, fontWeight: 700 }} />
                  </Tabs>

                  {/* TAB 1: Metadata */}
                  {editorTab === 0 && (
                    <Stack spacing={2}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" placeholder="slug-id" label="Challenge ID Slug"
                            value={customCoding.id} onChange={e => setCustomCoding({ ...customCoding, id: e.target.value })}
                            InputProps={{ startAdornment: <Box sx={{ fontSize: 11, mr: 0.5, fontWeight: 700, opacity: 0.7 }}>{college}_</Box> }} />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" label="Challenge Title" value={customCoding.title}
                            onChange={e => setCustomCoding({ ...customCoding, title: e.target.value })} />
                        </Grid>
                      </Grid>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <TextField fullWidth select size="small" label="Difficulty" value={customCoding.difficulty}
                            onChange={e => setCustomCoding({ ...customCoding, difficulty: e.target.value })}>
                            {['Easy', 'Medium', 'Hard'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                          </TextField>
                        </Grid>
                        <Grid item xs={4}>
                          <TextField fullWidth size="small" label="Category" placeholder="e.g. Arrays" value={customCoding.category}
                            onChange={e => setCustomCoding({ ...customCoding, category: e.target.value })} />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField fullWidth size="small" label="QB Category" placeholder="e.g. LCD" value={customCoding.qbCategory}
                            onChange={e => setCustomCoding({ ...customCoding, qbCategory: e.target.value })} />
                        </Grid>
                      </Grid>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" label="Topic Tags (comma-separated)" placeholder="e.g. array, binary-search" value={customCoding.topicTags}
                            onChange={e => setCustomCoding({ ...customCoding, topicTags: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" label="Company Tags (comma-separated)" placeholder="e.g. Google, Amazon" value={customCoding.companyTags}
                            onChange={e => setCustomCoding({ ...customCoding, companyTags: e.target.value })} />
                        </Grid>
                      </Grid>
                    </Stack>
                  )}

                  {/* TAB 2: Content */}
                  {editorTab === 1 && (
                    <Stack spacing={2}>
                      <TextField fullWidth multiline rows={4} label="Problem Statement" placeholder="Use HTML formatting if needed..." value={customCoding.description}
                        onChange={e => setCustomCoding({ ...customCoding, description: e.target.value })} />
                      <TextField fullWidth multiline rows={2} label="Constraints" placeholder="One constraint per line e.g. 1 <= forts.length <= 1000" value={customCoding.constraints}
                        onChange={e => setCustomCoding({ ...customCoding, constraints: e.target.value })} />
                      <TextField fullWidth size="small" label="Input Format" placeholder="e.g. Single line JSON array" value={customCoding.inputFormat}
                        onChange={e => setCustomCoding({ ...customCoding, inputFormat: e.target.value })} />
                      <TextField fullWidth size="small" label="Output Format" placeholder="e.g. JSON-serialised integer" value={customCoding.outputFormat}
                        onChange={e => setCustomCoding({ ...customCoding, outputFormat: e.target.value })} />
                    </Stack>
                  )}

                  {/* TAB 3: Cases (Public & Hidden) */}
                  {editorTab === 2 && (
                    <Stack spacing={2}>
                      {/* Sample cases */}
                      <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                          <Typography variant="caption" fontWeight={700}>Sample Cases (Shown in problem description)</Typography>
                          <Button size="small" startIcon={<AddIcon />} onClick={handleAddSampleCase}>Add Sample</Button>
                        </Box>
                        <Stack spacing={1} sx={{ maxHeight: 150, overflow: 'auto' }}>
                          {customCoding.sampleTestCases.map((sc, scIdx) => (
                            <Box key={scIdx} sx={{ border: '1px dashed #cbd5e1', p: 1, borderRadius: 1 }}>
                              <Grid container spacing={1} sx={{ mb: 1 }}>
                                <Grid item xs={6}>
                                  <TextField size="small" fullWidth label="Input" value={sc.input} onChange={e => handleSampleCaseChange(scIdx, 'input', e.target.value)} />
                                </Grid>
                                <Grid item xs={5}>
                                  <TextField size="small" fullWidth label="Output" value={sc.output} onChange={e => handleSampleCaseChange(scIdx, 'output', e.target.value)} />
                                </Grid>
                                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                  <IconButton size="small" color="error" disabled={customCoding.sampleTestCases.length === 1} onClick={() => handleRemoveSampleCase(scIdx)}><DeleteIcon fontSize="small" /></IconButton>
                                </Grid>
                              </Grid>
                              <TextField size="small" fullWidth label="Explanation" value={sc.explanation} onChange={e => handleSampleCaseChange(scIdx, 'explanation', e.target.value)} />
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      {/* Judged cases */}
                      <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                          <Typography variant="caption" fontWeight={700}>Judged Test Cases (Hidden/Run on Submit)</Typography>
                          <Button size="small" startIcon={<AddIcon />} onClick={handleAddTestCase}>Add TestCase</Button>
                        </Box>
                        <Stack spacing={1} sx={{ maxHeight: 180, overflow: 'auto' }}>
                          {customCoding.testCases.map((tc, tcIdx) => (
                            <Box key={tcIdx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <TextField size="small" placeholder="Label/Description" value={tc.label} onChange={e => handleTestCaseChange(tcIdx, 'label', e.target.value)} sx={{ flex: 1 }} />
                              <TextField size="small" placeholder="Input" value={tc.input} onChange={e => handleTestCaseChange(tcIdx, 'input', e.target.value)} sx={{ flex: 1.5 }} />
                              <TextField size="small" placeholder="Expected Output" value={tc.expectedOutput} onChange={e => handleTestCaseChange(tcIdx, 'expectedOutput', e.target.value)} sx={{ flex: 1.5 }} />
                              <TextField size="small" type="number" placeholder="Weight" value={tc.weight} onChange={e => handleTestCaseChange(tcIdx, 'weight', e.target.value)} sx={{ width: 65 }} />
                              <IconButton size="small" color="error" disabled={customCoding.testCases.length === 1} onClick={() => handleRemoveTestCase(tcIdx)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  )}

                  {/* TAB 4: Judging Setup */}
                  {editorTab === 3 && (
                    <Stack spacing={2}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" type="number" label="Time Limit (Ms)" value={customCoding.timeLimitMs}
                            onChange={e => setCustomCoding({ ...customCoding, timeLimitMs: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" type="number" label="Memory Limit (Mb)" value={customCoding.memoryLimitMb}
                            onChange={e => setCustomCoding({ ...customCoding, memoryLimitMb: e.target.value })} />
                        </Grid>
                      </Grid>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" label="Method Name (Driver entry point)" placeholder="e.g. captureForts" value={customCoding.methodName}
                            onChange={e => setCustomCoding({ ...customCoding, methodName: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" label="Params schema (comma-sep name:type)" placeholder="e.g. forts:integer[]" value={customCoding.methodParams}
                            onChange={e => setCustomCoding({ ...customCoding, methodParams: e.target.value })} />
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" fontWeight={700}>Solution Explanation</Typography>
                      <TextField fullWidth multiline rows={2} label="Approach description" value={customCoding.approach}
                        onChange={e => setCustomCoding({ ...customCoding, approach: e.target.value })} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" label="Time Complexity" placeholder="e.g. O(N)" value={customCoding.timeComplexity}
                            onChange={e => setCustomCoding({ ...customCoding, timeComplexity: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" label="Space Complexity" placeholder="e.g. O(1)" value={customCoding.spaceComplexity}
                            onChange={e => setCustomCoding({ ...customCoding, spaceComplexity: e.target.value })} />
                        </Grid>
                      </Grid>
                    </Stack>
                  )}

                  {/* TAB 5: Templates & Solution codes */}
                  {editorTab === 4 && (
                    <Box>
                      <Tabs value={codeLangTab} onChange={(_, v) => setCodeLangTab(v)} sx={{ mb: 1.5 }} size="small">
                        {['Python3', 'C', 'C++', 'Java', 'JavaScript'].map((lang, idx) => (
                          <Tab key={lang} label={lang} sx={{ fontSize: 10 }} />
                        ))}
                      </Tabs>
                      {['Python3', 'C', 'C++', 'Java', 'JavaScript'].map((lang, idx) => {
                        if (codeLangTab !== idx) return null;
                        return (
                          <Grid container spacing={2} key={lang}>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth multiline rows={6} label={`${lang} Student Boilerplate`}
                                value={customCoding.boilerplates[lang]}
                                onChange={e => handleBoilerplateChange(lang, e.target.value)}
                                inputProps={{ style: { fontFamily: 'monospace', fontSize: 10 } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth multiline rows={6} label={`${lang} Solution Code`}
                                value={customCoding.solutionCodes[lang]}
                                onChange={e => handleSolutionChange(lang, e.target.value)}
                                inputProps={{ style: { fontFamily: 'monospace', fontSize: 10 } }} />
                            </Grid>
                          </Grid>
                        );
                      })}
                    </Box>
                  )}

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button size="small" onClick={() => setEditorTab(prev => Math.max(0, prev - 1))} disabled={editorTab === 0}>Back Section</Button>
                    {editorTab < 4 ? (
                      <Button size="small" variant="outlined" onClick={() => setEditorTab(prev => prev + 1)}>Next Section</Button>
                    ) : (
                      <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleAddCodingChallenge}>
                        Add Challenge to List
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Coding Challenges preview list */}
              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={800} mb={2}>Added Coding Challenges ({codingChallenges.length})</Typography>
                  {codingChallenges.length === 0 ? (
                    <Box sx={{ py: 6, color: 'text.secondary', textAlign: 'center' }}>
                      <Typography>No challenges added. Use the left wizard panel to configure and add challenges.</Typography>
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
                              ID: <code>{c.id}</code> {c.isMapped && <Chip label="Master QB" size="small" color="info" sx={{ height: 16, fontSize: 8 }} />}
                            </Typography>
                            <Typography variant="caption" display="block">Category: {c.category}</Typography>
                            {c.topicTags && <Typography variant="caption" display="block" color="text.secondary">Topic Tags: {c.topicTags}</Typography>}
                            {c.companyTags && <Typography variant="caption" display="block" color="text.secondary">Company Tags: {c.companyTags}</Typography>}
                            <Typography variant="body2" sx={{ mt: 1, fontSize: 12 }}>{c.description}</Typography>
                            <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                              {c.sampleTestCases?.length} Sample Cases | {c.testCases?.length} Judged Cases (total weight: {c.testCases?.reduce((sum, tc) => sum + (Number(tc.weight) || 2), 0)})
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
                  <Typography variant="body2" fontWeight={700}>
                    {idx + 1}. {c.title} (ID: {c.id}) {c.isMapped && <Chip label="Master QB Ref" size="small" sx={{ height: 16, fontSize: 8 }} />}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">Difficulty: {c.difficulty}  ·  Category: {c.category}</Typography>
                  <Typography variant="body2" sx={{ my: 1 }}>{c.description}</Typography>
                  <Typography variant="caption" display="block">Instructions: {c.instructions}</Typography>
                  <Typography variant="caption" display="block">Constraints: {c.constraints}</Typography>

                  <Typography variant="subtitle2" sx={{ mt: 1.5, fontSize: 11, fontWeight: 700 }}>Test Cases Review:</Typography>
                  <Stack spacing={1}>
                    {c.testCases?.map((tc, tIdx) => (
                      <Typography key={tIdx} variant="caption" display="block" sx={{ fontFamily: 'monospace', bgcolor: '#f8fafc', p: 0.5, borderRadius: 1 }}>
                        Case {tIdx + 1}: Label: <strong>{tc.label || 'general'}</strong> | Input: <code>{tc.input}</code> | Expected: <code>{tc.expectedOutput}</code> | Weight: {tc.weight}
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
              {busy ? 'Saving Assessment…' : isEditing ? 'Update Assessment' : 'Publish Assessment'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TestCreator;
