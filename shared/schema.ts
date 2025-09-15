import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["super_admin", "agency"] }).notNull().default("agency"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel agencies table
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  phone: varchar("phone").notNull(),
  state: varchar("state"),
  city: varchar("city").notNull(),
  website: varchar("website"),
  bookingWebsite: varchar("booking_website"),
  whatsappImageUrl: varchar("whatsapp_image_url"),
  whatsappTemplate: varchar("whatsapp_template").default("eddygoo_2807"),
  logoUrl: varchar("logo_url"),
  username: varchar("username").unique(),
  password: varchar("password"),
  renewalChargePerBus: integer("renewal_charge_per_bus").default(5000),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "on_hold"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Buses table
export const buses = pgTable("buses", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id),
  number: varchar("number").notNull(),
  name: varchar("name").notNull(),
  fromLocation: varchar("from_location").notNull(),
  toLocation: varchar("to_location").notNull(),
  departureTime: varchar("departure_time").notNull(),
  arrivalTime: varchar("arrival_time").notNull(),
  busType: varchar("bus_type", { enum: ["Seater", "Sleeper", "AC Seater", "AC Sleeper", "Seater and Sleeper"] }).notNull(),
  capacity: integer("capacity").notNull(),
  fare: varchar("fare").notNull(),
  amenities: text("amenities").array().default([]),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  availabilityStatus: varchar("availability_status", { enum: ["available", "not_available"] }).notNull().default("available"),
  unavailableUntil: timestamp("unavailable_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Traveler data table
export const travelerData = pgTable("traveler_data", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull().references(() => buses.id),
  agencyId: integer("agency_id").notNull().references(() => agencies.id),
  uploadId: integer("upload_id").references(() => uploadHistory.id),
  travelerName: varchar("traveler_name").notNull(),
  phone: varchar("phone").notNull(),
  travelDate: date("travel_date").notNull(),
  couponCode: varchar("coupon_code").notNull(),
  whatsappStatus: varchar("whatsapp_status", { 
    enum: ["pending", "sent", "failed", "processing"] 
  }).notNull().default("pending"),
  whatsappOptOut: boolean("whatsapp_opt_out").default(false),
  optOutDate: timestamp("opt_out_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Upload history table
export const uploadHistory = pgTable("upload_history", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id),
  busId: integer("bus_id").notNull().references(() => buses.id),
  fileName: varchar("file_name").notNull(),
  travelerCount: integer("traveler_count").notNull(),
  status: varchar("status", { enum: ["processing", "completed", "failed"] })
    .notNull()
    .default("processing"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  agency: one(agencies, { fields: [users.id], references: [agencies.userId] }),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  user: one(users, { fields: [agencies.userId], references: [users.id] }),
  buses: many(buses),
  travelerData: many(travelerData),
  uploadHistory: many(uploadHistory),
}));

export const busesRelations = relations(buses, ({ one, many }) => ({
  agency: one(agencies, { fields: [buses.agencyId], references: [agencies.id] }),
  travelerData: many(travelerData),
  uploadHistory: many(uploadHistory),
}));

export const travelerDataRelations = relations(travelerData, ({ one }) => ({
  bus: one(buses, { fields: [travelerData.busId], references: [buses.id] }),
  agency: one(agencies, { fields: [travelerData.agencyId], references: [agencies.id] }),
}));

export const uploadHistoryRelations = relations(uploadHistory, ({ one }) => ({
  agency: one(agencies, { fields: [uploadHistory.agencyId], references: [agencies.id] }),
  bus: one(buses, { fields: [uploadHistory.busId], references: [buses.id] }),
}));

// Insert schemas
export const insertAgencySchema = createInsertSchema(agencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  bookingWebsite: z.string().url("Please enter a valid booking website URL").optional(),
  whatsappImageUrl: z.string().url("Please enter a valid WhatsApp image URL").optional(),
});

export const insertBusSchema = createInsertSchema(buses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelerDataSchema = createInsertSchema(travelerData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUploadHistorySchema = createInsertSchema(uploadHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Admin credentials table
export const adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull().default("Admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp API configuration table
export const whatsappConfig = pgTable("whatsapp_config", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { enum: ["business_api", "twilio", "messagebird", "other"] }).notNull(),
  apiKey: varchar("api_key").notNull(),
  apiSecret: varchar("api_secret"),
  phoneNumber: varchar("phone_number").notNull(),
  webhookUrl: varchar("webhook_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp message templates table
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  dayTrigger: integer("day_trigger").notNull(), // 30, 60, 90, etc.
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp message queue table
export const whatsappQueue = pgTable("whatsapp_queue", {
  id: serial("id").primaryKey(),
  travelerId: integer("traveler_id").notNull().references(() => travelerData.id),
  templateId: integer("template_id").notNull().references(() => whatsappTemplates.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status", { enum: ["pending", "sent", "failed", "cancelled"] }).notNull().default("pending"),
  message: text("message").notNull(), // Processed message with dynamic variables
  phoneNumber: varchar("phone_number").notNull(),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AdminCredentials = typeof adminCredentials.$inferSelect;
export type InsertAdminCredentials = typeof adminCredentials.$inferInsert;
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type Bus = typeof buses.$inferSelect;
export type InsertBus = z.infer<typeof insertBusSchema>;
export type TravelerData = typeof travelerData.$inferSelect;
export type InsertTravelerData = z.infer<typeof insertTravelerDataSchema>;
export type UploadHistory = typeof uploadHistory.$inferSelect;
export type InsertUploadHistory = z.infer<typeof insertUploadHistorySchema>;

// WhatsApp types
export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = typeof whatsappTemplates.$inferInsert;
export type WhatsappQueue = typeof whatsappQueue.$inferSelect;
export type InsertWhatsappQueue = typeof whatsappQueue.$inferInsert;

// Payment history table
export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id),
  billId: varchar("bill_id").notNull(), // Unique bill identifier
  billingPeriod: varchar("billing_period").notNull(), // e.g., "January 2025"
  totalBuses: integer("total_buses").notNull(),
  chargePerBus: integer("charge_per_bus").notNull(),
  subtotal: integer("subtotal").notNull(), // total buses * charge per bus
  taxPercentage: integer("tax_percentage").notNull().default(18), // GST percentage
  taxAmount: integer("tax_amount").notNull(),
  totalAmount: integer("total_amount").notNull(), // subtotal + tax
  paymentStatus: varchar("payment_status", { 
    enum: ["pending", "paid", "overdue", "partial"] 
  }).notNull().default("pending"),
  paymentMethod: varchar("payment_method", { 
    enum: ["cash", "bank_transfer", "upi", "card", "cheque", "other"] 
  }),
  paymentDate: timestamp("payment_date"),
  dueDate: timestamp("due_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tax configuration table
export const taxConfig = pgTable("tax_config", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().default("GST"),
  percentage: integer("percentage").notNull().default(18),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;
export type TaxConfig = typeof taxConfig.$inferSelect;
export type InsertTaxConfig = typeof taxConfig.$inferInsert;
