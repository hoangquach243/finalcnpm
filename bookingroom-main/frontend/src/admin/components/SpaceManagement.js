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

function SpaceManagement() {
  const [spaces, setSpaces] = useState([]);
  const [filteredSpaces, setFilteredSpaces] = useState([]);
  const [filters, setFilters] = useState({
    building: '',
    type: '',
    floor: ''
  });
  const [availableFloors, setAvailableFloors] = useState([]);
  const [availableBuildings, setAvailableBuildings] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editSpace, setEditSpace] = useState(null);
  const [newSpace, setNewSpace] = useState({
    name: '',
    type: 'Phòng tự học',
    building: 'Tòa A',
    floor: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (spaces.length > 0) {
      // Lấy danh sách tầng duy nhất từ dữ liệu phòng
      const floors = [...new Set(spaces.map(space => space.floor))].sort((a, b) => a - b);
      setAvailableFloors(floors);

      // Lấy danh sách tòa duy nhất từ dữ liệu phòng
      const buildings = [...new Set(spaces.map(space => space.building))].sort();
      setAvailableBuildings(buildings);

      // Lấy danh sách loại phòng duy nhất từ dữ liệu phòng
      const types = [...new Set(spaces.map(space => {
        return space.roomType === 'individual' ? 'Phòng tự học' : 
               space.roomType === 'group' ? 'Phòng học nhóm' : 'Phòng mentor';
      }))].sort();
      setAvailableTypes(types);
    }
  }, [spaces]);

  useEffect(() => {
    filterSpaces();
  }, [spaces, filters]);

  const fetchSpaces = async () => {
    try {
      const res = await api.get('/admin/rooms');
      setSpaces(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách phòng');
    }
  };

  const filterSpaces = () => {
    let result = [...spaces];
    if (filters.building) {
      result = result.filter(space => space.building === filters.building);
    }
    if (filters.type) {
      result = result.filter(space => {
        const spaceType = space.roomType === 'individual' ? 'Phòng tự học' : 
                         space.roomType === 'group' ? 'Phòng học nhóm' : 'Phòng mentor';
        return spaceType === filters.type;
      });
    }
    if (filters.floor) {
      result = result.filter(space => space.floor.toString() === filters.floor);
    }
    setFilteredSpaces(result);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpen = (space = null) => {
    setEditSpace(space);
    if (space) {
      setNewSpace({
        name: space.roomName,
        type: space.roomType === 'individual' ? 'Phòng tự học' : space.roomType === 'group' ? 'Phòng học nhóm' : 'Phòng mentor',
        building: space.building,
        floor: space.floor
      });
    } else {
      setNewSpace({
        name: '',
        type: 'Phòng tự học',
        building: 'Tòa A',
        floor: 1
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditSpace(null);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    try {
      if (!newSpace.name) {
        setError('Tên phòng không được để trống');
        return;
      }
      if (!newSpace.building) {
        setError('Tòa không được để trống');
        return;
      }
      if (!newSpace.floor || newSpace.floor < 1) {
        setError('Tầng phải là số dương');
        return;
      }

      const spaceData = {
        name: newSpace.name,
        type: newSpace.type,
        building: newSpace.building,
        floor: Number(newSpace.floor)
      };

      if (editSpace) {
        await api.put(`/admin/space/${editSpace._id}`, spaceData);
        setSuccess('Cập nhật phòng thành công');
      } else {
        await api.post('/admin/space', spaceData);
        setSuccess('Thêm phòng thành công');
      }
      fetchSpaces();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu phòng');
    }
  };

  const handleDelete = async (spaceId) => {
    try {
      await api.delete(`/admin/space/${spaceId}`);
      setSuccess('Xóa phòng thành công');
      fetchSpaces();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa phòng');
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
        <Typography variant="h4" gutterBottom>Quản lý phòng</Typography>
        
        <Box sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 1, 
          bgcolor: 'background.paper',
          boxShadow: 1
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Lọc theo tòa"
                value={filters.building}
                onChange={(e) => handleFilterChange('building', e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    minWidth: '200px'
                  },
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'background.paper',
                    padding: '0 4px'
                  }
                }}
              >
                <MenuItem value="">Tất cả tòa</MenuItem>
                {availableBuildings.map(building => (
                  <MenuItem key={building} value={building}>
                    {building}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Lọc theo loại phòng"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    minWidth: '200px'
                  },
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'background.paper',
                    padding: '0 4px'
                  }
                }}
              >
                <MenuItem value="">Tất cả loại phòng</MenuItem>
                {availableTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Lọc theo tầng"
                value={filters.floor}
                onChange={(e) => handleFilterChange('floor', e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    minWidth: '200px'
                  },
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'background.paper',
                    padding: '0 4px'
                  }
                }}
              >
                <MenuItem value="">Tất cả tầng</MenuItem>
                {availableFloors.map(floor => (
                  <MenuItem key={floor} value={floor.toString()}>
                    Tầng {floor}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => setFilters({ building: '', type: '', floor: '' })}
                sx={{ 
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                Xóa bộ lọc
              </Button>
              <Button 
                variant="contained" 
                onClick={() => handleOpen()}
                sx={{ 
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                Thêm phòng mới
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên phòng</TableCell>
              <TableCell>Loại phòng</TableCell>
              <TableCell>Tòa</TableCell>
              <TableCell>Tầng</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSpaces.map((space) => (
              <TableRow key={space._id}>
                <TableCell>{space.roomName}</TableCell>
                <TableCell>
                  {space.roomType === 'individual' ? 'Phòng tự học' : 
                   space.roomType === 'group' ? 'Phòng học nhóm' : 'Phòng mentor'}
                </TableCell>
                <TableCell>{space.building}</TableCell>
                <TableCell>{space.floor}</TableCell>
                <TableCell>
                  <Button variant="outlined" onClick={() => handleOpen(space)} sx={{ mr: 1 }}>
                    Sửa
                  </Button>
                  <Button variant="outlined" color="error" onClick={() => handleDelete(space._id)}>
                    Xóa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editSpace ? 'Sửa phòng' : 'Thêm phòng'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Tên phòng"
                value={newSpace.name}
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Loại phòng"
                value={newSpace.type}
                onChange={(e) => setNewSpace({ ...newSpace, type: e.target.value })}
                fullWidth
              >
                {['Phòng tự học', 'Phòng học nhóm', 'Phòng mentor'].map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Tòa"
                value={newSpace.building}
                onChange={(e) => setNewSpace({ ...newSpace, building: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Tầng"
                type="number"
                value={newSpace.floor}
                onChange={(e) => setNewSpace({ ...newSpace, floor: e.target.value })}
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button onClick={handleSave} variant="contained">Lưu</Button>
          </DialogActions>
        </Dialog>

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

export default SpaceManagement;