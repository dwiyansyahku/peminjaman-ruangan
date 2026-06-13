"use server";

import { db } from "@/db";
import { bookings, rooms, users } from "@/db/schema";
import { eq, and, or, gte, lte, lt, gt, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/actions/users";
import { addDays, getDay } from "date-fns";

export async function checkAvailability(
    roomId: number,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: number
) {
    try {
        // Check for overlapping bookings
        // A booking overlaps if:
        // (existingStart < newEnd) AND (existingEnd > newStart)
        const conditions = [
            eq(bookings.roomId, roomId),
            eq(bookings.status, "ACTIVE"),
            lt(bookings.startTime, endTime),
            gt(bookings.endTime, startTime),
        ];

        let overlappingBookings = await db
            .select()
            .from(bookings)
            .where(and(...conditions));

        // If updating existing booking, exclude it from overlap check
        if (excludeBookingId) {
            overlappingBookings = overlappingBookings.filter(
                (b) => b.id !== excludeBookingId
            );
        }

        return {
            available: overlappingBookings.length === 0,
            conflictingBookings: overlappingBookings,
        };
    } catch (error) {
        console.error("Error checking availability:", error);
        return { available: false, error: "Failed to check availability" };
    }
}

export async function createBooking(data: {
    userId: string;
    roomId: number;
    startTime: Date;
    endTime: Date;
    purpose?: string;
}) {
    try {
        // First check availability
        const availability = await checkAvailability(
            data.roomId,
            data.startTime,
            data.endTime
        );

        if (!availability.available) {
            return {
                success: false,
                error: "This time slot is already booked. Please choose another time.",
            };
        }

        // Check if room is under maintenance
        const room = await db
            .select()
            .from(rooms)
            .where(eq(rooms.id, data.roomId));

        if (room[0]?.status === "MAINTENANCE") {
            return {
                success: false,
                error: "This room is currently under maintenance.",
            };
        }

        const result = await db.insert(bookings).values(data).returning();
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        revalidatePath("/bookings");
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error creating booking:", error);
        return { success: false, error: "Failed to create booking" };
    }
}

export async function getUserBookings(userId: string) {
    try {
        const result = await db
            .select({
                booking: bookings,
                room: rooms,
            })
            .from(bookings)
            .innerJoin(rooms, eq(bookings.roomId, rooms.id))
            .where(eq(bookings.userId, userId))
            .orderBy(desc(bookings.createdAt));
        return result;
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        return [];
    }
}

export async function getActiveBookings() {
    try {
        const result = await db
            .select({
                booking: bookings,
                room: rooms,
                user: users,
            })
            .from(bookings)
            .innerJoin(rooms, eq(bookings.roomId, rooms.id))
            .innerJoin(users, eq(bookings.userId, users.id))
            .where(eq(bookings.status, "ACTIVE"))
            .orderBy(desc(bookings.startTime));
        return result;
    } catch (error) {
        console.error("Error fetching active bookings:", error);
        return [];
    }
}

export async function getAllBookings() {
    try {
        const result = await db
            .select({
                booking: bookings,
                room: rooms,
                user: users,
            })
            .from(bookings)
            .innerJoin(rooms, eq(bookings.roomId, rooms.id))
            .innerJoin(users, eq(bookings.userId, users.id))
            .orderBy(desc(bookings.createdAt));
        return result;
    } catch (error) {
        console.error("Error fetching all bookings:", error);
        return [];
    }
}

export async function updateBooking(bookingId: number, data: {
    roomId?: number;
    startTime?: Date;
    endTime?: Date;
    purpose?: string;
}) {
    try {
        if (data.roomId && data.startTime && data.endTime) {
            const availability = await checkAvailability(
                data.roomId,
                data.startTime,
                data.endTime,
                bookingId
            );

            if (!availability.available) {
                return {
                    success: false,
                    error: "This time slot is already booked. Please choose another time.",
                };
            }
        }

        const result = await db
            .update(bookings)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(bookings.id, bookingId))
            .returning();
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        revalidatePath("/bookings");
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error updating booking:", error);
        return { success: false, error: "Failed to update booking" };
    }
}

