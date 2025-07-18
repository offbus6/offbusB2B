import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAgencySchema, insertBusSchema, insertTravelerDataSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has an agency
      const agency = await storage.getAgencyByUserId(userId);
      
      res.json({
        ...user,
        agency: agency || null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const agencies = await storage.getPendingAgencies();
      res.json(agencies);
    } catch (error) {
      console.error("Error fetching pending agencies:", error);
      res.status(500).json({ message: "Failed to fetch pending agencies" });
    }
  });

  app.get('/api/agencies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
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
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
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
      const userId = req.user.claims.sub;
      const agency = await storage.getAgencyByUserId(userId);
      
      if (!agency || agency.status !== 'approved') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const busData = insertBusSchema.parse({
        ...req.body,
        agencyId: agency.id,
      });

      const bus = await storage.createBus(busData);
      res.json(bus);
    } catch (error) {
      console.error("Error creating bus:", error);
      res.status(500).json({ message: "Failed to create bus" });
    }
  });

  app.get('/api/buses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agency = await storage.getAgencyByUserId(userId);
      
      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });
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
      const userId = req.user.claims.sub;
      const agency = await storage.getAgencyByUserId(userId);
      
      if (!agency || agency.status !== 'approved') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { busId, travelDate } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
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
          couponCode: values[3]?.trim() || '',
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
      const userId = req.user.claims.sub;
      const agency = await storage.getAgencyByUserId(userId);
      
      if (!agency) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const data = await storage.getTravelerDataByAgency(agency.id);
      res.json(data);
    } catch (error) {
      console.error("Error fetching traveler data:", error);
      res.status(500).json({ message: "Failed to fetch traveler data" });
    }
  });

  app.patch('/api/traveler-data/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const user = await storage.getUser(req.user.claims.sub);
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
