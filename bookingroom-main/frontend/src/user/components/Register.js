import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Snackbar, Alert, Grid } from '@mui/material';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [id, setId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    try {
      const registerData = { 
        id, 
        studentId,
        name, 
        password, 
        email, 
        phone, 
        gender, 
        birthDate, 
        address 
      };
      const res = await api.post('/auth/register', registerData);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server, vui lòng thử lại sau');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Đăng Ký Tài Khoản Sinh Viên</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Vui lòng nhập đầy đủ thông tin để đăng ký tài khoản
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
              label="Mã số sinh viên"
              fullWidth
              margin="normal"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              helperText="Mã số sinh viên chính thức của trường"
            />
          </Grid>
        </Grid>
        <TextField
          label="Họ và tên"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        />
        <TextField
          label="Số điện thoại"
          fullWidth
          margin="normal"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField
          label="Địa chỉ"
          fullWidth
          margin="normal"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <FormLabel component="legend">Giới tính</FormLabel>
          <RadioGroup
            row
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <FormControlLabel value="Nam" control={<Radio />} label="Nam" />
            <FormControlLabel value="Nữ" control={<Radio />} label="Nữ" />
            <FormControlLabel value="Khác" control={<Radio />} label="Khác" />
          </RadioGroup>
        </FormControl>
        <TextField
          label="Ngày sinh"
          type="date"
          fullWidth
          margin="normal"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
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

export default Register; 