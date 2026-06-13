import type { Room, User, Booking, Announcement } from "@/db/schema";

// Room with occupancy status
export type RoomWithStatus = Room & {
    isOccupied: boolean;
};

// Booking with related room
export type BookingWithRoom = {
    booking: Booking;
    room: Room;
};

// Booking with all relations
export type BookingWithRelations = {
    booking: Booking;
    room: Room;
    user: User;
};

// Announcement with linked room
export type AnnouncementWithRoom = {
    announcement: Announcement;
    room: Room | null;
};

// Dashboard stats
export type DashboardStats = {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    activeBookings: number;
    maintenanceRooms: number;
};

// Time slot for booking
export type TimeSlot = {
    time: string;
    isBooked: boolean;
};

// Availability check result
export type AvailabilityResult = {
    available: boolean;
    conflictingBookings?: Booking[];
    error?: string;
};
