// auth.js - Authentication and authorization middleware

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authenticate JWT token from request headers
 * Attaches user object to req.user if valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      // Attach user to request
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Authorize specific roles
 * Must be used after authenticateToken middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 * Useful for routes that work for both authenticated and non-authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    // Try to verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        // Invalid token, continue without user
        req.user = null;
        return next();
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
      }

      next();
    });
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id and email
 * @param {string} expiresIn - Token expiration time (default: 7d)
 * @returns {string} JWT token
 */
const generateToken = (user, expiresIn = '7d') => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate refresh token for user
 * @param {Object} user - User object with id
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Verify refresh token
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Promise<Object>} Decoded token data
 */
const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

/**
 * Check if user owns a resource
 * @param {number} userId - User ID to check
 * @param {number} resourceOwnerId - Resource owner ID
 * @param {string} userRole - User role (ADMIN can access all)
 * @returns {boolean}
 */
const isResourceOwner = (userId, resourceOwnerId, userRole) => {
  return userRole === 'ADMIN' || userId === resourceOwnerId;
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  isResourceOwner,
};
