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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, Loader2, CheckCircle, CalendarRange, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createConsecutiveBooking } from "@/actions/bookings";
import { getRoomsAction } from "@/actions/roomsAdmin";
import { createRoom } from "@/actions/rooms";
import { toast } from "sonner";
import type { Room } from "@/db/schema";

interface AdminBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    adminId: string;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

export function AdminBookingModal({ isOpen, onClose, onSuccess, adminId }: AdminBookingModalProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [customRoomName, setCustomRoomName] = useState("");

    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    const [startHour, setStartHour] = useState("");
    const [startMinute, setStartMinute] = useState("");
    const [endHour, setEndHour] = useState("");
    const [endMinute, setEndMinute] = useState("");

    const [purpose, setPurpose] = useState("");
    const [loading, setLoading] = useState(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const isToday = startDate && format(startDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

    const availableHours = isToday 
        ? hours.filter(h => parseInt(h) >= currentHour)
        : hours;

    const availableMinutes = (isToday && startHour && parseInt(startHour) === currentHour)
        ? minutes.filter(m => parseInt(m) > currentMinute)
        : minutes;

    useEffect(() => {
        if (isOpen) {
            getRoomsAction().then(setRooms).catch(console.error);
            // Reset state
            setSelectedRoomId("");
            setCustomRoomName("");
            setStartDate(undefined);
            setEndDate(undefined);
            setStartHour("");
            setStartMinute("");
            setEndHour("");
            setEndMinute("");
            setPurpose("");
        }
    }, [isOpen]);

    const isMultiDay = endDate && startDate && format(endDate, "yyyy-MM-dd") !== format(startDate, "yyyy-MM-dd");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRoomId || !startDate || !purpose.trim()) {
            toast.error("Mohon lengkapi semua field.");
            return;
        }
        if (!startHour || !startMinute || !endHour || !endMinute) {
            toast.error("Mohon pilih jam mulai dan selesai.");
            return;
        }

        const sMin = parseInt(startHour) * 60 + parseInt(startMinute);
        const eMin = parseInt(endHour) * 60 + parseInt(endMinute);
        if (sMin >= eMin) {
            toast.error("Jam selesai harus setelah jam mulai.");
            return;
        }

        setLoading(true);
        let finalRoomId = selectedRoomId;

        if (selectedRoomId === "custom") {
            if (!customRoomName.trim()) {
                toast.error("Nama ruangan kustom wajib diisi.");
                setLoading(false);
                return;
            }
            try {
                const newRoomRes = await createRoom({
                    name: customRoomName.trim(),
                    capacity: 20,
                    openHour: "00:00",
                    closeHour: "23:59",
                    facilities: "Ruangan Kustom",
                    description: "Dibuat otomatis dari booking manual",
                });
                if (newRoomRes.success && newRoomRes.data) {
                    finalRoomId = newRoomRes.data.id.toString();
                } else {
                    toast.error("Gagal membuat ruangan kustom.");
                    setLoading(false);
                    return;
                }
            } catch {
                toast.error("Terjadi kesalahan saat membuat ruangan kustom.");
                setLoading(false);
                return;
            }
        }

        try {
            const res = await createConsecutiveBooking({
                roomId: parseInt(finalRoomId),
                startDate: format(startDate, "yyyy-MM-dd"),
                endDate: format(endDate ?? startDate, "yyyy-MM-dd"),
                startTime: `${startHour}:${startMinute}`,
                endTime: `${endHour}:${endMinute}`,
                purpose: purpose.trim(),
                userId: adminId,
            });

            if (res.success) {
                if (res.warning) {
                    toast.warning(res.warning);
                } else {
                    const label = (res.count ?? 0) > 1 ? `${res.count} booking` : "Booking";
                    toast.success(`${label} berhasil ditambahkan!`);
                }
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || "Gagal membuat booking.");
            }
        } catch {
            toast.error("Terjadi kesalahan saat memproses booking.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarRange className="h-5 w-5 text-blue-600" />
                        Tambah Booking Manual
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Pesan ruangan untuk satu hari atau beberapa hari berturut-turut.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {/* Room picker */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700">Pilih Ruangan</Label>
                        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                            <SelectTrigger className="w-full rounded-xl bg-slate-50">
                                <SelectValue placeholder="Pilih ruangan..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] rounded-xl">
                                {rooms.map(room => (
                                    <SelectItem key={room.id} value={room.id.toString()}>
                                        {room.name}
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom" className="font-semibold text-blue-600">
                                    + Input Ruangan Manual...
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {selectedRoomId === "custom" && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                                <Input
                                    placeholder="Masukkan nama ruangan baru..."
                                    value={customRoomName}
                                    onChange={e => setCustomRoomName(e.target.value)}
                                    className="bg-blue-50/50 border-blue-200 focus-visible:ring-blue-500 rounded-xl"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 text-xs">Tanggal Mulai</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl bg-slate-50 text-sm",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : "Pilih..."}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={d => {
                                            setStartDate(d);
                                            // reset end date if before new start
                                            if (d && endDate && endDate < d) setEndDate(d);
                                        }}
                                        disabled={{ before: today }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 text-xs">
                                Tanggal Selesai
                                <span className="text-slate-400 font-normal ml-1">(opsional)</span>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl bg-slate-50 text-sm",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "dd MMM yyyy", { locale: id }) : "Pilih..."}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        disabled={startDate ? { before: startDate } : { before: today }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Multi-day info */}
                    {isMultiDay && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 font-medium flex items-center gap-1.5">
                            <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                            Booking akan dibuat untuk setiap hari dari {format(startDate!, "dd MMM", { locale: id })} hingga {format(endDate!, "dd MMM yyyy", { locale: id })} pada jam yang sama.
                        </div>
                    )}

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700 text-sm ml-1 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                Jam Mulai
                            </Label>
                            <div className="flex gap-2 items-center">
                                <Select value={startHour} onValueChange={setStartHour}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-blue-500/20"><SelectValue placeholder="HH" /></SelectTrigger>
                                    <SelectContent className="h-[200px]">
                                        {availableHours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <span className="text-lg font-bold text-slate-400">:</span>
                                <Select value={startMinute} onValueChange={setStartMinute}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-blue-500/20"><SelectValue placeholder="MM" /></SelectTrigger>
                                    <SelectContent>
                                        {availableMinutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700 text-sm ml-1 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                Jam Selesai
                            </Label>
                            <div className="flex gap-2 items-center">
                                <Select value={endHour} onValueChange={setEndHour}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-blue-500/20"><SelectValue placeholder="HH" /></SelectTrigger>
                                    <SelectContent className="h-[200px]">
                                        {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <span className="text-lg font-bold text-slate-400">:</span>
                                <Select value={endMinute} onValueChange={setEndMinute}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-blue-500/20"><SelectValue placeholder="MM" /></SelectTrigger>
                                    <SelectContent>
                                        {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700 ml-1 flex items-center gap-1.5">
                            <Plus className="h-3.5 w-3.5 text-blue-500" />
                            Tujuan Peminjaman
                        </Label>
                        <Textarea
                            placeholder="Contoh: Rapat Dosen, Kegiatan Mahasiswa"
                            className="bg-slate-50 rounded-xl resize-none border-slate-200 focus:bg-white focus:ring-blue-500/10 transition-all"
                            value={purpose}
                            onChange={e => setPurpose(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100" onClick={onClose} disabled={loading}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 rounded-xl"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            {loading ? "Memproses..." : "Simpan Booking"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
