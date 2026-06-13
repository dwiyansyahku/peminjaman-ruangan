"use server";

import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
    try {
        const settings = await db.select().from(systemSettings);
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        return { success: true, data: settingsMap };
    } catch (error) {
        console.error("Error fetching system settings:", error);
        return { success: false, error: "Gagal mengambil pengaturan sistem" };
    }
}

export async function updateSystemSetting(key: string, value: string) {
    try {
        await db.insert(systemSettings)
            .values({ key, value })
            .onConflictDoUpdate({
                target: systemSettings.key,
                set: { value, updatedAt: new Date() }
            });
            
        revalidatePath("/");
        revalidatePath("/(dashboard)/settings");
        revalidatePath("/(dashboard)/rooms");
        return { success: true };
    } catch (error) {
        console.error(`Error updating system setting [${key}]:`, error);
        return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui pengaturan" };
    }
}

