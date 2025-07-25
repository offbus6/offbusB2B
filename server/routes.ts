import { Express, Request, Response } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import multer from "multer";
import XLSX from "xlsx";
import { z } from "zod";
import { insertAgencySchema, insertBusSchema, insertTravelerDataSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export function registerRoutes(app: Express) {
  // Auth routes
  app.post("/api/auth/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const admin = await storage.getAdminCredentials(email, password);
      if (!admin) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req.session as any).user = {
        id: admin.id,
        email: admin.email,
        role: "super_admin"
      };

      res.json({ 
        message: "Login successful",
        user: {
          id: admin.id,
          email: admin.email,
          role: "super_admin"
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/agency/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const agency = await storage.getAgencyByCredentials(email, password);
      if (!agency) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req.session as any).user = {
        id: agency.id,
        email: agency.email,
        role: "agency",
        status: agency.status
      };

      res.json({ 
        message: "Login successful",
        user: {
          id: agency.id,
          email: agency.email,
          role: "agency",
          status: agency.status
        }
      });
    } catch (error) {
      console.error("Agency login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/agency/signup", async (req: Request, res: Response) => {
    try {
      const data = insertAgencySchema.parse(req.body);
      
      // Check if email already exists
      const existingAgency = await storage.getAgencyByEmail(data.email);
      if (existingAgency) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password!, 10);
      
      const agency = await storage.createAgency({
        ...data,
        password: hashedPassword
      });

      res.status(201).json({ 
        message: "Agency registered successfully",
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
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Initial admin setup route - only works if no admin exists
  app.post("/api/auth/admin/setup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if any admin already exists
      const adminExists = await storage.checkAdminExists();
      if (adminExists) {
        return res.status(400).json({ message: "Admin account already exists" });
      }

      // Create the first admin
      const admin = await storage.createAdminCredentials({
        email,
        password,
        name: "Super Admin"
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
      res.status(500).json({ message: "Internal server error" });
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

  // Add alias for backwards compatibility
  app.get("/api/auth/user", (req: Request, res: Response) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
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

      const data = insertBusSchema.parse({
        ...req.body,
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
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const updates = req.body;

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
      if (!user || user.role !== "agency") {
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

  app.post("/api/traveler-data/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || user.role !== "agency") {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { busId } = req.body;
      if (!busId) {
        return res.status(400).json({ message: "Bus ID is required" });
      }

      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform and validate data
      const travelerDataArray = jsonData.map((row: any) => ({
        busId: parseInt(busId),
        agencyId: user.id,
        travelerName: row["Traveler Name"] || row["travelerName"] || "",
        phone: row["Phone"] || row["phone"] || "",
        travelDate: new Date(row["Travel Date"] || row["travelDate"]),
        couponCode: row["Coupon Code"] || row["couponCode"] || ""
      }));

      // Validate each record
      const validatedData = travelerDataArray.map(data => 
        insertTravelerDataSchema.parse(data)
      );

      // Save to database
      const createdData = await storage.createTravelerData(validatedData);

      // Create upload history record
      await storage.createUploadHistory({
        agencyId: user.id,
        busId: parseInt(busId),
        fileName: req.file.originalname,
        travelerCount: createdData.length,
        status: "completed"
      });

      res.status(201).json({
        message: "Data uploaded successfully",
        count: createdData.length,
        data: createdData
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

  return app;
}