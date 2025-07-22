import {
  users,
  agencies,
  buses,
  travelerData,
  uploadHistory,
  adminCredentials,
  whatsappConfig,
  whatsappTemplates,
  whatsappQueue,
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
  type AdminCredentials,
  type InsertAdminCredentials,
  type WhatsappConfig,
  type InsertWhatsappConfig,
  type WhatsappTemplate,
  type InsertWhatsappTemplate,
  type WhatsappQueue,
  type InsertWhatsappQueue,
  paymentHistory,
  taxConfig,
  type PaymentHistory,
  type InsertPaymentHistory,
  type TaxConfig,
  type InsertTaxConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;

  // Admin operations
  createAdminCredentials(admin: InsertAdminCredentials): Promise<AdminCredentials>;
  getAdminCredentials(email: string, password: string): Promise<AdminCredentials | undefined>;
  updateAdminCredentials(id: string, updates: Partial<InsertAdminCredentials>): Promise<AdminCredentials>;

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

  // Bus operations
  createBus(bus: InsertBus): Promise<Bus>;
  getBus(id: number): Promise<Bus | undefined>;
  getBusesByAgency(agencyId: number): Promise<Bus[]>;
  updateBus(id: number, updates: Partial<InsertBus>): Promise<Bus>;
  deleteBus(id: number): Promise<void>;

  // Traveler data operations
  createTravelerData(data: InsertTravelerData[]): Promise<TravelerData[]>;
  getTravelerData(id: number): Promise<TravelerData | undefined>;
  getTravelerDataByAgency(agencyId: number): Promise<TravelerData[]>;
  getTravelerDataByBus(busId: number): Promise<TravelerData[]>;
  updateTravelerData(id: number, updates: Partial<InsertTravelerData>): Promise<TravelerData>;

  // WhatsApp opt-out operations
  optOutTravelerFromWhatsapp(phoneNumber: string): Promise<TravelerData[]>;
  getTravelerByPhone(phoneNumber: string): Promise<TravelerData | undefined>;

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

  // WhatsApp operations
  getWhatsappConfig(): Promise<WhatsappConfig | undefined>;
  createWhatsappConfig(config: InsertWhatsappConfig): Promise<WhatsappConfig>;
  updateWhatsappConfig(id: number, config: Partial<InsertWhatsappConfig>): Promise<WhatsappConfig>;

  getWhatsappTemplates(): Promise<WhatsappTemplate[]>;
  createWhatsappTemplate(template: InsertWhatsappTemplate): Promise<WhatsappTemplate>;
  updateWhatsappTemplate(id: number, template: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate>;
  deleteWhatsappTemplate(id: number): Promise<void>;

  getWhatsappQueue(): Promise<WhatsappQueue[]>;
  createWhatsappQueue(queue: InsertWhatsappQueue): Promise<WhatsappQueue>;
  updateWhatsappQueueStatus(id: number, status: string): Promise<WhatsappQueue>;

  getWhatsappQueueStats(): Promise<{
    totalMessages: number;
    pendingMessages: number;
    sentMessages: number;
    failedMessages: number;
  }>;

  // Payment history operations
  getPaymentHistory(agencyId: number): Promise<PaymentHistory[]>;
  createPaymentRecord(payment: InsertPaymentHistory): Promise<PaymentHistory>;
  updatePaymentStatus(id: number, status: string, paymentMethod?: string, paymentDate?: Date, notes?: string): Promise<PaymentHistory>;
  generateMonthlyBill(agencyId: number, period: string): Promise<PaymentHistory>;

  // Tax configuration operations
  getTaxConfig(): Promise<TaxConfig | undefined>;
  updateTaxConfig(percentage: number): Promise<TaxConfig>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async getAgencyWithDetails(id: number): Promise<any> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.id, id));
    if (!agency) return undefined;

    const busCount = await db
      .select({ count: count() })
      .from(buses)
      .where(eq(buses.agencyId, id));

    const totalRenewalCharge = (busCount[0]?.count || 0) * (agency.renewalChargePerBus || 5000);

    return {
      ...agency,
      totalBuses: busCount[0]?.count || 0,
      totalRenewalCharge,
    };
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

  // Admin operations
  async createAdminCredentials(admin: InsertAdminCredentials): Promise<AdminCredentials> {
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const [credentials] = await db
      .insert(adminCredentials)
      .values({
        ...admin,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return credentials;
  }

  async getAdminCredentials(email: string, password: string): Promise<AdminCredentials | undefined> {
    const [credentials] = await db
      .select()
      .from(adminCredentials)
      .where(eq(adminCredentials.email, email))
      .limit(1);

    if (!credentials) {
      return undefined;
    }

    // Use bcrypt to verify password
    const isValidPassword = await bcrypt.compare(password, credentials.password);
    if (isValidPassword) {
      return credentials;
    }

    return undefined;
  }

  async updateAdminCredentials(id: string, updates: Partial<InsertAdminCredentials>): Promise<AdminCredentials> {
    const [credentials] = await db
      .update(adminCredentials)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(adminCredentials.id, id))
      .returning();
    return credentials;
  }

  // Dummy data seeding removed - system now uses only live data

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

  async getTravelerData(id: number): Promise<TravelerData | undefined> {
    const [traveler] = await db.select().from(travelerData).where(eq(travelerData.id, id));
    return traveler;
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

  // WhatsApp opt-out operations
  async optOutTravelerFromWhatsapp(phoneNumber: string): Promise<TravelerData[]> {
    return await db
      .update(travelerData)
      .set({ 
        whatsappOptOut: true, 
        optOutDate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(travelerData.phone, phoneNumber))
      .returning();
  }

  async getTravelerByPhone(phoneNumber: string): Promise<TravelerData | undefined> {
    const [traveler] = await db
      .select()
      .from(travelerData)
      .where(eq(travelerData.phone, phoneNumber));
    return traveler;
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

  // WhatsApp operations
  async getWhatsappConfig(): Promise<WhatsappConfig | undefined> {
    const [config] = await db.select().from(whatsappConfig).limit(1);
    return config;
  }

  async createWhatsappConfig(config: InsertWhatsappConfig): Promise<WhatsappConfig> {
    const [newConfig] = await db.insert(whatsappConfig).values(config).returning();
    return newConfig;
  }

  async updateWhatsappConfig(id: number, config: Partial<InsertWhatsappConfig>): Promise<WhatsappConfig> {
    const [updatedConfig] = await db
      .update(whatsappConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(whatsappConfig.id, id))
      .returning();
    return updatedConfig;
  }

  async getWhatsappTemplates(): Promise<WhatsappTemplate[]> {
    return await db.select().from(whatsappTemplates).orderBy(whatsappTemplates.dayTrigger);
  }

  async createWhatsappTemplate(template: InsertWhatsappTemplate): Promise<WhatsappTemplate> {
    const [newTemplate] = await db.insert(whatsappTemplates).values(template).returning();
    return newTemplate;
  }

  async updateWhatsappTemplate(id: number, template: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate> {
    const [updatedTemplate] = await db
      .update(whatsappTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(whatsappTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteWhatsappTemplate(id: number): Promise<void> {
    await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
  }

  async getWhatsappQueue(): Promise<WhatsappQueue[]> {
    return await db.select().from(whatsappQueue).orderBy(desc(whatsappQueue.createdAt));
  }

  async createWhatsappQueue(queue: InsertWhatsappQueue): Promise<WhatsappQueue> {
    const [newQueue] = await db.insert(whatsappQueue).values(queue).returning();
    return newQueue;
  }

  async updateWhatsappQueueStatus(id: number, status: string): Promise<WhatsappQueue> {
    const [updatedQueue] = await db
      .update(whatsappQueue)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(whatsappQueue.id, id))
      .returning();
    return updatedQueue;
  }

  async getWhatsappQueueStats(): Promise<{
    totalMessages: number;
    pendingMessages: number;
    sentMessages: number;
    failedMessages: number;
  }> {
    const [stats] = await db
      .select({
        totalMessages: count(),
        pendingMessages: count(sql`case when status = 'pending' then 1 end`),
        sentMessages: count(sql`case when status = 'sent' then 1 end`),
        failedMessages: count(sql`case when status = 'failed' then 1 end`),
      })
      .from(whatsappQueue);

    return {
      totalMessages: stats.totalMessages,
      pendingMessages: stats.pendingMessages,
      sentMessages: stats.sentMessages,
      failedMessages: stats.failedMessages,
    };
  }

  // Payment history operations
  async getPaymentHistory(agencyId: number): Promise<PaymentHistory[]> {
    return await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.agencyId, agencyId))
      .orderBy(desc(paymentHistory.createdAt));
  }

  async createPaymentRecord(payment: InsertPaymentHistory): Promise<PaymentHistory> {
    const [newPayment] = await db.insert(paymentHistory).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(
    id: number, 
    status: string, 
    paymentMethod?: string, 
    paymentDate?: Date, 
    notes?: string
  ): Promise<PaymentHistory> {
    const updateData: any = { 
      paymentStatus: status as any, 
      updatedAt: new Date() 
    };

    if (paymentMethod) updateData.paymentMethod = paymentMethod as any;
    if (paymentDate) updateData.paymentDate = paymentDate;
    if (notes) updateData.notes = notes;

    const [updatedPayment] = await db
      .update(paymentHistory)
      .set(updateData)
      .where(eq(paymentHistory.id, id))
      .returning();
    return updatedPayment;
  }

  async generateMonthlyBill(agencyId: number, period: string): Promise<PaymentHistory> {
    // Get agency details and current bus count
    const agency = await this.getAgency(agencyId);
    if (!agency) throw new Error("Agency not found");

    const [busCount] = await db
      .select({ count: count() })
      .from(buses)
      .where(eq(buses.agencyId, agencyId));

    const totalBuses = busCount?.count || 0;
    const chargePerBus = agency.renewalChargePerBus || 5000;
    const subtotal = totalBuses * chargePerBus;

    // Get current tax rate
    const taxConfig = await this.getTaxConfig();
    const taxPercentage = taxConfig?.percentage || 18;
    const taxAmount = Math.round((subtotal * taxPercentage) / 100);
    const totalAmount = subtotal + taxAmount;

    // Generate unique bill ID
    const billId = `BILL-${agencyId}-${Date.now()}`;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const paymentRecord: InsertPaymentHistory = {
      agencyId,
      billId,
      billingPeriod: period,
      totalBuses,
      chargePerBus,
      subtotal,
      taxPercentage,
      taxAmount,
      totalAmount,
      paymentStatus: "pending",
      dueDate,
    };

    return await this.createPaymentRecord(paymentRecord);
  }

  // Tax configuration operations
  async getTaxConfig(): Promise<TaxConfig | undefined> {
    const [config] = await db
      .select()
      .from(taxConfig)
      .where(eq(taxConfig.isActive, true))
      .limit(1);
    return config;
  }

  async updateTaxConfig(percentage: number): Promise<TaxConfig> {
    // First, deactivate all existing configs
    await db
      .update(taxConfig)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(taxConfig.isActive, true));

    // Create new active config
    const [newConfig] = await db
      .insert(taxConfig)
      .values({
        name: "GST",
        percentage,
        isActive: true,
      })
      .returning();

    return newConfig;
  }
}

export const storage = new DatabaseStorage();