import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, Box, MenuItem, AppBar, Toolbar, IconButton, Grid
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../../store/authSlice';
import api from '../../api/api';
import Footer from './Footer';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({
    id: '',
    studentId: '',
    name: '',
    password: '',
    email: '',
    phone: '',
    gender: 'Nam',
    birthDate: '',
    address: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/all-users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách người dùng');
    }
  };

  const handleOpen = (user = null) => {
    setEditUser(user);
    if (user) {
      setNewUser({
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        password: '',
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        address: user.address,
        role: user.role
      });
    } else {
      setNewUser({
        id: '',
        studentId: '',
        name: '',
        password: '',
        email: '',
        phone: '',
        gender: 'Nam',
        birthDate: '',
        address: '',
        role: 'user'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditUser(null);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    try {
      if (!newUser.id || newUser.id.length < 6) {
        setError('Tên đăng nhập phải có ít nhất 6 ký tự');
        return;
      }
      if (!newUser.studentId || newUser.studentId.length < 6) {
        setError('Mã số sinh viên phải có ít nhất 6 ký tự');
        return;
      }
      if (!newUser.name || newUser.name.length < 2) {
        setError('Tên phải có ít nhất 2 ký tự');
        return;
      }
      if (!editUser && (!newUser.password || newUser.password.length < 6)) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }

      const userData = {
        id: newUser.id,
        studentId: newUser.studentId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        gender: newUser.gender,
        birthDate: newUser.birthDate,
        address: newUser.address,
        role: newUser.role
      };

      if (newUser.password) {
        userData.password = newUser.password;
      }

      if (editUser) {
        await api.put(`/admin/users/${editUser._id}`, userData);
        setSuccess('Cập nhật thông tin người dùng thành công');
      } else {
        await api.post('/admin/users', userData);
        setSuccess('Thêm người dùng mới thành công');
      }
      fetchUsers();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu thông tin người dùng');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
    try {
        await api.delete(`/admin/users/${userId}`);
      setSuccess('Xóa người dùng thành công');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa người dùng');
      }
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
            HCMUT - Quản lý người dùng
          </Typography>
          <Button color="inherit" onClick={() => navigate('/admin')}>
            Trang chủ
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4">Quản lý người dùng</Typography>
          <Button variant="contained" color="primary" onClick={() => handleOpen()}>
            Thêm người dùng mới
        </Button>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên đăng nhập</TableCell>
              <TableCell>Mã số sinh viên</TableCell>
              <TableCell>Họ và tên</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.studentId}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(user)}>Sửa</Button>
                  <Button color="error" onClick={() => handleDelete(user._id)}>Xóa</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
              <TextField
                  label="Tên đăng nhập"
                  fullWidth
                  margin="normal"
                value={newUser.id}
                onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                  required
                  helperText="Tên đăng nhập dùng để đăng nhập vào hệ thống"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Mã số sinh viên"
                fullWidth
                  margin="normal"
                  value={newUser.studentId}
                  onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                required
                  helperText="Mã số sinh viên chính thức của trường"
              />
              </Grid>
            </Grid>

              <TextField
              label="Họ và tên"
              fullWidth
              margin="normal"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
              <TextField
              label="Email"
                fullWidth
              margin="normal"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              type="email"
              />
              <TextField
                label="Số điện thoại"
              fullWidth
              margin="normal"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
              <TextField
                label="Địa chỉ"
              fullWidth
              margin="normal"
                value={newUser.address}
                onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
              />
              <TextField
                label="Giới tính"
              fullWidth
              margin="normal"
                value={newUser.gender}
                onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
              select
              >
              <MenuItem value="Nam">Nam</MenuItem>
              <MenuItem value="Nữ">Nữ</MenuItem>
              <MenuItem value="Khác">Khác</MenuItem>
              </TextField>
              <TextField
                label="Ngày sinh"
                type="date"
              fullWidth
              margin="normal"
                value={newUser.birthDate}
                onChange={(e) => setNewUser({ ...newUser, birthDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
              label="Mật khẩu"
              type="password"
              fullWidth
              margin="normal"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              helperText={editUser ? "Để trống nếu không muốn thay đổi mật khẩu" : "Mật khẩu phải có ít nhất 6 ký tự"}
            />
            <TextField
                label="Vai trò"
              fullWidth
              margin="normal"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              select
              >
              <MenuItem value="user">Sinh viên</MenuItem>
              <MenuItem value="admin">Quản trị viên</MenuItem>
              </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Lưu
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Footer />
    </>
  );
}

export default UserManagement;