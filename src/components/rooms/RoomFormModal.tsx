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
import { Building2, Users, X, Plus, Loader2, Clock, CalendarDays } from "lucide-react";
import { createRoom, updateRoom } from "@/actions/rooms";
import { toast } from "sonner";
import type { Room } from "@/db/schema";

interface RoomFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    room?: Room | null; // if provided = edit mode
}

const FACILITY_SUGGESTIONS = [
    "Proyektor", "AC", "Whiteboard", "Sound System", "WiFi",
    "Komputer", "TV LED", "Microphone",
];

const DAYS_OF_WEEK = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function RoomFormModal({ isOpen, onClose, onSuccess, room }: RoomFormModalProps) {
    const [name, setName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"AVAILABLE" | "MAINTENANCE">("AVAILABLE");
    const [openHourHH, setOpenHourHH] = useState("07");
    const [openHourMM, setOpenHourMM] = useState("00");
    const [closeHourHH, setCloseHourHH] = useState("18");
    const [closeHourMM, setCloseHourMM] = useState("00");
    const [facilities, setFacilities] = useState<string[]>([]);
    const [facilityInput, setFacilityInput] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const isEdit = !!room;

    // Populate form when editing
    useEffect(() => {
        if (room) {
            setName(room.name);
            setCapacity(String(room.capacity));
            setDescription(room.description || "");
            setStatus(room.status as "AVAILABLE" | "MAINTENANCE");

            const [oH, oM] = (room.openHour || "07:00").split(":");
            setOpenHourHH(oH);
            setOpenHourMM(oM);

            const [cH, cM] = (room.closeHour || "18:00").split(":");
            setCloseHourHH(cH);
            setCloseHourMM(cM);

            try {
                setFacilities(room.facilities ? JSON.parse(room.facilities) : []);
            } catch {
                setFacilities([]);
            }

            try {
                setSelectedDays(room.hari ? JSON.parse(room.hari) : []);
            } catch {
                setSelectedDays([]);
            }
        } else {
            setName("");
            setCapacity("");
            setDescription("");
            setStatus("AVAILABLE");
            setOpenHourHH("07");
            setOpenHourMM("00");
            setCloseHourHH("18");
            setCloseHourMM("00");
            setFacilities([]);
            setSelectedDays([]);
        }
        setFacilityInput("");
    }, [room, isOpen]);

    const addFacility = (f: string) => {
        const trimmed = f.trim();
        if (trimmed && !facilities.includes(trimmed)) {
            setFacilities([...facilities, trimmed]);
        }
        setFacilityInput("");
    };

    const removeFacility = (f: string) => {
        setFacilities(facilities.filter((x) => x !== f));
    };

    const handleFacilityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addFacility(facilityInput);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !capacity) {
            toast.error("Nama dan kapasitas ruangan wajib diisi.");
            return;
        }

        if (selectedDays.length === 0) {
            toast.error("Pilih minimal satu hari operasional.");
            return;
        }

        setLoading(true);
        try {
            const openHour = `${openHourHH}:${openHourMM}`;
            const closeHour = `${closeHourHH}:${closeHourMM}`;

            const payload = {
                name: name.trim(),
                capacity: parseInt(capacity),
                openHour,
                closeHour,
                description: description.trim() || undefined,
                facilities: facilities.length ? JSON.stringify(facilities) : undefined,
                hari: selectedDays.length ? JSON.stringify(selectedDays) : undefined,
            };

            if (isEdit && room) {
                const res = await updateRoom(room.id, { ...payload, status });
                if (res.success) {
                    toast.success("Ruangan berhasil diperbarui!");
                } else {
                    throw new Error(res.error);
                }
            } else {
                const res = await createRoom(payload);
                if (res.success) {
                    toast.success("Ruangan berhasil ditambahkan!");
                } else {
                    throw new Error(res.error);
                }
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Gagal menyimpan ruangan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-900" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-800">
                                {isEdit ? "Edit Ruangan" : "Tambah Ruangan Baru"}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                {isEdit 
                                    ? "Perbarui informasi ruangan di bawah ini." 
                                    : "Lengkapi detail ruangan di bawah ini."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-4 max-h-[70vh] overflow-y-auto pr-1">
                    {/* Nama Ruangan */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700">Nama Ruangan <span className="text-red-500">*</span></Label>
                        <Input
                            placeholder="Contoh: Ruang Aula Utama"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Kapasitas */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            Kapasitas (orang) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="Contoh: 30"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            required
                            className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Status (edit only) */}
                    {isEdit && (
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700">Status Ruangan</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as "AVAILABLE" | "MAINTENANCE")}>
                                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="AVAILABLE">✅ Tersedia</SelectItem>
                                    <SelectItem value="MAINTENANCE">🔧 Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Jam Operasional */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400" />
                            Jam Operasional <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1">
                                <span className="text-xs text-slate-500 ml-1">Jam Buka</span>
                                <div className="flex gap-2">
                                    <Select value={openHourHH} onValueChange={setOpenHourHH}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 h-10 w-full">
                                            <SelectValue placeholder="HH" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] rounded-xl">
                                            {hours.map((h) => (
                                                <SelectItem key={`open-h-${h}`} value={h}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-lg font-bold self-center text-slate-400">:</span>
                                    <Select value={openHourMM} onValueChange={setOpenHourMM}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 h-10 w-full">
                                            <SelectValue placeholder="MM" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] rounded-xl">
                                            {minutes.map((m) => (
                                                <SelectItem key={`open-m-${m}`} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center pt-5 text-slate-400 font-bold">-</div>
                            <div className="flex-1 space-y-1">
                                <span className="text-xs text-slate-500 ml-1">Jam Tutup</span>
                                <div className="flex gap-2">
                                    <Select value={closeHourHH} onValueChange={setCloseHourHH}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 h-10 w-full">
                                            <SelectValue placeholder="HH" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] rounded-xl">
                                            {hours.map((h) => (
                                                <SelectItem key={`close-h-${h}`} value={h}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-lg font-bold self-center text-slate-400">:</span>
                                    <Select value={closeHourMM} onValueChange={setCloseHourMM}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 h-10 w-full">
                                            <SelectValue placeholder="MM" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] rounded-xl">
                                            {minutes.map((m) => (
                                                <SelectItem key={`close-m-${m}`} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hari Operasional */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-slate-400" />
                            Hari Operasional <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {DAYS_OF_WEEK.map((day) => {
                                const isSelected = selectedDays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedDays(selectedDays.filter(d => d !== day));
                                            } else {
                                                setSelectedDays([...selectedDays, day]);
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${isSelected
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border-blue-600"
                                                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fasilitas */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700">Fasilitas</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ketik fasilitas + Enter"
                                value={facilityInput}
                                onChange={(e) => setFacilityInput(e.target.value)}
                                onKeyDown={handleFacilityKeyDown}
                                className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => addFacility(facilityInput)}
                                className="rounded-xl border-slate-200 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Suggestions */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {FACILITY_SUGGESTIONS.filter((s) => !facilities.includes(s)).slice(0, 8).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => addFacility(s)}
                                    className="text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                >
                                    + {s}
                                </button>
                            ))}
                        </div>
                        {/* Selected facilities */}
                        {facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                                {facilities.map((f) => (
                                    <Badge
                                        key={f}
                                        className="gap-1 bg-white border border-blue-200 text-blue-800 hover:bg-white font-medium text-xs"
                                    >
                                        {f}
                                        <button type="button" onClick={() => removeFacility(f)} className="ml-0.5 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-700">Deskripsi</Label>
                        <Textarea
                            placeholder="Deskripsi singkat tentang ruangan ini..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors resize-none"
                        />
                    </div>



                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-xl border-slate-200"
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-md shadow-blue-900/20 transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                            ) : (
                                isEdit ? "Simpan Perubahan" : "Tambah Ruangan"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
