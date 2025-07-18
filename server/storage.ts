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
import { eq, and, desc, count, sql } from "drizzle-orm";

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

  async getAgencyByCredentials(username: string, password: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(
      and(eq(agencies.username, username), eq(agencies.password, password))
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
      // Check if dummy data already exists
      const existingAgencies = await this.getAllAgencies();
      if (existingAgencies.length > 0) {
        console.log("Dummy data already exists, skipping seed");
        return;
      }

      console.log("Seeding dummy data...");

      // Create dummy agencies
      const agency1 = await this.createAgency({
        name: "Golden Tours",
        username: "goldentours",
        password: "demo123",
        email: "info@goldentours.com",
        phone: "+1-555-0101",
        address: "123 Main St, New York, NY 10001",
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
        address: "456 Oak Ave, Los Angeles, CA 90001",
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
        address: "789 Pine Rd, Denver, CO 80001",
        contactPerson: "Mike Davis",
        licenseNumber: "CO-BUS-003",
        status: "pending",
        userId: "agency_user_3",
      });

      // Create dummy buses
      await this.createBus({
        agencyId: agency1.id,
        busName: "Golden Express 1",
        busNumber: "GE-001",
        route: "New York to Boston",
        departureTime: "08:00",
        arrivalTime: "12:00",
        capacity: 45,
        fare: 75.00,
        amenities: ["WiFi", "AC", "USB Charging", "Reclining Seats"],
        isActive: true,
      });

      await this.createBus({
        agencyId: agency1.id,
        busName: "Golden Express 2",
        busNumber: "GE-002",
        route: "New York to Philadelphia",
        departureTime: "14:00",
        arrivalTime: "17:00",
        capacity: 50,
        fare: 55.00,
        amenities: ["WiFi", "AC", "Entertainment System"],
        isActive: true,
      });

      await this.createBus({
        agencyId: agency2.id,
        busName: "Blue Sky Cruiser",
        busNumber: "BS-001",
        route: "Los Angeles to San Francisco",
        departureTime: "06:00",
        arrivalTime: "14:00",
        capacity: 55,
        fare: 95.00,
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
            passengerName: "Alice Johnson",
            phoneNumber: "+1-555-1001",
            email: "alice.johnson@email.com",
            seatNumber: "A1",
            ticketNumber: "TK-001",
            journeyDate: new Date("2024-01-20"),
            whatsappStatus: "sent",
            couponCode: "SAVE10",
            discount: 10.00,
          },
          {
            agencyId: agency1.id,
            busId: bus1[0].id,
            passengerName: "Bob Smith",
            phoneNumber: "+1-555-1002",
            email: "bob.smith@email.com",
            seatNumber: "B2",
            ticketNumber: "TK-002",
            journeyDate: new Date("2024-01-20"),
            whatsappStatus: "sent",
            couponCode: "WELCOME15",
            discount: 15.00,
          },
        ]);
      }

      if (bus2.length > 0) {
        await this.createTravelerData([
          {
            agencyId: agency2.id,
            busId: bus2[0].id,
            passengerName: "Carol Brown",
            phoneNumber: "+1-555-2001",
            email: "carol.brown@email.com",
            seatNumber: "C3",
            ticketNumber: "TK-003",
            journeyDate: new Date("2024-01-21"),
            whatsappStatus: "pending",
            couponCode: "FAMILY20",
            discount: 20.00,
          },
        ]);
      }

      console.log("Dummy data seeded successfully!");
    } catch (error) {
      console.error("Error seeding dummy data:", error);
    }
  }

  async getPendingAgencies(): Promise<Agency[]> {
    return await db.select().from(agencies).where(eq(agencies.status, "pending"));
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
