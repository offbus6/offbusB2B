import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import type { TravelerData } from "@shared/schema";
import { replitUserToAdmin, replitUserToUser } from "./replitAuth";
import { whatsappService } from "./whatsapp-service";

// Simple in-memory session storage with token-based auth
const activeSessions = new Map<string, any>();

// Generate session token
function generateSessionToken(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Store current logged in user globally (persistent across restarts)
let currentUser: any = null;

// Session storage for browser sessions
const sessionStore = new Map<string, any>();
import { insertAgencySchema, insertBusSchema, insertTravelerDataSchema, adminCredentials } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { agencies, buses } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Session middleware with memory store for persistence
const MemoryStoreSession = MemoryStore(session);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'super-secret-key-for-development-only',
  resave: false,
  saveUninitialized: false,
  rolling: false,
  name: 'connect.sid',
  store: new MemoryStoreSession({
    checkPeriod: 86400000,
  }),
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
  },
});

// Custom auth middleware - check session ID
const isAuthenticated = (req: any, res: any, next: any) => {
  console.log('Auth check - session exists:', !!req.session);
  console.log('Auth check - session user:', req.session?.user?.email);

  // Check if user is stored in session (admin login)
  if (req.session?.user) {
    req.user = req.session.user;
    console.log('Auth successful - session user found');
    next();
    return;
  }

  // Check if session exists in our store (regular user login)
  const sessionId = req.sessionID;
  const sessionData = sessionStore.get(sessionId);

  if (sessionData && sessionData.user) {
    req.user = sessionData.user;
    console.log('Auth successful - session store user found');
    next();
    return;
  }

  // Check global user as fallback (but this should be temporary)
  if (currentUser) {
    req.user = currentUser;
    console.log('Auth successful - global user fallback');
    next();
    return;
  }

  console.log('Authentication failed - no valid session found');
  res.status(401).json({ message: "Authentication required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy for session cookies
  app.set('trust proxy', 1);

  // Session middleware
  app.use(sessionMiddleware);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = req.user;
      res.json(sessionUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin Login
  app.post('/api/auth/admin/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;

      // Check admin credentials in database
      const adminCredentials = await storage.getAdminCredentials(email, password);

      if (adminCredentials) {
        const userWithRole = {
          id: adminCredentials.id,
          email: adminCredentials.email,
          role: 'super_admin'
        };

        // Store user globally and in session
        currentUser = userWithRole;
        req.session.user = userWithRole;

        res.json({
          user: userWithRole,
          role: 'super_admin',
          message: 'Admin login successful'
        });
        return;
      }

      res.status(401).json({ message: 'Invalid admin credentials' });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // Admin Signup (one-time setup)
  app.post('/api/auth/admin/signup', async (req: any, res) => {
    try {
      const { email, password } = req.body;

      // Check if admin already exists
      const [existingAdmin] = await db.select().from(adminCredentials).limit(1);
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin already exists' });
      }

      // Create admin credentials
      const adminId = Date.now().toString();
      const admin = await storage.createAdminCredentials({
        id: adminId,
        email,
        password,
      });

      res.json({ message: 'Admin account created successfully' });
    } catch (error) {
      console.error("Admin signup error:", error);
      res.status(500).json({ message: "Admin signup failed" });
    }
  });

  // Admin Profile Update
  app.patch('/api/auth/admin/profile', isAuthenticated, async (req: any, res) => {
    try {
      const { email, password } = req.body;
      const adminId = req.user.id;

      // Verify user is admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Update admin credentials
      const updatedAdmin = await storage.updateAdminCredentials(adminId, {
        email,
        password,
      });

      res.json({ 
        message: 'Profile updated successfully',
        email: updatedAdmin.email 
      });
    } catch (error) {
      console.error("Admin profile update error:", error);
      res.status(500).json({ message: "Profile update failed" });
    }
  });

  // Separate Travel Agent Login for Security
  app.post('/api/auth/agency/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      // Check for agency credentials (allow all agencies to login regardless of approval status)
      const agency = await storage.getAgencyByCredentials(email, password);

      if (agency) {
        const user = await storage.getUser(agency.userId);

        const userWithRole = {
          ...user,
          agency,
          role: 'agency'
        };

        // Store user globally and in session
        currentUser = userWithRole;
        sessionStore.set(req.sessionID, { user: userWithRole });

        res.json({
          user: userWithRole,
          agency,
          role: 'agency',
          message: 'Agency login successful'
        });
        return;
      }

      res.status(401).json({ message: 'Invalid agency credentials' });
    } catch (error) {
      console.error("Agency login error:", error);
      res.status(500).json({ message: "Agency login failed" });
    }
  });

  // General login endpoint that routes to appropriate login
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;

      // Check for agency credentials
      const agency = await storage.getAgencyByCredentials(email, password);
      if (agency) {
        const user = await storage.getUser(agency.userId);
        const userWithRole = {
          ...user,
          agency,
          role: 'agency'
        };

        // Store user globally and in session
        currentUser = userWithRole;
        sessionStore.set(req.sessionID, { user: userWithRole });

        res.json({
          user: userWithRole,
          agency,
          role: 'agency',
          message: 'Agency login successful'
        });
        return;
      }

      res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout handler function
  const handleLogout = (req: any, res: any) => {
    console.log('Logout request received');

    // Clear current user and session
    currentUser = null;

    // Clear from session store
    const sessionId = req.sessionID;
    if (sessionStore.has(sessionId)) {
      sessionStore.delete(sessionId);
    }

    // Clear session data
    if (req.session) {
      req.session.user = null;

      // Destroy the session completely
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
          // Even if session destruction fails, clear the cookie and respond
        }

        // Clear all session-related cookies
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'lax'
        });

        console.log('Logout successful - session cleared');
        res.json({ message: 'Logged out successfully' });
      });
    } else {
      // No session to destroy, just clear cookies
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });

      console.log('Logout successful - no session to clear');
      res.json({ message: 'Logged out successfully' });
    }
  };

  // Support both POST and GET for logout
  app.post('/api/auth/logout', handleLogout);
  app.get('/api/auth/logout', handleLogout);

  // Stats endpoints
  app.get('/api/stats/system', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // WhatsApp API endpoints
  app.get('/api/admin/whatsapp-config', isAuthenticated, async (req: any, res) => {
    try {
      const config = await storage.getWhatsappConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp config" });
    }
  });

  app.post('/api/admin/whatsapp-config', isAuthenticated, async (req: any, res) => {
    try {
      const existingConfig = await storage.getWhatsappConfig();
      let config;

      if (existingConfig) {
        config = await storage.updateWhatsappConfig(existingConfig.id, req.body);
      } else {
        config = await storage.createWhatsappConfig(req.body);
      }

      res.json(config);
    } catch (error) {
      console.error("Error saving WhatsApp config:", error);
      res.status(500).json({ message: "Failed to save WhatsApp config" });
    }
  });

  app.get('/api/admin/whatsapp-templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getWhatsappTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp templates" });
    }
  });

  app.post('/api/admin/whatsapp-templates', isAuthenticated, async (req: any, res) => {
    try {
      const template = await storage.createWhatsappTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating WhatsApp template:", error);
      res.status(500).json({ message: "Failed to create WhatsApp template" });
    }
  });

  app.patch('/api/admin/whatsapp-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.updateWhatsappTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating WhatsApp template:", error);
      res.status(500).json({ message: "Failed to update WhatsApp template" });
    }
  });

  app.delete('/api/admin/whatsapp-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWhatsappTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting WhatsApp template:", error);
      res.status(500).json({ message: "Failed to delete WhatsApp template" });
    }
  });

  app.get('/api/admin/whatsapp-queue/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getWhatsappQueueStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching WhatsApp queue stats:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp queue stats" });
    }
  });

  // WhatsApp webhook endpoint for incoming messages
  app.post('/api/whatsapp/webhook', async (req: any, res) => {
    try {
      const { phone_number, message, timestamp } = req.body;

      // Process the incoming message
      await whatsappService.processIncomingMessage(phone_number, message);

      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error("Error processing WhatsApp webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Manual opt-out endpoint
  app.post('/api/whatsapp/opt-out', async (req: any, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const optedOutTravelers = await storage.optOutTravelerFromWhatsapp(phoneNumber);

      res.json({ 
        message: `Successfully opted out ${optedOutTravelers.length} travelers`,
        count: optedOutTravelers.length 
      });
    } catch (error) {
      console.error("Error processing opt-out:", error);
      res.status(500).json({ message: "Failed to process opt-out" });
    }
  });

  // Get opt-out status
  app.get('/api/whatsapp/opt-out-status/:phoneNumber', isAuthenticated, async (req: any, res) => {
    try {
      const phoneNumber = req.params.phoneNumber;
      const traveler = await storage.getTravelerByPhone(phoneNumber);

      if (!traveler) {
        return res.status(404).json({ message: "Traveler not found" });
      }

      res.json({
        phoneNumber,
        optedOut: traveler.whatsappOptOut,
        optOutDate: traveler.optOutDate
      });
    } catch (error) {
      console.error("Error fetching opt-out status:", error);
      res.status(500).json({ message: "Failed to fetch opt-out status" });
    }
  });

  app.post('/api/admin/whatsapp-test', isAuthenticated, async (req: any, res) => {
    try {
      const { whatsappService } = await import('./whatsapp-service');
      await whatsappService.sendTestMessage();
      res.json({ message: "Test message sent successfully" });
    } catch (error) {
      console.error("Error testing WhatsApp:", error);
      res.status(500).json({ message: "Failed to test WhatsApp" });
    }
  });

  app.get('/api/stats/agency/:agencyId', isAuthenticated, async (req: any, res) => {
    try {
      const agencyId = parseInt(req.params.agencyId);
      const stats = await storage.getAgencyStats(agencyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching agency stats:", error);
      res.status(500).json({ message: "Failed to fetch agency stats" });
    }
  });

  // Dummy data seeding removed - system now uses only live data

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName, agencyName, phone, city, state, logoUrl } = req.body;

      console.log('Signup request received:', { email, firstName, lastName, agencyName, phone, city, state });

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Create user
      const userId = Date.now().toString(); // Simple ID generation
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        role: 'agency'
      });

      // Create agency with credentials
      const agency = await storage.createAgency({
        userId,
        name: agencyName,
        email,
        contactPerson: `${firstName} ${lastName}`,
        phone,
        city,
        state,
        logoUrl,
        password, // In production, hash this password
        status: 'pending'
      });

      console.log('Agency created successfully:', agency);
      res.json({ message: 'Account created successfully' });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Role assignment endpoint
  app.post('/api/auth/assign-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!role || !['super_admin', 'agency'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUserRole(userId, role);
      res.json({ message: "Role assigned successfully" });
    } catch (error) {
      console.error("Error assigning role:", error);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  // Simplified debug route to test database connection
  app.get('/api/test/db', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { agencies } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const allAgencies = await db.select().from(agencies);
      const pendingAgencies = await db.select().from(agencies).where(eq(agencies.status, "pending"));
      res.json({ 
        success: true, 
        all: allAgencies, 
        pending: pendingAgencies 
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Seed test data for development
  app.post('/api/test/seed-data', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { agencies } = await import('@shared/schema');

      // Add test agencies
      const testAgencies = [
        {
          userId: 'test1',
          name: 'Golden Express Travel',
          email: 'info@goldenexpress.com',
          contactPerson: 'John Smith',
          phone: '+1-555-0101',
          city: 'Mumbai',
          status: 'pending',
          password: 'password123',
        },
        {
          userId: 'test2',
          name: 'Blue Sky Transport',
          email: 'contact@bluesky.com',
          contactPerson: 'Sarah Johnson',
          phone: '+1-555-0102',
          city: 'Delhi',
          status: 'pending',
          password: 'password123',
        },
        {
          userId: 'test3',
          name: 'Mountain View Travels',
          email: 'hello@mountainview.com',
          contactPerson: 'Mike Wilson',
          phone: '+1-555-0103',
          city: 'Bangalore',
          status: 'approved',
          password: 'password123',
        }
      ];

      for (const agency of testAgencies) {
        await db.insert(agencies).values(agency).onConflictDoNothing();
      }

      res.json({ success: true, message: 'Test data seeded successfully' });
    } catch (error) {
      console.error("Seed data error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin middleware for admin-only routes
  const adminAuth = (req: any, res: any, next: any) => {
    console.log('Admin auth check - session:', req.session);
    console.log('Admin auth check - user:', req.session?.user);

    // First check if user is in session (admin login)
    if (req.session?.user) {
      if (req.session.user.role === 'super_admin') {
        req.user = req.session.user;
        next();
        return;
      }
    }

    // Fallback to global user (for immediate access)
    if (currentUser && currentUser.role === 'super_admin') {
      req.user = currentUser;
      next();
      return;
    }

    console.log('Admin authentication failed - no valid admin session');
    res.status(401).json({ message: "Admin authentication required" });
  };

  // Admin routes for managing agencies
  app.get('/api/admin/agencies/pending', adminAuth, async (req: any, res) => {
    try {
      const pendingAgencies = await storage.getPendingAgencies();
      res.json(pendingAgencies);
    } catch (error) {
      console.error("Error fetching pending agencies:", error);
      res.status(500).json({ message: "Failed to fetch pending agencies" });
    }
  });

  app.get('/api/admin/agencies', adminAuth, async (req: any, res) => {
    try {
      const agencies = await storage.getAllAgencies();
      res.json(agencies);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      res.status(500).json({ message: "Failed to fetch agencies" });
    }
  });

  app.patch('/api/admin/agencies/:id/status', adminAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const agency = await storage.updateAgencyStatus(parseInt(id), status);
      res.json(agency);
    } catch (error) {
      console.error("Error updating agency status:", error);
      res.status(500).json({ message: "Failed to update agency status" });
    }
  });

  // Add test buses for development/testing
  app.post('/api/admin/agencies/:id/add-test-buses', adminAuth, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      const { count = 3 } = req.body;

      // Check if agency exists
      const agency = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, agencyId))
        .limit(1);

      if (agency.length === 0) {
        return res.status(404).json({ message: 'Agency not found' });
      }

      // Add test buses
      const testBuses = [];
      for (let i = 1; i <= count; i++) {
        testBuses.push({
          agencyId,
          registrationNumber: `TEST${agencyId}-${Date.now()}-${i}`,
          routeNumber: `Route-${i}`,
          capacity: 40 + (i * 5),
          vehicleType: 'AC',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const result = await db.insert(buses).values(testBuses).returning();

      res.json({ 
        message: `Added ${count} test buses successfully`,
        buses: result 
      });
    } catch (error) {
      console.error('Error adding test buses:', error);
      res.status(500).json({ message: 'Failed to add test buses' });
    }
  });

  // Get specific agency details
  app.get('/api/admin/agencies/:id', adminAuth, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);

      const agency = await db
        .select({
          id: agencies.id,
          userId: agencies.userId,
          name: agencies.name,
          email: agencies.email,
          contactPerson: agencies.contactPerson,
          phone: agencies.phone,
          state: agencies.state,
          city: agencies.city,
          website: agencies.website,
          logoUrl: agencies.logoUrl,
          renewalChargePerBus: agencies.renewalChargePerBus,
          status: agencies.status,
          createdAt: agencies.createdAt,
        })
        .from(agencies)
        .where(eq(agencies.id, agencyId))
        .limit(1);

      if (agency.length === 0) {
        return res.status(404).json({ message: 'Agency not found' });
      }

      // Get total buses for this agency - using count function properly
      const busCountResult = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(buses)
        .where(eq(buses.agencyId, agencyId));

      const totalBuses = Number(busCountResult[0]?.count || 0);
      const renewalCharge = agency[0].renewalChargePerBus || 5000;
      const totalRenewalCharge = totalBuses * renewalCharge;

      console.log('Agency details debug:', {
        agencyId,
        busCountResult,
        totalBuses,
        renewalCharge,
        totalRenewalCharge
      });

      const result = {
        ...agency[0],
        totalBuses,
        totalRenewalCharge,
      };

      res.json(result);
    } catch (error) {
      console.error('Error fetching agency details:', error);
      res.status(500).json({ message: 'Failed to fetch agency details' });
    }
  });

  app.patch('/api/admin/agencies/:id/details', adminAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const agency = await storage.updateAgency(parseInt(id), updates);
      res.json(agency);
    } catch (error) {
      console.error("Error updating agency details:", error);
      res.status(500).json({ message: "Failed to update agency details" });
    }
  });

  app.delete('/api/admin/agencies/:id', adminAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAgency(parseInt(id));
      res.json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error("Error deleting agency:", error);
      res.status(500).json({ message: "Failed to delete agency" });
    }
  });

  // Payment history routes
  app.get('/api/admin/agencies/:id/payments', adminAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const payments = await storage.getPaymentHistory(parseInt(id));
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  app.post('/api/admin/agencies/:id/generate-bill', adminAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { period } = req.body;

      if (!period) {
        return res.status(400).json({ message: "Billing period is required" });
      }

      const bill = await storage.generateMonthlyBill(parseInt(id), period);
      res.json(bill);
    } catch (error) {
      console.error("Error generating bill:", error);
      res.status(500).json({ message: "Failed to generate bill" });
    }
  });

  app.patch('/api/admin/payments/:id/status', adminAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, paymentMethod, notes } = req.body;

      const paymentDate = status === 'paid' ? new Date() : undefined;
      const updatedPayment = await storage.updatePaymentStatus(
        parseInt(id), 
        status, 
        paymentMethod, 
        paymentDate, 
        notes
      );

      res.json(updatedPayment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Tax configuration routes
  app.get('/api/admin/tax-config', adminAuth, async (req: any, res) => {
    try {
      const taxConfig = await storage.getTaxConfig();
      res.json(taxConfig || { percentage: 18 });
    } catch (error) {
      console.error("Error fetching tax config:", error);
      res.status(500).json({ message: "Failed to fetch tax config" });
    }
  });

  app.patch('/api/admin/tax-config', adminAuth, async (req: any, res) => {
    try {
      const { percentage } = req.body;

      if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
        return res.status(400).json({ message: "Invalid tax percentage" });
      }

      const updatedConfig = await storage.updateTaxConfig(percentage);
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating tax config:", error);
      res.status(500).json({ message: "Failed to update tax config" });
    }
  });

  // Agency routes
  app.post('/api/agencies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agencyData = insertAgencySchema.parse({
        ...req.body,
        userId,
      });

      const agency = await storage.createAgency(agencyData);
      res.json(agency);
    } catch (error) {
      console.error("Error creating agency:", error);
      res.status(500).json({ message: "Failed to create agency" });
    }
  });

  app.get('/api/agencies/pending', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin (from admin credentials table)
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const pendingAgencies = await storage.getPendingAgencies();
      res.json(pendingAgencies);
    } catch (error) {
      console.error("Error fetching pending agencies:", error);
      res.status(500).json({ message: "Failed to fetch pending agencies" });
    }
  });

  app.get('/api/agencies', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin (from admin credentials table)
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const agencies = await storage.getAllAgencies();
      res.json(agencies);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      res.status(500).json({ message: "Failed to fetch agencies" });
    }
  });

  app.patch('/api/agencies/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin (from admin credentials table)
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const { id } = req.params;
      const { status } = req.body;

      const agency = await storage.updateAgencyStatus(parseInt(id), status);
      res.json(agency);
    } catch (error) {
      console.error("Error updating agency status:", error);
      res.status(500).json({ message: "Failed to update agency status" });
    }
  });

  app.delete('/api/agencies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      await storage.deleteAgency(parseInt(id));
      res.json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error("Error deleting agency:", error);
      res.status(500).json({ message: "Failed to delete agency" });
    }
  });

  app.patch('/api/agencies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const updates = req.body;

      const agency = await storage.updateAgency(parseInt(id), updates);
      res.json(agency);
    } catch (error) {
      console.error("Error updating agency:", error);
      res.status(500).json({ message: "Failed to update agency" });
    }
  });

  app.delete('/api/agencies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      await storage.deleteAgency(parseInt(id));
      res.json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error("Error deleting agency:", error);
      res.status(500).json({ message: "Failed to delete agency" });
    }
  });

  // Bus routes
  app.post('/api/buses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const agency = await storage.getAgencyByUserId(userId);

      if (!agency || agency.status !== 'approved') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const busData = {
        ...req.body,
        agencyId: agency.id,
      };

      const bus = await storage.createBus(busData);
      res.json(bus);
    } catch (error) {
      console.error("Error creating bus:", error);
      res.status(500).json({ message: "Failed to create bus" });
    }
  });

  app.get('/api/buses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const agency = await storage.getAgencyByUserId(userId);

      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const buses = await storage.getBusesByAgency(agency.id);
      res.json(buses);
    } catch (error) {
      console.error("Error fetching buses:", error);
      res.status(500).json({ message: "Failed to fetch buses" });
    }
  });

  app.patch('/api/buses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agency = await storage.getAgencyByUserId(userId);

      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const bus = await storage.getBus(parseInt(id));

      if (!bus || bus.agencyId !== agency.id) {
        return res.status(404).json({ message: "Bus not found" });
      }

      const updates = req.body;
      const updatedBus = await storage.updateBus(parseInt(id), updates);
      res.json(updatedBus);
    } catch (error) {
      console.error("Error updating bus:", error);
      res.status(500).json({ message: "Failed to update bus" });
    }
  });

  app.delete('/api/buses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agency = await storage.getAgencyByUserId(userId);

      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const bus = await storage.getBus(parseInt(id));

      if (!bus || bus.agencyId !== agency.id) {
        return res.status(404).json({ message: "Bus not found" });
      }

      await storage.deleteBus(parseInt(id));
      res.json({ message: "Bus deleted successfully" });
    } catch (error) {
      console.error("Error deleting bus:", error);
      res.status(500).json({ message: "Failed to delete bus" });
    }
  });

  // Traveler data routes
  app.post('/api/traveler-data/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const agency = await storage.getAgencyByUserId(userId);

      if (!agency || agency.status !== 'approved') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { busId, travelDate, couponCode } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!couponCode) {
        return res.status(400).json({ message: "Coupon code is required" });
      }

      const bus = await storage.getBus(parseInt(busId));
      if (!bus || bus.agencyId !== agency.id) {
        return res.status(404).json({ message: "Bus not found" });
      }

      // Parse CSV data (simplified - in real implementation, use a proper CSV parser)
      const csvData = file.buffer.toString('utf8');
      const lines = csvData.split('\n').filter((line: string) => line.trim());
      const headers = lines[0].split(',');

      const travelerDataList = lines.slice(1).map((line: string) => {
        const values = line.split(',');
        return {
          busId: parseInt(busId),
          agencyId: agency.id,
          travelerName: values[0]?.trim() || '',
          phone: values[1]?.trim() || '',
          travelDate: new Date(travelDate),
          couponCode: couponCode.trim(), // Use coupon code from form data
          whatsappStatus: 'pending' as const,
        };
      }).filter((data: any) => data.travelerName && data.phone);

      const insertedData = await storage.createTravelerData(travelerDataList);

      // Create upload history
      await storage.createUploadHistory({
        agencyId: agency.id,
        busId: parseInt(busId),
        fileName: file.originalname,
        travelerCount: insertedData.length,
        status: 'completed',
      });

      // Schedule WhatsApp messages for all uploaded travelers
      try {
        await whatsappService.scheduleMessagesForUpload(agency.id, parseInt(busId));
        console.log(`WhatsApp messages scheduled for ${insertedData.length} travelers`);
      } catch (error) {
        console.error("Error scheduling WhatsApp messages:", error);
      }

      res.json({ 
        message: "Data uploaded successfully", 
        count: insertedData.length,
        data: insertedData 
      });
    } catch (error) {
      console.error("Error uploading traveler data:", error);
      res.status(500).json({ message: "Failed to upload traveler data" });
    }
  });

  app.get('/api/traveler-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const agency = await storage.getAgencyByUserId(userId);

      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });      }

      const data = await storage.getTravelerDataByAgency(agency.id);
      res.json(data);
    } catch (error) {
      console.error("Error fetching traveler data:", error);
      res.status(500).json({ message: "Failed to fetch traveler data" });
    }
  });

  app.patch('/api/traveler-data/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const agency = await storage.getAgencyByUserId(userId);

      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const updates = req.body;

      const updatedData = await storage.updateTravelerData(parseInt(id), updates);
      res.json(updatedData);
    } catch (error) {
      console.error("Error updating traveler data:", error);
      res.status(500).json({ message: "Failed to update traveler data" });
    }
  });

  // Upload history routes
  app.get('/api/upload-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const agency = await storage.getAgencyByUserId(userId);

      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const history = await storage.getUploadHistoryByAgency(agency.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching upload history:", error);
      res.status(500).json({ message: "Failed to fetch upload history" });
    }
  });

  // Stats routes
  app.get('/api/stats/system', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  app.get('/api/stats/agency', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const agency = await storage.getAgencyByUserId(userId);

      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const stats = await storage.getAgencyStats(agency.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching agency stats:", error);
      res.status(500).json({ message: "Failed to fetch agency stats" });
    }
  });

  // Get specific agency details
  app.get('/api/admin/agencies/:id', adminAuth, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);

      const agency = await db
        .select({
          id: agencies.id,
          userId: agencies.userId,
          name: agencies.name,
          email: agencies.email,
          contactPerson: agencies.contactPerson,
          phone: agencies.phone,
          state: agencies.state,
          city: agencies.city,
          website: agencies.website,
          logoUrl: agencies.logoUrl,
          renewalChargePerBus: agencies.renewalChargePerBus,
          status: agencies.status,
          createdAt: agencies.createdAt,
        })
        .from(agencies)
        .where(eq(agencies.id, agencyId))
        .limit(1);

      if (agency.length === 0) {
        return res.status(404).json({ message: 'Agency not found' });
      }

      // Get total buses for this agency - using count function properly
      const busCountResult = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(buses)
        .where(eq(buses.agencyId, agencyId));

      const totalBuses = Number(busCountResult[0]?.count || 0);
      const renewalCharge = agency[0].renewalChargePerBus || 5000;
      const totalRenewalCharge = totalBuses * renewalCharge;

      console.log('Agency details debug:', {
        agencyId,
        busCountResult,
        totalBuses,
        renewalCharge,
        totalRenewalCharge
      });

      const result = {
        ...agency[0],
        totalBuses,
        totalRenewalCharge,
      };

      res.json(result);
    } catch (error) {
      console.error('Error fetching agency details:', error);
      res.status(500).json({ message: 'Failed to fetch agency details' });
    }
  });

  // Get agency buses
  app.get('/api/admin/agencies/:id/buses', adminAuth, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);

      const agencyBuses = await db.select({
        id: buses.id,
        registrationNumber: buses.registrationNumber,
        routeNumber: buses.routeNumber,
        capacity: buses.capacity,
        vehicleType: buses.vehicleType,
        isActive: buses.isActive,
        createdAt: buses.createdAt,
        updatedAt: buses.updatedAt
      })
        .from(buses)
        .where(eq(buses.agencyId, agencyId))
        .orderBy(buses.createdAt);

      res.json(agencyBuses);
    } catch (error) {
      console.error("Error fetching agency buses:", error);
      res.status(500).json({ message: "Failed to fetch agency buses" });
    }
  });

  // Get agency users/travelers
  app.get("/api/admin/agencies/:id/users", adminAuth, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);

      //select * from travelerData where agencyId = agencyId
      const agencyUsers = await db.select({
        id: agencies.id,
        userId: agencies.userId,
        name: agencies.name,
        email: agencies.email,
        contactPerson: agencies.contactPerson,
        phone: agencies.phone,
        state: agencies.state,
        city: agencies.city,
        website: agencies.website,
        logoUrl: agencies.logoUrl,
        renewalChargePerBus: agencies.renewalChargePerBus,
        status: agencies.status,
        createdAt: agencies.createdAt,
      })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      res.json(agencyUsers);
    } catch (error) {
      console.error("Error fetching agency users:", error);
      res.status(500).json({ message: "Failed to fetch agency users" });
    }
  });

  // Get agency statistics
  app.get('/api/admin/agencies/:id/stats', adminAuth, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);

      // Get total users/travelers
      const totalUsersResult = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      // Get total coupons
      const totalCouponsResult = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      // Get coupons used (assuming some field tracks usage)
      const couponsUsedResult = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      // Get messages sent
      const messagesSentResult = await db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      res.json({
        totalUsers: totalUsersResult[0]?.count || 0,
        totalCoupons: totalCouponsResult[0]?.count || 0,
        couponsUsed: couponsUsedResult[0]?.count || 0,
        messagesSent: messagesSentResult[0]?.count || 0
      });
    } catch (error) {
      console.error("Error fetching agency statistics:", error);
      res.status(500).json({ message: "Failed to fetch agency statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Dummy authentication middleware for admin-only routes
const requireAdminAuth = (req: any, res: any, next: any) => {
    console.log('Admin auth check - session:', req.session);
    console.log('Admin auth check - user:', req.session?.user);

    // First check if user is in session (admin login)
    if (req.session?.user) {
      if (req.session.user.role === 'super_admin') {
        req.user = req.session.user;
        next();
        return;
      }
    }

    // Fallback to global user (for immediate access)
    if (currentUser && currentUser.role === 'super_admin') {
      req.user = currentUser;
      next();
      return;
    }

    console.log('Admin authentication failed - no valid admin session');
    res.status(401).json({ message: "Admin authentication required" });
  };

// Dummy authentication middleware for admin-only routes
const requireAuth = (req: any, res: any, next: any) => {
    console.log('Admin auth check - session:', req.session);
    console.log('Admin auth check - user:', req.session?.user);

    // First check if user is in session (admin login)
    if (req.session?.user) {
        req.user = req.session.user;
        next();
        return;
    }

    // Fallback to global user (for immediate access)
    if (currentUser) {
      req.user = currentUser;
      next();
      return;
    }

    console.log(' authentication failed - no valid admin session');
    res.status(401).json({ message: " authentication required" });
  };