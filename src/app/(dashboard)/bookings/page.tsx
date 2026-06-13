"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Calendar,
    Trash2,
    Search,
    Eye,
} from "lucide-react";
import { getCurrentUser } from "@/actions/users";
import { getUserBookings, getAllBookings, cancelBooking } from "@/actions/bookings";
import type { User, Booking, Room } from "@/db/schema";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type BookingWithRoom = {
    booking: Booking;
    room: Room;
    user?: User | any;
};

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [detailBooking, setDetailBooking] = useState<BookingWithRoom | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [startDateFilter, setStartDateFilter] = useState("");
    const [endDateFilter, setEndDateFilter] = useState("");
    const [roomNameFilter, setRoomNameFilter] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000); // Update every 10 seconds for real-time feel
        return () => clearInterval(timer);
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData) {
            if (userData.role === "ADMIN") {
                const bookingsData = await getAllBookings();
                setBookings(bookingsData);
            } else {
                const bookingsData = await getUserBookings(userData.id);
                setBookings(bookingsData);
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCancelBooking = async () => {
        if (!selectedBooking) return;

        const result = await cancelBooking(selectedBooking.id);
        if (result.success) {
            toast.success("Peminjaman berhasil dibatalkan");
            loadData();
        } else {
            toast.error(result.error || "Gagal membatalkan peminjaman");
        }
        setCancelDialogOpen(false);
        setSelectedBooking(null);
    };

    const openCancelDialog = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancelDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>
                );
            case "COMPLETED":
                return <Badge variant="secondary">Selesai</Badge>;
            case "CANCELLED":
                return <Badge variant="destructive">Dibatalkan</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getDerivedStatus = (booking: Booking) => {
        if (booking.status === "ACTIVE" && booking.endTime) {
            const isFinished = currentTime.getTime() > new Date(booking.endTime).getTime();
            if (isFinished) return "COMPLETED";
        }
        return booking.status;
    };

    const activeBookings = bookings.filter((b) => {
        const statusMatch = getDerivedStatus(b.booking) === "ACTIVE";
        const nameMatch = !roomNameFilter || b.room.name.toLowerCase().includes(roomNameFilter.toLowerCase());
        return statusMatch && nameMatch;
    });

    let pastBookings = bookings.filter((b) => getDerivedStatus(b.booking) !== "ACTIVE");

    pastBookings = pastBookings.filter(b => {
        const date = format(new Date(b.booking.startTime), "yyyy-MM-dd");
        const afterStart = !startDateFilter || date >= startDateFilter;
        const beforeEnd = !endDateFilter || date <= endDateFilter;
        const nameMatch = !roomNameFilter || b.room.name.toLowerCase().includes(roomNameFilter.toLowerCase());
        return afterStart && beforeEnd && nameMatch;
    });

    pastBookings.sort((a, b) => a.room.name.localeCompare(b.room.name));

    return (
        <div className="min-h-screen">
            <div className="p-6">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">
                        Riwayat Peminjaman
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Kelola dan lihat riwayat peminjaman ruangan Anda
                    </p>
                </div>

                {/* Stats */}
                <div className="mb-6 flex gap-4">
                    <div className="rounded-lg border bg-green-50 px-4 py-2 text-green-700">
                        <span className="text-sm">Aktif: </span>
                        <span className="font-semibold">{activeBookings.length}</span>
                    </div>
                    <div className="rounded-lg border bg-slate-100 px-4 py-2 text-slate-700">
                        <span className="text-sm">Total: </span>
                        <span className="font-semibold">{bookings.length}</span>
                    </div>
                </div>

                {/* Active Bookings */}
                <Card className="mb-6 border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Peminjaman Aktif
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="animate-pulse text-slate-400">Loading...</div>
                            </div>
                        ) : activeBookings.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-slate-500">
                                Tidak ada peminjaman aktif
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ruangan</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Waktu</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeBookings.map(({ booking, room, user: bUser }) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-medium">{room.name}</TableCell>
                                            <TableCell>
                                                {format(new Date(booking.startTime), "EEEE, dd MMM yyyy", {
                                                    locale: id,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(booking.startTime), "HH:mm")} -{" "}
                                                {format(new Date(booking.endTime), "HH:mm")}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(getDerivedStatus(booking))}</TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                {user?.role === "ADMIN" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDetailBooking({ booking, room, user: bUser })}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Eye className="mr-1 h-4 w-4" />
                                                        Cek
                                                    </Button>
                                                )}
                                                {currentTime.getTime() < new Date(booking.startTime).getTime() && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openCancelDialog(booking)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-1 h-4 w-4" />
                                                        Batalkan
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Past Bookings */}
                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden mt-6">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-base font-bold text-slate-800">Riwayat Sebelumnya</CardTitle>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative group w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Cari nama ruangan..."
                                    value={roomNameFilter}
                                    onChange={(e) => setRoomNameFilter(e.target.value)}
                                    className="pl-9 h-9 border-slate-200 bg-white focus:bg-white rounded-xl text-sm transition-all shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Mulai:</Label>
                                <Input
                                    type="date"
                                    value={startDateFilter}
                                    onChange={(e) => setStartDateFilter(e.target.value)}
                                    className="w-auto h-9 border-slate-200 bg-white focus:bg-white rounded-xl text-sm transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sampai:</Label>
                                <Input
                                    type="date"
                                    value={endDateFilter}
                                    onChange={(e) => setEndDateFilter(e.target.value)}
                                    className="w-auto h-9 border-slate-200 bg-white focus:bg-white rounded-xl text-sm transition-colors"
                                />
                            </div>
                            {(startDateFilter || endDateFilter || roomNameFilter) && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => { setStartDateFilter(""); setEndDateFilter(""); setRoomNameFilter(""); }} 
                                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-9 px-2"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ScrollArea className="h-[400px]">
                            {pastBookings.length === 0 ? (
                                <div className="flex h-32 items-center justify-center text-slate-500">
                                    Belum ada riwayat peminjaman
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ruangan</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Waktu</TableHead>
                                            <TableHead>Status</TableHead>
                                            {user?.role === "ADMIN" && <TableHead className="text-right">Aksi</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pastBookings.map(({ booking, room, user: bUser }) => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-medium">{room.name}</TableCell>
                                                <TableCell>
                                                    {format(new Date(booking.startTime), "dd MMM yyyy", {
                                                        locale: id,
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(booking.startTime), "HH:mm")} -{" "}
                                                    {format(new Date(booking.endTime), "HH:mm")}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(getDerivedStatus(booking))}</TableCell>
                                                {user?.role === "ADMIN" && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDetailBooking({ booking, room, user: bUser })}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Eye className="mr-1 h-4 w-4" />
                                                            Cek
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                    <DialogHeader className="pb-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-800 text-red-600">Batalkan Peminjaman?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin membatalkan peminjaman ini? Tindakan ini
                            tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4 border-t border-slate-100">
                        <Button variant="outline" className="rounded-xl font-semibold border-slate-200 hover:bg-slate-50 text-slate-600" onClick={() => setCancelDialogOpen(false)}>
                            Tidak
                        </Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 rounded-xl font-semibold transition-all hover:-translate-y-0.5" onClick={handleCancelBooking}>
                            Ya, Batalkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Check Dialog for Admin */}
            <Dialog open={!!detailBooking} onOpenChange={(open) => !open && setDetailBooking(null)}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                    <DialogHeader className="pb-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-800">Detail Peminjaman</DialogTitle>
                    </DialogHeader>
                    {detailBooking && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-semibold">Ruangan</span>
                                <span className="col-span-2 font-bold text-slate-800">{detailBooking.room.name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-semibold">Nama Peminjam</span>
                                <span className="col-span-2 text-slate-700">{detailBooking.user?.fullName || "Tidak ada data"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-semibold">Status Peminjam</span>
                                <span className="col-span-2 text-slate-700">{detailBooking.user?.role === "STUDENT" ? "Mahasiswa" : detailBooking.user?.role || "Tidak ada data"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-semibold">Waktu</span>
                                <span className="col-span-2 text-slate-700">
                                    {format(new Date(detailBooking.booking.startTime), "EEEE, dd MMMM yyyy", { locale: id })}<br />
                                    {format(new Date(detailBooking.booking.startTime), "HH:mm")} - {format(new Date(detailBooking.booking.endTime), "HH:mm")}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <span className="text-slate-500 font-semibold">Keperluan</span>
                                <span className="col-span-2 text-slate-700">{detailBooking.booking.purpose}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="pt-2">
                        <Button className="rounded-xl font-semibold border-slate-200" onClick={() => setDetailBooking(null)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
