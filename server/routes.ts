import { Express, Request, Response } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import multer from "multer";
import XLSX from "xlsx";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import validator from "validator";
import { insertAgencySchema, insertBusSchema, insertTravelerDataSchema } from "@shared/schema";
import { 
  createAuthLimiter, 
  createGeneralLimiter, 
  createApiLimiter,
  validatePassword,
  validateEmail,
  validatePhoneNumber,
  SECURITY_CONFIG,
  SECURITY_HEADERS,
  sanitizeLogData
} from "./security-config";
import { securityMonitor, createSecurityMiddleware } from "./security-monitor";
import { whatsappService, sendBhashWhatsAppMessage, replaceApprovedTemplateVariables } from "./whatsapp-service";
import { testWhatsAppMessage, sendWhatsAppToTraveler, testWhatsAppWithImage } from "./whatsapp-test";

// Rate limiting configurations from security config
const authLimiter = createAuthLimiter();
const generalLimiter = createGeneralLimiter();
const apiLimiter = createApiLimiter();

// Configure multer for file uploads with enhanced security
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: SECURITY_CONFIG.FILE_UPLOAD.maxSize,
    files: SECURITY_CONFIG.FILE_UPLOAD.maxFiles
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!SECURITY_CONFIG.FILE_UPLOAD.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }

    // Validate file extension
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!SECURITY_CONFIG.FILE_UPLOAD.allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension. Only .csv, .xls, .xlsx files are allowed.'));
    }

    // Additional filename validation
    if (file.originalname.length > 255) {
      return cb(new Error('Filename too long.'));
    }

    // Check for suspicious filename patterns
    if (/[<>:"/\\|?*]/.test(file.originalname)) {
      return cb(new Error('Invalid characters in filename.'));
    }

    cb(null, true);
  }
});

// Input sanitization helper
function sanitizeInput(input: any): string {
  if (typeof input !== 'string') return '';
  return validator.escape(input.trim());
}

