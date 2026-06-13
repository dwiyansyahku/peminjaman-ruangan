"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateBooking } from "@/actions/bookings";
import { format } from "date-fns";
import type { Booking, Room } from "@/db/schema";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getRooms } from "@/actions/rooms";

interface EditBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    booking: {
        booking: { id: number; startTime: Date; endTime: Date; purpose: string | null };
        room: { id: number; name: string }
    } | null;
}

export function EditBookingModal({
    isOpen,
    onClose,
    onSuccess,
    booking,
}: EditBookingModalProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [formData, setFormData] = useState({
        roomId: "",
        date: "",
        startTime: "",
        endTime: "",
        purpose: "",
    });

    useEffect(() => {
        const fetchRooms = async () => {
            const data = await getRooms();
            setRooms(data);
        };
        fetchRooms();
    }, []);

    useEffect(() => {
        if (booking) {
            setFormData({
                roomId: booking.room.id.toString(),
                date: format(new Date(booking.booking.startTime), "yyyy-MM-dd"),
                startTime: format(new Date(booking.booking.startTime), "HH:mm"),
                endTime: format(new Date(booking.booking.endTime), "HH:mm"),
                purpose: booking.booking.purpose || "",
            });
        }
    }, [booking]);

    const handleSubmit = async () => {
        if (!booking) return;

        if (!formData.roomId || !formData.date || !formData.startTime || !formData.endTime || !formData.purpose) {
            toast.error("Mohon lengkapi semua field");
            return;
        }

        const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

        if (endDateTime <= startDateTime) {
            toast.error("Waktu selesai harus setelah waktu mulai");
            return;
        }

        const result = await updateBooking(booking.booking.id, {
            roomId: parseInt(formData.roomId),
            startTime: startDateTime,
            endTime: endDateTime,
            purpose: formData.purpose,
        });

        if (result.success) {
            toast.success("Booking berhasil diperbarui");
            onSuccess();
            onClose();
        } else {
            toast.error(result.error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <DialogTitle className="text-xl font-bold text-slate-800">Edit Booking</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Ruangan</Label>
                        <Select
                            value={formData.roomId}
                            onValueChange={(val) => setFormData({ ...formData, roomId: val })}
                        >
                            <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl">
                                <SelectValue placeholder="Pilih ruangan" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                {rooms.map((room) => (
                                    <SelectItem key={room.id} value={room.id.toString()}>
                                        {room.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Tanggal</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Jam Mulai</Label>
                            <Input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Jam Selesai</Label>
                            <Input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Keperluan</Label>
                        <Textarea
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl h-24 resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t border-slate-100 gap-3">
                    <Button variant="outline" onClick={onClose} className="rounded-xl font-semibold w-full sm:w-auto">
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 w-full sm:w-auto">
                        Simpan Perubahan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
