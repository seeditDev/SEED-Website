import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import StudentAnalysisView from '../StudentAnalysisView';
import DataService from '../../services/dataService';

const StaffStudentAnalysis = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [allResults, setAllResults] = useState([]);

  useEffect(() => {
    const loadAnalysisData = async () => {
      setLoading(true);
      try {
        const staffAuthRaw = localStorage.getItem('auth_data');
        const staffAuth = staffAuthRaw ? JSON.parse(staffAuthRaw) : {};
        const college = staffAuth.College || staffAuth.college || 'SEEDIT';
        const year = staffAuth.Year || staffAuth.year || '2K26';

        let list = [];
        try {
          const raw = await DataService.getCollegeData(college, 'scores', year);
          list = Array.isArray(raw) ? raw : (raw.students || raw.data || []);
        } catch (_) {}

        setAllResults(list);

        let target = null;
        if (studentId && studentId !== 'analysis') {
          target = list.find(s => 
            (s['Roll Number'] || s.rollNumber || '').toLowerCase() === studentId.toLowerCase() ||
            (s.Email || s.email || '').toLowerCase() === studentId.toLowerCase()
          );
        }

        if (!target && list.length > 0) {
          target = list[0];
        }

        if (target) {
          setStudentData({
            name: target.Name || target.name || 'Student',
            rollNumber: target['Roll Number'] || target.rollNumber || 'N/A',
            email: target.Email || target.email || 'N/A',
            college: target.College || target.college || college,
            department: target.Department || target.department || 'N/A',
            year: target.Year || target.year || year,
            score: target.score || target.correctAnswers || 0,
            totalMarks: target.totalMarks || 100,
            percentage: Math.round(target.percentage !== undefined ? target.percentage : ((target.score || 0) / (target.totalMarks || 100)) * 100),
            testName: target.testName || target.assessmentName || 'Assessment',
            questions: target.questions || [],
            answers: target.answers || [],
            violationCount: target.violationCount || 0,
            timeTaken: target.timeTaken || 'N/A',
            ...target
          });
        }
      } catch (err) {
        console.error('[StaffStudentAnalysis] Error loading student analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [studentId]);

  if (loading) {
    return (
      <Box style={{ padding: 48, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" style={{ marginTop: 16, color: '#64748b' }}>
          Loading student performance analysis...
        </Typography>
      </Box>
    );
  }

  if (!studentData) {
    return (
      <Paper style={{ padding: 32, textAlign: 'center', borderRadius: 16 }}>
        <Typography variant="h6" color="text.secondary">
          No student record found for analysis.
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/staff/students')}
          style={{ marginTop: 16 }}
        >
          Back to Students
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <StudentAnalysisView
        student={studentData}
        assessmentData={studentData}
        allStudentResults={allResults}
        onBack={() => navigate('/staff/students')}
      />
    </Box>
  );
};

export default StaffStudentAnalysis;
