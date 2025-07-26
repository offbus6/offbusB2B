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
import crypto from "crypto";
import validator from "validator";
import rateLimit from "express-rate-limit";

// Input sanitization helper
function sanitizeInput(input: string): string {
  if (!input) return "";
  return validator.escape(input.trim());
}

// Email validation helper
function validateEmail(email: string): boolean {
  return validator.isEmail(email) && email.length <= 254;
}

// Password strength validation
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;

  // Admin operations
  createAdminCredentials(admin: InsertAdminCredentials): Promise<AdminCredentials>;
  getAdminCredentials(email: string, password: string): Promise<AdminCredentials | undefined>;
  updateAdminCredentials(id: number, updates: Partial<InsertAdminCredentials>): Promise<AdminCredentials>;
  checkAdminExists(): Promise<boolean>;

  // Agency operations
  createAgency(agency: InsertAgency): Promise<Agency>;
  getAgency(id: number): Promise<Agency | undefined>;
  getAgencyByUserId(userId: string): Promise<Agency | undefined>;
  getAgencyByUsername(username: string): Promise<Agency | undefined>;
  getAgencyByEmail(email: string): Promise<Agency | undefined>;
  getAgencyByCredentials(username: string, password: string): Promise<Agency | undefined>;
  getPendingAgencies(): Promise<Agency[]>;
  getApprovedAgencies(): Promise<Agency[]>;
  getAllAgencies(): Promise<Agency[]>;
  updateAgencyStatus(id: number, status: string): Promise<Agency>;
  updateAgency(id: number, updates: Partial<InsertAgency>): Promise<Agency>;
  deleteAgency(id: number): Promise<void>;
  getAgencyById(id: number): Promise<Agency | null>;

  // Bus operations
  createBus(bus: InsertBus): Promise<Bus>;
  getBus(id: number): Promise<Bus | undefined>;
  getBusesByAgency(agencyId: number): Promise<Bus[]>;
  getAllBuses(): Promise<Bus[]>;
  updateBus(id: number, updates: Partial<InsertBus>): Promise<Bus>;
  deleteBus(id: number): Promise<void>;

  // Traveler data operations
  createTravelerData(data: InsertTravelerData[]): Promise<TravelerData[]>;
  getTravelerData(id: number): Promise<TravelerData | undefined>;
  getTravelerDataByAgency(agencyId: number): Promise<TravelerData[]>;
  getAllTravelerData(): Promise<TravelerData[]>;
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
  getAdminStats(): Promise<{
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

    // Notification-related operations
  getOverduePayments(): Promise<any[]>;
  getPaymentReminders(agencyId: number): Promise<any[]>;
  getRenewalAlerts(agencyId: number): Promise<any[]>;

    // Payment management operations
  getAllPayments(): Promise<any[]>;
  getPaymentStats(): Promise<{
    totalRevenue: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
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
    // Validate required fields
    if (!validateEmail(agency.email)) {
      throw new Error("Invalid email format");
    }

    if (agency.password) {
      const passwordValidation = validatePassword(agency.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(", ")}`);
      }
    }

    // Sanitize inputs
    const sanitizedData = {
      ...agency,
      name: sanitizeInput(agency.name),
      email: validator.normalizeEmail(agency.email) || agency.email,
      contactPerson: sanitizeInput(agency.contactPerson),
      phone: sanitizeInput(agency.phone),
      state: agency.state ? sanitizeInput(agency.state) : null,
      city: sanitizeInput(agency.city),
      website: agency.website ? validator.isURL(agency.website) ? agency.website : null : null,
      password: agency.password ? await bcrypt.hash(agency.password, 12) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newAgency] = await db
      .insert(agencies)
      .values(sanitizedData)
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

  async getAgencyByEmail(email: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.email, email));
    return agency;
  }

  async getAgencyByCredentials(email: string, password: string): Promise<Agency | undefined> {
    try {
      // Input validation
      if (!validateEmail(email) || !password) {
        // Still perform hash operation to prevent timing attacks
        await bcrypt.compare("dummy", "$2b$12$dummy.hash.to.prevent.timing.attacks");
        return undefined;
      }

      const sanitizedEmail = validator.normalizeEmail(email) || email;
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.email, sanitizedEmail))
        .limit(1);

      // Always perform hash comparison to prevent timing attacks
      const isValidPassword = (agency && agency.password)
        ? await bcrypt.compare(password, agency.password)
        : await bcrypt.compare(password, "$2b$12$dummy.hash.to.prevent.timing.attacks");

      if (!agency || !agency.password || !isValidPassword) {
        return undefined;
      }

      return agency;
    } catch (error) {
      console.error("Agency authentication error:", error);
      // Still perform dummy hash to maintain consistent timing
      await bcrypt.compare("dummy", "$2b$12$dummy.hash.to.prevent.timing.attacks");
      return undefined;
    }
  }

  // Admin operations
  async createAdminCredentials(admin: { email: string; password: string; name?: string }): Promise<AdminCredentials> {
    // Validate email
    if (!validateEmail(admin.email)) {
      throw new Error("Invalid email format");
    }

    // Validate password strength
    const passwordValidation = validatePassword(admin.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(", ")}`);
    }

    // Sanitize inputs
    const sanitizedEmail = validator.normalizeEmail(admin.email) || admin.email;
    const sanitizedName = sanitizeInput(admin.name || "Admin");

    // Hash password with higher cost factor for admin accounts
    const passwordToStore = await bcrypt.hash(admin.password, 12);

    const [credentials] = await db
      .insert(adminCredentials)
      .values({
        email: sanitizedEmail,
        name: sanitizedName,
        password: passwordToStore,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return credentials;
  }

  async getAdminCredentials(email: string, password: string): Promise<AdminCredentials | undefined> {
    try {
      // Input validation
      if (!validateEmail(email) || !password) {
        // Still perform hash operation to prevent timing attacks
        await bcrypt.compare("dummy", "$2b$12$dummy.hash.to.prevent.timing.attacks");
        return undefined;
      }

      const sanitizedEmail = validator.normalizeEmail(email) || email;

      const [admin] = await db
        .select()
        .from(adminCredentials)
        .where(eq(adminCredentials.email, sanitizedEmail))
        .limit(1);

      // Always perform hash comparison to prevent timing attacks
      const isValidPassword = admin 
        ? await bcrypt.compare(password, admin.password)
        : await bcrypt.compare(password, "$2b$12$dummy.hash.to.prevent.timing.attacks");

      if (!admin || !isValidPassword) {
        return undefined;
      }

      return admin;
    } catch (error) {
      console.error("Authentication error:", error);
      // Still perform dummy hash to maintain consistent timing
      await bcrypt.compare("dummy", "$2b$12$dummy.hash.to.prevent.timing.attacks");
      return undefined;
    }
  }

  async updateAdminCredentials(id: number, updates: Partial<InsertAdminCredentials>): Promise<AdminCredentials> {
    const updateData = { ...updates, updatedAt: new Date() };

    // Hash password if provided
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 12);
    }

    const [credentials] = await db
      .update(adminCredentials)
      .set(updateData)
      .where(eq(adminCredentials.id, id))
      .returning();
    return credentials;
  }

  async checkAdminExists(): Promise<boolean> {
    try {
      const [admin] = await db
        .select({ id: adminCredentials.id })
        .from(adminCredentials)
        .limit(1);
      return !!admin;
    } catch (error) {
      console.error('Error checking admin existence:', error);
      return false;
    }
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
  async getAgencies(): Promise<Agency[]> {
    return await db.select().from(agencies);
  }

  async getAgencyById(id: number): Promise<Agency | null> {
    const result = await db.select().from(agencies).where(eq(agencies.id, id)).limit(1);
    return result[0] || null;
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

  async getAllBuses(): Promise<Bus[]> {
    return await db.select().from(buses).orderBy(desc(buses.createdAt));
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

  async getAllTravelerData(): Promise<any[]> {
    return await db
      .select({
        id: travelerData.id,
        busId: travelerData.busId,
        agencyId: travelerData.agencyId,
        travelerName: travelerData.travelerName,
        phone: travelerData.phone,
        travelDate: travelerData.travelDate,
        couponCode: travelerData.couponCode,
        whatsappStatus: travelerData.whatsappStatus,
        whatsappOptOut: travelerData.whatsappOptOut,
        optOutDate: travelerData.optOutDate,
        createdAt: travelerData.createdAt,
        updatedAt: travelerData.updatedAt,
        // Agency information
        agencyName: agencies.name,
        agencyCity: agencies.city,
        agencyState: agencies.state,
        agencyPhone: agencies.phone,
        agencyContactPerson: agencies.contactPerson,
        // Bus information
        busNumber: buses.number,
        busName: buses.name,
        fromLocation: buses.fromLocation,
        toLocation: buses.toLocation,
        departureTime: buses.departureTime,
        arrivalTime: buses.arrivalTime,
        busType: buses.busType,
        capacity: buses.capacity,
        fare: buses.fare,
      })
      .from(travelerData)
      .leftJoin(agencies, eq(travelerData.agencyId, agencies.id))
      .leftJoin(buses, eq(travelerData.busId, buses.id))
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

  async deleteTravelerData(id: number): Promise<void> {
    // First, delete any related WhatsApp queue entries to avoid foreign key constraint violation
    await db
      .delete(whatsappQueue)
      .where(eq(whatsappQueue.travelerId, id));
    
    // Then delete the traveler data
    await db
      .delete(travelerData)
      .where(eq(travelerData.id, id));
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

  async getAdminStats(): Promise<{
    totalAgencies: number;
    totalBuses: number;
    totalMessages: number;
    totalCoupons: number;
  }> {
    return await this.getSystemStats(); // Alias for admin stats
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
      .select({
        id: paymentHistory.id,
        billId: paymentHistory.billId,
        billingPeriod: paymentHistory.billingPeriod,
        totalBuses: paymentHistory.totalBuses,
        chargePerBus: paymentHistory.chargePerBus,
        subtotal: paymentHistory.subtotal,
        taxPercentage: paymentHistory.taxPercentage,
        taxAmount: paymentHistory.taxAmount,
        totalAmount: paymentHistory.totalAmount,
        paymentStatus: paymentHistory.paymentStatus,
        paymentMethod: paymentHistory.paymentMethod,
        paymentDate: paymentHistory.paymentDate,
        dueDate: paymentHistory.dueDate,
        notes: paymentHistory.notes,
        createdAt: paymentHistory.createdAt,
        updatedAt: paymentHistory.updatedAt,
        agencyId: paymentHistory.agencyId,
      })
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

  async getOverduePayments() {
    try {
      const currentDate = new Date();
      const overduePayments = await db
        .select({
          id: paymentHistory.id,
          agencyId: paymentHistory.agencyId,
          agencyName: agencies.name,
          amount: paymentHistory.totalAmount,
          dueDate: paymentHistory.dueDate,
          status: paymentHistory.paymentStatus
        })
        .from(paymentHistory)
        .innerJoin(agencies, eq(paymentHistory.agencyId, agencies.id))
        .where(
          and(
            eq(paymentHistory.paymentStatus, 'pending'),
            sql`${paymentHistory.dueDate} < ${currentDate.toISOString()}`
          )
        );

      return overduePayments;
    } catch (error) {
      console.error("Error fetching overdue payments:", error);
      return [];
    }
  }

  async getPaymentReminders(agencyId: number) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days reminder

      const reminders = await db
        .select({
          id: paymentHistory.id,
          amount: paymentHistory.totalAmount,
          dueDate: paymentHistory.dueDate,
          createdAt: paymentHistory.createdAt
        })
        .from(paymentHistory)
        .where(
          and(
            eq(paymentHistory.agencyId, agencyId),
            eq(paymentHistory.paymentStatus, 'pending'),
            sql`${paymentHistory.dueDate} <= ${futureDate.toISOString()}`
          )
        );

      return reminders;
    } catch (error) {
      console.error("Error fetching payment reminders:", error);
      return [];
    }
  }

  async getRenewalAlerts(agencyId: number) {
    try {
      // For now, return empty array - implement when subscription expiry is tracked
      return [];
    } catch (error) {
      console.error("Error fetching renewal alerts:", error);
      return [];
    }
  }

  async getAllPayments() {
    try {
      const allPayments = await db
        .select({
          id: paymentHistory.id,
          agencyId: paymentHistory.agencyId,
          agencyName: agencies.name,
          amount: paymentHistory.totalAmount,
          dueDate: paymentHistory.dueDate,
          paymentDate: paymentHistory.paymentDate,
          status: paymentHistory.paymentStatus,
          paymentMethod: paymentHistory.paymentMethod,
          invoiceNumber: paymentHistory.billId,
          notes: paymentHistory.notes,
          createdAt: paymentHistory.createdAt
        })
        .from(paymentHistory)
        .innerJoin(agencies, eq(paymentHistory.agencyId, agencies.id))
        .orderBy(paymentHistory.createdAt);

      return allPayments;
    } catch (error) {
      console.error("Error fetching all payments:", error);
      return [];
    }
  }

  async getPaymentStats() {
    try {
      const [totalRevenue] = await db
        .select({ 
          sum: sql<number>`cast(sum(${paymentHistory.totalAmount}) as integer)` 
        })
        .from(paymentHistory)
        .where(eq(paymentHistory.paymentStatus, 'paid'));

      const [paidCount] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(paymentHistory)
        .where(eq(paymentHistory.paymentStatus, 'paid'));

      const [pendingCount] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(paymentHistory)
        .where(eq(paymentHistory.paymentStatus, 'pending'));

      const currentDate = new Date();
      const [overdueCount] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(paymentHistory)
        .where(
          and(
            eq(paymentHistory.paymentStatus, 'pending'),
            sql`${paymentHistory.dueDate} < ${currentDate.toISOString()}`
          )
        );

      return {
        totalRevenue: Number(totalRevenue?.sum || 0),
        paidCount: Number(paidCount?.count || 0),
        pendingCount: Number(pendingCount?.count || 0),
        overdueCount: Number(overdueCount?.count || 0)
      };
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      return {
        totalRevenue: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0
      };
    }
  }
}

export const storage = new DatabaseStorage();