export async function updateBookingStatus(
    bookingId: number,
    status: "ACTIVE" | "COMPLETED" | "CANCELLED"
) {
    try {
        const result = await db
            .update(bookings)
            .set({ status, updatedAt: new Date() })
            .where(eq(bookings.id, bookingId))
            .returning();
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        revalidatePath("/bookings");
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error updating booking status:", error);
        return { success: false, error: "Failed to update booking status" };
    }
}

export async function cancelBooking(bookingId: number) {
    return updateBookingStatus(bookingId, "CANCELLED");
}

export async function getBookingStats() {
    try {
        const now = new Date();

        // Get all rooms
        const allRooms = await db.select().from(rooms);

        // Get currently active bookings (happening right now)
        const currentBookings = await db
            .select()
            .from(bookings)
            .where(
                and(
                    eq(bookings.status, "ACTIVE"),
                    lte(bookings.startTime, now),
                    gt(bookings.endTime, now)
                )
            );

        // Get all active bookings (not cancelled)
        const activeBookings = await db
            .select()
            .from(bookings)
            .where(eq(bookings.status, "ACTIVE"));

        const occupiedRoomIds = new Set(currentBookings.map((b) => b.roomId));
        const availableRooms = allRooms.filter(
            (r) => !occupiedRoomIds.has(r.id) && r.status === "AVAILABLE"
        );
        const occupiedRooms = allRooms.filter((r) => occupiedRoomIds.has(r.id));

        return {
            totalRooms: allRooms.length,
            availableRooms: availableRooms.length,
            occupiedRooms: occupiedRooms.length,
            activeBookings: activeBookings.length,
            maintenanceRooms: allRooms.filter((r) => r.status === "MAINTENANCE")
                .length,
        };
    } catch (error) {
        console.error("Error fetching booking stats:", error);
        return {
            totalRooms: 0,
            availableRooms: 0,
            occupiedRooms: 0,
            activeBookings: 0,
            maintenanceRooms: 0,
        };
    }
}

export async function getRoomBookings(roomId: number, date?: Date) {
    try {
        let conditions = [eq(bookings.roomId, roomId), eq(bookings.status, "ACTIVE")];

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            conditions.push(gte(bookings.startTime, startOfDay));
            conditions.push(lte(bookings.startTime, endOfDay));
        }

        const result = await db
            .select()
            .from(bookings)
            .where(and(...conditions))
            .orderBy(bookings.startTime);

        return result;
    } catch (error) {
        console.error("Error fetching room bookings:", error);
        return [];
    }
}

