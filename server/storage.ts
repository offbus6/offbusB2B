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
  
  // Agency operations
  createAgency(agency: InsertAgency): Promise<Agency>;
  getAgency(id: number): Promise<Agency | undefined>;
  getAgencyByUserId(userId: string): Promise<Agency | undefined>;
  getPendingAgencies(): Promise<Agency[]>;
  getApprovedAgencies(): Promise<Agency[]>;
  getAllAgencies(): Promise<Agency[]>;
  updateAgencyStatus(id: number, status: string): Promise<Agency>;
  updateAgency(id: number, updates: Partial<InsertAgency>): Promise<Agency>;
  deleteAgency(id: number): Promise<void>;
  
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
