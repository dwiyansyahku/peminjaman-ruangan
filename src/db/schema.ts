import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    boolean,
    pgEnum,
    serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "STUDENT"]);
export const roomStatusEnum = pgEnum("room_status", ["AVAILABLE", "MAINTENANCE"]);
export const bookingStatusEnum = pgEnum("booking_status", [
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
]);

// Users table (synced with Supabase Auth)
export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    role: userRoleEnum("role").notNull().default("STUDENT"),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    nim: text("nim"),
    prodi: text("prodi"),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rooms table
export const rooms = pgTable("rooms", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    capacity: integer("capacity").notNull(),
    status: roomStatusEnum("status").notNull().default("AVAILABLE"),
    facilities: text("facilities"), // JSON string of facilities
    openHour: text("open_hour").notNull().default("07:00"),
    closeHour: text("close_hour").notNull().default("18:00"),
    hari: text("hari"), // JSON string of days (e.g., ["Senin", "Selasa"])
    imageUrl: text("image_url"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bookings table
export const bookings = pgTable("bookings", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    roomId: integer("room_id")
        .notNull()
        .references(() => rooms.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    status: bookingStatusEnum("status").notNull().default("ACTIVE"),
    purpose: text("purpose"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Announcements table
export const announcements = pgTable("announcements", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    linkedRoomId: integer("linked_room_id").references(() => rooms.id, {
        onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    blockedFrom: timestamp("blocked_from"),
    blockedUntil: timestamp("blocked_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    bookings: many(bookings),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
    bookings: many(bookings),
    announcements: many(announcements),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
    user: one(users, {
        fields: [bookings.userId],
        references: [users.id],
    }),
    room: one(rooms, {
        fields: [bookings.roomId],
        references: [rooms.id],
    }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
    linkedRoom: one(rooms, {
        fields: [announcements.linkedRoomId],
        references: [rooms.id],
    }),
}));

// System Settings table
export const systemSettings = pgTable("system_settings", {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
