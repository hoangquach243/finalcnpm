import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Container, Grid, Typography, Snackbar, Alert, AppBar, Toolbar, IconButton } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../../store/authSlice';
import api from '../../api/api';
import Footer from './Footer';

function UserInfo() {
  const [user, setUser] = useState({
    _id: '',
    id: '',
    name: '',
    birthDate: '',
    gender: '',
    address: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const { token, user: authUser, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/profile');
        const adminUser = res.data.data;
        if (adminUser) {
          setUser({
            _id: adminUser._id,
            id: adminUser.id,
            name: adminUser.name,
            birthDate: adminUser.birthDate ? new Date(adminUser.birthDate).toISOString().split('T')[0] : '',
            gender: adminUser.gender,
            address: adminUser.address,
            email: adminUser.email,
            phone: adminUser.phone,
            password: '',
          });
        } else {
          setError('Không tìm thấy thông tin admin');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi lấy thông tin admin');
      } finally {
        setLoading(false);
      }
    };

    if (token && authUser?.role === 'admin') {
      fetchUser();
    } else {
      setError('Vui lòng đăng nhập với tài khoản admin');
      setLoading(false);
    }
  }, [token, authUser]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const updateData = {
        name: user.name,
        birthDate: user.birthDate,
        gender: user.gender,
        address: user.address,
        email: user.email,
        phone: user.phone,
      };
      if (user.password) {
        updateData.password = user.password;
      }
      const res = await api.put('/auth/update', updateData);
      setSuccess('Cập nhật thông tin thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thông tin thất bại');
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

  if (loading) {
    return (
      <Container sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HCMUT - Quản trị
          </Typography>
          <Button color="inherit" onClick={() => navigate('/admin')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => navigate('/admin/users')}>
            Quản lý người dùng
          </Button>
          <Button color="inherit" onClick={() => navigate('/admin/spaces')}>
            Quản lý phòng
          </Button>
          <Button color="inherit" onClick={() => navigate('/admin/user')}>
            Thông tin cá nhân
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: '32px', fontWeight: 'bold', color: 'blue', marginBottom: '30px' }}>
          Thông tin nhân viên
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={10}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Họ và tên"
                value={user.name}
                onChange={handleChange}
                fullWidth
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '20px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="id"
                label="ID"
                value={user.id}
                onChange={handleChange}
                fullWidth
                disabled
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '15px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="birthDate"
                label="Ngày tháng năm sinh"
                type="date"
                value={user.birthDate}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '15px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="gender"
                label="Giới tính"
                value={user.gender}
                onChange={handleChange}
                fullWidth
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '15px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="address"
                label="Địa chỉ"
                value={user.address}
                onChange={handleChange}
                fullWidth
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '15px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                value={user.email}
                onChange={handleChange}
                fullWidth
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '15px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Số điện thoại"
                value={user.phone}
                onChange={handleChange}
                fullWidth
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '15px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label="Mật khẩu"
                type="password"
                value={user.password}
                onChange={handleChange}
                fullWidth
                sx={{
                  width: '400px',
                  height: '60px',
                  '& .MuiInputLabel-root': {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: 'blue',
                    transform: 'translateY(-20px) translateX(10px)',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '25px',
                    padding: '15px',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    border: '2px solid rgb(255, 255, 255)',
                  },
                }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" color="primary" sx={{ fontSize: '20px' }}>
              Cập nhật thông tin
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin')}
              sx={{ fontSize: '20px' }}
            >
              Quay lại
            </Button>
          </Box>
        </form>
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

export default UserInfo;