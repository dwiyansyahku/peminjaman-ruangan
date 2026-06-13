"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    Megaphone,
    Plus,
} from "lucide-react";
import { getCurrentUser } from "@/actions/users";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/actions/announcements";
import { getRooms } from "@/actions/rooms";
import type { User, Announcement, Room } from "@/db/schema";
import { format } from "date-fns";

type AnnouncementWithRoom = {
    announcement: Announcement;
    room: Room | null;
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<AnnouncementWithRoom[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [linkedRoomId, setLinkedRoomId] = useState<string>("");

    const [dateFilter, setDateFilter] = useState("");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [userData, announcementsData, roomsData] = await Promise.all([
                getCurrentUser(),
                getAnnouncements(false),
                getRooms(),
            ]);
            setUser(userData);
            setAnnouncements(announcementsData);
            setRooms(roomsData);
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenDialog = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setTitle(announcement.title);
            setDescription(announcement.description || "");
            setLinkedRoomId(announcement.linkedRoomId?.toString() || "");
        } else {
            setEditingAnnouncement(null);
            setTitle("");
            setDescription("");
            setLinkedRoomId("");
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingAnnouncement(null);
        setTitle("");
        setDescription("");
        setLinkedRoomId("");
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Judul harus diisi");
            return;
        }

        const data = {
            title: title.trim(),
            description: description.trim() || undefined,
            linkedRoomId: linkedRoomId ? parseInt(linkedRoomId) : undefined,
        };

        let result;
        if (editingAnnouncement) {
            result = await updateAnnouncement(editingAnnouncement.id, data);
        } else {
            result = await createAnnouncement(data);
        }

        if (result.success) {
            toast.success(
                editingAnnouncement
                    ? "Pengumuman berhasil diperbarui"
                    : "Pengumuman berhasil dibuat"
            );
            handleCloseDialog();
            loadData();
        } else {
            toast.error(result.error || "Gagal menyimpan pengumuman");
        }
    };

    const isAdmin = user?.role === "ADMIN";

    return (
        <div className="min-h-screen">
            <div className="p-6">
                {/* Page Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Pengumuman</h1>
                        <p className="mt-1 text-slate-600">
                            Kelola pengumuman ruangan kosong
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filter Tanggal:</Label>
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-auto h-9 border-slate-200 bg-white focus:bg-white rounded-xl text-sm transition-colors"
                        />
                        {dateFilter && (
                            <Button variant="ghost" size="sm" onClick={() => setDateFilter("")} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-9 px-2">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-6 flex gap-4">
                    <div className="rounded-lg border bg-green-50 px-4 py-2 text-green-700">
                        <span className="text-sm">Aktif: </span>
                        <span className="font-semibold">
                            {announcements.filter((a) => a.announcement.isActive).length}
                        </span>
                    </div>
                    <div className="rounded-lg border bg-slate-100 px-4 py-2 text-slate-700">
                        <span className="text-sm">Total: </span>
                        <span className="font-semibold">{announcements.length}</span>
                    </div>
                </div>

                {/* Announcements List */}
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200" />
                        ))}
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed">
                        <div className="text-center">
                            <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-lg font-medium text-slate-600">
                                Belum ada pengumuman
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {announcements
                            .filter(a => !dateFilter || format(new Date(a.announcement.createdAt), "yyyy-MM-dd") === dateFilter)
                            .map(({ announcement, room }) => (
                                <AnnouncementCard
                                    key={announcement.id}
                                    announcement={announcement}
                                    linkedRoom={room}
                                    isAdmin={isAdmin}
                                    onEdit={handleOpenDialog}
                                    disabled={format(new Date(announcement.createdAt), "yyyy-MM-dd") < format(new Date(), "yyyy-MM-dd")}
                                />
                            ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                    <DialogHeader className="pb-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-800">
                            {editingAnnouncement ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium mt-1.5">
                            Pengumuman akan ditampilkan kepada mahasiswa di dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul</Label>
                            <Input
                                id="title"
                                placeholder="Contoh: Ruangan Lab Komputer Tersedia"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi (Opsional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Deskripsi pengumuman..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all resize-none h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedRoom" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Link ke Ruangan (Opsional)</Label>
                            <Select value={linkedRoomId} onValueChange={setLinkedRoomId}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all">
                                    <SelectValue placeholder="Pilih ruangan..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="none">Tidak ada</SelectItem>
                                    {rooms.map((room) => (
                                        <SelectItem key={room.id} value={room.id.toString()}>
                                            {room.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs font-medium text-slate-400 mt-1.5">
                                Jika dipilih, mahasiswa dapat langsung booking ruangan dari pengumuman
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-100 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={handleCloseDialog} className="rounded-xl font-semibold border-slate-200 hover:bg-slate-50 text-slate-600">
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                        >
                            {editingAnnouncement ? "Simpan Perubahan" : "Buat Pengumuman"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
