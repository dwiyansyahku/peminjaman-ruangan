"use server";

import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getRoomsAction() {
    try {
        const allRooms = await db.select().from(rooms).where(eq(rooms.status, "AVAILABLE"));
        return allRooms;
    } catch (error) {
        console.error("Error fetching rooms for admin:", error);
        return [];
    }
}
