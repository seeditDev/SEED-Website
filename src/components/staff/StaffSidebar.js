import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assessment as ReportsIcon,
  Book as CoursesIcon,
  Quiz as McqIcon,
  Code as CodingIcon,
  AssignmentTurnedIn as AssessmentsIcon,
  People as StudentsIcon,
  PersonSearch as AnalysisIcon,
  ExitToApp as LogoutIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import TrackingService from '../../services/trackingService';

const DRAWER_WIDTH = 260;

const MENU_ITEMS = [
  { text: 'Dashboard', path: '/staff/dashboard', icon: <DashboardIcon /> },
  { text: 'Reports', path: '/staff/reports', icon: <ReportsIcon /> },
  { text: 'Courses & Series', path: '/staff/courses', icon: <CoursesIcon /> },
  { text: 'MCQ Creator', path: '/staff/mcq-creator', icon: <McqIcon /> },
  { text: 'Coding Creator', path: '/staff/coding-creator', icon: <CodingIcon /> },
  { text: 'Assessments', path: '/staff/assessments', icon: <AssessmentsIcon /> },
  { text: 'Students', path: '/staff/students', icon: <StudentsIcon /> },
  { text: 'Student Analysis', path: '/staff/students/analysis', icon: <AnalysisIcon /> }
];


const StaffSidebar = ({ user, mobileOpen, handleDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      TrackingService.stopTracking();
    } catch (_) {}
    localStorage.removeItem('auth_data');
    localStorage.removeItem('role');
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#f8fafc' }}>
      {/* Brand Header */}
      <Box style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Avatar style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', width: 42, height: 42 }}>
          <SchoolIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.05rem', lineHeight: 1.2 }}>
            SEED Staff
          </Typography>
          <Chip label="Staff Workspace" size="small" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700, fontSize: '0.68rem', height: 20, marginTop: 4 }} />
        </Box>
      </Box>

      {/* User Info Strip */}
      {user && (
        <Box style={{ padding: '14px 20px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="subtitle2" style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem' }}>
            {user.Name || user.name || 'Staff User'}
          </Typography>
          <Typography variant="caption" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
            {user.College || user.college || user.Email || 'SEED-IT Partner'}
          </Typography>
        </Box>
      )}

      {/* Navigation Links */}
      <List style={{ flex: 1, padding: '16px 12px' }}>
        {MENU_ITEMS.map((item) => {
          const isSelected = location.pathname === item.path || (item.path !== '/staff/dashboard' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding style={{ marginBottom: 4 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isSelected}
                style={{
                  borderRadius: 10,
                  padding: '10px 14px',
                  background: isSelected ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon style={{ color: isSelected ? '#ffffff' : '#64748b', minWidth: 38 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ style: { fontWeight: isSelected ? 700 : 500, fontSize: '0.9rem' } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Logout Button */}
      <Box style={{ padding: '16px 12px' }}>
        <ListItemButton
          onClick={handleLogout}
          style={{
            borderRadius: 10,
            padding: '10px 14px',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.08)'
          }}
        >
          <ListItemIcon style={{ color: '#ef4444', minWidth: 38 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ style: { fontWeight: 700, fontSize: '0.9rem' } }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" style={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        style={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        style={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' } }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default StaffSidebar;
