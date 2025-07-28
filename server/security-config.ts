import rateLimit from "express-rate-limit";

// Security configuration constants
export const SECURITY_CONFIG = {
  // Rate limiting - Increased for testing
  AUTH_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 attempts per window per IP (increased from 5)
    message: { message: "Too many authentication attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
  },
  
  GENERAL_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window per IP (increased from 100)
    message: { message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  API_RATE_LIMIT: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 API calls per minute per IP (increased from 20)
    message: { message: "API rate limit exceeded" },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // File upload security
  FILE_UPLOAD: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    allowedMimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain', // Sometimes CSV comes as text/plain
      'application/csv', // Alternative CSV mime type
      'application/octet-stream', // Fallback for some file uploads
    ],
    allowedExtensions: ['.csv', '.xls', '.xlsx']
  },
  
  // Session security
  SESSION: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    checkInterval: 60 * 60 * 1000, // Clean up every hour
    name: 'sessionId', // Custom session name
    regenerateOnLogin: true
  },
  
  // Password requirements
  PASSWORD: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialCharsPattern: /[@$!%*?&]/,
    maxLength: 128 // Prevent DoS attacks
  },
  
  // Request body limits
  BODY_LIMITS: {
    json: '10mb',
    urlencoded: '10mb',
    raw: '10mb'
  },
  
  // CORS settings
  CORS: {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24 hours
  }
};

// Create rate limiters with security config
export const createAuthLimiter = () => rateLimit(SECURITY_CONFIG.AUTH_RATE_LIMIT);
export const createGeneralLimiter = () => rateLimit(SECURITY_CONFIG.GENERAL_RATE_LIMIT);
export const createApiLimiter = () => rateLimit(SECURITY_CONFIG.API_RATE_LIMIT);

// Security validation functions
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = SECURITY_CONFIG.PASSWORD;

  if (!password || typeof password !== 'string') {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }
  
  if (password.length > config.maxLength) {
    errors.push(`Password must not exceed ${config.maxLength} characters`);
  }

  if (config.requireLowercase && !/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (config.requireUppercase && !/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (config.requireNumbers && !/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (config.requireSpecialChars && !config.specialCharsPattern.test(password)) {
    errors.push("Password must contain at least one special character (@$!%*?&)");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEmail(email: string): { isValid: boolean; sanitized?: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: "Email is required" };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  // Length validation
  if (email.length > 254) {
    return { isValid: false, error: "Email address too long" };
  }

  const sanitized = email.toLowerCase().trim();
  return { isValid: true, sanitized };
}

export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check length (10-15 digits is standard for international numbers)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { isValid: false, error: "Phone number must be 10-15 digits" };
  }

  return { isValid: true };
}

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// Sensitive data patterns for log sanitization
export const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'session',
  'cookie'
];

export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (SENSITIVE_PATTERNS.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}