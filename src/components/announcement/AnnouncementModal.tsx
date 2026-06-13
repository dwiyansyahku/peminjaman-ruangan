"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
    Megaphone,
    Loader2,
    CheckCircle,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Edit,
    CalendarClock,
    CalendarCheck2,
} from "lucide-react";
import {
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncements,
    toggleAnnouncementStatus,
} from "@/actions/announcements";
import { getRoomsAction } from "@/actions/roomsAdmin";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Room } from "@/db/schema";

interface Announcement {
    id: number;
    title: string;
    description: string | null;
    linkedRoomId: number | null;
    isActive: boolean;
    blockedFrom: Date | null;  // repurposed as periodFrom
    blockedUntil: Date | null; // repurposed as periodUntil
    createdAt: Date;
}

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const mins = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

export function AnnouncementModal({ isOpen, onClose, onSuccess }: AnnouncementModalProps) {
    const [view, setView] = useState<"list" | "form">("list");
    const [editing, setEditing] = useState<Announcement | null>(null);

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [linkedRoomId, setLinkedRoomId] = useState("");
    const [hasPeriod, setHasPeriod] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [fromHH, setFromHH] = useState("07");
    const [fromMM, setFromMM] = useState("00");
    const [untilDate, setUntilDate] = useState("");
    const [untilHH, setUntilHH] = useState("18");
    const [untilMM, setUntilMM] = useState("00");
    const [currentTime, setCurrentTime] = useState(new Date());

    const [rooms, setRooms] = useState<Room[]>([]);
    const [announcements, setAnnouncements] = useState<{ announcement: Announcement; room: Room | null }[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

    const loadData = async () => {
        const [roomsData, announcementsData] = await Promise.all([
            getRoomsAction(),
            getAnnouncements(false),
        ]);
        setRooms(roomsData);
        setAnnouncements(announcementsData as { announcement: Announcement; room: Room | null }[]);
    };

    useEffect(() => {
        if (isOpen) {
            loadData();
            const timer = setInterval(() => setCurrentTime(new Date()), 10000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    const resetForm = () => {
        setTitle(""); setDescription(""); setLinkedRoomId("");
        setHasPeriod(false);
        setFromDate(""); setFromHH("07"); setFromMM("00");
        setUntilDate(""); setUntilHH("18"); setUntilMM("00");
        setEditing(null);
    };

    const handleEdit = (ann: Announcement) => {
        setEditing(ann);
        setTitle(ann.title);
        setDescription(ann.description || "");
        setLinkedRoomId(ann.linkedRoomId?.toString() || "");

        if (ann.blockedFrom && ann.blockedUntil) {
            setHasPeriod(true);
            const from = new Date(ann.blockedFrom);
            const until = new Date(ann.blockedUntil);
            setFromDate(from.toISOString().split("T")[0]);
            setFromHH(from.getHours().toString().padStart(2, "0"));
            setFromMM(from.getMinutes().toString().padStart(2, "0"));
            setUntilDate(until.toISOString().split("T")[0]);
            setUntilHH(until.getHours().toString().padStart(2, "0"));
            setUntilMM(until.getMinutes().toString().padStart(2, "0"));
        }
        setView("form");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { toast.error("Judul wajib diisi"); return; }
        if (!linkedRoomId || linkedRoomId === "none") {
            toast.error("Ruangan wajib dipilih"); return;
        }
        if (hasPeriod && (!fromDate || !untilDate)) {
            toast.error("Tanggal periode wajib diisi"); return;
        }

        let blockedFrom: Date | undefined;
        let blockedUntil: Date | undefined;
        if (hasPeriod && fromDate && untilDate) {
            blockedFrom = new Date(`${fromDate}T${fromHH}:${fromMM}:00`);
            blockedUntil = new Date(`${untilDate}T${untilHH}:${untilMM}:00`);
            
            if (isNaN(blockedFrom.getTime()) || isNaN(blockedUntil.getTime())) {
                toast.error("Format tanggal atau waktu tidak valid");
                return;
            }

            if (blockedFrom >= blockedUntil) {
                toast.error("Waktu mulai harus sebelum waktu selesai"); return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || undefined,
                linkedRoomId: (linkedRoomId && linkedRoomId !== "none") ? parseInt(linkedRoomId) : undefined,
                blockedFrom,
                blockedUntil,
            };

            if (editing) {
                const res = await updateAnnouncement(editing.id, {
                    ...payload,
                    blockedFrom: blockedFrom ?? null,
                    blockedUntil: blockedUntil ?? null,
                });
                if (!res.success) throw new Error(res.error);
                toast.success("Pengumuman berhasil diperbarui!");
            } else {
                const res = await createAnnouncement(payload);
                if (!res.success) throw new Error(res.error);
                toast.success("Pengumuman berhasil dibuat!");
            }

            resetForm(); setView("list"); loadData(); onSuccess();
        } catch (err: any) {
            console.error("Submission error:", err);
            const errorMessage = err?.message || (typeof err === "string" ? err : "Gagal menyimpan. Terjadi kesalahan pada server.");
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (announcementId: number) => {
        setDeleteLoadingId(announcementId);
        try {
            const res = await deleteAnnouncement(announcementId);
            if (res.success) { toast.success("Dihapus!"); loadData(); onSuccess(); }
            else toast.error("Gagal menghapus");
        } catch { toast.error("Terjadi kesalahan"); }
        finally { setDeleteLoadingId(null); }
    };

    const handleToggle = async (announcementId: number) => {
        await toggleAnnouncementStatus(announcementId);
        loadData(); onSuccess();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); setView("list"); } }}>
            <DialogContent className="sm:max-w-[620px] border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-800">
                                {view === "list" ? "Kelola Pengumuman" : editing ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                {view === "list"
                                    ? "Pengumuman memberitahu mahasiswa tentang ruangan yang tersedia untuk dipinjam."
                                    : "Isi detail pengumuman yang akan diterima oleh mahasiswa."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* LIST VIEW */}
                {view === "list" ? (
                    <div className="space-y-3 max-h-[62vh] overflow-y-auto pt-2 pr-1">
                        <Button onClick={() => { resetForm(); setView("form"); }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold gap-2">
                            <Megaphone className="w-4 h-4" /> Buat Pengumuman Baru
                        </Button>

                        {announcements.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm italic py-8">Belum ada pengumuman</p>
                        ) : (
                            announcements.map(({ announcement, room }) => (
                                <div key={announcement.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-all">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <p className="font-bold text-slate-800 truncate">{announcement.title}</p>
                                                {(() => {
                                                    if (!announcement.isActive) return <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] uppercase">Non-aktif</Badge>;
                                                    const isFinished = announcement.blockedUntil ? new Date(announcement.blockedUntil) <= currentTime : false;
                                                    if (isFinished) return <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] uppercase">Selesai</Badge>;
                                                    return <Badge className="bg-green-100 text-green-700 border-none text-[10px] uppercase">Aktif</Badge>;
                                                })()}
                                                {room && <Badge className="bg-blue-100 text-blue-700 border-none text-[10px]">{room.name}</Badge>}
                                            </div>
                                            {announcement.description && (
                                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{announcement.description}</p>
                                            )}
                                            {announcement.blockedFrom && announcement.blockedUntil && (
                                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg px-2 py-1 w-fit">
                                                    <CalendarClock className="w-3 h-3" />
                                                    <span className="font-medium">Periode:</span>
                                                    {format(new Date(announcement.blockedFrom), "dd MMM, HH:mm", { locale: id })}
                                                    {" — "}
                                                    {format(new Date(announcement.blockedUntil), "dd MMM yyyy, HH:mm", { locale: id })}
                                                </div>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1">
                                                Diluncurkan: {format(new Date(announcement.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => handleToggle(announcement.id)} className="rounded-lg">
                                                {announcement.isActive
                                                    ? <ToggleRight className="w-5 h-5 text-green-500" />
                                                    : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement)} className="rounded-lg">
                                                <Edit className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(announcement.id)}
                                                disabled={deleteLoadingId === announcement.id} className="rounded-lg">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* FORM VIEW */
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700">Judul <span className="text-red-500">*</span></Label>
                            <Input placeholder="Contoh: Ruang CASSING Tersedia untuk Peminjaman!"
                                value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl bg-slate-50" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700">Keterangan <span className="text-slate-400 font-normal">(opsional)</span></Label>
                            <Textarea placeholder="Informasi tambahan tentang pengumuman ini..."
                                value={description} onChange={e => setDescription(e.target.value)}
                                className="rounded-xl bg-slate-50 resize-none" rows={2} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700">Ruangan yang Diumumkan <span className="text-red-500">*</span></Label>
                            <Select value={linkedRoomId} onValueChange={setLinkedRoomId}>
                                <SelectTrigger className="rounded-xl bg-slate-50"><SelectValue placeholder="Pilih ruangan..." /></SelectTrigger>
                                <SelectContent className="max-h-[200px] rounded-xl">
                                    {rooms.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-400 ml-1">Jika dipilih, mahasiswa akan diarahkan langsung ke ruangan ini saat klik notifikasi.</p>
                        </div>

                        {/* Period toggle */}
                        <div className={`rounded-xl border-2 transition-all ${hasPeriod ? "border-blue-200 bg-blue-50/60" : "border-slate-100 bg-slate-50"} p-4 space-y-4`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarClock className={`w-4 h-4 ${hasPeriod ? "text-blue-500" : "text-slate-400"}`} />
                                    <Label className={`font-semibold ${hasPeriod ? "text-blue-700" : "text-slate-600"}`}>
                                        Tetapkan Periode Tersedia
                                    </Label>
                                </div>
                                <button type="button" onClick={() => setHasPeriod(v => !v)} className="flex-shrink-0">
                                    {hasPeriod
                                        ? <ToggleRight className="w-7 h-7 text-blue-500" />
                                        : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                                </button>
                            </div>

                            {hasPeriod && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
                                            <CalendarClock className="w-3.5 h-3.5" /> Mulai
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                                className="rounded-xl bg-white flex-1" />
                                            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden h-10 w-[130px]">
                                                <Select value={fromHH} onValueChange={setFromHH}>
                                                    <SelectTrigger className="border-0 shadow-none focus:ring-0 rounded-none w-full text-center text-sm">
                                                        <SelectValue /></SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="flex items-center text-slate-400 font-bold text-sm">:</span>
                                                <Select value={fromMM} onValueChange={setFromMM}>
                                                    <SelectTrigger className="border-0 shadow-none focus:ring-0 rounded-none w-full text-center text-sm">
                                                        <SelectValue /></SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {mins.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
                                            <CalendarCheck2 className="w-3.5 h-3.5" /> Sampai
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input type="date" value={untilDate} onChange={e => setUntilDate(e.target.value)}
                                                className="rounded-xl bg-white flex-1" />
                                            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden h-10 w-[130px]">
                                                <Select value={untilHH} onValueChange={setUntilHH}>
                                                    <SelectTrigger className="border-0 shadow-none focus:ring-0 rounded-none w-full text-center text-sm">
                                                        <SelectValue /></SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="flex items-center text-slate-400 font-bold text-sm">:</span>
                                                <Select value={untilMM} onValueChange={setUntilMM}>
                                                    <SelectTrigger className="border-0 shadow-none focus:ring-0 rounded-none w-full text-center text-sm">
                                                        <SelectValue /></SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {mins.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-600 font-medium">
                                        💡 Periode ini ditampilkan kepada mahasiswa sebagai informasi kapan ruangan tersedia untuk dipinjam.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button type="button" variant="outline" className="flex-1 rounded-xl"
                                onClick={() => { setView("list"); resetForm(); }} disabled={loading}>
                                Kembali
                            </Button>
                            <Button type="submit"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
                                disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                {editing ? "Simpan Perubahan" : "Buat Pengumuman"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
