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
  logoUrl: varchar("logo_url"),
  username: varchar("username").unique(),
  password: varchar("password"),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Traveler data table
export const travelerData = pgTable("traveler_data", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull().references(() => buses.id),
  agencyId: integer("agency_id").notNull().references(() => agencies.id),
  travelerName: varchar("traveler_name").notNull(),
  phone: varchar("phone").notNull(),
  travelDate: date("travel_date").notNull(),
  couponCode: varchar("coupon_code").notNull(),
  whatsappStatus: varchar("whatsapp_status", { 
    enum: ["pending", "sent", "failed"] 
  }).notNull().default("pending"),
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
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
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
