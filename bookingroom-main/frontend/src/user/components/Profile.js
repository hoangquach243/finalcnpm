import React, { useState, useEffect } from 'react';
import {
  Container, Typography, TextField, Button, Box, Snackbar, Alert,
  AppBar, Toolbar, IconButton, Grid, Paper
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../../store/authSlice';
import api from '../../api/api';
import Footer from './Footer';

function Profile() {
  const [user, setUser] = useState({
    id: '',
    studentId: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    birthDate: '',
    address: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, refreshToken, user: authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setUser({
          id: res.data.data.id,
          studentId: res.data.data.studentId,
          name: res.data.data.name,
          email: res.data.data.email,
          phone: res.data.data.phone,
          gender: res.data.data.gender,
          birthDate: res.data.data.birthDate ? new Date(res.data.data.birthDate).toISOString().split('T')[0] : '',
          address: res.data.data.address,
          password: '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải thông tin hồ sơ');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const updateData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate,
        address: user.address,
      };
      if (user.password) {
        updateData.password = user.password;
      }
      const res = await api.put('/auth/update', updateData);
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
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
          {authUser?.role === 'admin' && (
            <Button color="inherit" onClick={() => navigate('/admin')}>
              Quản trị
            </Button>
          )}
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>Thông tin cá nhân</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tên đăng nhập"
                fullWidth
                margin="normal"
                value={user.id}
                disabled
                helperText="Tên đăng nhập không thể thay đổi"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Mã số sinh viên"
                fullWidth
                margin="normal"
                value={user.studentId}
                disabled
                helperText="Mã số sinh viên không thể thay đổi"
              />
            </Grid>
          </Grid>

          <TextField
            label="Họ và tên"
            fullWidth
            margin="normal"
            name="name"
            value={user.name}
            onChange={handleChange}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            name="email"
            value={user.email}
            onChange={handleChange}
            type="email"
          />
          <TextField
            label="Số điện thoại"
            fullWidth
            margin="normal"
            name="phone"
            value={user.phone}
            onChange={handleChange}
          />
          <TextField
            label="Địa chỉ"
            fullWidth
            margin="normal"
            name="address"
            value={user.address}
            onChange={handleChange}
          />
          <TextField
            label="Giới tính"
            fullWidth
            margin="normal"
            name="gender"
            value={user.gender}
            onChange={handleChange}
            select
            SelectProps={{ native: true }}
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </TextField>
          <TextField
            label="Ngày sinh"
            type="date"
            fullWidth
            margin="normal"
            name="birthDate"
            value={user.birthDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Mật khẩu mới"
            type="password"
            fullWidth
            margin="normal"
            name="password"
            value={user.password}
            onChange={handleChange}
            helperText="Để trống nếu không muốn thay đổi mật khẩu"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
          >
            Cập nhật thông tin
          </Button>
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default Profile;