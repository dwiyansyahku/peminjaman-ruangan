"use server";

import { db } from "@/db";
import { rooms, bookings, announcements } from "@/db/schema";
import { eq, and, or, gte, lte, ilike, lt, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/actions/users";

// --- Helper for Operational Hours parsing ---
function isTimeWithinOperationalHours(
    reqStartTimeMinutes: number,
    reqEndTimeMinutes: number,
    requestDayName: string,
    openHourStr: string | null,
    closeHourStr: string | null
): boolean {
    if (!openHourStr) return true; // Default fallback if really empty
    
    const TOLERANCE_MINUTES = 15; // Allow for slight mismatch (e.g. 13:40 search for 13:50 room)

    // Check if it's JSON schedule map
    if (openHourStr.startsWith("{")) {
        try {
            const scheduleMap = JSON.parse(openHourStr);
            const intervals: string[] = [];
            if (scheduleMap[requestDayName]) {
                intervals.push(...scheduleMap[requestDayName]);
            }
            if (scheduleMap["_ALL_"]) {
                intervals.push(...scheduleMap["_ALL_"]);
            }
            // If it's a JSON config but no schedule for this day, then not available
            if (intervals.length === 0) return false;

            for (const interval of intervals) {
                const dashIdx = interval.indexOf("-", 3);
                if (dashIdx === -1) continue;
                const intStartStr = interval.slice(0, dashIdx).trim();
                const intEndStr = interval.slice(dashIdx + 1).trim();
                const [sH, sM] = intStartStr.split(":").map(Number);
                const [eH, eM] = intEndStr.split(":").map(Number);
                const iStart = sH * 60 + (sM || 0);
                const iEnd = eH * 60 + (eM || 0);
                
                // Use tolerance for start time
                if (reqStartTimeMinutes + TOLERANCE_MINUTES >= iStart && reqEndTimeMinutes <= iEnd) {
                    return true;
                }
            }
            return false;
        } catch {
            // failed parsing JSON, fallback to legacy
        }
    }

    // Check if it's flat multi-interval (e.g. "07:00-09:00, 13:00-15:00")
    if (openHourStr.includes("-")) {
        const intervals = openHourStr.split(",").map(i => i.trim());
        for (const interval of intervals) {
            const dashIdx = interval.indexOf("-", 3);
            if (dashIdx === -1) continue;
            const intStartStr = interval.slice(0, dashIdx).trim();
            const intEndStr = interval.slice(dashIdx + 1).trim();
            const [sH, sM] = intStartStr.split(":").map(Number);
            const [eH, eM] = intEndStr.split(":").map(Number);
            const iStart = sH * 60 + (sM || 0);
            const iEnd = eH * 60 + (eM || 0);

            // Use tolerance for start time
            if (reqStartTimeMinutes + TOLERANCE_MINUTES >= iStart && reqEndTimeMinutes <= iEnd) {
                return true;
            }
        }
        return false;
    }

    // Fallback legacy single timeframe behavior
    const [openH, openM] = (openHourStr || "07:00").split(':').map(Number);
    const [closeH, closeM] = (closeHourStr || "18:00").split(':').map(Number);
    const roomStartTime = openH * 60 + (openM || 0);
    const roomEndTime = closeH * 60 + (closeM || 0);

    return (reqStartTimeMinutes + TOLERANCE_MINUTES >= roomStartTime && reqEndTimeMinutes <= roomEndTime);
}
export async function getRooms(searchQuery?: string) {
    try {
        if (searchQuery) {
            return await db
                .select()
                .from(rooms)
                .where(
                    or(
                        ilike(rooms.name, `%${searchQuery}%`),
                        ilike(rooms.description || "", `%${searchQuery}%`)
                    )
                );
        }
        return await db.select().from(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
    }
}

export async function searchRooms(params: {
    date: string;
    startTime: string;
    endTime: string;
}) {
    try {
        const { date, startTime, endTime } = params;
        // Explicitly set timezone to Asia/Jakarta (+07:00)
        const startDateTime = new Date(`${date}T${startTime}:00+07:00`);
        const endDateTime = new Date(`${date}T${endTime}:00+07:00`);

        // Get all available rooms
        const allRooms = await db
            .select()
            .from(rooms)
            .where(eq(rooms.status, "AVAILABLE"));

        // Filter valid rooms by day of week
        const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const requestDayName = daysMap[startDateTime.getDay()];

        // Parse requested times into minutes from midnight for checks
        const [hStart, mStart] = startTime.split(':').map(Number);
        const [hEnd, mEnd] = endTime.split(':').map(Number);
        const reqStartTimeMinutes = hStart * 60 + (mStart || 0);
        const reqEndTimeMinutes = hEnd * 60 + (mEnd || 0);

        const validRooms = allRooms.filter(room => {
            // Check day of week
            let isValidDay = true;
            if (room.hari) {
                try {
                    const activeDays = JSON.parse(room.hari);
                    if (activeDays.length > 0 && !activeDays.includes(requestDayName)) {
                        isValidDay = false;
                    }
                } catch {
                    // Ignore parse error
                }
            }
            if (!isValidDay) return false;

            // Check operational hours
            return isTimeWithinOperationalHours(reqStartTimeMinutes, reqEndTimeMinutes, requestDayName, room.openHour, room.closeHour);
        });

        // Get bookings that overlap with the requested time
        const overlappingBookings = await db
            .select()
            .from(bookings)
            .where(
                and(
                    eq(bookings.status, "ACTIVE"),
                    or(
                        // Booking starts during requested time
                        and(
                            gte(bookings.startTime, startDateTime),
                            lte(bookings.startTime, endDateTime)
                        ),
                        // Booking ends during requested time
                        and(
                            gte(bookings.endTime, startDateTime),
                            lte(bookings.endTime, endDateTime)
                        ),
                        // Booking encompasses requested time
                        and(
                            lte(bookings.startTime, startDateTime),
                            gte(bookings.endTime, endDateTime)
                        )
                    )
                )
            );

        const bookedRoomIds = new Set(overlappingBookings.map((b) => b.roomId));
        
        // Return all valid rooms with their occupied status
        // We sort them so available rooms appear first
        return validRooms.map(room => {
            const currentConflict = overlappingBookings.find(b => b.roomId === room.id);
            return {
                room,
                isOccupied: bookedRoomIds.has(room.id),
                conflict: currentConflict ? {
                    startTime: currentConflict.startTime,
                    endTime: currentConflict.endTime,
                    purpose: currentConflict.purpose
                } : null
            };
        }).sort((a, b) => {
            if (a.isOccupied === b.isOccupied) return 0;
            return a.isOccupied ? 1 : -1;
        });
    } catch (error) {
        console.error("Error searching rooms:", error);
        return [];
    }
}

export async function getRoomById(roomId: number) {
    try {
        const result = await db.select().from(rooms).where(eq(rooms.id, roomId));
        return result[0] || null;
    } catch (error) {
        console.error("Error fetching room:", error);
        return null;
    }
}

export async function getRoomsWithStatus() {
    try {
        const allRooms = await db.select().from(rooms);
        const now = new Date();

        // Get all active bookings
        const activeBookings = await db
            .select()
            .from(bookings)
            .where(
                and(
                    eq(bookings.status, "ACTIVE"),
                    lte(bookings.startTime, now),
                    gt(bookings.endTime, now)
                )
            );

        const occupiedRoomIds = new Set(activeBookings.map((b) => b.roomId));

        return allRooms.map((room) => {
            const currentBooking = activeBookings.find((b) => b.roomId === room.id);
            return {
                ...room,
                isOccupied: !!currentBooking,
                currentBooking: currentBooking ? {
                    startTime: currentBooking.startTime,
                    endTime: currentBooking.endTime,
                    purpose: currentBooking.purpose
                } : null
            };
        });
    } catch (error) {
        console.error("Error fetching rooms with status:", error);
        return [];
    }
}

export async function getRoomsWithAvailability(params: {
    date: Date;
    startHours: number;
    startMinutes: number;
    endHours: number;
    endMinutes: number;
}) {
    try {
        const { date, startHours, startMinutes, endHours, endMinutes } = params;

        // Construct Date objects manually enforcing +07:00 timezone
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        const hStart = String(startHours).padStart(2, '0');
        const mStart = String(startMinutes).padStart(2, '0');

        const hEnd = String(endHours).padStart(2, '0');
        const mEnd = String(endMinutes).padStart(2, '0');

        const startDateTime = new Date(`${yyyy}-${mm}-${dd}T${hStart}:${mStart}:00+07:00`);
        const endDateTime = new Date(`${yyyy}-${mm}-${dd}T${hEnd}:${mEnd}:00+07:00`);

        const reqStartTime = startHours * 60 + startMinutes;
        const reqEndTime = endHours * 60 + endMinutes;

        const allRooms = await db.select().from(rooms);

        // Get bookings that overlap with the requested time
        const overlappingBookings = await db
            .select()
            .from(bookings)
            .where(
                and(
                    eq(bookings.status, "ACTIVE"),
                    lt(bookings.startTime, endDateTime),
                    gt(bookings.endTime, startDateTime)
                )
            );

        const bookedRoomIds = new Set(overlappingBookings.map((b) => b.roomId));
        
        // Day of week for operational hours check
        const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const requestDayName = daysMap[startDateTime.getDay()];

        return allRooms.map((room) => {
            const isOccupied = bookedRoomIds.has(room.id);
            
            // Check operational hours
            let isWithinHours = true;
            if (room.hari || room.openHour) {
                // Check day of week
                let isValidDay = true;
                if (room.hari) {
                    try {
                        const activeDays = JSON.parse(room.hari);
                        if (activeDays.length > 0 && !activeDays.includes(requestDayName)) {
                            isValidDay = false;
                        }
                    } catch {}
                }
                
                if (!isValidDay) {
                    isWithinHours = false;
                } else if (room.openHour) {
                    isWithinHours = isTimeWithinOperationalHours(reqStartTime, reqEndTime, requestDayName, room.openHour, room.closeHour);
                }
            }

            const currentBooking = overlappingBookings.find((b) => b.roomId === room.id);

            return {
                ...room,
                isOccupied,
                isWithinHours,
                currentBooking: currentBooking ? {
                    startTime: currentBooking.startTime,
                    endTime: currentBooking.endTime,
                    purpose: currentBooking.purpose
                } : null,
                // Status mapping for sorting and frontend
                availabilityStatus: (room.status === "MAINTENANCE" ? "MAINTENANCE" 
                                    : isOccupied ? "OCCUPIED" 
                                    : !isWithinHours ? "OUTSIDE_HOURS" 
                                    : "AVAILABLE") as "AVAILABLE" | "MAINTENANCE" | "OCCUPIED" | "OUTSIDE_HOURS"
            };
        });
    } catch (error) {
        console.error("Error fetching rooms with availability:", error);
        return [];
    }
}

export async function createRoom(data: {
    name: string;
    capacity: number;
    facilities?: string;
    openHour?: string;
    closeHour?: string;
    hari?: string;
    imageUrl?: string;
    description?: string;
}) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        const result = await db.insert(rooms).values(data).returning();
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error creating room:", error);
        return { success: false, error: "Failed to create room" };
    }
}