export async function importRoutineBookings(
    scheduleData: {
        roomName: string;
        dayName: string;
        startTime: string; // HH:mm
        endTime: string;   // HH:mm
        purpose: string;
    }[],
    startDateStr: string, // YYYY-MM-DD
    endDateStr: string    // YYYY-MM-DD
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "ADMIN") {
            return { success: false, error: "Unauthorized. Admin access required." };
        }

        const allRooms = await db.select().from(rooms);
        const adminUserId = currentUser.id;

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);

        const daysMap: Record<string, number> = {
            "minggu": 0,
            "senin": 1,
            "selasa": 2,
            "rabu": 3,
            "kamis": 4,
            "jumat": 5,
            "sabtu": 6,
        };

        const bookingsToInsert = [];
        let skippedCount = 0;

        for (const schedule of scheduleData) {
            const room = allRooms.find(r => r.name.toLowerCase() === schedule.roomName.toLowerCase().trim());
            if (!room) {
                skippedCount++;
                continue;
            }

            const dayIndex = daysMap[schedule.dayName.toLowerCase().trim()];
            if (dayIndex === undefined) {
                skippedCount++;
                continue;
            }

            // Iterate date from startDate to endDate
            let currentDate = new Date(startDate);
            
            // Advance to the first matching day
            while (getDay(currentDate) !== dayIndex) {
                currentDate = addDays(currentDate, 1);
            }

            while (currentDate <= endDate) {
                const yyyy = currentDate.getFullYear();
                const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                const dd = String(currentDate.getDate()).padStart(2, '0');

                // Basic validation for time format (HH:mm)
                const startParts = schedule.startTime.split(":");
                const endParts = schedule.endTime.split(":");
                
                if (startParts.length >= 2 && endParts.length >= 2) {
                    const startH = startParts[0].padStart(2, '0');
                    const startM = startParts[1].padStart(2, '0');
                    const endH = endParts[0].padStart(2, '0');
                    const endM = endParts[1].padStart(2, '0');

                    const startDateTime = new Date(`${yyyy}-${mm}-${dd}T${startH}:${startM}:00+07:00`);
                    const endDateTime = new Date(`${yyyy}-${mm}-${dd}T${endH}:${endM}:00+07:00`);

                    bookingsToInsert.push({
                        roomId: room.id,
                        userId: adminUserId,
                        startTime: startDateTime,
                        endTime: endDateTime,
                        purpose: schedule.purpose || "Jadwal Kelas Rutin",
                        status: "ACTIVE" as const,
                    });
                } else {
                    skippedCount++;
                }

                currentDate = addDays(currentDate, 7);
            }
        }

        if (bookingsToInsert.length > 0) {
            // Batch insert in Drizzle
            await db.insert(bookings).values(bookingsToInsert);
        }

        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        revalidatePath("/bookings");
        
        return { 
            success: true, 
            count: bookingsToInsert.length,
            classesProcessed: scheduleData.length - skippedCount,
            skipped: skippedCount
        };

    } catch (error) {
        console.error("Error importing routine bookings:", error);
        return { success: false, error: "Gagal memproses jadwal rutin. Pastikan format file benar." };
    }
}

// Day name to getDay() index map
const DAY_INDEX: Record<string, number> = {
    "Minggu": 0, "Senin": 1, "Selasa": 2, "Rabu": 3,
    "Kamis": 4, "Jumat": 5, "Sabtu": 6,
};

export async function createRecurringBooking(data: {
    roomId: number;
    days: string[];        // ["Senin", "Rabu", "Jumat"]
    startDate: string;     // YYYY-MM-DD
    endDate: string;       // YYYY-MM-DD
    startTime: string;     // HH:mm
    endTime: string;       // HH:mm
    purpose: string;
}) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "ADMIN") {
            return { success: false, error: "Unauthorized. Admin access required." };
        }

        if (!data.days || data.days.length === 0) {
            return { success: false, error: "Pilih minimal 1 hari." };
        }

        const startDateBase = new Date(data.startDate + "T00:00:00+07:00");
        const endDateBase   = new Date(data.endDate   + "T23:59:59+07:00");

        if (startDateBase > endDateBase) {
            return { success: false, error: "Tanggal mulai harus sebelum tanggal selesai." };
        }

        const [sH, sM] = data.startTime.split(":").map(Number);
        const [eH, eM] = data.endTime.split(":").map(Number);

        if (sH * 60 + sM >= eH * 60 + eM) {
            return { success: false, error: "Jam selesai harus setelah jam mulai." };
        }

        const targetDayIndexes = data.days
            .map(d => DAY_INDEX[d])
            .filter(i => i !== undefined);

        const bookingsToInsert = [];
        let current = new Date(startDateBase);

        while (current <= endDateBase) {
            const dayIdx = current.getDay();
            if (targetDayIndexes.includes(dayIdx)) {
                const yyyy = current.getFullYear();
                const mm   = String(current.getMonth() + 1).padStart(2, "0");
                const dd   = String(current.getDate()).padStart(2, "0");
                const hS   = String(sH).padStart(2, "0");
                const mS   = String(sM).padStart(2, "0");
                const hE   = String(eH).padStart(2, "0");
                const mE   = String(eM).padStart(2, "0");

                const startDateTime = new Date(`${yyyy}-${mm}-${dd}T${hS}:${mS}:00+07:00`);
                const endDateTime   = new Date(`${yyyy}-${mm}-${dd}T${hE}:${mE}:00+07:00`);

                // Check for conflicts
                const conflict = await checkAvailability(data.roomId, startDateTime, endDateTime);
                if (!conflict.available) {
                    // Skip conflicting slots silently
                } else {
                    bookingsToInsert.push({
                        roomId: data.roomId,
                        userId: currentUser.id,
                        startTime: startDateTime,
                        endTime: endDateTime,
                        purpose: data.purpose || "Booking Berulang (Admin)",
                        status: "ACTIVE" as const,
                    });
                }
            }
            current = addDays(current, 1);
        }

        if (bookingsToInsert.length === 0) {
            return { success: false, error: "Tidak ada slot yang dapat dibooking (semua sudah terpakai atau tidak ada hari yang cocok)." };
        }

        await db.insert(bookings).values(bookingsToInsert);
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        revalidatePath("/bookings");

        return { success: true, count: bookingsToInsert.length };
    } catch (error) {
        console.error("Error creating recurring booking:", error);
        return { success: false, error: "Gagal membuat booking berulang." };
    }
}

