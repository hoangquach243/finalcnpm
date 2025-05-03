import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { styled } from '@mui/system';

const FooterBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#455A64',
  color: '#FFFFFF',
  padding: '20px',
  width: '100%',
  maxWidth: 'none',
  marginTop: '40px',
}));

const Footer = () => {
  return (
    <FooterBox>
      <Container maxWidth="lg">
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Tổ kỹ thuật P. ĐT / Technician
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Email: ddthue@hcmut.edu.vn
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          ĐT (TEL.): (84-8) 38647256 - 5258
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Quý Thầy/Cô chưa có tài khoản (hoặc quên mật khẩu) nếu trưởng vui lòng liên hệ Trung tâm Dữ liệu & Công nghệ Thông tin, phòng 109A5 để được hỗ trợ.
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          (For HCMUT account, please contact to: Data and Information Technology Center)
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Email: dl-cntt@hcmut.edu.vn
        </Typography>
        <Typography variant="body2">
          ĐT (TEL.): (84-8) 38647256 - 5200
        </Typography>
      </Container>
    </FooterBox>
  );
};

export default Footer;