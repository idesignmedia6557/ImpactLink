// server.js - Main Express server setup for ImpactLink API

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Port configuration
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// ============ ROUTES ============

// Import route handlers
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const charitiesRoutes = require('./routes/charities');
const projectsRoutes = require('./routes/projects');
const donationsRoutes = require('./routes/donations');
const webhooksRoutes = require('./routes/webhooks');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/charities', charitiesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ImpactLink API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      charities: '/api/charities',
      projects: '/api/projects',
      donations: '/api/donations',
      webhooks: '/api/webhooks',
    },
  });
});

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============ SERVER STARTUP ============

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nReceived shutdown signal, closing gracefully...');
  
  try {
    await prisma.$disconnect();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const server = app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('  ImpactLink API Server');
  console.log('=================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('=================================\n');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

module.exports = app;
