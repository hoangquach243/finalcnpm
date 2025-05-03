import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Stack, Button, Snackbar, Alert
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import * as XLSX from 'xlsx';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function HistoryDialog({ open, onClose, title, historyData, mapRoomTypeToLabel, mode = 'floor' }) {
  const [selectedRoomType, setSelectedRoomType] = useState('mentor');
  const [availableTypes, setAvailableTypes] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const chartRef = useRef();

  useEffect(() => {
    if (open) {
      const types = Array.from(new Set(historyData.map(item => item.roomType)));
      setAvailableTypes(types);

      if (types.length > 0) {
        setSelectedRoomType(types[0]);
      }
    }
  }, [open, historyData]);

  const filteredData = historyData.filter(item => item.roomType === selectedRoomType);

  const labels = filteredData.map(item => item.date);
  const usedHours = filteredData.map(item => item.usedHours);

  const chartData = {
    labels,
    datasets: [{
      label: 'Số giờ sử dụng',
      data: usedHours,
      backgroundColor: '#36A2EB',
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      Ngày: item.date,
      'Loại phòng': mapRoomTypeToLabel(item.roomType),
      'Số giờ sử dụng': item.usedHours,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch_sử_sử_dụng');

    const fileName = `${title.replace(/\s+/g, '_')}_${selectedRoomType}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setToast({ open: true, message: 'Xuất file Excel thành công!', severity: 'success' });
  };

  const handleExportChart = () => {
    if (!chartRef.current) return;

    const chartCanvas = chartRef.current.canvas;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = chartCanvas.width;
    exportCanvas.height = chartCanvas.height;

    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(chartCanvas, 0, 0);

    const link = document.createElement('a');
    link.href = exportCanvas.toDataURL('image/png');
    link.download = `${title.replace(/\s+/g, '_')}_${selectedRoomType}.png`;
    link.click();

    setToast({ open: true, message: 'Đã tải ảnh biểu đồ thành công!', severity: 'success' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {filteredData.length > 0 ? (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {['mentor', 'group', 'individual'].map(type => (
                <Button
                  key={type}
                  size="small"
                  variant={selectedRoomType === type ? 'contained' : 'outlined'}
                  disabled={mode === 'room' && type !== availableTypes[0]}
                  onClick={() => setSelectedRoomType(type)}
                >
                  {mapRoomTypeToLabel(type)}
                </Button>
              ))}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button variant="outlined" onClick={handleExportExcel}>
                📥 Xuất file Excel
              </Button>
              <Button variant="outlined" onClick={handleExportChart}>
                🖼️ Lưu biểu đồ PNG
              </Button>
            </Stack>

            <Typography variant="h6" sx={{ mt: 2 }}>Biểu đồ sử dụng:</Typography>
            <Bar ref={chartRef} data={chartData} options={chartOptions} />

            <Typography variant="h6" sx={{ mt: 4 }}>Chi tiết sử dụng:</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ngày</strong></TableCell>
                  <TableCell><strong>Loại phòng</strong></TableCell>
                  <TableCell><strong>Số giờ sử dụng</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{mapRoomTypeToLabel(item.roomType)}</TableCell>
                    <TableCell>{item.usedHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <Typography>Không có dữ liệu cho tháng/năm đã chọn.</Typography>
        )}
      </DialogContent>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

export default HistoryDialog;