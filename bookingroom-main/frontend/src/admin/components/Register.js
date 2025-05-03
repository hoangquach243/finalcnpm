import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Snackbar, Alert, Grid } from '@mui/material';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

const AdminRegister = () => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    try {
      const registerData = { 
        id, 
        name, 
        password, 
        email, 
        phone,
        verificationCode
      };
      const res = await api.post('/auth/register-admin', registerData);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server, vui lòng thử lại sau');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Đăng Ký Tài Khoản Quản Trị Viên</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Vui lòng nhập đầy đủ thông tin để đăng ký tài khoản quản trị viên
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Tên đăng nhập"
              fullWidth
              margin="normal"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              helperText="Tên đăng nhập dùng để đăng nhập vào hệ thống"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Họ và tên"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
        </Grid>
        <TextField
          label="Mật khẩu"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText="Mật khẩu phải có ít nhất 6 ký tự"
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <TextField
          label="Số điện thoại"
          fullWidth
          margin="normal"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <TextField
          label="Mã xác thực"
          fullWidth
          margin="normal"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          required
          helperText="Nhập mã xác thực được cấp để tạo tài khoản quản trị viên"
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleRegister}
          sx={{ mt: 3 }}
        >
          Đăng ký
        </Button>
      </Box>
    </Container>
  );
};

export default AdminRegister;