export async function updateRoom(
    roomId: number,
    data: {
        name?: string;
        capacity?: number;
        status?: "AVAILABLE" | "MAINTENANCE";
        facilities?: string;
        openHour?: string;
        closeHour?: string;
        hari?: string;
        imageUrl?: string;
        description?: string;
    }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        const result = await db
            .update(rooms)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(rooms.id, roomId))
            .returning();
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error updating room:", error);
        return { success: false, error: "Failed to update room" };
    }
}

export async function deleteRoom(roomId: number) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        await db.delete(rooms).where(eq(rooms.id, roomId));
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting room:", error);
        return { success: false, error: "Failed to delete room" };
    }
}

export async function importRoomsBulk(roomsData: {
    name: string;
    capacity: number;
    facilities?: string;
    openHour?: string;
    closeHour?: string;
    hari?: string;
    description?: string;
    status: "AVAILABLE" | "MAINTENANCE";
}[]) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        if (!roomsData || roomsData.length === 0) {
            return { success: false, error: "Tidak ada data untuk diimpor" };
        }

        await db.insert(rooms).values(roomsData);
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        return { success: true, count: roomsData.length };
    } catch (error) {
        console.error("Error importing rooms bulk:", error);
        return { success: false, error: "Gagal mengimpor ruangan" };
    }
}
