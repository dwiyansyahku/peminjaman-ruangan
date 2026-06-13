"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    CheckCircle,
    XCircle,
    Settings,
    Pencil,
    Trash2,
    Building2,
    MonitorPlay,
    UsersRound,
    Presentation,
    BookOpen,
    Clock,
    CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import type { Room } from "@/db/schema";

interface RoomCardProps {
    room: Room & { 
        isOccupied?: boolean; 
        currentBooking?: any;
        isWithinHours?: boolean;
        availabilityStatus?: "AVAILABLE" | "OCCUPIED" | "OUTSIDE_HOURS" | "MAINTENANCE";
    };
    onBook?: (room: Room) => void;
    showBookButton?: boolean;
    isAdmin?: boolean;
    onEdit?: (room: Room) => void;
    onDelete?: (room: Room) => void;
    isTimeSelected?: boolean;
}

export function RoomCard({
    room,
    onBook,
    showBookButton = true,
    isAdmin = false,
    onEdit,
    onDelete,
    isTimeSelected = false,
}: RoomCardProps) {
    const facilities = room.facilities ? JSON.parse(room.facilities) : [];
    let hariText = "Setiap Hari";
    if (room.hari) {
        try {
            const hariList = JSON.parse(room.hari);
            if (hariList.length > 0 && hariList.length < 7) {
                hariText = hariList.join(", ");
            }
        } catch {
            // Ignore parse error
        }
    }
    const isAvailable = room.status === "AVAILABLE" && !room.isOccupied;

    // Pick icon variant based on capacity
    const getRoomVariant = () => {
        const name = room.name.toLowerCase();
        if (name.includes("lab") || name.includes("komputer")) return { Icon: MonitorPlay, gradient: "from-indigo-600 to-purple-600", bg: "bg-indigo-50" };
        if (name.includes("aula") || name.includes("serbaguna")) return { Icon: UsersRound, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50" };
        if (name.includes("seminar") || name.includes("kuliah")) return { Icon: Presentation, gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-50" };
        if (name.includes("belajar") || name.includes("baca") || name.includes("perpus")) return { Icon: BookOpen, gradient: "from-green-600 to-emerald-500", bg: "bg-green-50" };
        if (room.capacity >= 100) return { Icon: UsersRound, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50" };
        if (room.capacity >= 30) return { Icon: Presentation, gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-50" };
        return { Icon: Building2, gradient: "from-blue-900 to-blue-600", bg: "bg-blue-50" };
    };
    const { Icon, gradient, bg } = getRoomVariant();

    return (
        <Card className="group overflow-hidden border-none rounded-2xl bg-white shadow-sm shadow-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
            {/* Icon Banner */}
            <div className={`relative h-44 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center overflow-hidden`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-2 border-white" />
                    <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full border-2 border-white" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white" />
                </div>

                {/* Main icon */}
                <div className="relative z-10 w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/20 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-10 w-10 text-white" />
                </div>

                {/* Status Badge */}
                <div className="absolute right-3 top-3">
                    {room.status === "MAINTENANCE" || room.availabilityStatus === "MAINTENANCE" ? (
                        <Badge variant="destructive" className="gap-1 border-white/20 shadow-lg">
                            <Settings className="h-3 w-3" />
                            Maintenance
                        </Badge>
                    ) : room.isOccupied || room.availabilityStatus === "OCCUPIED" ? (
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="gap-1 bg-orange-500 text-white font-bold border-white/20 shadow-lg">
                                <XCircle className="h-3 w-3" />
                                BOOKED
                            </Badge>
                            {room.currentBooking && (
                                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[10px] font-bold text-orange-700 border-orange-100">
                                    Sampai {format(new Date(room.currentBooking.endTime), "HH:mm")}
                                </Badge>
                            )}
                        </div>
                    ) : room.availabilityStatus === "OUTSIDE_HOURS" ? (
                        <Badge variant="outline" className="gap-1 bg-blue-500/90 text-white border-white/20 shadow-lg backdrop-blur-sm">
                            <Clock className="h-3 w-3" />
                            Luar Jam Ops
                        </Badge>
                    ) : (
                        <Badge className="gap-1 bg-green-500/90 text-white border-white/20 shadow-lg">
                            <CheckCircle className="h-3 w-3" />
                            Tersedia
                        </Badge>
                    )}
                </div>
            </div>

            {/* Room title strip */}
            <div className={`px-4 py-3 ${bg} flex items-center justify-between border-b border-slate-100`}>
                <h3 className="text-base font-bold text-slate-800 truncate">{room.name}</h3>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 shrink-0 ml-2">
                    <Users className="h-3.5 w-3.5" />
                    {room.capacity} org
                </div>
            </div>

            {/* Content */}
            <CardContent className="p-4">
                {room.description && (
                    <p className="mb-3 text-sm text-slate-600 line-clamp-2">
                        {room.description}
                    </p>
                )}

                <div className="flex flex-col gap-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>
                            {room.availabilityStatus === "AVAILABLE" ? (
                                <>Tersedia s/d <span className="text-blue-700">{room.closeHour || "18:00"}</span></>
                            ) : room.isOccupied || room.availabilityStatus === "OCCUPIED" ? (
                                <>Digunakan s/d <span className="text-orange-700 font-bold">{room.currentBooking ? format(new Date(room.currentBooking.endTime), "HH:mm") : "-"}</span>. Tersedia kembali pkl <span className="text-blue-700 font-bold">{room.currentBooking ? format(new Date(room.currentBooking.endTime), "HH:mm") : "-"}</span></>
                            ) : (
                                <>Jam Operasional: {room.openHour} - {room.closeHour}</>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        <span className="line-clamp-1" title={hariText}>Hari: {hariText}</span>
                    </div>
                </div>

                {/* Facilities */}
                {facilities.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                        {facilities.slice(0, 4).map((facility: string, index: number) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className="text-xs bg-slate-50"
                            >
                                {facility}
                            </Badge>
                        ))}
                        {facilities.length > 4 && (
                            <Badge variant="outline" className="text-xs bg-slate-50">
                                +{facilities.length - 4}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    {showBookButton && (
                        <Button
                            onClick={() => onBook?.(room)}
                            disabled={!isTimeSelected || (room.availabilityStatus ? room.availabilityStatus !== "AVAILABLE" : !isAvailable)}
                            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white shadow-md shadow-blue-900/20 rounded-xl font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        >
                            {!isTimeSelected 
                                ? "Pilih Waktu Dahulu" 
                                : room.availabilityStatus === "AVAILABLE" || (isAvailable && !room.availabilityStatus)
                                ? "Pinjam Ruangan" 
                                : room.availabilityStatus === "OUTSIDE_HOURS"
                                ? "Tutup (Luar Jam Ops)"
                                : "Tidak Tersedia"}
                        </Button>
                    )}
                    {isAdmin && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onEdit?.(room)}
                                title="Edit ruangan"
                                className="rounded-xl border-slate-200 text-blue-700 hover:bg-blue-50 hover:border-blue-200"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onDelete?.(room)}
                                title="Hapus ruangan"
                                className="rounded-xl border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