export async function createConsecutiveBooking(data: {
    roomId: number;
    startDate: string;  // YYYY-MM-DD
    endDate: string;    // YYYY-MM-DD (can equal startDate for single day)
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
    purpose: string;
    userId: string;
}) {
    try {
        const [sH, sM] = data.startTime.split(":").map(Number);
        const [eH, eM] = data.endTime.split(":").map(Number);

        const startBase = new Date(data.startDate + "T00:00:00+07:00");
        const endBase   = new Date(data.endDate   + "T00:00:00+07:00");

        if (startBase > endBase) {
            return { success: false, error: "Tanggal selesai harus sama atau setelah tanggal mulai." };
        }
        if (sH * 60 + sM >= eH * 60 + eM) {
            return { success: false, error: "Jam selesai harus setelah jam mulai." };
        }

        const bookingsToInsert = [];
        const skippedDates: string[] = [];
        let current = new Date(startBase);

        while (current <= endBase) {
            const yyyy = current.getFullYear();
            const mm   = String(current.getMonth() + 1).padStart(2, "0");
            const dd   = String(current.getDate()).padStart(2, "0");
            const hS   = String(sH).padStart(2, "0");
            const mS   = String(sM).padStart(2, "0");
            const hE   = String(eH).padStart(2, "0");
            const mE   = String(eM).padStart(2, "0");

            const startDT = new Date(`${yyyy}-${mm}-${dd}T${hS}:${mS}:00+07:00`);
            const endDT   = new Date(`${yyyy}-${mm}-${dd}T${hE}:${mE}:00+07:00`);

            const conflict = await checkAvailability(data.roomId, startDT, endDT);
            if (!conflict.available) {
                skippedDates.push(`${dd}/${mm}`);
            } else {
                bookingsToInsert.push({
                    roomId: data.roomId,
                    userId: data.userId,
                    startTime: startDT,
                    endTime: endDT,
                    purpose: data.purpose,
                    status: "ACTIVE" as const,
                });
            }
            current = addDays(current, 1);
        }

        if (bookingsToInsert.length === 0) {
            return { success: false, error: `Semua tanggal sudah terpakai: ${skippedDates.join(", ")}` };
        }

        await db.insert(bookings).values(bookingsToInsert);
        revalidatePath("/rooms");
        revalidatePath("/dashboard");
        revalidatePath("/bookings");

        const msg = skippedDates.length > 0
            ? `${bookingsToInsert.length} booking dibuat. Dilewati (bentrok): ${skippedDates.join(", ")}`
            : undefined;

        return { success: true, count: bookingsToInsert.length, warning: msg };
    } catch (error) {
        console.error("Error creating consecutive booking:", error);
        return { success: false, error: "Gagal membuat booking berhari-hari." };
    }
}
