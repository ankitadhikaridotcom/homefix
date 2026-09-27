const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT from HTTP-only cookie
const requireAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user data to request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role.' });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
