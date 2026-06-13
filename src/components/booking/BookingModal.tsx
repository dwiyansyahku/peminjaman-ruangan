"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Calendar as CalendarIcon,
    Clock,
    Building2,
    AlertCircle,
    Info,
    CalendarCheck,
    CheckCircle
} from "lucide-react";
import { createBooking, checkAvailability, getRoomBookings } from "@/actions/bookings";
import type { Room, Booking } from "@/db/schema";
import { format, setHours, setMinutes, isBefore } from "date-fns";
import { id } from "date-fns/locale";

interface BookingModalProps {
    room: Room | null;
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess?: () => void;
    preSelectedDate?: Date;
    preSelectedStartHour?: string;
    preSelectedStartMinute?: string;
    preSelectedEndHour?: string;
    preSelectedEndMinute?: string;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export function BookingModal({
    room,
    isOpen,
    onClose,
    userId,
    onSuccess,
    preSelectedDate,
    preSelectedStartHour,
    preSelectedStartMinute,
    preSelectedEndHour,
    preSelectedEndMinute,
}: BookingModalProps) {
    const now = new Date();
    const currentHourStr = now.getHours().toString().padStart(2, '0');
    const currentMinuteStr = now.getMinutes().toString().padStart(2, '0');

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(preSelectedDate || undefined);
    const [startHour, setStartHour] = useState<string>(preSelectedStartHour || "");
    const [startMinute, setStartMinute] = useState<string>(preSelectedStartMinute || "");
    const [endHour, setEndHour] = useState<string>(preSelectedEndHour || "");
    const [endMinute, setEndMinute] = useState<string>(preSelectedEndMinute || "");
    const [purpose, setPurpose] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<Booking[]>([]);

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

    const isToday = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

    useEffect(() => {
        if (isToday) {
            // If currently selected startHour is in the past, reset it
            if (startHour && parseInt(startHour) < currentHour) {
                setStartHour("");
                setStartMinute("");
            } 
            // If current hour but minute is in the past, reset minute
            else if (startHour && parseInt(startHour) === currentHour && startMinute && parseInt(startMinute) <= currentMinute) {
                setStartMinute("");
            }
        }
    }, [isToday, currentHour, currentMinute, startHour, startMinute]);

    const isFutureDate = selectedDate && format(selectedDate, "yyyy-MM-dd") > format(now, "yyyy-MM-dd");

    const availableHours = isFutureDate 
        ? hours
        : hours.filter(h => parseInt(h) >= currentHour);

    const availableMinutes = (!isFutureDate && parseInt(startHour || currentHour.toString()) === currentHour)
        ? minutes.filter(m => parseInt(m) >= currentMinute)
        : minutes;

    const availableEndHours = isFutureDate
        ? hours
        : hours.filter(h => parseInt(h) >= currentHour);

    const availableEndMinutes = (!isFutureDate && parseInt(endHour || currentHour.toString()) === currentHour)
        ? minutes.filter(m => parseInt(m) >= currentMinute)
        : minutes;

    useEffect(() => {
        if (isOpen) {
            // Logic: Use props if present, else empty/user decides
            setSelectedDate(preSelectedDate || undefined);
            setStartHour(preSelectedStartHour || "");
            setStartMinute(preSelectedStartMinute || "");
            setEndHour(preSelectedEndHour || "");
            setEndMinute(preSelectedEndMinute || "");
            setPurpose("");
            setIsLoading(false);
        }
    }, [isOpen, preSelectedDate, preSelectedStartHour, preSelectedStartMinute, preSelectedEndHour, preSelectedEndMinute]);

    useEffect(() => {
        if (isToday) {
            if (startHour && parseInt(startHour) < currentHour) {
                setStartHour("");
                setStartMinute("");
            } else if (startHour && parseInt(startHour) === currentHour && startMinute && parseInt(startMinute) <= currentMinute) {
                setStartMinute("");
            }
        }
    }, [isToday, currentHour, currentMinute, startHour, startMinute]);

    useEffect(() => {
        if (room && selectedDate) {
            loadBookedSlots();
        }
    }, [room, selectedDate]);

    const loadBookedSlots = async () => {
        if (!room || !selectedDate) return;
        const bookings = await getRoomBookings(room.id, selectedDate);
        setBookedSlots(bookings);
    };

    const isTimeSlotBooked = (time: string): boolean => {
        if (!selectedDate) return false;

        const [hours, minutes] = time.split(":").map(Number);
        const slotTime = setMinutes(setHours(selectedDate, hours), minutes);

        return bookedSlots.some((booking) => {
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            return !isBefore(slotTime, start) && isBefore(slotTime, end);
        });
    };

    const handleSubmit = async () => {
        if (!room || !selectedDate || !startHour || !startMinute || !endHour || !endMinute || !purpose.trim()) {
            toast.error("Mohon lengkapi semua field yang diwajibkan");
            return;
        }

        const startHours = parseInt(startHour, 10);
        const startMinutes = parseInt(startMinute, 10);
        const endHours = parseInt(endHour, 10);
        const endMinutes = parseInt(endMinute, 10);

        const startDateTime = setMinutes(
            setHours(new Date(selectedDate), startHours),
            startMinutes
        );
        const endDateTime = setMinutes(
            setHours(new Date(selectedDate), endHours),
            endMinutes
        );

        if (!isBefore(startDateTime, endDateTime)) {
            toast.error("Waktu selesai harus setelah waktu mulai");
            return;
        }

        if (isBefore(startDateTime, new Date())) {
            toast.error("Tidak bisa booking untuk waktu yang sudah lewat");
            return;
        }

        setIsLoading(true);

        try {
            // Check availability first
            const availability = await checkAvailability(
                room.id,
                startDateTime,
                endDateTime
            );

            if (!availability.available) {
                toast.error("Slot waktu ini sudah terisi. Silakan pilih waktu lain.");
                setIsLoading(false);
                return;
            }

            const result = await createBooking({
                userId,
                roomId: room.id,
                startTime: startDateTime,
                endTime: endDateTime,
                purpose,
            });

            if (result.success) {
                toast.success("Berhasil memesan ruangan!");
                onSuccess?.();
                handleClose();
            } else {
                toast.error(result.error || "Gagal memesan ruangan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStartHour("07");
        setStartMinute("00");
        setEndHour("08");
        setEndMinute("00");
        setPurpose("");
        setSelectedDate(new Date());
        onClose();
    };

    if (!room) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        Pinjam Ruangan
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        Isi detail peminjaman untuk <strong className="text-slate-700">{room.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Room Info */}
                    <div className="rounded-xl border border-blue-100/50 bg-gradient-to-r from-blue-50 to-purple-50 p-4 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{room.name}</h3>
                        <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                            Kapasitas: <span className="text-slate-800">{room.capacity} orang</span>
                        </p>
                    </div>

                    {/* Selection Summary (Context) */}
                    <div className="rounded-xl border border-blue-100/50 bg-gradient-to-r from-blue-50 to-purple-50 p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Tanggal Booking</p>
                                <p className="font-bold text-slate-800">{selectedDate ? format(selectedDate, "dd MMMM yyyy", { locale: id }) : "-"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Estimasi Waktu</p>
                                <p className="font-bold text-slate-800">{startHour}:{startMinute || "00"} - {endHour}:{endMinute || "00"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Editable Inputs */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Calendar */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                                    1. Ubah Tanggal
                                </Label>
                                <div className="rounded-xl border border-slate-200 p-2 bg-white flex justify-center">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))}
                                        className="rounded-md"
                                        locale={id}
                                    />
                                </div>
                            </div>

                            {/* Time Selectors */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        2. Ubah Waktu
                                    </Label>
                                    
                                    <div className="space-y-4 pt-2">
                                        {/* Start Time */}
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Jam Mulai</span>
                                            <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
                                                <Select value={startHour} onValueChange={setStartHour}>
                                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2 py-3 h-12 font-bold text-slate-700">
                                                        <SelectValue placeholder="HH" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {availableHours.map((h) => (
                                                            <SelectItem key={`start-h-${h}`} value={h}>{h}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center justify-center text-slate-400 font-bold px-1">:</div>
                                                <Select value={startMinute} onValueChange={setStartMinute}>
                                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2 py-3 h-12 font-bold text-slate-700">
                                                        <SelectValue placeholder="MM" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableMinutes.map((m) => (
                                                            <SelectItem key={`start-m-${m}`} value={m}>{m}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* End Time */}
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Jam Selesai</span>
                                            <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
                                                <Select value={endHour} onValueChange={setEndHour}>
                                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2 py-3 h-12 font-bold text-slate-700">
                                                        <SelectValue placeholder="HH" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {availableEndHours.map((h) => (
                                                            <SelectItem key={`end-h-${h}`} value={h}>{h}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center justify-center text-slate-400 font-bold px-1">:</div>
                                                <Select value={endMinute} onValueChange={setEndMinute}>
                                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2 py-3 h-12 font-bold text-slate-700">
                                                        <SelectValue placeholder="MM" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableEndMinutes.map((m) => (
                                                            <SelectItem key={`end-m-${m}`} value={m}>{m}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Availability Timeline / List */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4 text-blue-500" />
                            Ketersediaan Hari Ini
                        </Label>
                        
                        {bookedSlots.length === 0 ? (
                            <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-xl border border-green-100">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-medium text-green-800">Ruangan tersedia sepenuhnya sepanjang hari.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase italic mb-2 px-1">Terisi pada jam berikut:</p>
                                {[...bookedSlots].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((slot, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-400" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] font-italic">
                                                    {slot.purpose || "Agenda Terjadwal"}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-100 font-bold uppercase">BOOKED</Badge>
                                    </div>
                                ))}
                                
                                {/* Constructive Suggestion */}
                                {(() => {
                                    const latestSlot = [...bookedSlots].sort((a,b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()).pop();
                                    if(latestSlot) {
                                        return (
                                            <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                                    Saran: Anda dapat membooking ruangan ini <span className="font-bold underline">setelah jam {format(new Date(latestSlot.endTime), "HH:mm")}</span> atau mencari celah waktu kosong di atas.
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Purpose */}
                    <div>
                        <Label htmlFor="purpose" className="text-sm font-semibold text-slate-700">Tujuan Peminjaman <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="purpose"
                            placeholder="Contoh: Rapat tim, presentasi proyek, dll."
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            required
                            className="mt-2 bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all resize-none h-24"
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t border-slate-100 gap-3 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} className="rounded-xl font-semibold border-slate-200 hover:bg-slate-50 text-slate-600">
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !startHour || !startMinute || !endHour || !endMinute || !purpose.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                    >
                        {isLoading ? "Memproses..." : "Konfirmasi Peminjaman"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
