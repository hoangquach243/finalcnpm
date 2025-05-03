import React, { useState } from 'react';
import {
  Container, Typography, TextField, Button, Box, Snackbar, Alert,
  AppBar, Toolbar, IconButton
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../../store/authSlice';
import api from '../../api/api';
import Footer from './Footer';

function Rating() {
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, refreshToken, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await api.post('/ratings', { rating, comment });
      setSuccess(res.data.message);
      setTimeout(() => navigate('/user/search'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi đánh giá');
    }
  };

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
        <Typography variant="h4" gutterBottom>Đánh giá</Typography>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Điểm đánh giá (1-5)"
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Bình luận"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
            Gửi đánh giá
          </Button>
        </Box>

        <Snackbar
          open={!!error || !!success}
          autoHideDuration={6000}
          onClose={() => {
            setError('');
            setSuccess('');
          }}
        >
          <Alert
            severity={error ? 'error' : 'success'}
            onClose={() => {
              setError('');
              setSuccess('');
            }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Container>

      <Footer />
    </>
  );
}

export default Rating;