"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCurrentUser() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return null;

        // Try to get user from database
        const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id));

        // If user exists in database, return it
        if (dbUser[0]) {
            return dbUser[0];
        }

        // If user doesn't exist in database, create them
        // This handles the case when the Supabase trigger didn't run
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const newUser = await db
            .insert(users)
            .values({
                id: user.id,
                email: user.email || '',
                fullName: fullName,
                role: 'STUDENT',
            })
            .returning();

        return newUser[0] || null;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

export async function getUserById(userId: string) {
    try {
        const result = await db.select().from(users).where(eq(users.id, userId));
        return result[0] || null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

export async function createUserProfile(data: {
    id: string;
    email: string;
    fullName: string;
    role?: "ADMIN" | "STUDENT";
}) {
    try {
        const result = await db
            .insert(users)
            .values({
                id: data.id,
                email: data.email,
                fullName: data.fullName,
                role: data.role || "STUDENT",
            })
            .returning();
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error creating user profile:", error);
        return { success: false, error: "Failed to create user profile" };
    }
}

export async function updateUserRole(userId: string, role: "ADMIN" | "STUDENT") {
    try {
        const result = await db
            .update(users)
            .set({ role, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error updating user role:", error);
        return { success: false, error: "Failed to update user role" };
    }
}

export async function getAllUsers() {
    try {
        return await db.select().from(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function getUserByEmail(email: string) {
    try {
        const result = await db.select().from(users).where(eq(users.email, email));
        return result[0] || null;
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
}

export async function getUserByNim(nim: string) {
    try {
        const result = await db.select().from(users).where(eq(users.nim, nim));
        return result[0] || null;
    } catch (error) {
        console.error("Error fetching user by nim:", error);
        return null;
    }
}

export async function updateUserProfile(userId: string, data: { fullName: string, nim?: string, prodi?: string, phone?: string }) {
    try {
        const result = await db
            .update(users)
            .set({
                fullName: data.fullName,
                nim: data.nim || null,
                prodi: data.prodi || null,
                phone: data.phone || null,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))
            .returning();
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error updating user details:", error);
        return { success: false, error: "Gagal memperbarui profil" };
    }
}

export async function adminUpdateUser(userId: string, data: { fullName?: string, nim?: string, prodi?: string, phone?: string, role?: "ADMIN" | "STUDENT" }) {
    try {
        const updateData: any = { updatedAt: new Date() };
        if (data.fullName !== undefined) updateData.fullName = data.fullName;
        if (data.nim !== undefined) updateData.nim = data.nim || null;
        if (data.prodi !== undefined) updateData.prodi = data.prodi || null;
        if (data.phone !== undefined) updateData.phone = data.phone || null;
        if (data.role !== undefined) updateData.role = data.role;

        const result = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();
            
        revalidatePath("/users");
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Error updating user by admin:", error);
        return { success: false, error: "Gagal memperbarui data user" };
    }
}

export async function deleteUser(userId: string) {
    try {
        await db.delete(users).where(eq(users.id, userId));
        revalidatePath("/users");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Gagal menghapus user" };
    }
}