export function registerRoutes(app: Express) {
  // Apply comprehensive security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://replit.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:"],
        fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));

  // Additional security headers
  app.use((req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Remove server signature
    res.removeHeader('X-Powered-By');

    // Add cache control for sensitive pages
    if (req.path.includes('/admin') || req.path.includes('/auth')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    next();
  });

  // Apply security monitoring
  app.use(createSecurityMiddleware());

  // Apply rate limiting
  app.use('/api', generalLimiter);
  app.use('/api/data', apiLimiter); // More restrictive for data endpoints

  // General login endpoint (checks both admin and agency)
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      // Sanitize email
      const sanitizedEmail = validator.normalizeEmail(email);
      if (!sanitizedEmail || !validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Try admin login first
      const admin = await storage.getAdminCredentials(sanitizedEmail, password);
      if (admin) {
        // Regenerate session to prevent session fixation
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: "Authentication failed" });
          }

          // Set session with minimal information
          (req.session as any).user = {
            id: admin.id,
            email: admin.email,
            role: "super_admin",
            loginTime: new Date().toISOString()
          };

          res.json({ 
            message: "Login successful",
            user: {
              id: admin.id,
              email: admin.email,
              role: "super_admin"
            }
          });
        });
        return;
      }

      // Try agency login
      const agency = await storage.getAgencyByCredentials(sanitizedEmail, password);
      if (agency) {
        // Regenerate session to prevent session fixation
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: "Authentication failed" });
          }

          // Set session with agency information
          (req.session as any).user = {
            id: agency.id,
            email: agency.email,
            role: "agency",
            loginTime: new Date().toISOString(),
            agency: {
              id: agency.id,
              name: agency.name,
              email: agency.email,
              status: agency.status,
              contactPerson: agency.contactPerson,
              phone: agency.phone,
              city: agency.city,
              state: agency.state,
              bookingWebsite: agency.bookingWebsite,
              whatsappImageUrl: agency.whatsappImageUrl
            }
          };

          res.json({ 
            message: "Login successful",
            user: {
              id: agency.id,
              email: agency.email,
              role: "agency",
              agency: {
                id: agency.id,
                name: agency.name,
                email: agency.email,
                status: agency.status,
                contactPerson: agency.contactPerson,
                phone: agency.phone,
                city: agency.city,
                state: agency.state,
                bookingWebsite: agency.bookingWebsite,
                whatsappImageUrl: agency.whatsappImageUrl
              }
            }
          });
        });
        return;
      }

      // Neither admin nor agency found
      return res.status(401).json({ message: "Authentication failed" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/admin/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      // Sanitize email
      const sanitizedEmail = validator.normalizeEmail(email);
      if (!sanitizedEmail || !validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const admin = await storage.getAdminCredentials(sanitizedEmail, password);
      if (!admin) {
        // Generic error message to prevent user enumeration
        return res.status(401).json({ message: "Authentication failed" });
      }

      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }

        // Set session with minimal information
        (req.session as any).user = {
          id: admin.id,
          email: admin.email,
          role: "super_admin",
          loginTime: new Date().toISOString()
        };

        res.json({ 
          message: "Login successful",
          user: {
            id: admin.id,
            email: admin.email,
            role: "super_admin"
          }
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/agency/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      // Sanitize email
      const sanitizedEmail = validator.normalizeEmail(email);
      if (!sanitizedEmail || !validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const agency = await storage.getAgencyByCredentials(sanitizedEmail, password);
      if (!agency) {
        // Generic error message to prevent user enumeration
        return res.status(401).json({ message: "Authentication failed" });
      }

      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }

        // Set session with agency information
        (req.session as any).user = {
          id: agency.id,
          email: agency.email,
          role: "agency",
          loginTime: new Date().toISOString(),
          agency: {
            id: agency.id,
            name: agency.name,
            email: agency.email,
            status: agency.status,
            contactPerson: agency.contactPerson,
            phone: agency.phone,
            city: agency.city,
            state: agency.state,
            bookingWebsite: agency.bookingWebsite,
            whatsappImageUrl: agency.whatsappImageUrl
          }
        };

        res.json({ 
          message: "Login successful",
          user: {
            id: agency.id,
            email: agency.email,
            role: "agency",
            agency: {
              id: agency.id,
              name: agency.name,
              email: agency.email,
              status: agency.status,
              contactPerson: agency.contactPerson,
              phone: agency.phone,
              city: agency.city,
              state: agency.state,
              bookingWebsite: agency.bookingWebsite,
              whatsappImageUrl: agency.whatsappImageUrl
            }
          }
        });
      });
    } catch (error) {
      console.error("Agency login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Generic signup route (alias for agency signup for frontend compatibility)
  app.post("/api/auth/signup", authLimiter, async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, agencyName, email, phone, city, state, logoUrl, password, bookingWebsite } = req.body;

      // Map frontend fields to backend expected fields
      const mappedData = {
        name: agencyName,
        email,
        contactPerson: `${firstName} ${lastName}`,
        phone,
        city,
        state,
        website: "",
        bookingWebsite,
        password,
        logoUrl
      };

      // Enhanced email validation
      const emailValidation = validateEmail(mappedData.email);
      if (!emailValidation.isValid) {
        return res.status(400).json({ message: emailValidation.error });
      }
      const sanitizedEmail = emailValidation.sanitized!;

      // Enhanced password validation
      if (mappedData.password) {
        const passwordValidation = validatePassword(mappedData.password);
        if (!passwordValidation.isValid) {
          return res.status(400).json({ 
            message: "Password validation failed",
            errors: passwordValidation.errors
          });
        }
      }

      // Check if email already exists
      const existingAgency = await storage.getAgencyByEmail(sanitizedEmail);
      if (existingAgency) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Enhanced phone validation
      if (mappedData.phone) {
        const phoneValidation = validatePhoneNumber(mappedData.phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ message: phoneValidation.error });
        }
      }

      // URL validation for booking website and logo URL
      let validatedBookingWebsite = undefined;
      let validatedLogoUrl = undefined;

      if (mappedData.bookingWebsite) {
        const bookingWebsite = mappedData.bookingWebsite.trim();
        if (validator.isURL(bookingWebsite, { protocols: ['http', 'https'] })) {
          validatedBookingWebsite = bookingWebsite;
        } else {
          return res.status(400).json({ message: "Invalid booking website URL format" });
        }
      }

      if (mappedData.logoUrl) {
        const logoUrl = mappedData.logoUrl.trim();
        // Accept both HTTP/HTTPS URLs and base64 data URLs
        if (validator.isURL(logoUrl, { protocols: ['http', 'https'] }) || logoUrl.startsWith('data:image/')) {
          validatedLogoUrl = logoUrl;
        } else {
          return res.status(400).json({ message: "Invalid logo URL format" });
        }
      }

      // Create agency with proper data structure
      const agencyData = {
        userId: `agency_${Date.now()}`, // Generate a temporary userId
        name: sanitizeInput(mappedData.name),
        email: sanitizedEmail,
        contactPerson: sanitizeInput(mappedData.contactPerson),
        phone: sanitizeInput(mappedData.phone),
        city: sanitizeInput(mappedData.city),
        state: mappedData.state ? sanitizeInput(mappedData.state) : undefined,
        website: mappedData.website ? sanitizeInput(mappedData.website) : undefined,
        bookingWebsite: validatedBookingWebsite,
        logoUrl: validatedLogoUrl,
        password: mappedData.password,
        status: "pending" as const
      };

      const agency = await storage.createAgency(agencyData);

      res.status(201).json({ 
        message: "Agency registered successfully. Please wait for admin approval.",
        agency: {
          id: agency.id,
          name: agency.name,
          email: agency.email,
          status: agency.status
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/agency/signup", authLimiter, async (req: Request, res: Response) => {
    try {
      const { name, email, contactPerson, phone, city, state, website, password } = req.body;

      // Enhanced email validation
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return res.status(400).json({ message: emailValidation.error });
      }
      const sanitizedEmail = emailValidation.sanitized!;

      // Enhanced password validation
      if (password) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          return res.status(400).json({ 
            message: "Password validation failed",
            errors: passwordValidation.errors
          });
        }
      }

      // Check if email already exists
      const existingAgency = await storage.getAgencyByEmail(sanitizedEmail);
      if (existingAgency) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Enhanced phone validation
      if (phone) {
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ message: phoneValidation.error });
        }
      }

      // Create agency with proper data structure
      const agencyData = {
        userId: `agency_${Date.now()}`, // Generate a temporary userId
        name: sanitizeInput(name),
        email: sanitizedEmail,
        contactPerson: sanitizeInput(contactPerson),
        phone: sanitizeInput(phone),
        city: sanitizeInput(city),
        state: state ? sanitizeInput(state) : undefined,
        website: website ? sanitizeInput(website) : undefined,
        password: password,
        status: "pending" as const
      };

      const agency = await storage.createAgency(agencyData);

      res.status(201).json({ 
        message: "Agency registered successfully. Please wait for admin approval.",
        agency: {
          id: agency.id,
          name: agency.name,
          email: agency.email,
          status: agency.status
        }
      });
    } catch (error) {
      console.error("Agency signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // Clear all session data
    const sessionId = req.sessionID;

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Clear all possible cookie variations
      res.clearCookie("connect.sid", {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      });

      // Also clear with different path configurations
      res.clearCookie("connect.sid", { path: '/' });
      res.clearCookie("connect.sid");

      res.json({ message: "Logged out successfully" });
    });
  });

  // Initial admin setup route - only works if no admin exists
  app.post("/api/auth/admin/setup", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Input validation
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid input format" });
      }

      // Sanitize email
      const sanitizedEmail = validator.normalizeEmail(email);
      if (!sanitizedEmail || !validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Password strength validation
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
        return res.status(400).json({ 
          message: "Password must contain uppercase, lowercase, number, and special character" 
        });
      }

      // Check if any admin already exists
      const adminExists = await storage.checkAdminExists();
      if (adminExists) {
        return res.status(409).json({ message: "Admin account already exists" });
      }

      // Create the first admin
      const admin = await storage.createAdminCredentials({
        email: sanitizedEmail,
        password,
        name: name ? sanitizeInput(name) : "Super Admin"
      });

      res.status(201).json({ 
        message: "Admin account created successfully",
        admin: {
          id: admin.id,
          email: admin.email
        }
      });
    } catch (error) {
      console.error("Admin setup error:", error);
      res.status(500).json({ message: "Setup failed" });
    }
  });

  // Session check
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user });
  });

  // Add alias for backwards compatibility with enhanced agency data loading
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // For agency users, ensure we have the latest agency data
    if (user.role === "agency" && user.id) {
      try {
        const agency = await storage.getAgencyById(user.id);
        if (agency) {
          user.agency = {
            id: agency.id,
            name: agency.name,
            email: agency.email,
            status: agency.status,
            contactPerson: agency.contactPerson,
            phone: agency.phone,
            city: agency.city,
            state: agency.state,
            bookingWebsite: agency.bookingWebsite,
            whatsappImageUrl: agency.whatsappImageUrl,
            whatsappTemplate: agency.whatsappTemplate
          };
        }
      } catch (error) {
        console.error("Error loading agency data:", error);
      }
    }

    res.json({ user });
  });

  // Agency routes
  app.get("/api/agencies", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const agencies = await storage.getAllAgencies();
      res.json(agencies);
    } catch (error) {
      console.error("Get agencies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/agencies/pending", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const agencies = await storage.getPendingAgencies();
      res.json(agencies);
    } catch (error) {
      console.error("Get pending agencies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin-specific agency routes (aliases for backward compatibility)
  app.get("/api/admin/agencies", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const agencies = await storage.getAllAgencies();
      res.json(agencies);
    } catch (error) {
      console.error("Get admin agencies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/agencies/pending", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const agencies = await storage.getPendingAgencies();
      res.json(agencies);
    } catch (error) {
      console.error("Get admin pending agencies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/agencies/:id/status", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!["approved", "rejected", "on_hold"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const agency = await storage.updateAgencyStatus(parseInt(id), status);
      res.json(agency);
    } catch (error) {
      console.error("Update agency status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin-specific agency status update endpoint
  app.patch("/api/admin/agencies/:id/status", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!["approved", "rejected", "on_hold"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const agency = await storage.updateAgencyStatus(parseInt(id), status);
      res.json(agency);
    } catch (error) {
      console.error("Update admin agency status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/agencies", async (req: Request, res: Response) => {
    try {
      const { name, email, contactPerson, phone, city, state, website, password } = req.body;

      // Enhanced email validation
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return res.status(400).json({ message: emailValidation.error });
      }
      const sanitizedEmail = emailValidation.sanitized!;

      // Enhanced password validation
      if (password) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          return res.status(400).json({ 
            message: "Password validation failed",
            errors: passwordValidation.errors
          });
        }
      }

      // Check if email already exists
      const existingAgency = await storage.getAgencyByEmail(sanitizedEmail);
      if (existingAgency) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Enhanced phone validation
      if (phone) {
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ message: phoneValidation.error });
        }
      }

      // Create agency with proper data structure
      const agencyData = {
        userId: `agency_${Date.now()}`, // Generate a temporary userId
        name: sanitizeInput(name),
        email: sanitizedEmail,
        contactPerson: sanitizeInput(contactPerson),
        phone: sanitizeInput(phone),
        city: sanitizeInput(city),
        state: state ? sanitizeInput(state) : undefined,
        website: website ? sanitizeInput(website) : undefined,
        password: password,
        status: "pending" as const
      };

      const agency = await storage.createAgency(agencyData);

      res.status(201).json({ 
        message: "Agency created successfully",
        agency: {
          id: agency.id,
          name: agency.name,
          email: agency.email,
          status: agency.status
        }
      });
    } catch (error) {
      console.error("Create agency error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Creation failed" });
    }
  });

  app.delete("/api/agencies/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteAgency(parseInt(id));
      res.json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error("Delete agency error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin-specific agency delete endpoint (alias for backward compatibility)
  app.delete("/api/admin/agencies/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteAgency(parseInt(id));
      res.json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error("Delete admin agency error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bus routes
  app.get("/api/buses", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      let buses;
      if (user.role === "agency") {
        buses = await storage.getBusesByAgency(user.id);
      } else {
        // Super admin can see all buses
        buses = await storage.getAllBuses();
      }

      res.json(buses);
    } catch (error) {
      console.error("Get buses error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/buses", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = insertBusSchema.parse({        ...req.body,
        agencyId: user.id
      });

      const bus = await storage.createBus(data);
      res.status(201).json(bus);
    } catch (error) {
      console.error("Create bus error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/buses/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || (user.role !== "agency" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const updates = req.body;

      // Validate that the bus belongs to the agency (unless super admin)
      if (user.role === "agency") {
        const existingBus = await storage.getBus(parseInt(id));
        if (!existingBus || existingBus.agencyId !== user.id) {
          return res.status(403).json({ message: "Bus not found or access denied" });
        }
      }

      const bus = await storage.updateBus(parseInt(id), updates);
      res.json(bus);
    } catch (error) {
      console.error("Update bus error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/buses/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || (user.role !== "agency" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteBus(parseInt(id));
      res.json({ message: "Bus deleted successfully" });
    } catch (error) {
      console.error("Delete bus error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Traveler data routes
  app.get("/api/traveler-data", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      let travelerData;
      if (user.role === "agency") {
        travelerData = await storage.getTravelerDataByAgency(user.id);
      } else {
        // Super admin can see all traveler data
        travelerData = await storage.getAllTravelerData();
      }

      res.json(travelerData);
    } catch (error) {
      console.error("Get traveler data error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Security dashboard endpoint (super admin only)
  app.get("/api/security/dashboard", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const summary = securityMonitor.getSecuritySummary(24);
      res.json(summary);
    } catch (error) {
      console.error("Security dashboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Security events endpoint (super admin only)
  app.get("/api/security/events", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const hours = parseInt(req.query.hours as string) || 24;
      const events = securityMonitor.getRecentEvents(hours);
      res.json(events);
    } catch (error) {
      console.error("Security events error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Authorization middleware
  function requireAuth(roles: string[] = []) {
    return (req: Request, res: Response, next: any) => {
      const user = (req.session as any)?.user;

      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Check session timeout (24 hours)
      const loginTime = new Date(user.loginTime || 0);
      const now = new Date();
      const diffHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

      if (diffHours > 24) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session expired" });
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    };
  }

  app.patch("/api/traveler-data/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const updates = req.body;

      const traveler = await storage.updateTravelerData(parseInt(id), updates);
      res.json(traveler);
    } catch (error) {
      console.error("Update traveler data error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/traveler-data/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteTravelerData(parseInt(id));
      res.json({ message: "Traveler data deleted successfully" });
    } catch (error) {
      console.error("Delete traveler data error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/traveler-data/upload", requireAuth(['agency']), upload.single("file"), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { busId } = req.body;
      if (!busId || !validator.isInt(busId.toString())) {
        return res.status(400).json({ message: "Invalid bus ID" });
      }

      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform and validate data
      const travelerDataArray = jsonData.map((row: any) => {
        let phone = String(row["Phone"] || row["phone"] || "").trim();

        // Auto-format Indian phone numbers
        if (phone) {
          // Remove any existing country code or special characters
          phone = phone.replace(/[^\d]/g, '');

          // If it's a 10-digit number, add +91
          if (phone.length === 10 && phone.match(/^[6-9]\d{9}$/)) {
            phone = '+91' + phone;
          }
          // If it already has 91 prefix (like 919876543210), format it properly
          else if (phone.length === 12 && phone.startsWith('91') && phone.substring(2).match(/^[6-9]\d{9}$/)) {
            phone = '+91' + phone.substring(2);
          }
          // If it's already formatted with +91, keep as is
          else if (phone.startsWith('+91') && phone.length === 13) {
            // Already formatted correctly
          }
          // For any other format, try to extract 10 digits if possible
          else if (phone.length >= 10) {
            const match = phone.match(/([6-9]\d{9})/);
            if (match) {
              phone = '+91' + match[1];
            }
          }
        }

        return {
          busId: parseInt(busId),
          agencyId: user.id,
          travelerName: String(row["Traveler Name"] || row["traveler_name"] || row["travelerName"] || ""),
          phone: phone,
          travelDate: req.body.travelDate || "",
          couponCode: String(req.body.couponCode || ""), // Ensure it's a string
          whatsappStatus: "pending"
        };
      });

      // Remove duplicates within the same upload and filter missing phone numbers
      // Passengers can travel multiple times, but not receive multiple messages in one day
      const seenPhones = new Set();
      const finalTravelerData = travelerDataArray.filter((traveler) => {
        if (!traveler.phone || traveler.phone.trim() === '') {
          return false; // Skip records with missing phone numbers
        }
        if (seenPhones.has(traveler.phone)) {
          return false; // Skip duplicate phone numbers within this upload
        }
        seenPhones.add(traveler.phone);
        return true;
      });

      const duplicatesInFile = travelerDataArray.length - finalTravelerData.length;
      // No longer filtering against database - allow existing passengers to be uploaded

      // Create upload history record first
      const uploadRecord = await storage.createUploadHistory({
        agencyId: user.id,
        busId: parseInt(busId),
        fileName: req.file.originalname,
        travelerCount: finalTravelerData.length,
        status: "processing"
      });

      // Add uploadId to each traveler data record
      const travelerDataWithUploadId = finalTravelerData.map(data => ({
        ...data,
        uploadId: uploadRecord.id
      }));

      // Validate each record
      const validatedData = travelerDataWithUploadId.map(data => 
        insertTravelerDataSchema.parse(data)
      );

      // Save to database using upsert (update existing or create new)
      const upsertedData = await storage.upsertTravelerData(validatedData);

      // Schedule WhatsApp messages for each uploaded traveler
      try {
        for (const traveler of upsertedData) {
          await whatsappService.scheduleMessagesForTraveler(traveler.id);
        }
        console.log(`Scheduled WhatsApp messages for ${upsertedData.length} travelers`);
      } catch (error) {
        console.error('Error scheduling WhatsApp messages:', error);
        // Continue with upload even if scheduling fails
      }

      // Update upload history record status to completed
      await storage.updateUploadHistory(uploadRecord.id, {
        status: "completed",
        travelerCount: upsertedData.length
      });

      let message = "Data uploaded successfully.";
      if (duplicatesInFile > 0) {
        message += ` Removed ${duplicatesInFile} duplicate phone numbers and missing records from the upload.`;
      }

      res.status(201).json({
        message: message,
        count: upsertedData.length,
        originalCount: travelerDataArray.length,
        duplicatesInFile: duplicatesInFile,
        data: upsertedData
      });
    } catch (error) {
      console.error("Upload traveler data error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data format", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WhatsApp configuration routes
  app.get("/api/whatsapp/config", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const config = await storage.getWhatsappConfig();
      res.json(config);
    } catch (error) {
      console.error("Get WhatsApp config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/whatsapp/config", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const config = await storage.createWhatsappConfig(req.body);
      res.status(201).json(config);
    } catch (error) {
      console.error("Create WhatsApp config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WhatsApp templates routes
  app.get("/api/whatsapp/templates", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const templates = await storage.getWhatsappTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get WhatsApp templates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/whatsapp/templates", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const template = await storage.createWhatsappTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Create WhatsApp template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WhatsApp message processing endpoint (replaces background interval)
  app.post("/api/whatsapp/process-messages", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log("Processing pending WhatsApp messages via API endpoint");
      await whatsappService.processPendingMessages();
      
      res.json({ 
        message: "WhatsApp message processing completed successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("WhatsApp message processing error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test WhatsApp API endpoint (super admin only)
  app.post("/api/whatsapp/test", authLimiter, async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { phoneNumber, message } = req.body;

      // Enhanced input validation
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ message: phoneValidation.error });
      }

      if (!message || typeof message !== 'string' || message.length > 1000) {
        return res.status(400).json({ message: "Invalid message content" });
      }

      // Get WhatsApp configuration
      const config = await storage.getWhatsappConfig();
      if (!config || !config.isActive) {
        return res.status(400).json({ message: "WhatsApp configuration not found or inactive" });
      }

      // Send test message using BhashSMS API
      const testMessage = "TEST MESSAGE from TravelFlow Admin\n\n" + message + "\n\nSent at: " + new Date().toLocaleString();

      // Use the whatsapp service to send the message
      const success = await whatsappService.sendTestMessage(phoneNumber, testMessage, config);

      if (success) {
        // Log successful test for security monitoring
        securityMonitor.logSecurityEvent({
          type: 'AUTH_FAILURE', // Using as general event type
          ip: req.ip || 'unknown',
          endpoint: '/api/whatsapp/test',
          details: { 
            admin: user.email,
            phoneNumber: phoneNumber.substring(0, 5) + 'xxxxx',
            success: true
          },
          severity: 'LOW'
        });

        res.json({ 
          message: "Test message sent successfully",
          phoneNumber: phoneNumber,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ message: "Failed to send test message" });
      }
    } catch (error) {
      console.error("WhatsApp test error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats routes
  app.get("/api/stats/admin", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stats/agency", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getAgencyStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Get agency stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Missing admin agency detail routes
  app.get("/api/admin/agencies/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const agency = await storage.getAgency(parseInt(id));
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      res.json(agency);
    } catch (error) {
      console.error("Get admin agency error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/agencies/:id/payments", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Return empty array for now - payment system not fully implemented
      res.json([]);
    } catch (error) {
      console.error("Get admin agency payments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/agencies/:id/buses", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const buses = await storage.getBusesByAgency(parseInt(id));
      res.json(buses);
    } catch (error) {
      console.error("Get admin agency buses error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/agencies/:id/users", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Return empty array for now - user system not fully implemented for agencies
      res.json([]);
    } catch (error) {
      console.error("Get admin agency users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/agencies/:id/stats", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const stats = await storage.getAgencyStats(parseInt(id));
      res.json(stats || {
        totalBuses: 0,
        totalUsers: 0,
        totalCoupons: 0,
        couponsUsed: 0,
        messagesSent: 0
      });
    } catch (error) {
      console.error("Get admin agency stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/tax-config", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Return default tax config
      res.json({ percentage: 18 });
    } catch (error) {
      console.error("Get admin tax config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/user-data", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const travelerData = await storage.getAllTravelerData();
      res.json(travelerData);
    } catch (error) {
      console.error("Get admin user data error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete traveler data (admin only)
  app.delete("/api/admin/user-data/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteTravelerData(parseInt(id));
      res.json({ message: "Traveler data deleted successfully" });
    } catch (error) {
      console.error("Delete admin user data error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/payments", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Get admin payments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/payment-stats", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Return basic payment stats
      res.json({
        totalRevenue: 0,
        pendingPayments: 0,
        overduePayments: 0,
        monthlyGrowth: 0
      });
    } catch (error) {
      console.error("Get admin payment stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/whatsapp-templates", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const templates = await storage.getWhatsappTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get admin whatsapp templates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/whatsapp-config", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const config = await storage.getWhatsappConfig();
      res.json(config);
    } catch (error) {
      console.error("Get admin whatsapp config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/whatsapp-queue/stats", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const queue = await storage.getWhatsappQueue();
      res.json({
        totalMessages: queue.length,
        pendingMessages: queue.filter(m => m.status === 'pending').length,
        sentMessages: queue.filter(m => m.status === 'sent').length,
        failedMessages: queue.filter(m => m.status === 'failed').length
      });
    } catch (error) {
      console.error("Get admin whatsapp queue stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stats/system", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (user.role === "super_admin") {
        const stats = await storage.getAdminStats();
        res.json(stats);
      } else {
        const stats = await storage.getAgencyStats(user.id);
        res.json(stats);
      }
    } catch (error) {
      console.error("Get system stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get WhatsApp message schedule for a specific traveler or agency
  app.get("/api/whatsapp/schedule/:type/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { type, id } = req.params;
      let schedule: any[] = [];

      if (type === 'traveler' && (user.role === 'agency' || user.role === 'super_admin')) {
        // Get schedule for specific traveler
        const queue = await storage.getWhatsappQueue();
        schedule = queue.filter(msg => msg.travelerId === parseInt(id));
      } else if (type === 'agency' && user.role === 'agency') {
        // Get schedule for agency's travelers
        const queue = await storage.getWhatsappQueue();
        const travelers = await storage.getTravelerDataByAgency(user.id);
        const travelerIds = travelers.map(t => t.id);
        schedule = queue.filter(msg => travelerIds.includes(msg.travelerId));
      } else if (type === 'agency' && user.role === 'super_admin') {
        // Admin can see any agency's schedule  
        const queue = await storage.getWhatsappQueue();
        const travelers = await storage.getTravelerDataByAgency(parseInt(id));
        const travelerIds = travelers.map(t => t.id);
        schedule = queue.filter(msg => travelerIds.includes(msg.travelerId));
      }

      // Add traveler and template details
      const enrichedSchedule = await Promise.all(schedule.map(async (msg: any) => {
        const traveler = await storage.getTravelerData(msg.travelerId);
        const templates = await storage.getWhatsappTemplates();
        const template = templates.find(t => t.id === msg.templateId);

        return {
          ...msg,
          travelerName: traveler?.travelerName,
          travelerPhone: traveler?.phone,
          templateName: template?.name,
          dayTrigger: template?.dayTrigger,
          timeUntilSend: Math.ceil((new Date(msg.scheduledFor).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) // days
        };
      }));

      res.json({
        schedule: enrichedSchedule.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()),
        count: enrichedSchedule.length,
        nextMessage: enrichedSchedule.find(msg => msg.status === 'pending' && new Date(msg.scheduledFor) > new Date())
      });
    } catch (error) {
      console.error("Get WhatsApp schedule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test WhatsApp with specific database user
  app.post("/api/admin/whatsapp/test-database-user", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid JSON format" });
      }

      const { userId } = body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get traveler data
      const traveler = await storage.getTravelerData(userId);
      if (!traveler) {
        return res.status(404).json({ message: "Traveler not found" });
      }

      // Get agency and bus data for personalized message
      const agency = await storage.getAgency(traveler.agencyId);
      const bus = await storage.getBus(traveler.busId);

      if (!agency) {
        return res.status(404).json({ message: "Agency not found for this traveler" });
      }

      // Clean phone number
      let cleanPhone = traveler.phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      }

      // Create personalized test message
      const personalizedMessage = `Dear ${traveler.travelerName},

Greetings from ${agency.name}! 

This is a TEST MESSAGE from TravelFlow Admin.

Your booking details:
Bus: ${bus?.name || 'Bus Service'}
Route: ${bus ? `${bus.fromLocation} to ${bus.toLocation}` : 'Route'}
Travel Date: ${traveler.travelDate ? new Date(traveler.travelDate).toLocaleDateString() : 'Travel Date'}
Your Coupon: ${traveler.couponCode}

Use your coupon for special discounts!
Book at: ${agency.bookingWebsite || 'https://your-booking-website.com'}

This was a test message to verify WhatsApp delivery.

To stop receiving messages, reply STOP.

Happy Travels!`;

      // Send via BhashSMS API with working credentials
      const apiUrl = 'http://bhashsms.com/api/sendmsg.php';
      const params = new URLSearchParams({
        user: 'eddygoo1',
        pass: '123456',
        sender: 'BUZWAP',
        phone: cleanPhone,
        text: personalizedMessage,
        priority: 'wa',
        stype: 'normal',
        Params: '54,877,966,52'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'TravelFlow-WhatsApp-Service/1.0'
        },
        signal: controller.signal
            });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.text();

      // Update traveler WhatsApp status
      const status = result.startsWith('S.') ? 'sent' : 'failed';
      await storage.updateTravelerData(traveler.id, { whatsappStatus: status });

      if (result.startsWith('S.')) {
        res.json({ 
          success: true, 
          message: `Test message sent successfully to ${traveler.travelerName} (+91${cleanPhone})`,
          travelerData: {
            name: traveler.travelerName,
            phone: `+91${cleanPhone}`,
            agency: agency.name,
            bus: bus?.name,
            coupon: traveler.couponCode
          },
          messageId: result,
          apiResponse: result
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: `Failed to send test message to ${traveler.travelerName}: ${result}`,
          travelerData: {
            name: traveler.travelerName,
            phone: `+91${cleanPhone}`,
            agency: agency.name
          },
          apiResponse: result
        });
      }
    } catch (error) {
      console.error("Database user WhatsApp test error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // WhatsApp Testing Route for Admin with approved templates
  app.post("/api/admin/whatsapp/test", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { phoneNumber, message, agencyName, imageUrl } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Clean phone number (remove +91 if present)
      let cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      }

      const testMessage = message || `Greetings from ${agencyName || 'TravelFlow'}! 

Thank you for choosing us for your travel needs. Here's your special coupon code: TRAVEL2025

Get 15% off on your next booking!
Valid for all bus routes
Valid till 31st March 2025

Book now at: https://your-booking-website.com

To stop receiving messages, reply STOP.

Happy Travels!`;

      // Send via BhashSMS API with new endpoint
      const apiUrl = 'http://bhashsms.com/api/sendmsg.php';
      const params = new URLSearchParams({
        user: 'eddygoo1',
        pass: '123456',
        sender: 'BUZWAP',
        phone: cleanPhone,
        text: testMessage,
        priority: 'wa',
        stype: 'normal',
        Params: '54,877,966,52'
      });

      // Add image parameters if image URL is provided
      if (imageUrl) {
        params.append('htype', 'image');
        params.append('url', imageUrl);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'TravelFlow-WhatsApp-Service/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.text();

      // Update traveler WhatsApp status if found
      const traveler = await storage.getTravelerByPhone(`+91${cleanPhone}`);
      if (traveler) {
        const status = result.startsWith('S.') ? 'sent' : 'failed';
        await storage.updateTravelerData(traveler.id, { whatsappStatus: status });
      }

      // Handle API responses with approved templates
      if (result.startsWith('S.')) {
        res.json({ 
          success: true, 
          message: `WhatsApp message ${imageUrl ? 'with image ' : ''}sent successfully to +91${cleanPhone}`,
          messageId: result,
          travelerUpdated: !!traveler,
          apiResponse: result,
          templatesApproved: true,
          imageSupported: !!imageUrl
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: `Failed to send WhatsApp message: ${result}`,
          travelerUpdated: !!traveler,
          apiResponse: result,
          templatesApproved: true
        });
      }
    } catch (error) {
      console.error("WhatsApp test error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error occurred",
        travelerUpdated: false
      });
    }
  });

  // Bulk WhatsApp Testing for Agency Users
  app.post("/api/admin/whatsapp/bulk-test", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { agencyId, message } = req.body;

      if (!agencyId) {
        return res.status(400).json({ message: "Agency ID is required" });
      }

      // Get all travelers for the agency
      const travelers = await storage.getTravelerDataByAgency(agencyId);
      const agency = await storage.getAgency(agencyId);

      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const traveler of travelers) {
        try {
          // Clean phone number
          let cleanPhone = traveler.phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
            cleanPhone = cleanPhone.substring(2);
          }

          const personalizedMessage = message || `Dear ${traveler.travelerName},

Greetings from ${agency.name}! 

Thank you for traveling with us. Here's your exclusive coupon code: ${traveler.couponCode}

Get special discounts on your next booking!
Valid for all our routes
Limited time offer

Book now at: ${agency.bookingWebsite || 'https://your-booking-website.com'}

To stop receiving messages, reply STOP.

Happy Travels!`;

          // Send via BhashSMS API with activated utility endpoint
          const apiUrl = 'http://bhashsms.com/api/sendmsgutil.php';
          const params = new URLSearchParams({
            user: 'BhashWapAi',
            pass: 'bwap@123$',
            sender: 'BUZWAP',
            phone: cleanPhone,
            text: personalizedMessage,
            priority: 'wa',
            stype: 'utility'  // Use utility type for template compliance
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`${apiUrl}?${params}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'TravelFlow-WhatsApp-Service/1.0'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const result = await response.text();

          // Update traveler status
          const status = result.startsWith('S.') ? 'sent' : 'failed';
          await storage.updateTravelerData(traveler.id, { whatsappStatus: status });

          if (result.startsWith('S.')) {
            successCount++;
            const success = true;
            const sentMessage = `Hi ${traveler.travelerName}, thanks for Traveling with us at ${agency.name}! Get 20% off on your next trip – use Coupon Code ${traveler.couponCode || 'SAVE20'} 🚀 Valid for Next 90 days at: ${agency.bookingWebsite || 'https://your-booking-website.com'} ✨ Hurry Up.`;

            results.push({
              travelerId: traveler.id,
              travelerName: traveler.travelerName,
              phone: `+91${cleanPhone}`,
              success,
              message: success ? "Message sent successfully" : `Failed: ${result}`,
              apiResponse: result,
              sentMessage: sentMessage
            });
          } else {
            failCount++;
            const success = false;
            const sentMessage = `Hi ${traveler.travelerName}, thanks for Traveling with us at ${agency.name}! Get 20% off on your next trip – use Coupon Code ${traveler.couponCode || 'SAVE20'} 🚀 Valid for Next 90 days at: ${agency.bookingWebsite || 'https://your-booking-website.com'} ✨ Hurry Up.`;

            results.push({
              travelerId: traveler.id,
              travelerName: traveler.travelerName,
              phone: `+91${cleanPhone}`,
              success,
              message: success ? "Message sent successfully" : `Failed: ${result}`,
              apiResponse: result,
              sentMessage: sentMessage
            });
          }

          // Add delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          failCount++;
          results.push({
            travelerName: traveler.travelerName,
            phone: traveler.phone,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk WhatsApp sending completed. Sent: ${successCount}, Failed: ${failCount}`,
        agencyName: agency.name,
        totalTravelers: travelers.length,
        successCount,
        failCount,
        results
      });

    } catch (error) {
      console.error("Bulk WhatsApp test error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Middleware to check authentication
  function authMiddleware(req: Request, res: Response, next: () => void) {
    if (!(req.session as any)?.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }

  // Delete traveler data by admin
  app.delete("/api/admin/user-data/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { user } = req.session as any;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      await storage.deleteTravelerData(id);
      res.json({ message: "Traveler data deleted successfully" });
    } catch (error) {
      console.error("Delete admin user data error:", error);
      res.status(500).json({ message: "Failed to delete traveler data" });
    }
  });

  // Update agency profile
  app.patch("/api/agencies/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { user } = req.session as any;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ message: "Access denied" });
      }

      const agencyId = parseInt(req.params.id);
      if (isNaN(agencyId)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }

      // Ensure agency can only update their own profile
      if (user.agency?.id !== agencyId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const { name, email, contactPerson, phone, city, state, website } = req.body;

      // Enhanced email validation if email is being changed
      if (email && email !== user.agency.email) {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          return res.status(400).json({ message: emailValidation.error });
        }

        // Check if new email already exists
        const existingAgency = await storage.getAgencyByEmail(emailValidation.sanitized!);
        if (existingAgency && existingAgency.id !== agencyId) {
          return res.status(409).json({ message: "Email already in use by another agency" });
        }
      }

      // Enhanced phone validation
      if (phone) {
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ message: phoneValidation.error });
        }
      }

      // URL validation for booking website and WhatsApp image URL
      let validatedBookingWebsite = undefined;
      let validatedWhatsappImageUrl = undefined;

      if (req.body.bookingWebsite) {
        const bookingWebsite = req.body.bookingWebsite.trim();
        if (validator.isURL(bookingWebsite, { protocols: ['http', 'https'] })) {
          validatedBookingWebsite = bookingWebsite;
        } else {
          return res.status(400).json({ message: "Invalid booking website URL format" });
        }
      }

      if (req.body.whatsappImageUrl) {
        const whatsappImageUrl = req.body.whatsappImageUrl.trim();
        if (validator.isURL(whatsappImageUrl, { protocols: ['http', 'https'] })) {
          validatedWhatsappImageUrl = whatsappImageUrl;
        } else {
          return res.status(400).json({ message: "Invalid WhatsApp image URL format" });
        }
      }

      const updateData = {
        name: name ? sanitizeInput(name) : undefined,
        email: email ? sanitizeInput(email) : undefined,
        contactPerson: contactPerson ? sanitizeInput(contactPerson) : undefined,
        phone: phone ? sanitizeInput(phone) : undefined,
        city: city ? sanitizeInput(city) : undefined,
        state: state ? sanitizeInput(state) : undefined,
        website: website ? sanitizeInput(website) : undefined,
        bookingWebsite: validatedBookingWebsite,
        whatsappImageUrl: validatedWhatsappImageUrl,
        whatsappTemplate: req.body.whatsappTemplate ? sanitizeInput(req.body.whatsappTemplate) : undefined,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
      );

      await storage.updateAgency(agencyId, updateData);

      // Update session with fresh agency data from database
      if (req.session) {
        const updatedAgency = await storage.getAgencyById(agencyId);
        if (updatedAgency) {
          (req.session as any).user.agency = {
            id: updatedAgency.id,
            name: updatedAgency.name,
            email: updatedAgency.email,
            status: updatedAgency.status,
            contactPerson: updatedAgency.contactPerson,
            phone: updatedAgency.phone,
            city: updatedAgency.city,
            state: updatedAgency.state,
            bookingWebsite: updatedAgency.bookingWebsite,
            whatsappImageUrl: updatedAgency.whatsappImageUrl,
            whatsappTemplate: updatedAgency.whatsappTemplate
          };
        }
      }

      res.json({ message: "Agency profile updated successfully" });
    } catch (error) {
      console.error("Update agency profile error:", error);
      res.status(500).json({ message: "Failed to update agency profile" });
    }
  });

  // Update agency password
  app.patch("/api/agencies/:id/password", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { user } = req.session as any;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ message: "Access denied" });
      }

      const agencyId = parseInt(req.params.id);
      if (isNaN(agencyId)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }

      // Ensure agency can only update their own password
      if (user.agency?.id !== agencyId) {
        return res.status(403).json({ message: "You can only update your own password" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Enhanced password validation
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "New password validation failed",
          errors: passwordValidation.errors
        });
      }

      // Verify current password
      const agency = await storage.getAgencyById(agencyId);
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const isValidPassword = agency.password ? await bcrypt.compare(currentPassword, agency.password) : false;
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await storage.updateAgency(agencyId, { password: hashedNewPassword });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Update agency password error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Direct BhashSMS WhatsApp API Test Route with Dynamic Agency Profile Data
  app.post("/api/test/bhash-whatsapp", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, message, travelerId } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Clean phone number (remove +91 if present, ensure it's 10 digits)
      let cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      }

      // Default test message if none provided
      const testMessage = message || "eddygoo_2807";

      let dynamicParams = '54,877,966,52'; // Fallback to static params
      let agencyImageUrl = 'https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg'; // Default image

      // If travelerId provided, fetch dynamic data from database
      if (travelerId) {
        try {
          // Get traveler data
          const traveler = await storage.getTravelerData(travelerId);
          if (traveler) {
            // Get agency data  
            const agency = await storage.getAgency(traveler.agencyId);
            if (agency) {
              // Create dynamic Params: traveler_name,agency_name,coupon_code,booking_url
              const travelerName = encodeURIComponent(traveler.travelerName || 'Traveler');
              const agencyName = encodeURIComponent(agency.name || 'Travel Agency');  
              const couponCode = encodeURIComponent(traveler.couponCode || 'SAVE10');
              const bookingUrl = encodeURIComponent(agency.bookingWebsite || 'https://travelflow.com/book');

              dynamicParams = `${travelerName},${agencyName},${couponCode},${bookingUrl}`;

              // Use agency's WhatsApp image URL if available
              if (agency.whatsappImageUrl) {
                agencyImageUrl = agency.whatsappImageUrl;
              }

              console.log(`Dynamic Params created: ${dynamicParams}`);
              console.log(`Agency Image URL: ${agencyImageUrl}`);
            }
          }
        } catch (error) {
          console.log(`Error fetching dynamic data: ${error}. Using fallback params.`);
        }
      }

      // Use the new BhashSMS API endpoint and credentials
      const apiUrl = 'http://bhashsms.com/api/sendmsg.php';
      const params = new URLSearchParams({
        user: 'eddygoo1',
        pass: '123456',
        sender: 'BUZWAP',
        phone: cleanPhone,
        text: testMessage,
        priority: 'wa',
        stype: 'normal',
        Params: dynamicParams
      });

      // Always add image parameters with dynamic agency image URL
      params.append('htype', 'image');
      params.append('url', agencyImageUrl);

      console.log(`Sending WhatsApp message to ${cleanPhone} via BhashSMS API`);
      console.log(`API URL: ${apiUrl}?${params.toString()}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${apiUrl}?${params}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'TravelFlow-WhatsApp-Service/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const result = await response.text();

        console.log(`BhashSMS API Response: ${result}`);

        // Check if message was sent successfully
        const success = result.startsWith('S.');

        res.json({
          success: success,
          message: success ? "WhatsApp message sent successfully!" : `Failed to send message. API Response: ${result}`,
          apiResponse: result,
          phoneNumber: cleanPhone,
          sentMessage: testMessage,
          imageUrl: agencyImageUrl,
          dynamicParams: dynamicParams,
          apiUrl: `${apiUrl}?${params.toString()}`
        });

      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error(`BhashSMS API Error:`, fetchError);

        res.json({
          success: false,
          message: `API request failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          phoneNumber: cleanPhone,
          sentMessage: testMessage
        });
      }

    } catch (error) {
      console.error("BhashSMS test error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  /*
  // DISABLED: Manual WhatsApp message sending to all unsent users (CAUSES UNAUTHORIZED BATCH PROCESSING)
  app.post("/api/agency/whatsapp/send-all", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get agency data
      const agency = await storage.getAgency(user.id);
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      // Get all travelers for this agency who haven't received WhatsApp messages
      const travelers = await storage.getTravelerDataByAgency(user.id);
      const unsentTravelers = travelers.filter(t => !t.whatsappStatus || t.whatsappStatus === 'failed');

      if (unsentTravelers.length === 0) {
        return res.json({
          success: true,
          message: "All travelers have already received WhatsApp messages",
          results: [],
          summary: { total: 0, sent: 0, failed: 0 }
        });
      }

      const results = [];
      const approvedTemplate = "Hi {{1}}, thanks for Traveling with us at {{2}}! Get 20% off on your next trip – use Coupon Code {{3}} 🚀 Valid for Next 90 days at: {{4}} ✨ Hurry Up.";

      for (const traveler of unsentTravelers) {
        try {
          // Get bus information for route details
          const bus = await storage.getBus(traveler.busId);

          // Clean phone number
          let cleanPhone = traveler.phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
            cleanPhone = cleanPhone.substring(2);
          }

          // Use agency's booking website URL and WhatsApp image URL from profile
          const bookingUrl = agency.bookingWebsite || agency.website || 'https://testtravelagency.com';
          const whatsappImageUrl = agency.whatsappImageUrl || 'https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg';

          // Send via BhashSMS API using your exact template format
          const apiUrl = 'https://bhashsms.com/api/sendmsg.php';
          const whatsappTemplate = agency.whatsappTemplate || 'eddygoo_2807';
          
          // Build URL manually without encoding to avoid %2C, %3A, %2F issues
          const cleanParams = [
            `user=eddygoo1`,
            `pass=123456`,
            `sender=BUZWAP`,
            `phone=${cleanPhone}`,
            `text=${whatsappTemplate}`,
            `priority=wa`,
            `stype=normal`,
            `Params=${traveler.travelerName},${agency.name},${traveler.couponCode || 'SAVE20'},${bookingUrl}`,
            `htype=image`,
            `url=${whatsappImageUrl}`
          ].join('&');
          
          const finalUrl = `${apiUrl}?${cleanParams}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(finalUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'TravelFlow-WhatsApp-Service/1.0' },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const result = await response.text();
          const success = result.startsWith('S.');

          // Update traveler WhatsApp status
          await storage.updateTravelerData(traveler.id, { 
            whatsappStatus: success ? 'sent' : 'failed'
          });

          const sentMessage = `Hi ${traveler.travelerName}, thanks for Traveling with us at ${agency.name}! Get 20% off on your next trip – use Coupon Code ${traveler.couponCode || 'SAVE20'} 🚀 Valid for Next 90 days at: ${bookingUrl} ✨ Hurry Up.`;

          results.push({
            travelerId: traveler.id,
            travelerName: traveler.travelerName,
            phone: `+91${cleanPhone}`,
            success,
            message: success ? "Message sent successfully" : `Failed: ${result}`,
            apiResponse: result,
            sentMessage: sentMessage
          });

        } catch (error) {
          results.push({
            travelerId: traveler.id,
            travelerName: traveler.travelerName,
            phone: traveler.phone,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: successCount > 0,
        message: `Sent ${successCount} messages successfully, ${failureCount} failed`,
        results,
        summary: {
          total: results.length,
          sent: successCount,
          failed: failureCount
        }
      });

    } catch (error) {
      console.error("Send all WhatsApp messages error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });
  */

  /*
  // DISABLED: Manual WhatsApp message sending to individual user (SECURITY RISK - CAUSES UNAUTHORIZED API CALLS)
  // This endpoint was making unauthorized API calls when users accessed individual travelers
  app.post("/api/agency/whatsapp/send-individual/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;

      // Get traveler data
      const traveler = await storage.getTravelerData(parseInt(id));
      if (!traveler || traveler.agencyId !== user.id) {
        return res.status(404).json({ message: "Traveler not found or access denied" });
      }

      // Get agency data
      const agency = await storage.getAgency(user.id);
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      // Clean and validate phone number
      let cleanPhone = traveler.phone.replace(/\D/g, '');

      // Ensure it's a valid Indian mobile number
      let finalPhone = cleanPhone;
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        finalPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
        finalPhone = cleanPhone.substring(1);
      }

      // Validate final phone number (should be 10 digits starting with 6-9)
      if (!/^[6-9]\d{9}$/.test(finalPhone)) {
        return res.status(400).json({
          success: false,
          message: `Invalid phone number format: ${traveler.phone}`,
          travelerData: {
            id: traveler.id,
            name: traveler.travelerName,
            phone: traveler.phone,
            status: 'failed'
          }
        });
      }

      // Get bus information for route details
      const bus = await storage.getBus(traveler.busId);

      // Use agency's booking website URL and WhatsApp image URL from profile
      const bookingUrl = agency.bookingWebsite || agency.website || 'https://testtravelagency.com';
      const whatsappImageUrl = agency.whatsappImageUrl || 'https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg';

      console.log(`Sending individual WhatsApp to ${traveler.travelerName} at +91${finalPhone}`);
      console.log(`Using booking URL: ${bookingUrl}`);
      console.log(`Using WhatsApp image: ${whatsappImageUrl}`);
      console.log(`🎯 Individual WhatsApp Template: ${agency.whatsappTemplate || 'eddygoo_2807'}`);

      // Send via BhashSMS API using your exact template format
      const apiUrl = 'https://bhashsms.com/api/sendmsg.php';
      const whatsappTemplate = agency.whatsappTemplate || 'eddygoo_2807';
      
      // Build URL manually without encoding to avoid %2C, %3A, %2F issues
      const cleanParams = [
        `user=eddygoo1`,
        `pass=123456`,
        `sender=BUZWAP`,
        `phone=${finalPhone}`,
        `text=${whatsappTemplate}`,
        `priority=wa`,
        `stype=normal`,
        `Params=${traveler.travelerName},${agency.name},${traveler.couponCode || 'SAVE20'},${bookingUrl}`,
        `htype=image`,
        `url=${whatsappImageUrl}`
      ].join('&');
      
      const finalUrl = `${apiUrl}?${cleanParams}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'TravelFlow-WhatsApp-Service/1.0' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.text().then(text => text.trim());

      console.log(`WhatsApp API Response for individual send to ${finalPhone}:`, result);

      // More strict success checking
      const success = response.ok && result.startsWith('S.') && result.length > 2;

      // Update traveler WhatsApp status
      await storage.updateTravelerData(traveler.id, { 
        whatsappStatus: success ? 'sent' : 'failed'
      });

      res.json({
        success,
        message: success ? `WhatsApp message sent successfully to +91${finalPhone}` : `Failed to send message: ${result}`,
        travelerData: {
          id: traveler.id,
          name: traveler.travelerName,
          phone: `+91${finalPhone}`,
          status: success ? 'sent' : 'failed'
        },
        apiResponse: result,
        sentMessage: `Hi ${traveler.travelerName}, thanks for Traveling with us at ${agency.name}! Get 20% off on your next trip – use Coupon Code ${traveler.couponCode || 'SAVE20'} 🚀 Valid for Next 90 days at: ${bookingUrl} ✨ Hurry Up.`,
        phoneValidation: {
          original: traveler.phone,
          cleaned: finalPhone,
          isValid: true
        }
      });

    } catch (error) {
      console.error("Send individual WhatsApp message error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });
  */

  /*
  // DISABLED: Simple WhatsApp Test Endpoint (SECURITY RISK - MAKES REAL API CALLS)
  app.post("/api/whatsapp/test-message", async (req: Request, res: Response) => {
    try {
      console.log("=== WhatsApp Test Request ===");
      const { phone, message, imageUrl } = req.body;

      if (!phone || !message) {
        return res.status(400).json({ 
          success: false, 
          error: "Phone number and message are required" 
        });
      }

      const result = await testWhatsAppMessage(phone, message, imageUrl);

      console.log("Test result:", result);
      res.json(result);

    } catch (error) {
      console.error("WhatsApp test endpoint error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });
  */

  /*
  // DISABLED: Test WhatsApp with Traveler Template (SECURITY RISK - MAKES REAL API CALLS)
  app.post("/api/whatsapp/test-traveler", async (req: Request, res: Response) => {
    try {
      const { travelerName, agencyName, couponCode, bookingWebsite, phone } = req.body;

      if (!travelerName || !agencyName || !couponCode || !bookingWebsite || !phone) {
        return res.status(400).json({ 
          success: false, 
          error: "All fields are required: travelerName, agencyName, couponCode, bookingWebsite, phone" 
        });
      }

      const result = await sendWhatsAppToTraveler(travelerName, agencyName, couponCode, bookingWebsite, phone);
      res.json(result);

    } catch (error) {
      console.error("WhatsApp traveler test error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });
  */

  /*
  // DISABLED: Test WhatsApp with Image (SECURITY RISK - MAKES REAL API CALLS)
  app.post("/api/whatsapp/test-image", async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ 
          success: false, 
          error: "Phone number is required" 
        });
      }

      const result = await testWhatsAppWithImage(phone);
      res.json(result);

    } catch (error) {
      console.error("WhatsApp image test error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });
  */

  /*
  // DISABLED: Debug WhatsApp test endpoint (SECURITY RISK - MAKES REAL API CALLS)
  app.post("/api/whatsapp/debug-test", async (req: Request, res: Response) => {
    try {
      const { phone, message } = req.body;

      if (!phone) {
        return res.status(400).json({ 
          success: false, 
          error: "Phone number is required" 
        });
      }

      // Clean and validate phone number
      let cleanPhone = phone.replace(/\D/g, '');
      let finalPhone = cleanPhone;

      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        finalPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
        finalPhone = cleanPhone.substring(1);
      }

      console.log(`=== DEBUG WhatsApp Test ===`);
      console.log(`Original phone: ${phone}`);
      console.log(`Cleaned phone: ${cleanPhone}`);
      console.log(`Final phone: ${finalPhone}`);

      // Validate phone number
      const isValidPhone = /^[6-9]\d{9}$/.test(finalPhone);
      console.log(`Phone validation: ${isValidPhone}`);

      if (!isValidPhone) {
        return res.json({
          success: false,
          error: `Invalid phone number format. Must be 10 digits starting with 6-9. Got: ${finalPhone}`,
          phoneValidation: {
            original: phone,
            cleaned: cleanPhone,
            final: finalPhone,
            isValid: false
          }
        });
      }

      const testMessage = message || `DEBUG TEST: Hi! This is a test from TravelFlow at ${new Date().toLocaleTimeString()}. Please reply if you receive this.`;

      // Send via BhashSMS API using your exact working format
      const apiUrl = 'http://bhashsms.com/api/sendmsg.php';
      const baseParams = `user=eddygoo1&pass=123456&sender=BUZWAP&phone=${finalPhone}&text=${encodeURIComponent(testMessage)}&priority=wa&stype=normal&Params=54,877,966,52&htype=image&url=https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg`;
      const finalUrl = `${apiUrl}?${baseParams}`;

      console.log(`API URL: ${finalUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'TravelFlow-Debug/1.0' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.text().then(text => text.trim());

      console.log(`API Response: "${result}"`);
      console.log(`Response starts with S.: ${result.startsWith('S.')}`);
      console.log(`Response length: ${result.length}`);

      const success = response.ok && result.startsWith('S.') && result.length > 2;

      console.log(`Final success status: ${success}`);
      console.log(`=== END DEBUG ===`);

      res.json({
        success,
        message: success ? `Test message sent successfully to +91${finalPhone}` : `Failed to send test message`,
        apiResponse: result,
        phoneValidation: {
          original: phone,
          cleaned: cleanPhone,
          final: finalPhone,
          isValid: true
        },
        apiDetails: {
          url: finalUrl,
          responseStatus: response.status,
          responseOk: response.ok
        },
        testMessage
      });

    } catch (error) {
      console.error("Debug WhatsApp test error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });
  */

  // System health check for large batch processing
  app.get("/api/system/health", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || (user.role !== "agency" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      res.json({
        status: 'healthy',
        uptime: Math.floor(uptime),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        timestamp: new Date().toISOString(),
        recommendations: {
          maxBatchSize: memUsage.heapUsed > 100 * 1024 * 1024 ? 500 : 1000,
          delayBetweenBatches: memUsage.heapUsed > 100 * 1024 * 1024 ? 5000 : 1000
        }
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /*
  // DISABLED: Intelligent batch splitting for large WhatsApp campaigns (causing unwanted multiple batch sends)
  app.post('/api/agency/whatsapp/send-large-batch/:uploadId', requireAuth(['agency']), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { uploadId } = req.params;
      const { batchSize = 500 } = req.body; // Configurable batch size
      const agencyId = user.agency?.id;

      if (!agencyId) {
        return res.status(404).json({ error: 'Agency not found' });
      }

      // Get all pending travelers
      let allTravelers: any[] = [];
      if (uploadId.startsWith('legacy-')) {
        const [, busIdStr, dateStr] = uploadId.split('-');
        const busId = parseInt(busIdStr);
        const targetDate = new Date(dateStr).toDateString();
        const agencyTravelers = await storage.getTravelerDataByAgency(agencyId);
        allTravelers = agencyTravelers.filter(t => 
          t.busId === busId && 
          !t.uploadId && 
          new Date(t.createdAt || new Date()).toDateString() === targetDate
        );
      } else {
        const uploadIdNum = parseInt(uploadId);
        if (!isNaN(uploadIdNum)) {
          allTravelers = await storage.getTravelerDataByUpload(uploadIdNum);
        }
      }

      const initialPendingTravelers = allTravelers.filter(t => t && t.whatsappStatus !== 'sent');
      
      // CRITICAL: Remove duplicate phone numbers to prevent multiple messages to same passenger
      const seenPhones = new Set();
      const pendingTravelers = initialPendingTravelers.filter(traveler => {
        if (seenPhones.has(traveler.phone)) {
          console.log(`🚫 DUPLICATE PHONE DETECTED: Skipping ${traveler.travelerName} (${traveler.phone}) - already processed in this batch`);
          return false;
        }
        seenPhones.add(traveler.phone);
        return true;
      });

      const duplicatesSkipped = initialPendingTravelers.length - pendingTravelers.length;
      if (duplicatesSkipped > 0) {
        console.log(`⚠️  DUPLICATE PREVENTION: Skipped ${duplicatesSkipped} duplicate phone numbers to prevent multiple messages`);
      }
      
      if (pendingTravelers.length === 0) {
        return res.json({ success: true, message: 'No pending travelers to send WhatsApp', totalBatches: 0 });
      }

      // Split into manageable batches
      const batches = [];
      for (let i = 0; i < pendingTravelers.length; i += batchSize) {
        batches.push(pendingTravelers.slice(i, i + batchSize));
      }

      console.log(`📦 LARGE CAMPAIGN: Splitting ${pendingTravelers.length} travelers into ${batches.length} batches of ${batchSize}`);

      let totalSent = 0;
      let totalFailed = 0;
      const batchResults = [];

      // Process each batch with delays
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        console.log(`\n🚀 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} travelers)`);
        
        try {
          // Use the existing batch processing logic
          const batchResponse = await fetch(`http://localhost:5000/api/agency/whatsapp/send-batch/${uploadId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.cookie || ''
            }
          });

          const batchResult = await batchResponse.json();
          
          if (batchResult.success) {
            totalSent += batchResult.sentCount || 0;
            totalFailed += batchResult.failedCount || 0;
          }

          batchResults.push({
            batchNumber: batchIndex + 1,
            travelers: batch.length,
            sent: batchResult.sentCount || 0,
            failed: batchResult.failedCount || 0,
            success: batchResult.success
          });

          // Delay between batches for system stability
          if (batchIndex < batches.length - 1) {
            console.log(`⏳ Waiting 5 seconds before next batch...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

        } catch (batchError) {
          console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
          totalFailed += batch.length;
          batchResults.push({
            batchNumber: batchIndex + 1,
            travelers: batch.length,
            sent: 0,
            failed: batch.length,
            success: false,
            error: batchError instanceof Error ? batchError.message : 'Unknown error'
          });
        }
      }

      console.log(`\n📊 LARGE CAMPAIGN COMPLETED`);
      console.log(`✅ Total sent: ${totalSent}`);
      console.log(`❌ Total failed: ${totalFailed}`);
      console.log(`📦 Batches processed: ${batches.length}`);

      res.json({
        success: totalSent > 0,
        message: `Large campaign completed: ${totalSent} sent, ${totalFailed} failed across ${batches.length} batches`,
        totalSent,
        totalFailed,
        totalBatches: batches.length,
        batchSize,
        batchResults,
        campaignDetails: {
          totalTravelers: pendingTravelers.length,
          batchStrategy: 'intelligent_splitting',
          delayBetweenBatches: '5 seconds',
          memoryOptimized: true
        }
      });

    } catch (error) {
      console.error('Large batch campaign error:', error);
      res.status(500).json({ 
        error: 'Failed to process large batch campaign',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  */


  // Get today's API call statistics
  app.get('/api/agency/whatsapp/api-stats', requireAuth(['agency']), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const agencyId = user.agency?.id;
      if (!agencyId) {
        return res.status(404).json({ error: 'Agency not found' });
      }

      // Get date parameter or default to today
      const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const allTravelers = await storage.getTravelerDataByAgency(agencyId);
      
      // DEBUG: Count ALL travelers who had API calls (sent/failed) on ANY date first
      const allApiCallTravelers = allTravelers.filter(t => 
        t.whatsappStatus === 'sent' || t.whatsappStatus === 'failed'
      );
      
      console.log(`\n🔍 API STATS DEBUG for agency ${agencyId}, date ${targetDate}:`);
      console.log(`📊 Total travelers: ${allTravelers.length}`);
      console.log(`📞 Travelers with API calls ever: ${allApiCallTravelers.length}`);
      
      // Show sample of travelers and their timestamps to understand the data
      console.log(`\n📋 SAMPLE OF TRAVELERS WITH API CALLS:`);
      allApiCallTravelers.slice(0, 10).forEach((t, idx) => {
        console.log(`${idx + 1}. ${t.travelerName} - Status: ${t.whatsappStatus} - Created: ${t.createdAt} - Updated: ${t.updatedAt}`);
      });
      
      // For the target date, filter by updatedAt (when WhatsApp status was set)
      const travelersWithApiCalls = allApiCallTravelers.filter(t => {
        // Use updatedAt as the date when WhatsApp was actually sent
        const apiCallDate = t.updatedAt ? new Date(t.updatedAt).toISOString().split('T')[0] : 
                           (t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : targetDate);
        const matches = apiCallDate === targetDate;
        if (matches) {
          console.log(`✅ Found API call for ${targetDate}: ${t.travelerName} (${t.whatsappStatus}) - Updated: ${t.updatedAt}`);
        }
        return matches;
      });
      console.log(`📅 Date ${targetDate} - found ${travelersWithApiCalls.length} API calls`);

      const sentCount = travelersWithApiCalls.filter(t => t.whatsappStatus === 'sent').length;
      const failedCount = travelersWithApiCalls.filter(t => t.whatsappStatus === 'failed').length;
      const totalApiCallsForDate = sentCount + failedCount;
      
      // Also include ALL sent and failed travelers regardless of date to show total usage
      const allSentEver = allTravelers.filter(t => t.whatsappStatus === 'sent').length;
      const allFailedEver = allTravelers.filter(t => t.whatsappStatus === 'failed').length;
      const totalApiCallsEver = allSentEver + allFailedEver;
      
      // Get all pending (never had API calls)
      const pendingCount = allTravelers.filter(t => !t.whatsappStatus || t.whatsappStatus === 'pending').length;

      console.log(`\n📊 FINAL CALCULATION for ${targetDate}:`);
      console.log(`   Selected date API calls: ${totalApiCallsForDate} (sent: ${sentCount}, failed: ${failedCount})`);
      console.log(`   Total ever API calls: ${totalApiCallsEver} (sent: ${allSentEver}, failed: ${allFailedEver})`);
      console.log(`   Pending never sent: ${pendingCount}`);

      const response = {
        date: targetDate,
        totalApiCallsToday: totalApiCallsForDate,
        totalApiCallsEver: totalApiCallsEver,
        breakdown: {
          sent: sentCount,
          failed: failedCount,
          pending: pendingCount,
          total: allTravelers.length
        },
        everBreakdown: {
          sent: allSentEver,
          failed: allFailedEver,
          pending: pendingCount,
          total: allTravelers.length
        },
        note: `API calls for ${targetDate}: ${totalApiCallsForDate}. Total ever: ${totalApiCallsEver}`
      };

      console.log(`🔍 Response object:`, JSON.stringify(response, null, 2));
      res.json(response);

    } catch (error) {
      console.error('Error getting API stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get upload batches with WhatsApp status for scheduler
  app.get('/api/agency/upload-batches', requireAuth(['agency']), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const agencyId = user.agency?.id;
      if (!agencyId) {
        return res.status(404).json({ error: 'Agency not found' });
      }

      // Get date parameter for filtering batches that had API calls on specific date
      const targetDate = req.query.date as string;
      console.log(`\n🎯 BATCH API FILTER for agency ${agencyId}, target date: ${targetDate}`);

      // Get upload history for this agency
      const uploadHistory = await storage.getUploadHistory(agencyId);

      // Create batches from actual upload history records
      const batches = [];

      for (const upload of uploadHistory) {
        // Get bus info
        const bus = await storage.getBus(upload.busId);

        // Get all travelers for this specific upload
        const travelers = await storage.getTravelerDataByUpload(upload.id);

        if (travelers.length === 0) continue; // Skip empty uploads

        // CRITICAL: If filtering by date, only include batches that had API calls on that date
        if (targetDate) {
          // Filter travelers who had API calls made on the target date
          const apiCallTravelers = travelers.filter(t => {
            if (t.whatsappStatus !== 'sent' && t.whatsappStatus !== 'failed') return false;
            const apiCallDate = t.updatedAt ? new Date(t.updatedAt).toISOString().split('T')[0] : null;
            return apiCallDate === targetDate;
          });
          
          // Skip this batch if no API calls were made on the target date
          if (apiCallTravelers.length === 0) {
            console.log(`📦 Skipping batch ${upload.id} - no API calls on ${targetDate}`);
            continue;
          }
          
          console.log(`📦 Including batch ${upload.id} - ${apiCallTravelers.length} API calls on ${targetDate}`);
        }

        // Calculate WhatsApp status with better accuracy  
        const sentCount = travelers.filter(t => t.whatsappStatus === 'sent').length;
        const failedCount = travelers.filter(t => t.whatsappStatus === 'failed').length;
        const pendingCount = travelers.filter(t => !t.whatsappStatus || t.whatsappStatus === 'pending').length;
        const totalCount = travelers.length;

        let whatsappStatus: 'pending' | 'sent' | 'partial' = 'pending';
        if (sentCount === totalCount && totalCount > 0) {
          whatsappStatus = 'sent';
        } else if (sentCount > 0) {
          whatsappStatus = 'partial';
        }

        // Get unique routes and coupons for this specific upload
        const routeSet = new Set(travelers.map(t => bus ? `${bus.fromLocation} to ${bus.toLocation}` : 'Unknown Route'));
        const couponSet = new Set(travelers.map(t => t.couponCode).filter(Boolean));
        const routes = Array.from(routeSet) || [];
        const coupons = Array.from(couponSet) || [];

        batches.push({
          uploadId: upload.id.toString(), // Ensure it's a string for consistency
          uploadDate: upload.createdAt || new Date(),
          travelerCount: totalCount || 0,
          routes: routes || [],
          coupons: coupons || [],
          whatsappStatus,
          sentCount: sentCount || 0,
          failedCount: failedCount || 0,
          pendingCount: pendingCount || 0,
          fileName: upload.fileName || 'Unknown File', // Add filename for better identification
          busName: bus?.name || 'Unknown Bus',
          progressPercentage: totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0
        });
      }

      console.log(`\n📊 FINAL BATCH RESULTS for ${targetDate || 'all dates'}:`);
      console.log(`   Found ${batches.length} batches that had API calls${targetDate ? ` on ${targetDate}` : ' ever'}`);
      batches.forEach(batch => {
        console.log(`   - Batch ${batch.uploadId}: ${batch.sentCount + batch.failedCount} API calls (${batch.fileName})`);
      });

      // If no upload history but there's traveler data, create legacy batches
      if (batches.length === 0) {
        const allTravelers = await storage.getTravelerDataByAgency(agencyId);

        // Group legacy travelers by bus and creation date (without uploadId)
        const legacyTravelers = allTravelers.filter(t => !t.uploadId);

        if (legacyTravelers.length > 0) {
          // Group by bus and day
          const travelerGroups = new Map<string, any[]>();

          for (const traveler of legacyTravelers) {
            const date = new Date(traveler.createdAt || new Date()).toDateString();
            const key = `${traveler.busId}-${date}`;

            if (!travelerGroups.has(key)) {
              travelerGroups.set(key, []);
            }
            travelerGroups.get(key)!.push(traveler);
          }

          // Create batches for each group
          for (const [key, travelers] of travelerGroups) {
            const firstTraveler = travelers[0];
            const bus = await storage.getBus(firstTraveler.busId);

            // Calculate WhatsApp status
            const sentCount = travelers.filter((t: any) => t.whatsappStatus === 'sent').length;
            const totalCount = travelers.length;

            let whatsappStatus: 'pending' | 'sent' | 'partial' = 'pending';
            if (sentCount === totalCount && totalCount > 0) {
              whatsappStatus = 'sent';
            } else if (sentCount > 0) {
              whatsappStatus = 'partial';
            }

            // Get unique routes and coupons
            const routeSet = new Set(travelers.map((t: any) => bus ? `${bus.fromLocation} to ${bus.toLocation}` : 'Unknown Route'));
            const couponSet = new Set(travelers.map((t: any) => t.couponCode).filter(Boolean));
            const routes = Array.from(routeSet);
            const coupons = Array.from(couponSet);

            batches.push({
              uploadId: `legacy-${key}`, // Use legacy identifier
              uploadDate: firstTraveler.createdAt || new Date(),
              travelerCount: totalCount,
              routes,
              coupons,
              whatsappStatus,
              sentCount,
              fileName: 'Legacy Upload',
              busName: bus?.name || 'Unknown Bus'
            });
          }
        }
      }

      // Sort batches by upload date (newest first)
      batches.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );

      res.json(batches);
    } catch (error) {
      console.error('Error fetching upload batches:', error);
      res.status(500).json({ error: 'Failed to fetch upload batches' });
    }
  });

  // Send WhatsApp to all travelers in a batch with proper individual API calls and delays
  app.post('/api/agency/whatsapp/send-batch/:uploadId', requireAuth(['agency']), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { uploadId } = req.params;
      const agencyId = user.agency?.id;

      // CRITICAL LOGGING: Track which batch is being requested
      console.log(`\n🎯 BATCH SEND REQUEST RECEIVED`);
      console.log(`📅 Upload ID Requested: ${uploadId}`);
      console.log(`🏢 Agency ID: ${agencyId}`);
      console.log(`👤 User: ${user.email}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

      if (!agencyId) {
        return res.status(404).json({ error: 'Agency not found' });
      }

      // CRITICAL: Prevent multiple batch processing - only process the EXACT requested batch
      console.log(`🛡️  SAFETY CHECK: Only processing upload ID: ${uploadId}`);
      console.log(`🚨 WARNING: If any other batch gets processed, this is a SYSTEM BUG`);
      
      // CRITICAL DUPLICATE PREVENTION: Reset any stuck 'processing' status from previous interrupted sends
      console.log(`🔧 CRITICAL CLEANUP: Preventing duplicate API calls by fixing stuck 'processing' records`);
      await storage.resetProcessingStatus(uploadId);
      
      // ADDITIONAL SAFETY: Wait 1 second for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add batch size limit for safety
      const MAX_BATCH_SIZE = 1000;
      let batchTravelers = [];

      // Handle legacy batches vs normal upload batches
      if (uploadId.startsWith('legacy-')) {
        const [, busIdStr, dateStr] = uploadId.split('-');
        const busId = parseInt(busIdStr);
        const targetDate = new Date(dateStr).toDateString();

        const allTravelers = await storage.getTravelerDataByAgency(agencyId);
        batchTravelers = allTravelers.filter(t => 
          t.busId === busId && 
          !t.uploadId && 
          new Date(t.createdAt || new Date()).toDateString() === targetDate
        );
      } else {
        const uploadIdNum = parseInt(uploadId);
        if (isNaN(uploadIdNum)) {
          return res.status(400).json({ error: 'Invalid upload ID' });
        }
        batchTravelers = await storage.getTravelerDataByUpload(uploadIdNum);
      }

      // CRITICAL DUPLICATE PREVENTION: Only process travelers who haven't received WhatsApp messages
      console.log(`🔍 DUPLICATE CHECK: Filtering travelers who already received WhatsApp messages`);
      
      const initialPendingTravelers = (batchTravelers || []).filter(t => {
        if (!t) return false;
        
        const hasReceived = t.whatsappStatus === 'sent' || t.whatsappStatus === 'processing';
        if (hasReceived) {
          console.log(`✅ ALREADY PROCESSED: ${t.travelerName} (${t.phone}) - Status: ${t.whatsappStatus}`);
        }
        return !hasReceived;
      });

      // CRITICAL: Remove duplicate phone numbers within this batch
      const seenPhones = new Set();
      const pendingTravelers = initialPendingTravelers.filter(traveler => {
        if (seenPhones.has(traveler.phone)) {
          console.log(`🚫 DUPLICATE PHONE WITHIN BATCH: Skipping ${traveler.travelerName} (${traveler.phone})`);
          return false;
        }
        seenPhones.add(traveler.phone);
        return true;
      });
      
      console.log(`📊 DUPLICATE PREVENTION COMPLETE:`);
      console.log(`   Total in batch: ${(batchTravelers || []).length}`);
      console.log(`   Already processed: ${(batchTravelers || []).length - initialPendingTravelers.length}`);
      console.log(`   Duplicates within batch: ${initialPendingTravelers.length - pendingTravelers.length}`);
      console.log(`   Will process: ${pendingTravelers.length}`);

      const duplicatesSkipped = initialPendingTravelers.length - pendingTravelers.length;
      if (duplicatesSkipped > 0) {
        console.log(`⚠️  DUPLICATE PREVENTION: Skipped ${duplicatesSkipped} duplicate phone numbers to prevent multiple messages`);
      }

      if (pendingTravelers.length === 0) {
        const alreadySentCount = (batchTravelers || []).filter(t => t && t.whatsappStatus === 'sent').length;
        return res.json({ 
          success: true, 
          message: `All travelers have already received WhatsApp messages (${alreadySentCount} previously sent)`, 
          sentCount: 0,
          alreadySentCount,
          totalCount: (batchTravelers || []).length
        });
      }

      console.log(`\n🎯 SMART BATCH PROCESSING`);
      console.log(`📊 Total travelers in batch: ${(batchTravelers || []).length}`);
      console.log(`✅ Already sent: ${(batchTravelers || []).length - pendingTravelers.length}`);
      console.log(`⏳ Pending to send: ${pendingTravelers.length}`);
      console.log(`📋 ONLY PROCESSING BATCH: ${uploadId} - NO OTHER BATCHES WILL BE PROCESSED`);
      console.log(`🚀 Starting from where we left off...`);

      // Safety check for large batches
      if (pendingTravelers.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
          error: `Batch size too large. Maximum ${MAX_BATCH_SIZE} messages per batch. Current: ${pendingTravelers.length}`,
          suggestion: 'Process in smaller batches for better reliability'
        });
      }

      console.log(`\n🚀 BULK WHATSAPP API HANDLER - PROCESSING ${pendingTravelers.length} TRAVELERS`);
      console.log(`📋 Each traveler will get individual API call with personalized data`);
      console.log(`⏱️  Using 1-second delay between each API call for optimal delivery`);

      let sentCount = 0;
      let failedCount = 0;
      let totalApiCallsToday = 0; // Track API calls for this batch
      
      // Get fresh agency data from database to ensure we have latest whatsappTemplate
      const agency = await storage.getAgencyById(user.agency.id);
      if (!agency) {
        return res.status(404).json({ error: 'Agency not found' });
      }
      console.log(`🔄 FRESH AGENCY DATA - WhatsApp Template: '${agency.whatsappTemplate}' (fallback: 'eddygoo_2807')`);
      console.log(`📊 Agency ID: ${agency.id}, Name: ${agency.name}`);
      const deliveryResults = [];

      // Process each traveler individually with personalized API calls
      for (let i = 0; i < pendingTravelers.length; i++) {
        const traveler = pendingTravelers[i];
        
        // Safety check
        if (!traveler || !traveler.id || !traveler.phone || !traveler.travelerName) {
          console.error(`❌ Invalid traveler data at index ${i}:`, traveler);
          failedCount++;
          deliveryResults.push({
            travelerName: traveler?.travelerName || 'Unknown',
            phone: traveler?.phone || 'Unknown',
            status: 'failed',
            reason: 'Invalid traveler data'
          });
          continue;
        }
        
        try {
          console.log(`\n=== WHATSAPP BATCH SEND DEBUG ===`);
          console.log(`Traveler: ${traveler.travelerName}`);
          console.log(`Original Phone: ${traveler.phone}`);

          // Clean and validate phone number with detailed logging
          let cleanPhone = traveler.phone.replace(/\D/g, '');
          console.log(`Cleaned Phone: ${cleanPhone}`);

          let finalPhone = cleanPhone;
          if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
            finalPhone = cleanPhone.substring(2);
          } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
            finalPhone = cleanPhone.substring(1);
          }
          console.log(`Final Phone: +91${finalPhone}`);

          // Validate phone number
          if (!/^[6-9]\d{9}$/.test(finalPhone)) {
            console.error(`❌ Invalid phone number format: ${finalPhone}`);
            await storage.updateTravelerData(traveler.id, { whatsappStatus: 'failed' });
            failedCount++;
            deliveryResults.push({
              travelerName: traveler.travelerName,
              phone: traveler.phone,
              status: 'failed',
              reason: 'Invalid phone number format'
            });
            continue;
          }

          // Get agency settings and bus info
          const bus = await storage.getBus(traveler.busId);
          const bookingUrl = agency.bookingWebsite || agency.website || 'https://testtravelagency.com';
          const whatsappImageUrl = agency.whatsappImageUrl || 'https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg';

          console.log(`Booking URL: ${bookingUrl}`);
          console.log(`WhatsApp Image URL: ${whatsappImageUrl}`);
          console.log(`🎯 WhatsApp Template: ${agency.whatsappTemplate || 'eddygoo_2807'}`);

          // Create INDIVIDUAL API call with PERSONALIZED data for THIS traveler
          const apiUrl = 'https://bhashsms.com/api/sendmsg.php';
          const whatsappTemplate = agency.whatsappTemplate || 'eddygoo_2807';
          
          // Build URL manually without encoding to avoid %2C, %3A, %2F issues
          const cleanParams = [
            `user=eddygoo1`,
            `pass=123456`,
            `sender=BUZWAP`,
            `phone=${finalPhone}`,
            `text=${whatsappTemplate}`,
            `priority=wa`,
            `stype=normal`,
            `Params=${traveler.travelerName},${agency.name},${traveler.couponCode || 'SAVE20'},${bookingUrl}`,
            `htype=image`,
            `url=${whatsappImageUrl}`
          ].join('&');
          
          const fullApiUrl = `${apiUrl}?${cleanParams}`;

          // CRITICAL DUPLICATE CHECK: Verify this phone number hasn't been processed already
          const currentStatus = await storage.getTravelerData(traveler.id);
          if (currentStatus?.whatsappStatus === 'sent' || currentStatus?.whatsappStatus === 'processing') {
            console.log(`🚫 ALREADY PROCESSED: ${traveler.travelerName} (${traveler.phone}) - Status: ${currentStatus.whatsappStatus}`);
            continue; // Skip this traveler
          }
          
          // CRITICAL SAFETY: Mark as processing BEFORE API call to prevent duplicates
          console.log(`🔒 PRE-API SAFETY: Marking traveler ${traveler.id} as 'processing' to prevent duplicate calls`);
          await storage.updateTravelerData(traveler.id, { whatsappStatus: 'processing' });

          // Make INDIVIDUAL API call for THIS traveler
          console.log(`\n🚀 API CALL ${i + 1}/${pendingTravelers.length}: ${traveler.travelerName} (${traveler.phone})`);
          console.log(`🔍 CRITICAL: This phone ${traveler.phone} is now RECEIVING WhatsApp message`);
          console.log(`⚠️  IMPORTANT: If interrupted after this point, phone ${traveler.phone} already got message!`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(fullApiUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'TravelFlow-WhatsApp/1.0'
            }
          });
          
          // Count this API call
          totalApiCallsToday++;

          clearTimeout(timeoutId);
          const responseText = await response.text().then(text => text.trim());
          
          // CRITICAL: Immediately update to prevent duplicate processing on interruption
          console.log(`🔒 IMMEDIATE POST-API UPDATE: Updating status to prevent duplicates on interruption`);
          const isSuccess = response.ok && 
                           responseText.startsWith('S.') && 
                           responseText.length > 2 &&
                           !responseText.includes('ERROR') &&
                           !responseText.includes('FAIL');
          
          // Update status immediately after API response to prevent race condition
          const finalStatus = isSuccess ? 'sent' : 'failed';
          await storage.updateTravelerData(traveler.id, { whatsappStatus: finalStatus });

          console.log(`API Response Status: ${response.status}`);
          console.log(`API Response OK: ${response.ok}`);
          console.log(`Raw API Response: "${responseText}"`);
          console.log(`Response Length: ${responseText.length}`);
          console.log(`Starts with S.: ${responseText.startsWith('S.')}`);
          console.log(`Full API URL: ${fullApiUrl}`);

          // Check for daily limit reached - stop batch processing
          if (responseText.includes('Daily Message Limit Reached')) {
            console.log(`🚫 DAILY LIMIT REACHED - Stopping batch processing`);
            console.log(`📊 Processed ${i + 1}/${pendingTravelers.length} travelers before hitting limit`);
            console.log(`✅ Sent: ${sentCount}, ❌ Failed: ${failedCount + 1}`);
            
            // Mark current traveler as failed due to limit
            await storage.updateTravelerData(traveler.id, { whatsappStatus: 'failed' });
            failedCount++;
            
            deliveryResults.push({
              travelerName: traveler.travelerName,
              phone: `+91${finalPhone}`,
              status: 'failed',
              apiResponse: responseText,
              reason: 'Daily message limit reached'
            });

            // Return early with limit reached information
            const alreadySentCount = (batchTravelers || []).length - pendingTravelers.length;
            return res.json({
              success: sentCount > 0,
              limitReached: true,
              message: `Daily message limit reached after sending ${sentCount} messages. Resume tomorrow to continue.`,
              sentCount,
              failedCount,
              alreadySentCount,
              totalInBatch: (batchTravelers || []).length,
              totalProcessed: i + 1,
              remainingToProcess: pendingTravelers.length - (i + 1),
              deliveryResults,
              limitInfo: {
                limitReachedAt: new Date().toISOString(),
                processedBeforeLimit: i + 1,
                remainingTravelers: pendingTravelers.length - (i + 1),
                canResumeAt: 'Tomorrow after daily limit resets'
              }
            });
          }

          console.log(`=== BULK DELIVERY DEBUG ===`);
          console.log(`Response Status: ${response.status}`);
          console.log(`Response OK: ${response.ok}`);
          console.log(`Raw Response: "${responseText}"`);
          console.log(`Response Length: ${responseText.length}`);
          console.log(`Starts with S.: ${responseText.startsWith('S.')}`);

          if (isSuccess) {
            console.log(`✅ BULK SUCCESS: WhatsApp sent to ${traveler.travelerName} (+91${finalPhone}) - Message ID: ${responseText}`);
            console.log(`⚠️  IMPORTANT: User should receive WhatsApp message at +91${finalPhone} in 1-5 minutes`);
            
            sentCount++;
            
            deliveryResults.push({
              travelerName: traveler.travelerName,
              phone: `+91${finalPhone}`,
              status: 'sent',
              messageId: responseText,
              personalizedData: {
                name: traveler.travelerName,
                agency: agency.name,
                coupon: traveler.couponCode || 'SAVE20',
                bookingUrl: bookingUrl
              }
            });
          } else {
            console.log(`❌ BULK FAILED: ${traveler.travelerName} (+91${finalPhone}): ${responseText}`);
            
            failedCount++;
            
            deliveryResults.push({
              travelerName: traveler.travelerName,
              phone: `+91${finalPhone}`,
              status: 'failed',
              apiResponse: responseText,
              reason: 'API call failed'
            });
          }

          // CRITICAL: 1-second delay between each API call for proper delivery
          if (i < pendingTravelers.length - 1) {
            console.log(`⏳ Waiting 1 second before next API call...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Memory cleanup for large batches
          if (i > 0 && i % 100 === 0) {
            console.log(`🔄 Processed ${i}/${pendingTravelers.length} messages. Forcing garbage collection...`);
            if (global.gc) {
              global.gc();
            }
          }

        } catch (error) {
          console.error(`❌ Error processing ${traveler.travelerName}:`, error);
          await storage.updateTravelerData(traveler.id, { whatsappStatus: 'failed' });
          failedCount++;
          
          deliveryResults.push({
            travelerName: traveler.travelerName,
            phone: traveler.phone,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`\n📊 BULK SEND COMPLETED`);
      console.log(`✅ Successfully sent: ${sentCount}`);
      console.log(`❌ Failed: ${failedCount}`);
      console.log(`📱 Total processed: ${pendingTravelers.length}`);
      console.log(`📞 Total API calls made: ${totalApiCallsToday}`);
      console.log(`🎯 Each traveler got individual API call with personalized data`);

      const alreadySentCount = (batchTravelers || []).length - pendingTravelers.length;

      res.json({
        success: sentCount > 0,
        message: `Smart batch complete: ${sentCount} newly sent, ${failedCount} failed${alreadySentCount > 0 ? `, ${alreadySentCount} already sent` : ''}`,
        sentCount,
        failedCount,
        alreadySentCount,
        totalInBatch: (batchTravelers || []).length,
        totalProcessed: pendingTravelers.length,
        totalApiCallsMade: totalApiCallsToday,
        deliveryResults,
        smartBatching: {
          enabled: true,
          skippedAlreadySent: alreadySentCount,
          resumedFromPosition: alreadySentCount + 1,
          preventsDuplicates: true
        },
        processingDetails: {
          individualApiCalls: true,
          personalizedData: true,
          delayBetweenCalls: '1 second',
          templateUsed: agency.whatsappTemplate || 'eddygoo_2807',
          apiCallCount: totalApiCallsToday
        }
      });

    } catch (error) {
      console.error('Error in bulk WhatsApp send:', error);
      res.status(500).json({ error: 'Failed to send WhatsApp messages' });
    }
  });

  // WhatsApp delivery debugging route
  app.post("/api/debug/whatsapp-delivery", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { debugWhatsAppDelivery } = await import('./whatsapp-delivery-debug');
      const result = await debugWhatsAppDelivery();

      res.json(result);
    } catch (error) {
      console.error('WhatsApp debug error:', error);
      res.status(500).json({ error: 'Failed to run WhatsApp debugging' });
    }
  });

  // Check WhatsApp daily limit and usage
  app.get("/api/agency/whatsapp/daily-limit", requireAuth(['agency']), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ error: 'Access denied' });
      }

      console.log('\n📊 CHECKING WHATSAPP DAILY LIMIT 📊');
      
      // Check account balance and status via BhashSMS API
      const balanceUrl = 'https://bhashsms.com/api/sendmsg.php?user=eddygoo1&pass=123456&sender=BUZWAP&phone=9900408817&text=balance';
      
      try {
        const response = await fetch(balanceUrl);
        const responseText = (await response.text()).trim();
        
        console.log(`Balance API Response: "${responseText}"`);
        
        // Get today's sent count from database for this agency
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const travelers = await storage.getTravelerDataByAgency(user.id);
        const todaysSent = travelers.filter(t => {
          const updatedAt = new Date(t.updatedAt || t.createdAt || new Date());
          return t.whatsappStatus === 'sent' && 
                 updatedAt >= today && 
                 updatedAt < tomorrow;
        }).length;
        
        // Parse balance response for limit information
        let dailyLimit = 'Unknown';
        let currentUsage = todaysSent;
        let accountBalance = 'Unknown';
        let limitReached = false;
        
        if (responseText.includes('Daily Message Limit Reached')) {
          limitReached = true;
        } else if (responseText.startsWith('S.')) {
          accountBalance = 'Active';
        }
        
        // Estimate daily limit based on common BhashSMS plans
        let estimatedLimit = 1000; // Default assumption
        if (responseText.includes('500')) estimatedLimit = 500;
        if (responseText.includes('1000')) estimatedLimit = 1000;
        if (responseText.includes('2000')) estimatedLimit = 2000;
        if (responseText.includes('5000')) estimatedLimit = 5000;
        
        const remainingMessages = limitReached ? 0 : estimatedLimit - currentUsage;
        const usagePercentage = Math.round((currentUsage / estimatedLimit) * 100);
        
        res.json({
          success: true,
          dailyLimit: {
            estimated: estimatedLimit,
            actual: dailyLimit,
            limitReached
          },
          usage: {
            todaysSent: currentUsage,
            remaining: Math.max(0, remainingMessages),
            percentage: usagePercentage
          },
          account: {
            status: accountBalance,
            provider: 'BhashSMS',
            credentials: 'eddygoo1'
          },
          resetTime: 'Daily limit resets at midnight IST',
          apiResponse: responseText,
          recommendations: limitReached ? [
            'Daily limit reached - wait until midnight for reset',
            'Contact BhashSMS to upgrade your plan for higher limits',
            'Consider spreading campaigns across multiple days'
          ] : [
            `You can send approximately ${remainingMessages} more messages today`,
            'Monitor usage to avoid hitting limits during important campaigns',
            'Consider upgrading if you frequently approach limits'
          ]
        });
        
      } catch (error) {
        console.error('Error checking balance:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to check daily limit',
          message: 'Could not connect to BhashSMS API'
        });
      }
      
    } catch (error) {
      console.error('Daily limit check error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to check daily limit' 
      });
    }
  });

  // WhatsApp Template Verification Endpoint
  app.post("/api/agency/whatsapp/verify-template", requireAuth(['agency']), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user || user.role !== 'agency') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const agency = user.agency;
      const testPhone = '9900408817'; // Your test number

      console.log('\n🔍 WHATSAPP TEMPLATE VERIFICATION 🔍');
      console.log(`Agency: ${agency.name}`);
      console.log(`Test Phone: +91${testPhone}`);

      const verificationResults = [];

      // Test 1: Check account balance/status
      console.log('\n1️⃣ Testing account status...');
      try {
        const balanceUrl = `https://bhashsms.com/api/sendmsg.php?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testPhone}&text=balance`;
        const balanceResponse = await fetch(balanceUrl);
        const balanceText = (await balanceResponse.text()).trim();
        
        verificationResults.push({
          test: 'Account Balance',
          response: balanceText,
          status: balanceText.includes('S.') ? 'success' : 'warning'
        });
        
        console.log(`Account Status: "${balanceText}"`);
      } catch (error) {
        verificationResults.push({
          test: 'Account Balance',
          response: 'Failed to check',
          status: 'error'
        });
      }

      // Test 2: Test template approval
      console.log('\n2️⃣ Testing WhatsApp template approval...');
      try {
        const templateUrl = `https://bhashsms.com/api/sendmsg.php?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testPhone}&text=eddygoo_2807&priority=wa&stype=normal&Params=TestUser,${agency.name},TEST20,${agency.bookingWebsite || 'https://test.com'}&htype=image&url=${agency.whatsappImageUrl || 'https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg'}`;
        
        const templateResponse = await fetch(templateUrl);
        const templateText = (await templateResponse.text()).trim();
        
        const isApproved = templateText.startsWith('S.');
        
        verificationResults.push({
          test: 'WhatsApp Template (eddygoo_2807)',
          response: templateText,
          status: isApproved ? 'success' : 'critical_error',
          note: isApproved ? 'Template appears approved' : 'TEMPLATE NOT APPROVED - Messages will not deliver'
        });
        
        console.log(`Template Test: "${templateText}"`);
        if (!isApproved) {
          console.log('🚨 CRITICAL: Template not approved for WhatsApp delivery');
        }
      } catch (error) {
        verificationResults.push({
          test: 'WhatsApp Template',
          response: 'Network error',
          status: 'error'
        });
      }

      // Test 3: Test SMS delivery (fallback)
      console.log('\n3️⃣ Testing SMS delivery as fallback...');
      try {
        const smsUrl = `https://bhashsms.com/api/sendmsg.php?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testPhone}&text=SMS Test from ${agency.name} - If you receive this, SMS works fine&priority=ndnd&stype=normal`;
        
        const smsResponse = await fetch(smsUrl);
        const smsText = (await smsResponse.text()).trim();
        
        verificationResults.push({
          test: 'SMS Fallback',
          response: smsText,
          status: smsText.startsWith('S.') ? 'success' : 'error',
          note: 'SMS can be used as backup if WhatsApp fails'
        });
        
        console.log(`SMS Test: "${smsText}"`);
      } catch (error) {
        verificationResults.push({
          test: 'SMS Fallback',
          response: 'Network error',
          status: 'error'
        });
      }

      // Analyze results and provide recommendations
      const templateApproved = verificationResults.find(r => r.test.includes('WhatsApp Template'))?.status === 'success';
      const accountWorking = verificationResults.find(r => r.test === 'Account Balance')?.status !== 'error';

      let diagnosis = '';
      let recommendations = [];

      if (!templateApproved) {
        diagnosis = 'CRITICAL: WhatsApp template not approved for delivery';
        recommendations = [
          'Contact BhashSMS support immediately',
          'Request approval for template "eddygoo_2807" for WhatsApp Business API',
          'Provide your business details and use case to BhashSMS',
          'Consider using SMS as temporary fallback',
          'Ask BhashSMS about WhatsApp template approval process'
        ];
      } else if (accountWorking) {
        diagnosis = 'Template appears approved - delivery should work';
        recommendations = [
          'Monitor actual message delivery to users',
          'Check with recipients if messages are received',
          'Verify phone numbers are WhatsApp-enabled',
          'Consider rate limiting for better delivery'
        ];
      } else {
        diagnosis = 'Account or connectivity issues detected';
        recommendations = [
          'Check BhashSMS account status',
          'Verify account balance and credits',
          'Check network connectivity to BhashSMS servers'
        ];
      }

      console.log(`\n📋 DIAGNOSIS: ${diagnosis}`);
      console.log('💡 RECOMMENDATIONS:');
      recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));

      res.json({
        success: true,
        diagnosis,
        recommendations,
        verificationResults,
        templateApproved,
        accountWorking,
        nextSteps: templateApproved ? 
          'Template appears approved. If users still not receiving messages, contact BhashSMS support.' : 
          'URGENT: Contact BhashSMS to approve WhatsApp template eddygoo_2807'
      });

    } catch (error) {
      console.error('Template verification error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to verify template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bulk delivery analysis for agencies
  app.post("/api/agency/whatsapp/analyze-bulk-delivery", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log('\n🔍 BULK WHATSAPP DELIVERY ANALYSIS 🔍');
      
      // Get agency data
      const agency = await storage.getAgency(user.id);
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      // Get all travelers for analysis
      const travelers = await storage.getTravelerDataByAgency(user.id);
      const sentTravelers = travelers.filter(t => t.whatsappStatus === 'sent');
      const failedTravelers = travelers.filter(t => t.whatsappStatus === 'failed');
      const pendingTravelers = travelers.filter(t => !t.whatsappStatus || t.whatsappStatus === 'pending');

      console.log(`Agency: ${agency.name}`);
      console.log(`Total Travelers: ${travelers.length}`);
      console.log(`Sent Successfully: ${sentTravelers.length}`);
      console.log(`Failed: ${failedTravelers.length}`);
      console.log(`Pending: ${pendingTravelers.length}`);

      // Test with 3 sample numbers to check template approval
      const testNumbers = ['9900408817', '9035580937', '9876543210'];
      const testResults = [];

      for (const testPhone of testNumbers) {
        try {
          const apiUrl = 'https://bhashsms.com/api/sendmsg.php';
          const testParams = `user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testPhone}&text=eddygoo_2807&priority=wa&stype=normal&Params=TestUser,${agency.name},TEST20,${agency.bookingWebsite || 'https://test.com'}&htype=image&url=${agency.whatsappImageUrl || 'https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg'}`;
          const testUrl = `${apiUrl}?${testParams}`;

          console.log(`Testing with ${testPhone}: ${testUrl}`);

          const response = await fetch(testUrl);
          const responseText = (await response.text()).trim();

          testResults.push({
            phone: testPhone,
            success: responseText.startsWith('S.'),
            response: responseText,
            url: testUrl
          });

          console.log(`Test ${testPhone}: ${responseText}`);
          
          // 5 second delay between test calls
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          testResults.push({
            phone: testPhone,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const analysis = {
        agencyName: agency.name,
        statistics: {
          total: travelers.length,
          sent: sentTravelers.length,
          failed: failedTravelers.length,
          pending: pendingTravelers.length,
          successRate: travelers.length > 0 ? Math.round((sentTravelers.length / travelers.length) * 100) : 0
        },
        templateTests: testResults,
        recommendations: [] as string[],
        potentialIssues: [] as string[]
      };

      // Add recommendations based on analysis
      if (sentTravelers.length === 0 && travelers.length > 0) {
        analysis.potentialIssues.push('No messages delivered despite API success - Template approval issue likely');
        analysis.recommendations.push('Contact BhashSMS to verify template eddygoo_2807 approval status');
      }

      if (failedTravelers.length > sentTravelers.length) {
        analysis.potentialIssues.push('High failure rate indicates API or account restrictions');
        analysis.recommendations.push('Check BhashSMS account balance and daily limits');
      }

      const testSuccessRate = testResults.filter(t => t.success).length / testResults.length * 100;
      if (testSuccessRate < 100) {
        analysis.potentialIssues.push(`Template test success rate: ${testSuccessRate}%`);
        analysis.recommendations.push('Template may need approval for WhatsApp delivery');
      }

      console.log('\n📋 ANALYSIS COMPLETE 📋');
      console.log(`Success Rate: ${analysis.statistics.successRate}%`);
      console.log(`Template Test Success: ${testSuccessRate}%`);

      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Bulk delivery analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to analyze bulk delivery' 
      });
    }
  });

  return app;
}