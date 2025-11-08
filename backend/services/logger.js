/**
 * Logger Service for ImpactLink
 * Professional logging using Winston with multiple transports
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport - all logs
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  }),

  // Error logs - separate file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // Combined logs - all levels
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // HTTP logs - API requests
  new winston.transports.File({
    filename: path.join(logsDir, 'http.log'),
    level: 'http',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3
  })
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false
});

// Create a stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Helper functions for structured logging
const logWithContext = (level, message, metadata = {}) => {
  logger.log(level, message, {
    ...metadata,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

// Convenience methods
logger.logError = (message, error, metadata = {}) => {
  logWithContext('error', message, {
    ...metadata,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  });
};

logger.logInfo = (message, metadata = {}) => {
  logWithContext('info', message, metadata);
};

logger.logWarning = (message, metadata = {}) => {
  logWithContext('warn', message, metadata);
};

logger.logDebug = (message, metadata = {}) => {
  logWithContext('debug', message, metadata);
};

logger.logHttp = (message, metadata = {}) => {
  logWithContext('http', message, metadata);
};

// Log API request
logger.logRequest = (req, res, duration) => {
  logger.logHttp('API Request', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.id || 'anonymous'
  });
};

// Log authentication events
logger.logAuth = (event, userId, success, metadata = {}) => {
  logger.logInfo('Authentication Event', {
    event,
    userId,
    success,
    ...metadata
  });
};

// Log donation events
logger.logDonation = (event, donationId, amount, metadata = {}) => {
  logger.logInfo('Donation Event', {
    event,
    donationId,
    amount,
    ...metadata
  });
};

// Log payment events
logger.logPayment = (event, paymentId, amount, status, metadata = {}) => {
  logger.logInfo('Payment Event', {
    event,
    paymentId,
    amount,
    status,
    ...metadata
  });
};

// Log security events
logger.logSecurity = (event, level, metadata = {}) => {
  const logLevel = level === 'critical' ? 'error' : level === 'high' ? 'warn' : 'info';
  logWithContext(logLevel, `Security Event: ${event}`, {
    securityLevel: level,
    ...metadata
  });
};

// Log database operations
logger.logDatabase = (operation, table, success, duration, metadata = {}) => {
  logger.logDebug('Database Operation', {
    operation,
    table,
    success,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Log email events
logger.logEmail = (event, recipient, success, metadata = {}) => {
  logger.logInfo('Email Event', {
    event,
    recipient,
    success,
    ...metadata
  });
};

// Production error monitoring
if (process.env.NODE_ENV === 'production') {
  // In production, you might want to add additional transports
  // For example, sending critical errors to monitoring services
  logger.on('error', (err) => {
    console.error('Logger error:', err);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  logger.end();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  logger.end();
});

module.exports = logger;
