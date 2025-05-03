import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Table, TableHead,
  TableBody, TableRow, TableCell, Paper,
  Button, Stack, Dialog, DialogTitle, DialogContent,
  Collapse, IconButton, AppBar, Toolbar
} from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js';
import { ExpandMore, ExpandLess, Logout as LogoutIcon } from '@mui/icons-material';
import HistoryDialog from './HistoryDialog';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../../store/authSlice';
import Footer from './Footer';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function BuildingDashboard() {
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);
  const [chartType, setChartType] = useState(null);
  const [expandedFloors, setExpandedFloors] = useState({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [historyMode, setHistoryMode] = useState('');
  const [historyTarget, setHistoryTarget] = useState('');
  const { token, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/rooms')
      .then(response => setRooms(response.data))
      .catch(error => console.error('Lỗi khi tải dữ liệu phòng:', error));
  }, []);

  useEffect(() => {
    if (historyOpen && historyMode && historyTarget) {
      const fetchHistory = async () => {
        try {
          const params = { month: selectedMonth, year: selectedYear };
          if (historyMode === 'room') params.roomId = historyTarget;
          if (historyMode === 'floor') params.floor = historyTarget;

          const response = await api.get(`/admin/history`, { params });
          setHistoryData(response.data.data);
        } catch (error) {
          console.error('Lỗi reload lịch sử:', error);
        }
      };
      fetchHistory();
    }
  }, [selectedMonth, selectedYear, historyOpen, historyMode, historyTarget]);

  const mapRoomTypeToLabel = (type) => {
    switch (type) {
      case 'mentor':
        return 'Phòng mentor 1:1';
      case 'group':
        return 'Phòng nhóm';
      case 'individual':
        return 'Phòng cá nhân';
      default:
        return type;
    }
  };

  const groupedByFloor = rooms.reduce((acc, room) => {
    const floor = room.floor;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const handleOpenChart = (type) => {
    setChartType(type);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setChartType(null);
  };

  const toggleFloor = (floor) => {
    setExpandedFloors(prev => ({
      ...prev,
      [floor]: !prev[floor]
    }));
  };

  const handleViewHistoryRoom = async (room) => {
    try {
      const params = {
        roomId: room.roomName,
        month: selectedMonth,
        year: selectedYear,
      };
      const response = await api.get(`/admin/history`, { params });
      setHistoryData(response.data.data);

      setSelectedTitle(`Lịch sử sử dụng - Phòng ${room.roomName}`);
      setHistoryOpen(true);
      setHistoryMode('room');
      setHistoryTarget(room.roomName);
    } catch (error) {
      console.error('Lỗi lấy lịch sử phòng:', error);
    }
  };

  const handleViewHistoryFloor = async (floor) => {
    try {
      const params = {
        floor,
        month: selectedMonth,
        year: selectedYear,
      };
      const response = await api.get(`/admin/history`, { params });
      setHistoryData(response.data.data);

      setSelectedTitle(`Lịch sử sử dụng - Tầng ${floor}`);
      setHistoryOpen(true);
      setHistoryMode('floor');
      setHistoryTarget(floor);
    } catch (error) {
      console.error('Lỗi lấy lịch sử tầng:', error);
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

  const UsageChart = () => {
    const used = rooms.filter(r => r.inUse).length;
    const free = rooms.length - used;

    const data = {
      labels: ['Đang sử dụng', 'Trống'],
      datasets: [{
        label: 'Số lượng phòng',
        data: [used, free],
        backgroundColor: ['red', 'green'],
      }]
    };

    return <Pie data={data} />;
  };

  const TypeChart = () => {
    const typeCounts = rooms.reduce((acc, room) => {
      acc[room.roomType] = (acc[room.roomType] || 0) + 1;
      return acc;
    }, {});

    const data = {
      labels: Object.keys(typeCounts).map(type => mapRoomTypeToLabel(type)),
      datasets: [{
        label: 'Số lượng phòng',
        data: Object.values(typeCounts),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      }]
    };

    return <Bar data={data} />;
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
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <div>
            <label>Chọn tháng: </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ padding: '6px', borderRadius: '4px', marginLeft: '8px' }}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Chọn năm: </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ padding: '6px', borderRadius: '4px', marginLeft: '8px' }}
            >
              {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </Stack>

        <Typography variant="h4" gutterBottom>
          Thống kê tình trạng sử dụng phòng
        </Typography>

        {Object.entries(groupedByFloor).map(([floor, roomsInFloor]) => (
          <Paper key={floor} sx={{ mt: 3, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">Tầng {floor}</Typography>
                <Button size="small" variant="outlined" onClick={() => handleViewHistoryFloor(floor)}>
                  Xem lịch sử tầng
                </Button>
              </Stack>
              <IconButton onClick={() => toggleFloor(floor)}>
                {expandedFloors[floor] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Stack>

            <Collapse in={expandedFloors[floor]} timeout="auto" unmountOnExit>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Tên phòng</strong></TableCell>
                    <TableCell><strong>Loại phòng</strong></TableCell>
                    <TableCell><strong>Tình trạng</strong></TableCell>
                    <TableCell><strong>Thao tác</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomsInFloor.map((room, index) => (
                    <TableRow key={index}>
                      <TableCell>{room.roomName}</TableCell>
                      <TableCell>{mapRoomTypeToLabel(room.roomType)}</TableCell>
                      <TableCell sx={{ color: room.inUse ? 'red' : 'green' }}>
                        {room.inUse ? 'Đang sử dụng' : 'Trống'}
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => handleViewHistoryRoom(room)}>
                          Xem lịch sử
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Collapse>
          </Paper>
        ))}

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Button variant="contained" color="primary" onClick={() => handleOpenChart('usage')}>
            Biểu đồ tình trạng sử dụng
          </Button>
          <Button variant="contained" color="secondary" onClick={() => handleOpenChart('type')}>
            Biểu đồ loại phòng
          </Button>
        </Stack>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Biểu đồ thống kê</DialogTitle>
          <DialogContent>
            {chartType === 'usage' && <UsageChart />}
            {chartType === 'type' && <TypeChart />}
          </DialogContent>
        </Dialog>

        <HistoryDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          title={selectedTitle}
          historyData={historyData}
          mapRoomTypeToLabel={mapRoomTypeToLabel}
          mode={historyMode}
        />
      </Container>

      <Footer />
    </>
  );
}

export default BuildingDashboard;