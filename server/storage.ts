import {
  users,
  agencies,
  buses,
  travelerData,
  uploadHistory,
  type User,
  type UpsertUser,
  type Agency,
  type InsertAgency,
  type Bus,
  type InsertBus,
  type TravelerData,
  type InsertTravelerData,
  type UploadHistory,
  type InsertUploadHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, ne } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  
  // Agency operations
  createAgency(agency: InsertAgency): Promise<Agency>;
  getAgency(id: number): Promise<Agency | undefined>;
  getAgencyByUserId(userId: string): Promise<Agency | undefined>;
  getAgencyByUsername(username: string): Promise<Agency | undefined>;
  getAgencyByCredentials(username: string, password: string): Promise<Agency | undefined>;
  getPendingAgencies(): Promise<Agency[]>;
  getApprovedAgencies(): Promise<Agency[]>;
  getAllAgencies(): Promise<Agency[]>;
  updateAgencyStatus(id: number, status: string): Promise<Agency>;
  updateAgency(id: number, updates: Partial<InsertAgency>): Promise<Agency>;
  deleteAgency(id: number): Promise<void>;
  getOrCreateAdminUser(): Promise<User>;
  
  // Bus operations
  createBus(bus: InsertBus): Promise<Bus>;
  getBus(id: number): Promise<Bus | undefined>;
  getBusesByAgency(agencyId: number): Promise<Bus[]>;
  updateBus(id: number, updates: Partial<InsertBus>): Promise<Bus>;
  deleteBus(id: number): Promise<void>;
  
  // Traveler data operations
  createTravelerData(data: InsertTravelerData[]): Promise<TravelerData[]>;
  getTravelerDataByAgency(agencyId: number): Promise<TravelerData[]>;
  getTravelerDataByBus(busId: number): Promise<TravelerData[]>;
  updateTravelerData(id: number, updates: Partial<InsertTravelerData>): Promise<TravelerData>;
  
  // Upload history operations
  createUploadHistory(history: InsertUploadHistory): Promise<UploadHistory>;
  getUploadHistoryByAgency(agencyId: number): Promise<UploadHistory[]>;
  
  // Stats operations
  getSystemStats(): Promise<{
    totalAgencies: number;
    totalBuses: number;
    totalMessages: number;
    totalCoupons: number;
  }>;
  getAgencyStats(agencyId: number): Promise<{
    totalBuses: number;
    totalMessages: number;
    totalCoupons: number;
    totalTravelers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createAgency(agency: InsertAgency): Promise<Agency> {
    const [newAgency] = await db
      .insert(agencies)
      .values(agency)
      .returning();
    return newAgency;
  }

  async getAgency(id: number): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.id, id));
    return agency;
  }

  async getAgencyByUserId(userId: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.userId, userId));
    return agency;
  }

  async getAgencyByUsername(username: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.username, username));
    return agency;
  }

  async getAgencyByCredentials(email: string, password: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(
      and(eq(agencies.email, email), eq(agencies.password, password))
    );
    return agency;
  }

  async getOrCreateAdminUser(): Promise<User> {
    const adminId = 'admin_user';
    let admin = await this.getUser(adminId);
    
    if (!admin) {
      admin = await this.upsertUser({
        id: adminId,
        email: 'admin@travelflow.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'super_admin'
      });
    }
    
    return admin;
  }

  async seedDummyData(): Promise<void> {
    try {
      // Force reseed of dummy data
      console.log("Clearing existing data and reseeding...");

      // Clear existing data in correct order to avoid foreign key constraints
      await db.delete(travelerData);
      await db.delete(uploadHistory);
      await db.delete(buses);
      await db.delete(agencies);
      await db.delete(users).where(ne(users.id, 'admin_user'));

      console.log("Seeding dummy data...");

      // Create agency users first
      const agencyUser1 = await this.upsertUser({
        id: "agency_user_1",
        email: "info@goldentours.com",
        firstName: "John",
        lastName: "Smith",
        role: "agency"
      });

      const agencyUser2 = await this.upsertUser({
        id: "agency_user_2",
        email: "contact@bluesky.com",
        firstName: "Sarah",
        lastName: "Johnson",
        role: "agency"
      });

      const agencyUser3 = await this.upsertUser({
        id: "agency_user_3",
        email: "info@mountainexpress.com",
        firstName: "Mike",
        lastName: "Wilson",
        role: "agency"
      });

      // Create more pending agency users for testing
      const agencyUser4 = await this.upsertUser({
        id: "agency_user_4",
        email: "info@citylines.com",
        firstName: "Anna",
        lastName: "Davis",
        role: "agency"
      });

      const agencyUser5 = await this.upsertUser({
        id: "agency_user_5",
        email: "contact@coastalcruise.com",
        firstName: "David",
        lastName: "Brown",
        role: "agency"
      });

      // Create dummy agencies
      const agency1 = await this.createAgency({
        name: "Golden Tours",
        username: "goldentours",
        password: "demo123",
        email: "info@goldentours.com",
        phone: "+1-555-0101",
        address: "123 Main St",
        state: "New York",
        city: "New York",
        website: "https://goldentours.com",
        contactPerson: "John Smith",
        licenseNumber: "NY-BUS-001",
        status: "approved",
        userId: "agency_user_1",
      });

      const agency2 = await this.createAgency({
        name: "Blue Sky Travel",
        username: "bluesky",
        password: "demo123",
        email: "contact@bluesky.com",
        phone: "+1-555-0102",
        address: "456 Oak Ave",
        state: "California",
        city: "Los Angeles",
        website: "https://blueskytravel.com",
        contactPerson: "Sarah Johnson",
        licenseNumber: "CA-BUS-002",
        status: "approved",
        userId: "agency_user_2",
      });

      const agency3 = await this.createAgency({
        name: "Mountain Express",
        username: "mountain",
        password: "demo123",
        email: "info@mountainexpress.com",
        phone: "+1-555-0103",
        address: "789 Pine Rd",
        state: "Colorado",
        city: "Denver",
        website: "https://mountainexpress.com",
        contactPerson: "Mike Wilson",
        licenseNumber: "CO-BUS-003",
        status: "pending",
        userId: "agency_user_3",
      });

      const agency4 = await this.createAgency({
        name: "City Lines Transport",
        username: "citylines",
        password: "demo123",
        email: "info@citylines.com",
        phone: "+1-555-0104",
        address: "321 Business Blvd",
        state: "Illinois",
        city: "Chicago",
        website: "https://citylines.com",
        contactPerson: "Anna Davis",
        licenseNumber: "IL-BUS-004",
        status: "pending",
        userId: "agency_user_4",
      });

      const agency5 = await this.createAgency({
        name: "Coastal Cruise Lines",
        username: "coastal",
        password: "demo123",
        email: "contact@coastalcruise.com",
        phone: "+1-555-0105",
        address: "654 Ocean Dr",
        state: "Florida",
        city: "Miami",
        website: "https://coastalcruise.com",
        contactPerson: "David Brown",
        licenseNumber: "FL-BUS-005",
        status: "pending",
        userId: "agency_user_5",
      });

      // Create dummy buses
      await this.createBus({
        agencyId: agency1.id,
        number: "GE-001",
        name: "Golden Express 1",
        fromLocation: "New York",
        toLocation: "Boston",
        departureTime: "08:00",
        arrivalTime: "12:00",
        busType: "AC Seater",
        capacity: 45,
        fare: "75",
        amenities: ["WiFi", "AC", "USB Charging", "Reclining Seats"],
        isActive: true,
      });

      await this.createBus({
        agencyId: agency1.id,
        number: "GE-002",
        name: "Golden Express 2",
        fromLocation: "New York",
        toLocation: "Philadelphia",
        departureTime: "14:00",
        arrivalTime: "17:00",
        busType: "AC Seater",
        capacity: 50,
        fare: "55",
        amenities: ["WiFi", "AC", "Entertainment System"],
        isActive: true,
      });

      await this.createBus({
        agencyId: agency2.id,
        number: "BS-001",
        name: "Blue Sky Cruiser",
        fromLocation: "Los Angeles",
        toLocation: "San Francisco",
        departureTime: "06:00",
        arrivalTime: "14:00",
        busType: "AC Sleeper",
        capacity: 55,
        fare: "95",
        amenities: ["WiFi", "AC", "Meals", "Entertainment"],
        isActive: true,
      });

      // Create dummy traveler data
      const bus1 = await this.getBusesByAgency(agency1.id);
      const bus2 = await this.getBusesByAgency(agency2.id);

      if (bus1.length > 0) {
        await this.createTravelerData([
          {
            agencyId: agency1.id,
            busId: bus1[0].id,
            travelerName: "Alice Johnson",
            phone: "+1-555-1001",
            travelDate: new Date("2025-07-25"),
            whatsappStatus: "sent",
            couponCode: "SAVE10",
          },
          {
            agencyId: agency1.id,
            busId: bus1[0].id,
            travelerName: "Bob Smith",
            phone: "+1-555-1002",
            travelDate: new Date("2025-07-25"),
            whatsappStatus: "sent",
            couponCode: "WELCOME15",
          },
        ]);
      }

      if (bus2.length > 0) {
        await this.createTravelerData([
          {
            agencyId: agency2.id,
            busId: bus2[0].id,
            travelerName: "Carol Brown",
            phone: "+1-555-2001",
            travelDate: new Date("2025-07-26"),
            whatsappStatus: "pending",
            couponCode: "FAMILY20",
          },
        ]);
      }

      console.log("Dummy data seeded successfully!");
      console.log("=== LOGIN CREDENTIALS ===");
      console.log("Admin Login:");
      console.log("  Username: admin");
      console.log("  Password: admin123");
      console.log("");
      console.log("Travel Agency Logins:");
      console.log("  Golden Tours (Approved):");
      console.log("    Username: goldentours");
      console.log("    Password: demo123");
      console.log("  Blue Sky Travel (Approved):");
      console.log("    Username: bluesky");
      console.log("    Password: demo123");
      console.log("  Mountain Express (Pending):");
      console.log("    Username: mountain");
      console.log("    Password: demo123");
      console.log("  City Lines Transport (Pending):");
      console.log("    Username: citylines");
      console.log("    Password: demo123");
      console.log("  Coastal Cruise Lines (Pending):");
      console.log("    Username: coastal");
      console.log("    Password: demo123");
      console.log("========================");
    } catch (error) {
      console.error("Error seeding dummy data:", error);
    }
  }

  async getPendingAgencies(): Promise<Agency[]> {
    try {
      console.log("Fetching pending agencies from database...");
      const result = await db.select().from(agencies).where(eq(agencies.status, "pending"));
      console.log("Database result:", result);
      return result;
    } catch (error) {
      console.error("Database error in getPendingAgencies:", error);
      throw error;
    }
  }

  async getApprovedAgencies(): Promise<Agency[]> {
    return await db.select().from(agencies).where(eq(agencies.status, "approved"));
  }

  async getAllAgencies(): Promise<Agency[]> {
    return await db.select().from(agencies).orderBy(desc(agencies.createdAt));
  }

  async updateAgencyStatus(id: number, status: string): Promise<Agency> {
    const [agency] = await db
      .update(agencies)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(agencies.id, id))
      .returning();
    return agency;
  }

  async updateAgency(id: number, updates: Partial<InsertAgency>): Promise<Agency> {
    const [agency] = await db
      .update(agencies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agencies.id, id))
      .returning();
    return agency;
  }

  async deleteAgency(id: number): Promise<void> {
    await db.delete(agencies).where(eq(agencies.id, id));
  }

  async createBus(bus: InsertBus): Promise<Bus> {
    const [newBus] = await db
      .insert(buses)
      .values(bus)
      .returning();
    return newBus;
  }

  async getBus(id: number): Promise<Bus | undefined> {
    const [bus] = await db.select().from(buses).where(eq(buses.id, id));
    return bus;
  }

  async getBusesByAgency(agencyId: number): Promise<Bus[]> {
    return await db.select().from(buses).where(eq(buses.agencyId, agencyId));
  }

  async updateBus(id: number, updates: Partial<InsertBus>): Promise<Bus> {
    const [bus] = await db
      .update(buses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(buses.id, id))
      .returning();
    return bus;
  }

  async deleteBus(id: number): Promise<void> {
    await db.delete(buses).where(eq(buses.id, id));
  }

  async createTravelerData(data: InsertTravelerData[]): Promise<TravelerData[]> {
    return await db
      .insert(travelerData)
      .values(data)
      .returning();
  }

  async getTravelerDataByAgency(agencyId: number): Promise<TravelerData[]> {
    return await db
      .select()
      .from(travelerData)
      .where(eq(travelerData.agencyId, agencyId))
      .orderBy(desc(travelerData.createdAt));
  }

  async getTravelerDataByBus(busId: number): Promise<TravelerData[]> {
    return await db
      .select()
      .from(travelerData)
      .where(eq(travelerData.busId, busId))
      .orderBy(desc(travelerData.createdAt));
  }

  async updateTravelerData(id: number, updates: Partial<InsertTravelerData>): Promise<TravelerData> {
    const [data] = await db
      .update(travelerData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(travelerData.id, id))
      .returning();
    return data;
  }

  async createUploadHistory(history: InsertUploadHistory): Promise<UploadHistory> {
    const [newHistory] = await db
      .insert(uploadHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getUploadHistoryByAgency(agencyId: number): Promise<UploadHistory[]> {
    return await db
      .select()
      .from(uploadHistory)
      .where(eq(uploadHistory.agencyId, agencyId))
      .orderBy(desc(uploadHistory.createdAt));
  }

  async getSystemStats(): Promise<{
    totalAgencies: number;
    totalBuses: number;
    totalMessages: number;
    totalCoupons: number;
  }> {
    const [agencyCount] = await db
      .select({ count: count() })
      .from(agencies)
      .where(eq(agencies.status, "approved"));

    const [busCount] = await db
      .select({ count: count() })
      .from(buses);

    const [messageCount] = await db
      .select({ count: count() })
      .from(travelerData)
      .where(eq(travelerData.whatsappStatus, "sent"));

    const [couponCount] = await db
      .select({ count: count() })
      .from(travelerData);

    return {
      totalAgencies: agencyCount?.count || 0,
      totalBuses: busCount?.count || 0,
      totalMessages: messageCount?.count || 0,
      totalCoupons: couponCount?.count || 0,
    };
  }

  async getAgencyStats(agencyId: number): Promise<{
    totalBuses: number;
    totalMessages: number;
    totalCoupons: number;
    totalTravelers: number;
  }> {
    const [busCount] = await db
      .select({ count: count() })
      .from(buses)
      .where(eq(buses.agencyId, agencyId));

    const [messageCount] = await db
      .select({ count: count() })
      .from(travelerData)
      .where(and(
        eq(travelerData.agencyId, agencyId),
        eq(travelerData.whatsappStatus, "sent")
      ));

    const [couponCount] = await db
      .select({ count: count() })
      .from(travelerData)
      .where(eq(travelerData.agencyId, agencyId));

    const [travelerCount] = await db
      .select({ count: count() })
      .from(travelerData)
      .where(eq(travelerData.agencyId, agencyId));

    return {
      totalBuses: busCount?.count || 0,
      totalMessages: messageCount?.count || 0,
      totalCoupons: couponCount?.count || 0,
      totalTravelers: travelerCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
