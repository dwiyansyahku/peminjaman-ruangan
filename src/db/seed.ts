// Seed script for development
// Run with: npx tsx src/db/seed.ts

import { db } from "./index";
import { rooms, announcements } from "./schema";

async function seed() {
    console.log("🌱 Seeding database...");

    // Seed Rooms
    const roomsData = [
        {
            name: "Ruang Rapat Utama",
            capacity: 20,
            status: "AVAILABLE" as const,
            facilities: JSON.stringify(["Proyektor", "AC", "Whiteboard", "Wi-Fi", "Sound System"]),
            imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
            description: "Ruang rapat utama dengan fasilitas lengkap untuk meeting besar dan presentasi.",
        },
        {
            name: "Lab Komputer A",
            capacity: 40,
            status: "AVAILABLE" as const,
            facilities: JSON.stringify(["40 Komputer", "Proyektor", "AC", "Wi-Fi"]),
            imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
            description: "Laboratorium komputer dengan 40 unit PC untuk praktikum dan pelatihan.",
        },
        {
            name: "Aula Serbaguna",
            capacity: 200,
            status: "AVAILABLE" as const,
            facilities: JSON.stringify(["Panggung", "Sound System", "AC", "Proyektor", "200 Kursi"]),
            imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
            description: "Aula besar untuk seminar, workshop, dan acara kampus.",
        },
        {
            name: "Ruang Diskusi 1",
            capacity: 8,
            status: "AVAILABLE" as const,
            facilities: JSON.stringify(["TV", "Whiteboard", "AC"]),
            imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
            description: "Ruang diskusi kecil untuk kelompok studi dan brainstorming.",
        },
        {
            name: "Ruang Diskusi 2",
            capacity: 10,
            status: "AVAILABLE" as const,
            facilities: JSON.stringify(["Proyektor", "Whiteboard", "AC"]),
            imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
            description: "Ruang diskusi untuk meeting tim dan presentasi kelompok.",
        },
        {
            name: "Lab Multimedia",
            capacity: 25,
            status: "MAINTENANCE" as const,
            facilities: JSON.stringify(["25 iMac", "Software Editing", "Green Screen", "AC"]),
            imageUrl: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800",
            description: "Laboratorium multimedia untuk editing video dan desain grafis.",
        },
        {
            name: "Ruang Seminar A",
            capacity: 50,
            status: "AVAILABLE" as const,
            facilities: JSON.stringify(["Proyektor", "Mic Wireless", "AC", "Podium"]),
            imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
            description: "Ruang seminar untuk presentasi dan kuliah tamu.",
        },
        {
            name: "Ruang Seminar B",
            capacity: 50,
            status: "AVAILABLE" as const,
            facilities: JSON.stringify(["Proyektor", "Mic Wireless", "AC", "Podium"]),
            imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
            description: "Ruang seminar kedua dengan kapasitas sama.",
        },
    ];

    console.log("📦 Inserting rooms...");
    await db.insert(rooms).values(roomsData);

    // Seed Announcements
    const announcementsData = [
        {
            title: "Lab Komputer A Tersedia untuk Praktikum",
            description: "Lab Komputer A kini tersedia untuk praktikum dan pelatihan. Segera booking untuk kegiatan Anda!",
            linkedRoomId: 2,
            isActive: true,
        },
        {
            title: "Ruang Rapat Utama - Booking Minggu Ini",
            description: "Ruang rapat utama masih memiliki slot kosong minggu ini. Cocok untuk meeting tim dan presentasi proyek.",
            linkedRoomId: 1,
            isActive: true,
        },
        {
            title: "Maintenance Lab Multimedia",
            description: "Lab Multimedia sedang dalam maintenance untuk upgrade perangkat. Diperkirakan selesai minggu depan.",
            isActive: true,
        },
    ];

    console.log("📢 Inserting announcements...");
    await db.insert(announcements).values(announcementsData);

    console.log("✅ Seeding completed!");
    process.exit(0);
}

seed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});
