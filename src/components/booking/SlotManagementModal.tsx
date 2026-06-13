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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Loader2, CheckCircle2, XCircle, Search, User } from "lucide-react";
import { getAllBookings, updateBookingStatus } from "@/actions/bookings";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Room } from "@/db/schema";

type BookingStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

interface BookingUser {
    id: string;
    fullName: string;
    email: string;
}

interface Booking {
    id: number;
    roomId: number;
    userId: string;
    startTime: Date;
    endTime: Date;
    status: string;
    purpose: string | null;
    createdAt: Date;
}

interface SlotEntry {
    booking: Booking;
    room: Room;
    user: BookingUser;
}

interface SlotManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
    ACTIVE: "Aktif",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
};

export function SlotManagementModal({ isOpen, onClose, onSuccess }: SlotManagementModalProps) {
    const [bookings, setBookings] = useState<SlotEntry[]>([]);
    const [filtered, setFiltered] = useState<SlotEntry[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(data as SlotEntry[]);
        } catch {
            toast.error("Gagal memuat data booking");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadBookings();
    }, [isOpen]);

    useEffect(() => {
        let result = [...bookings];
        if (statusFilter !== "ALL") {
            result = result.filter(b => b.booking.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(b =>
                b.room.name.toLowerCase().includes(q) ||
                b.user.fullName.toLowerCase().includes(q) ||
                b.booking.purpose?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [bookings, statusFilter, search]);

    const handleAction = async (bookingId: number, status: BookingStatus) => {
        setActionLoadingId(bookingId);
        try {
            const res = await updateBookingStatus(bookingId, status);
            if (res.success) {
                const label = status === "COMPLETED" ? "diselesaikan" : "dibatalkan";
                toast.success(`Booking berhasil ${label}!`);
                loadBookings();
                onSuccess();
            } else {
                toast.error("Gagal memperbarui status booking");
            }
        } catch {
            toast.error("Terjadi kesalahan");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                            <CalendarClock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-800">Kelola Slot Booking</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                Lihat, selesaikan, atau batalkan slot peminjaman ruangan.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Filters */}
                <div className="flex gap-3 pt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Cari ruangan, peminjam, atau tujuan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rounded-xl bg-slate-50"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | BookingStatus)}>
                        <SelectTrigger className="w-[160px] rounded-xl bg-slate-50">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="ACTIVE">Aktif</SelectItem>
                            <SelectItem value="COMPLETED">Selesai</SelectItem>
                            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Booking List */}
                <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm italic">
                            Tidak ada data booking ditemukan
                        </div>
                    ) : (
                        filtered.map(({ booking, room, user }) => (
                            <div key={booking.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            <p className="font-bold text-slate-800">{room.name}</p>
                                            <Badge className={`${statusColors[booking.status] || "bg-slate-100 text-slate-600"} border-none text-[10px] uppercase tracking-wider`}>
                                                {statusLabels[booking.status] || booking.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="font-medium">{user.fullName}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-xs">{user.email}</span>
                                        </div>
                                        {booking.purpose && (
                                            <p className="text-sm text-slate-500 italic mb-1 line-clamp-1">"{booking.purpose}"</p>
                                        )}
                                        <p className="text-xs text-slate-400 font-mono">
                                            {format(new Date(booking.startTime), "dd MMM yyyy, HH:mm", { locale: id })}
                                            {" → "}
                                            {format(new Date(booking.endTime), "HH:mm", { locale: id })}
                                        </p>
                                    </div>

                                    {booking.status === "ACTIVE" && (
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(booking.id, "COMPLETED")}
                                                disabled={actionLoadingId === booking.id}
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold gap-1.5"
                                            >
                                                {actionLoadingId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                Selesai
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAction(booking.id, "CANCELLED")}
                                                disabled={actionLoadingId === booking.id}
                                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold gap-1.5"
                                            >
                                                {actionLoadingId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                Batalkan
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        {filtered.length} dari {bookings.length} data booking ditampilkan
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
