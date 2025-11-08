/**
 * Validation Utilities for ImpactLink
 * Comprehensive validation functions for data integrity
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
};

/**
 * Validate phone number (international format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate amount (positive number with max 2 decimals)
 */
const isValidAmount = (amount) => {
  if (typeof amount !== 'number' || amount <= 0) return false;
  
  // Check for max 2 decimal places
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  return decimalPlaces <= 2;
};

/**
 * Validate donation amount (min $1, max $1,000,000)
 */
const isValidDonationAmount = (amount) => {
  return isValidAmount(amount) && amount >= 1 && amount <= 1000000;
};

/**
 * Validate MongoDB/Prisma ID format
 */
const isValidId = (id) => {
  // For UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // For MongoDB ObjectId format
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  return uuidRegex.test(id) || objectIdRegex.test(id);
};

/**
 * Validate date format and range
 */
const isValidDate = (date, options = {}) => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) return false;
  
  if (options.minDate && dateObj < new Date(options.minDate)) return false;
  if (options.maxDate && dateObj > new Date(options.maxDate)) return false;
  
  return true;
};

/**
 * Validate string length
 */
const isValidLength = (str, min, max) => {
  if (typeof str !== 'string') return false;
  const length = str.trim().length;
  return length >= min && length <= max;
};

/**
 * Validate enum value
 */
const isValidEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

/**
 * Validate charity category
 */
const isValidCharityCategory = (category) => {
  const categories = [
    'EDUCATION',
    'HEALTH',
    'POVERTY',
    'ENVIRONMENT',
    'ANIMAL_WELFARE',
    'HUMAN_RIGHTS',
    'DISASTER_RELIEF',
    'COMMUNITY',
    'OTHER'
  ];
  return isValidEnum(category, categories);
};

/**
 * Validate user role
 */
const isValidUserRole = (role) => {
  const roles = ['DONOR', 'CHARITY', 'CORPORATE', 'ADMIN'];
  return isValidEnum(role, roles);
};

/**
 * Validate donation status
 */
const isValidDonationStatus = (status) => {
  const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'];
  return isValidEnum(status, statuses);
};

/**
 * Validate payment method
 */
const isValidPaymentMethod = (method) => {
  const methods = ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER'];
  return isValidEnum(method, methods);
};

/**
 * Validate recurring frequency
 */
const isValidRecurringFrequency = (frequency) => {
  const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
  return isValidEnum(frequency, frequencies);
};

/**
 * Validate project status
 */
const isValidProjectStatus = (status) => {
  const statuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
  return isValidEnum(status, statuses);
};

/**
 * Validate pagination params
 */
const isValidPagination = (page, limit) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  return (
    !isNaN(pageNum) &&
    !isNaN(limitNum) &&
    pageNum > 0 &&
    limitNum > 0 &&
    limitNum <= 100 // Max 100 items per page
  );
};

/**
 * Validate sort order
 */
const isValidSortOrder = (order) => {
  return ['asc', 'desc', 'ASC', 'DESC'].includes(order);
};

/**
 * Sanitize string (remove HTML tags and trim)
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate and sanitize user input
 */
const validateUserInput = (data, schema) => {
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required check
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    // Skip validation if not required and value is empty
    if (!rules.required && !value) continue;
    
    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors[field] = `${field} must be a ${rules.type}`;
      continue;
    }
    
    // Length check for strings
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} must be at most ${rules.maxLength} characters`;
    }
    
    // Range check for numbers
    if (rules.min !== undefined && value < rules.min) {
      errors[field] = `${field} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      errors[field] = `${field} must be at most ${rules.max}`;
    }
    
    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors[field] = rules.message || `${field} is invalid`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // User registration
  userRegistration: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    email: { required: true, type: 'string', validate: isValidEmail, message: 'Invalid email format' },
    password: { required: true, type: 'string', validate: isValidPassword, message: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
    role: { required: true, type: 'string', validate: isValidUserRole, message: 'Invalid user role' }
  },
  
  // Donation creation
  donationCreation: {
    projectId: { required: true, type: 'string', validate: isValidId, message: 'Invalid project ID' },
    amount: { required: true, type: 'number', validate: isValidDonationAmount, message: 'Amount must be between $1 and $1,000,000' },
    paymentMethod: { required: true, type: 'string', validate: isValidPaymentMethod, message: 'Invalid payment method' },
    isAnonymous: { required: false, type: 'boolean' }
  },
  
  // Project creation
  projectCreation: {
    title: { required: true, type: 'string', minLength: 10, maxLength: 200 },
    description: { required: true, type: 'string', minLength: 50, maxLength: 5000 },
    goalAmount: { required: true, type: 'number', min: 100, max: 10000000 },
    category: { required: true, type: 'string', validate: isValidCharityCategory, message: 'Invalid category' },
    startDate: { required: true, validate: (date) => isValidDate(date, { minDate: new Date() }), message: 'Start date must be in the future' },
    endDate: { required: true, validate: (date) => isValidDate(date, { minDate: new Date() }), message: 'End date must be in the future' }
  }
};

module.exports = {
  // Basic validators
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidUrl,
  isValidAmount,
  isValidDonationAmount,
  isValidId,
  isValidDate,
  isValidLength,
  isValidEnum,
  
  // Domain-specific validators
  isValidCharityCategory,
  isValidUserRole,
  isValidDonationStatus,
  isValidPaymentMethod,
  isValidRecurringFrequency,
  isValidProjectStatus,
  isValidPagination,
  isValidSortOrder,
  
  // Utilities
  sanitizeString,
  validateUserInput,
  schemas
};
