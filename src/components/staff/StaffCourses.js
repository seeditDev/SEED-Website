import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Book as CourseIcon,
  Class as SeriesIcon,
  Assignment as TestIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import AssessmentAdminService from '../../services/assessmentAdminService';

const StaffCourses = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const list = await AssessmentAdminService.listCourses();
        setCourses(list);
      } catch (err) {
        console.error('[StaffCourses] Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <Box>
      <Box style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" style={{ fontWeight: 800, color: '#0f172a' }}>
            Course Series & Tests
          </Typography>
          <Typography variant="body2" style={{ color: '#64748b', marginTop: 4 }}>
            View published Courses, Series, and mapped Assessment Tests.
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress style={{ marginBottom: 24, borderRadius: 4 }} />}

      {!loading && courses.length === 0 && (
        <Paper style={{ padding: 48, textAlign: 'center', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <CourseIcon style={{ fontSize: 48, color: '#94a3b8', marginBottom: 16 }} />
          <Typography variant="h6" style={{ fontWeight: 700, color: '#0f172a' }}>
            No Courses Found
          </Typography>
          <Typography variant="body2" style={{ color: '#64748b', marginTop: 8 }}>
            Courses and Series published in the Admin Hub will appear here.
          </Typography>
        </Paper>
      )}

      {courses.map((course) => (
        <Paper key={course.id} style={{ marginBottom: 24, borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box style={{ padding: 24, background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff' }}>
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CourseIcon style={{ color: '#818cf8', fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" style={{ fontWeight: 800 }}>
                    {course.title}
                  </Typography>
                  <Typography variant="caption" style={{ color: '#94a3b8' }}>
                    {course.description || `ID: ${course.id}`}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${(course.series || []).length} Series`}
                size="small"
                style={{ background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8', fontWeight: 700 }}
              />
            </Box>
          </Box>

          <Box style={{ padding: 16 }}>
            {(course.series || []).map((series) => (
              <Accordion key={series.id} style={{ marginBottom: 12, border: '1px solid #f1f5f9', borderRadius: 12 }} elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SeriesIcon style={{ color: '#6366f1' }} />
                    <Typography variant="subtitle1" style={{ fontWeight: 700, color: '#0f172a' }}>
                      {series.title}
                    </Typography>
                    <Chip
                      label={`${(series.tests || []).length} Tests`}
                      size="small"
                      variant="outlined"
                      style={{ height: 22, fontSize: '0.75rem', marginLeft: 8 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List disablePadding>
                    {(series.tests || []).map((test) => (
                      <React.Fragment key={test.id}>
                        <ListItem style={{ padding: '12px 16px' }}>
                          <TestIcon style={{ color: '#94a3b8', marginRight: 16 }} />
                          <ListItemText
                            primary={
                              <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Typography variant="subtitle2" style={{ fontWeight: 700, color: '#0f172a' }}>
                                  {test.title || test.assessmentTitle || test.id}
                                </Typography>
                                <Chip
                                  label={(test.type || 'mcq').toUpperCase()}
                                  size="small"
                                  style={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    background: (test.type || '').toLowerCase() === 'coding' ? '#e0e7ff' : '#f0fdf4',
                                    color: (test.type || '').toLowerCase() === 'coding' ? '#4338ca' : '#15803d'
                                  }}
                                />
                              </Box>
                            }
                            secondary={`Duration: ${test.duration_minutes || test.durationMinutes || 60} mins | Marks: ${test.totalMarks || 100}`}
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                    {(series.tests || []).length === 0 && (
                      <Typography variant="caption" style={{ color: '#94a3b8', fontStyle: 'italic', padding: 16, display: 'block' }}>
                        No tests assigned to this series yet.
                      </Typography>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default StaffCourses;
