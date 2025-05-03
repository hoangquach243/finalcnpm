import React, { useState } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Snackbar, 
  Alert,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import api from '../../api/api';

const Login = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setId('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { id, password });
      dispatch(setCredentials({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      }));
      navigate(res.data.user.role === 'admin' ? '/admin' : '/user/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <Container sx={{ mt: 8, maxWidth: '500px' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Đăng nhập
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Sinh viên" />
            <Tab label="Quản trị viên" />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label={activeTab === 0 ? "Tên đăng nhập sinh viên" : "Tên đăng nhập quản trị viên"}
            value={id}
            onChange={(e) => setId(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 2 }}
          >
            Đăng nhập
          </Button>
          {activeTab === 1 && (
            <Button 
              onClick={() => navigate('/admin/register')} 
              fullWidth 
              sx={{ mt: 1 }}
            >
              Đăng ký tài khoản quản trị viên
            </Button>
          )}
          {activeTab === 0 && (
            <Button 
              onClick={() => navigate('/user/register')} 
              fullWidth 
              sx={{ mt: 1 }}
            >
              Đăng ký tài khoản mới
            </Button>
          )}
        </Box>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default Login; 