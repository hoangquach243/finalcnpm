import React, { useState, useEffect } from 'react';
import {
  Container, Typography, List, ListItem, ListItemText, Snackbar, Alert,
  AppBar, Toolbar, Button, IconButton
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../../store/authSlice';
import api from '../../api/api';
import Footer from './Footer';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const { token, refreshToken, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải thông báo');
      }
    };
    fetchNotifications();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
      dispatch(clearCredentials());
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(clearCredentials());
      navigate('/login');
    }
  };

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HCMUT - Không gian học tập
          </Typography>
          <Button color="inherit" onClick={() => navigate('/user/search')}>
            Trang chủ
          </Button>
          <Button color="inherit" onClick={() => navigate('/user/notifications')}>
            Thông báo
          </Button>
          <Button color="inherit" onClick={() => navigate('/user/profile')}>
            Hồ sơ
          </Button>
          {user?.role === 'admin' && (
            <Button color="inherit" onClick={() => navigate('/admin')}>
              Quản trị
            </Button>
          )}
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>Thông báo</Typography>
        <List>
          {notifications.map((notification) => (
            <ListItem key={notification._id}>
              <ListItemText
                primary={notification.message}
                secondary={new Date(notification.createdAt).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      </Container>

      <Footer />
    </>
  );
}

export default Notifications;