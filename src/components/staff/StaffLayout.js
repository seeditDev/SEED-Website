import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  ExitToApp as LogoutIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material';
import StaffSidebar from './StaffSidebar';
import TrackingService from '../../services/trackingService';

const DRAWER_WIDTH = 260;

const StaffLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('portal_theme') || 'bw');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth_data');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (_) {}
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    try {
      TrackingService.stopTracking();
    } catch (_) {}
    localStorage.removeItem('auth_data');
    localStorage.removeItem('role');
    navigate('/login', { replace: true });
  };

  const toggleTheme = () => {
    const nextTheme = themeMode === 'bw' ? 'light' : 'bw';
    setThemeMode(nextTheme);
    localStorage.setItem('portal_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <Box style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Header Bar */}
      <AppBar
        position="fixed"
        style={{
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          marginLeft: `${DRAWER_WIDTH}px`,
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 1100
        }}
      >
        <Toolbar style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              style={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
              Staff Workspace
            </Typography>
          </Box>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} size="small" style={{ color: '#64748b' }}>
                {themeMode === 'bw' ? <LightIcon /> : <DarkIcon />}
              </IconButton>
            </Tooltip>

            {user && (
              <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={handleProfileMenuOpen}>
                <Avatar style={{ background: '#6366f1', width: 34, height: 34, fontSize: '0.9rem', fontWeight: 700 }}>
                  {(user.Name || user.name || 'S')[0].toUpperCase()}
                </Avatar>
                <Typography variant="body2" style={{ fontWeight: 600, color: '#334155', display: { xs: 'none', sm: 'block' } }}>
                  {user.Name || user.name || 'Staff User'}
                </Typography>
              </Box>
            )}

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Signed in as {user?.Email || user?.email || 'Staff'}
              </MenuItem>
              <MenuItem onClick={handleLogout} style={{ color: '#ef4444', gap: '8px' }}>
                <LogoutIcon fontSize="small" /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Sidebar */}
      <StaffSidebar user={user} mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Main Content Area */}
      <Box
        component="main"
        style={{
          flexGrow: 1,
          padding: '88px 24px 32px 24px',
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
          background: '#f8fafc'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default StaffLayout;
