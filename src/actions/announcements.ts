"use server";

import { db } from "@/db";
import { announcements, rooms, bookings } from "@/db/schema";
import { eq, desc, and, or, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/actions/users";

export async function getAnnouncements(activeOnly = true) {
    try {
        const currentUser = await getCurrentUser();
        const query = db
            .select({
                announcement: announcements,
                room: rooms,
            })
            .from(announcements)
            .leftJoin(rooms, eq(announcements.linkedRoomId, rooms.id))
            .orderBy(desc(announcements.createdAt));

        const conditions = [];

        if (activeOnly) {
            conditions.push(eq(announcements.isActive, true));
        }

        if (currentUser && currentUser.role === "STUDENT") {
            conditions.push(gte(announcements.createdAt, currentUser.createdAt));
        }

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        const data = await query;

        // Enhance with occupancy status
        const enhancedData = await Promise.all(
            data.map(async (item) => {
                let isOccupied = false;
                if (item.announcement.linkedRoomId && item.announcement.blockedFrom && item.announcement.blockedUntil) {
                    const overlaps = await db
                        .select()
                        .from(bookings)
                        .where(
                            and(
                                eq(bookings.roomId, item.announcement.linkedRoomId),
                                eq(bookings.status, "ACTIVE"),
                                or(
                                    and(
                                        gte(bookings.startTime, item.announcement.blockedFrom),
                                        lte(bookings.startTime, item.announcement.blockedUntil)
                                    ),
                                    and(
                                        gte(bookings.endTime, item.announcement.blockedFrom),
                                        lte(bookings.endTime, item.announcement.blockedUntil)
                                    ),
                                    and(
                                        lte(bookings.startTime, item.announcement.blockedFrom),
                                        gte(bookings.endTime, item.announcement.blockedUntil)
                                    )
                                )
                            )
                        );
                    isOccupied = overlaps.length > 0;
                }
                return { ...item, isOccupied };
            })
        );

        return enhancedData;
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return [];
    }
}

export async function getAnnouncementById(announcementId: number) {
    try {
        const result = await db
            .select({
                announcement: announcements,
                room: rooms,
            })
            .from(announcements)
            .leftJoin(rooms, eq(announcements.linkedRoomId, rooms.id))
            .where(eq(announcements.id, announcementId));
        return result[0] || null;
    } catch (error) {
        console.error("Error fetching announcement:", error);
        return null;
    }
}

export async function createAnnouncement(data: {
    title: string;
    description?: string;
    linkedRoomId?: number;
    blockedFrom?: Date;
    blockedUntil?: Date;
}) {
    console.log("Creating announcement with data:", JSON.stringify(data, (key, value) => 
        value instanceof Date ? value.toISOString() : value
    , 2));

    try {
        // Simple sanitization to ensure Dates are really Dates
        const sanitizedData = {
            ...data,
            blockedFrom: data.blockedFrom instanceof Date && !isNaN(data.blockedFrom.getTime()) ? data.blockedFrom : null,
            blockedUntil: data.blockedUntil instanceof Date && !isNaN(data.blockedUntil.getTime()) ? data.blockedUntil : null,
        };

        console.log("Sanitized data for DB:", JSON.stringify(sanitizedData, (key, value) => 
            value instanceof Date ? value.toISOString() : value
        , 2));

        const result = await db.insert(announcements).values(sanitizedData as any).returning();
        
        console.log("Successfully inserted. Result ID:", result[0]?.id);

        try {
            revalidatePath("/dashboard");
            revalidatePath("/rooms");
        } catch (revError) {
            console.warn("Revalidation error (non-fatal):", revError);
        }

        // Return a clean object to ensure serializability
        return { 
            success: true, 
            data: {
                ...result[0],
                createdAt: result[0].createdAt.toISOString(),
                updatedAt: result[0].updatedAt.toISOString(),
                blockedFrom: result[0].blockedFrom?.toISOString() || null,
                blockedUntil: result[0].blockedUntil?.toISOString() || null,
            } 
        };
    } catch (error) {
        console.error("CRITICAL error creating announcement:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to create announcement" 
        };
    }
}

export async function updateAnnouncement(
    announcementId: number,
    data: {
        title?: string;
        description?: string;
        linkedRoomId?: number | null;
        isActive?: boolean;
        blockedFrom?: Date | null;
        blockedUntil?: Date | null;
    }
) {
    try {
        const result = await db
            .update(announcements)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(announcements.id, announcementId))
            .returning();
        
        try {
            revalidatePath("/dashboard");
            revalidatePath("/rooms");
        } catch (rErr) {
            console.warn("Update revalidation failed:", rErr);
        }

        return { 
            success: true, 
            data: {
                ...result[0],
                createdAt: result[0].createdAt.toISOString(),
                updatedAt: result[0].updatedAt.toISOString(),
                blockedFrom: result[0].blockedFrom?.toISOString() || null,
                blockedUntil: result[0].blockedUntil?.toISOString() || null,
            }
        };
    } catch (error) {
        console.error("Error updating announcement:", error);
        return { success: false, error: "Failed to update announcement" };
    }
}

export async function deleteAnnouncement(announcementId: number) {
    try {
        await db.delete(announcements).where(eq(announcements.id, announcementId));
        revalidatePath("/dashboard");
        revalidatePath("/rooms");
        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return { success: false, error: "Failed to delete announcement" };
    }
}

export async function toggleAnnouncementStatus(announcementId: number) {
    try {
        const current = await db
            .select()
            .from(announcements)
            .where(eq(announcements.id, announcementId));

        if (!current[0]) {
            return { success: false, error: "Announcement not found" };
        }

        const result = await db
            .update(announcements)
            .set({ isActive: !current[0].isActive, updatedAt: new Date() })
            .where(eq(announcements.id, announcementId))
            .returning();

        try {
            revalidatePath("/dashboard");
            revalidatePath("/rooms");
        } catch (rErr) {
            console.warn("Toggle revalidation failed:", rErr);
        }

        return { 
            success: true, 
            data: {
                ...result[0],
                createdAt: result[0].createdAt.toISOString(),
                updatedAt: result[0].updatedAt.toISOString(),
                blockedFrom: result[0].blockedFrom?.toISOString() || null,
                blockedUntil: result[0].blockedUntil?.toISOString() || null,
            }
        };
    } catch (error) {
        console.error("Error toggling announcement status:", error);
        return { success: false, error: "Failed to toggle announcement status" };
    }
}
