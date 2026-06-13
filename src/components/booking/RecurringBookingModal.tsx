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
import { CalendarIcon, Loader2, RepeatIcon, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createRecurringBooking } from "@/actions/bookings";
import { getRoomsAction } from "@/actions/roomsAdmin";
import { toast } from "sonner";
import type { Room } from "@/db/schema";

const ALL_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

interface RecurringBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    adminId: string;
}

export function RecurringBookingModal({ isOpen, onClose, onSuccess, adminId }: RecurringBookingModalProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [startHour, setStartHour] = useState("08");
    const [startMinute, setStartMinute] = useState("00");
    const [endHour, setEndHour] = useState("10");
    const [endMinute, setEndMinute] = useState("00");
    const [purpose, setPurpose] = useState("");
    const [loading, setLoading] = useState(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useEffect(() => {
        if (isOpen) {
            getRoomsAction().then(setRooms).catch(console.error);
            // Reset
            setSelectedRoomId("");
            setSelectedDays([]);
            setStartDate(undefined);
            setEndDate(undefined);
            setStartHour("08");
            setStartMinute("00");
            setEndHour("10");
            setEndMinute("00");
            setPurpose("");
        }
    }, [isOpen]);

    const toggleDay = (day: string) => {
        setSelectedDays(prev => {
            const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
            return [...next].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRoomId) { toast.error("Pilih ruangan terlebih dahulu."); return; }
        if (selectedDays.length === 0) { toast.error("Pilih minimal 1 hari."); return; }
        if (!startDate || !endDate) { toast.error("Lengkapi rentang tanggal."); return; }
        if (!purpose.trim()) { toast.error("Isi tujuan peminjaman."); return; }

        const sMin = parseInt(startHour) * 60 + parseInt(startMinute);
        const eMin = parseInt(endHour) * 60 + parseInt(endMinute);
        if (sMin >= eMin) { toast.error("Jam selesai harus setelah jam mulai."); return; }

        setLoading(true);
        try {
            const res = await createRecurringBooking({
                roomId: parseInt(selectedRoomId),
                days: selectedDays,
                startDate: format(startDate, "yyyy-MM-dd"),
                endDate: format(endDate, "yyyy-MM-dd"),
                startTime: `${startHour}:${startMinute}`,
                endTime: `${endHour}:${endMinute}`,
                purpose: purpose.trim(),
            });

            if (res.success) {
                toast.success(`Berhasil membuat ${res.count} booking berulang!`);
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || "Gagal membuat booking berulang.");
            }
        } catch {
            toast.error("Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    const selectedRoom = rooms.find(r => r.id.toString() === selectedRoomId);

    return (
        <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[540px] border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <RepeatIcon className="h-5 w-5 text-orange-500" />
                        Booking Berulang
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Blokir ruangan di hari-hari tertentu dalam rentang tanggal yang ditentukan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                    {/* Room */}
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
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Days of week */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Pilih Hari</Label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_DAYS.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all",
                                        selectedDays.includes(day)
                                            ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-orange-300"
                                    )}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        {selectedDays.length > 0 && (
                            <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {selectedDays.join(", ")} dipilih
                            </p>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 text-xs">Tanggal Mulai</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl bg-slate-50 text-sm", !startDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : "Pilih..."}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        disabled={{ before: today }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 text-xs">Tanggal Selesai</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl bg-slate-50 text-sm", !endDate && "text-muted-foreground")}>
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

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700 text-sm ml-1 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                Jam Mulai
                            </Label>
                            <div className="flex gap-2 items-center">
                                <Select value={startHour} onValueChange={setStartHour}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-orange-500/20"><SelectValue placeholder="HH" /></SelectTrigger>
                                    <SelectContent className="h-[200px]">
                                        {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <span className="text-lg font-bold text-slate-400">:</span>
                                <Select value={startMinute} onValueChange={setStartMinute}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-orange-500/20"><SelectValue placeholder="MM" /></SelectTrigger>
                                    <SelectContent>
                                        {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
                                <Select value={endHour} onValueChange={setHour => setEndHour(setHour)}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-orange-500/20"><SelectValue placeholder="HH" /></SelectTrigger>
                                    <SelectContent className="h-[200px]">
                                        {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <span className="text-lg font-bold text-slate-400">:</span>
                                <Select value={endMinute} onValueChange={setEndMinute}>
                                    <SelectTrigger className="flex-1 bg-slate-50 rounded-xl border-slate-200 focus:ring-orange-500/20"><SelectValue placeholder="MM" /></SelectTrigger>
                                    <SelectContent>
                                        {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedRoom && selectedDays.length > 0 && startDate && endDate && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-orange-700">
                                Ruangan <strong>{selectedRoom.name}</strong> akan diblokir setiap <strong>{selectedDays.join(", ")}</strong> jam <strong>{startHour}:{startMinute}–{endHour}:{endMinute}</strong> dari <strong>{format(startDate, "dd MMM", { locale: id })}</strong> s/d <strong>{format(endDate, "dd MMM yyyy", { locale: id })}</strong>.
                            </p>
                        </div>
                    )}

                    {/* Purpose */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700">Tujuan / Keterangan</Label>
                        <Textarea
                            placeholder="Contoh: Kelas Teknik Lingkungan 2025/2026"
                            className="bg-slate-50 rounded-xl resize-none"
                            value={purpose}
                            onChange={e => setPurpose(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={loading}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 rounded-xl"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RepeatIcon className="w-4 h-4 mr-2" />}
                            {loading ? "Memproses..." : "Buat Booking Berulang"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
