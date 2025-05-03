const jwt = require('jsonwebtoken');
const RevokedToken = require('../models/RevokedToken');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const isRevoked = await RevokedToken.findOne({ token });
    if (isRevoked) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, 'secretKey');
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = authMiddleware;