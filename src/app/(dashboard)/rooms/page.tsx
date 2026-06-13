"use client";


import { useState, useEffect, useCallback } from "react";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomFormModal } from "@/components/rooms/RoomFormModal";
import { RoomExcelUploadModal } from "@/components/rooms/RoomExcelUploadModal";
import { BookingModal } from "@/components/booking/BookingModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Search,
    Plus,
    CalendarIcon,
    Clock,
    FileSpreadsheet,
    Filter,
    Building2,
    LayoutGrid,
    List,
    Pencil,
    Trash2,
    CheckCircle,
    XCircle,
    Settings,
    Info,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getRoomsWithStatus, deleteRoom, getRoomsWithAvailability } from "@/actions/rooms";
import { getCurrentUser } from "@/actions/users";
import { getSystemSettings, updateSystemSetting } from "@/actions/settings";
import { toast } from "sonner";
import type { Room, User } from "@/db/schema";

type RoomWithStatus = Room & { 
    isOccupied: boolean; 
    currentBooking?: any;
    isWithinHours?: boolean;
    availabilityStatus?: "AVAILABLE" | "OCCUPIED" | "OUTSIDE_HOURS" | "MAINTENANCE";
};

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export default function RoomsPage() {
    const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<RoomWithStatus[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    const now = new Date();
    
    // Time Selection for Check Availability
    const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
    const [startHour, setStartHour] = useState<string>("");
    const [startMinute, setStartMinute] = useState<string>("");
    const [endHour, setEndHour] = useState<string>("");
    const [endMinute, setEndMinute] = useState<string>("");
    const [isTimeSelected, setIsTimeSelected] = useState(false);

    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const isToday = bookingDate && format(bookingDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
    const isFutureDate = bookingDate && format(bookingDate, "yyyy-MM-dd") > format(now, "yyyy-MM-dd");

    const availableHours = isFutureDate 
        ? hours
        : hours.filter(h => parseInt(h, 10) >= currentHour);

    const availableMinutes = (!isFutureDate && parseInt(startHour || currentHour.toString(), 10) === currentHour)
        ? minutes.filter(m => parseInt(m, 10) >= currentMinute)
        : minutes;

    const availableEndHours = isFutureDate
        ? hours
        : hours.filter(h => parseInt(h, 10) >= currentHour);

    const availableEndMinutes = (!isFutureDate && parseInt(endHour || currentHour.toString(), 10) === currentHour)
        ? minutes.filter(m => parseInt(m, 10) >= currentMinute)
        : minutes;

    useEffect(() => {
        if (isToday) {
            if (startHour && parseInt(startHour, 10) < currentHour) {
                setStartHour("");
                setStartMinute("");
            } else if (startHour && parseInt(startHour, 10) === currentHour && startMinute && parseInt(startMinute) <= currentMinute) {
                setStartMinute("");
            }
        }
    }, [isToday, currentHour, currentMinute, startHour, startMinute]);

    // Booking
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    // Room form (add / edit)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    // Delete confirm
    const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [userData] = await Promise.all([
            getCurrentUser(),
        ]);
        setUser(userData);
        

        setRooms([]); // Don't load rooms automatically
        setFilteredRooms([]);
        setIsTimeSelected(false);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCheckAvailability = async () => {
        if (!bookingDate || !startHour || !startMinute || !endHour || !endMinute) {
            toast.error("Mohon lengkapi tanggal dan jam.");
            return;
        }

        const sHour = parseInt(startHour, 10);
        const sMin = parseInt(startMinute, 10);
        const eHour = parseInt(endHour, 10);
        const eMin = parseInt(endMinute, 10);

        if (sHour > eHour || (sHour === eHour && sMin >= eMin)) {
            toast.error("Waktu selesai harus setelah waktu mulai.");
            return;
        }

        setIsLoading(true);
        const availableRooms = await getRoomsWithAvailability({
            date: bookingDate,
            startHours: sHour,
            startMinutes: sMin,
            endHours: eHour,
            endMinutes: eMin,
        });

        setRooms(availableRooms);
        setFilteredRooms(availableRooms);
        setIsTimeSelected(true);
        setIsLoading(false);
        toast.success("Ketersediaan ruangan diperbarui!");
    };

    useEffect(() => {
        let result = [...rooms];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.description?.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== "all") {
            if (statusFilter === "available") result = result.filter((r) => (r.availabilityStatus || (r.status === "AVAILABLE" && !r.isOccupied)) === "AVAILABLE");
            else if (statusFilter === "occupied") result = result.filter((r) => r.isOccupied || r.availabilityStatus === "OCCUPIED");
            else if (statusFilter === "maintenance") result = result.filter((r) => r.status === "MAINTENANCE" || r.availabilityStatus === "MAINTENANCE");
        }

        // Filter by OUTSIDE_HOURS (User request: Hide rooms outside hours)
        result = result.filter(r => r.availabilityStatus !== "OUTSIDE_HOURS");

        // --- SMART SORTING ---
        // 1. Availability Status priority (Available first)
        // 2. Name A-Z
        const statusPriority = {
            AVAILABLE: 0,
            OCCUPIED: 1,
            MAINTENANCE: 3,
            OUTSIDE_HOURS: 4, // Should be filtered anyway
        };

        result.sort((a, b) => {
            const statusA = a.availabilityStatus || (a.status === "MAINTENANCE" ? "MAINTENANCE" : a.isOccupied ? "OCCUPIED" : "AVAILABLE");
            const statusB = b.availabilityStatus || (b.status === "MAINTENANCE" ? "MAINTENANCE" : b.isOccupied ? "OCCUPIED" : "AVAILABLE");
            
            if (statusPriority[statusA] !== statusPriority[statusB]) {
                return statusPriority[statusA] - statusPriority[statusB];
            }
            return a.name.localeCompare(b.name);
        });

        setFilteredRooms(result);
    }, [searchQuery, statusFilter, rooms]);

    // Grouping rooms for categorized display
    const roomGroups = {
        available: filteredRooms.filter(r => r.availabilityStatus === "AVAILABLE"),
        occupied: filteredRooms.filter(r => r.availabilityStatus === "OCCUPIED"),
        maintenance: filteredRooms.filter(r => r.availabilityStatus === "MAINTENANCE")
    };

    const handleBookRoom = (room: Room) => {
        setSelectedRoom(room);
        setIsBookingModalOpen(true);
    };

    const handleEditRoom = (room: Room) => {
        setEditingRoom(room);
        setIsFormOpen(true);
    };

    const handleAddRoom = () => {
        setEditingRoom(null);
        setIsFormOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingRoom) return;
        setDeleteLoading(true);
        try {
            const res = await deleteRoom(deletingRoom.id);
            if (res.success) {
                toast.success(`Ruangan "${deletingRoom.name}" berhasil dihapus.`);
                loadData();
            } else {
                toast.error("Gagal menghapus ruangan.");
            }
        } catch {
            toast.error("Terjadi kesalahan.");
        } finally {
            setDeleteLoading(false);
            setDeletingRoom(null);
        }
    };


    const isAdmin = user?.role === "ADMIN";

    return (
        <div className="min-h-screen">
            <div className="p-6">

                {/* Page Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Daftar Ruangan</h1>
                        <p className="mt-1 text-slate-600">
                            {isAdmin ? "Kelola semua ruangan fasilitas kampus" : "Temukan dan pinjam ruangan yang tersedia"}
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="flex flex-wrap gap-2 justify-end">
                            <Button
                                onClick={() => setIsExcelModalOpen(true)}
                                variant="outline"
                                className="bg-white border-blue-200 hover:bg-blue-50 text-blue-700 hover:text-blue-900 rounded-xl font-semibold transition-all hover:-translate-y-0.5 gap-2"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                Import Ruangan
                            </Button>
                            <Button
                                onClick={handleAddRoom}
                                className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5 gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Ruangan
                            </Button>
                        </div>
                    )}
                </div>

                {/* View Switcher (Admin Only) */}
                {isAdmin && (
                    <div className="mb-4 flex justify-end">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "table")} className="w-auto">
                            <TabsList className="bg-slate-100 border-none h-9">
                                <TabsTrigger value="grid" className="gap-2 rounded-md transition-all">
                                    <LayoutGrid className="h-4 w-4" />
                                    Visual
                                </TabsTrigger>
                                <TabsTrigger value="table" className="gap-2 rounded-md transition-all">
                                    <List className="h-4 w-4" />
                                    Manajemen
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                )}

                <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/50 shadow-xl shadow-blue-500/5">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-blue-500" />
                        Cek Ketersediaan Ruangan
                    </h2>

                    <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
                        {/* Date Picker */}
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Tanggal</p>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl h-11 border-slate-200 bg-slate-50 hover:bg-white",
                                            !bookingDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                        {bookingDate ? format(bookingDate, "dd MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={bookingDate}
                                        onSelect={(d) => { setBookingDate(d); }}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        initialFocus
                                        locale={id}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Start Time */}
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Waktu Mulai</p>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm h-11 focus-within:ring-2 focus-within:ring-blue-500/20">
                                <Select value={startHour} onValueChange={(v) => { setStartHour(v); }}>
                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2">
                                        <SelectValue placeholder="HH" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {availableHours.map((h) => <SelectItem key={`sh-${h}`} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center justify-center text-slate-400 font-bold px-1">:</div>
                                <Select value={startMinute} onValueChange={(v) => { setStartMinute(v); }}>
                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2">
                                        <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableMinutes.map((m) => <SelectItem key={`sm-${m}`} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* End Time */}
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Waktu Selesai</p>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm h-11 focus-within:ring-2 focus-within:ring-blue-500/20">
                                <Select value={endHour} onValueChange={(v) => { setEndHour(v); }}>
                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2">
                                        <SelectValue placeholder="HH" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {availableEndHours.map((h) => <SelectItem key={`eh-${h}`} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center justify-center text-slate-400 font-bold px-1">:</div>
                                <Select value={endMinute} onValueChange={(v) => { setEndMinute(v); }}>
                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 rounded-none w-full text-center px-2">
                                        <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEndMinutes.map((m) => <SelectItem key={`em-${m}`} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Check Availability Button */}
                        <div className="flex-1 min-w-[150px]">
                            <Button
                                onClick={handleCheckAvailability}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Cari
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Cari nama ruangan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all font-medium text-slate-700 h-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 border-slate-200 rounded-xl font-medium text-slate-700 h-10 focus:ring-2 focus:ring-blue-500/20 transition-all">
                                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="available">Tersedia</SelectItem>
                                <SelectItem value="occupied">Sedang Digunakan</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Instructions / Status Message */}
                {!isTimeSelected && (
                    <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                            <Clock className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Tentukan Waktu Peminjaman</h3>
                        <p className="text-slate-600 max-w-md">
                            Silakan pilih tanggal dan jam untuk melihat daftar ruangan yang tersedia sesuai dengan kebutuhan Anda.
                        </p>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="mb-6 flex gap-3 flex-wrap">
                    <div className="rounded-xl bg-white shadow-sm px-4 py-2 text-sm font-medium text-slate-600">
                        Total: <span className="font-bold text-slate-800">{rooms.filter(r => r.availabilityStatus !== "OUTSIDE_HOURS").length}</span> ruangan
                    </div>
                    <div className="rounded-xl bg-green-50 shadow-sm px-4 py-2 text-sm font-medium text-green-700">
                        Tersedia: <span className="font-bold">{rooms.filter((r) => (r.availabilityStatus || (r.status === "AVAILABLE" && !r.isOccupied)) === "AVAILABLE").length}</span>
                    </div>
                    <div className="rounded-xl bg-orange-50 shadow-sm px-4 py-2 text-sm font-medium text-orange-700">
                        Digunakan: <span className="font-bold">{rooms.filter((r) => r.isOccupied).length}</span>
                    </div>
                    <div className="rounded-xl bg-red-50 shadow-sm px-4 py-2 text-sm font-medium text-red-700">
                        Maintenance: <span className="font-bold">{rooms.filter((r) => r.status === "MAINTENANCE").length}</span>
                    </div>
                </div>

                {/* Rooms Grid */}
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                        ))}
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="flex flex-col h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50">
                        <Building2 className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-600">
                            {rooms.length === 0 ? "Belum ada ruangan" : "Tidak ada ruangan ditemukan"}
                        </p>
                        <p className="text-sm text-slate-400">
                            {rooms.length === 0 && isAdmin
                                ? "Klik \"Tambah Ruangan\" untuk mulai menambahkan data."
                                : "Coba ubah filter atau kata pencarian."}
                        </p>
                        {rooms.length === 0 && isAdmin && (
                            <Button
                                onClick={handleAddRoom}
                                className="mt-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Ruangan Pertama
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === "grid" ? (
                            <>
                        <div className="space-y-10">
                                    {/* Tersedia Section */}
                                    {roomGroups.available.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 pb-2 border-b border-green-100">
                                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm">
                                                    <CheckCircle className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-800">Ruangan Tersedia</h2>
                                                    <p className="text-sm text-slate-500 font-medium">Siap untuk dipesan sekarang</p>
                                                </div>
                                                <Badge className="ml-2 bg-green-100 text-green-700 border-none font-bold">{roomGroups.available.length}</Badge>
                                            </div>
                                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {roomGroups.available.map((room) => (
                                                    <RoomCard
                                                        key={room.id}
                                                        room={room}
                                                        onBook={handleBookRoom}
                                                        showBookButton={user?.role === "STUDENT"}
                                                        isAdmin={isAdmin}
                                                        onEdit={handleEditRoom}
                                                        onDelete={(r) => setDeletingRoom(r)}
                                                        isTimeSelected={isTimeSelected}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Digunakan Section */}
                                    {roomGroups.occupied.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 pb-2 border-b border-orange-100 mt-4">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm">
                                                    <XCircle className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-800">Sedang Digunakan</h2>
                                                    <p className="text-sm text-slate-500 font-medium">Ruangan yang memiliki peminjaman aktif</p>
                                                </div>
                                                <Badge className="ml-2 bg-orange-100 text-orange-700 border-none font-bold">{roomGroups.occupied.length}</Badge>
                                            </div>
                                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {roomGroups.occupied.map((room) => (
                                                    <RoomCard
                                                        key={room.id}
                                                        room={room}
                                                        onBook={handleBookRoom}
                                                        showBookButton={user?.role === "STUDENT"}
                                                        isAdmin={isAdmin}
                                                        onEdit={handleEditRoom}
                                                        onDelete={(r) => setDeletingRoom(r)}
                                                        isTimeSelected={isTimeSelected}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Maintenance Section */}
                                    {roomGroups.maintenance.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 pb-2 border-b border-red-100 mt-4">
                                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
                                                    <Settings className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-800">Maintenance</h2>
                                                    <p className="text-sm text-slate-500 font-medium">Ruangan dalam perbaikan atau pemeliharaan</p>
                                                </div>
                                                <Badge className="ml-2 bg-red-100 text-red-700 border-none font-bold">{roomGroups.maintenance.length}</Badge>
                                            </div>
                                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {roomGroups.maintenance.map((room) => (
                                                    <RoomCard
                                                        key={room.id}
                                                        room={room}
                                                        onBook={handleBookRoom}
                                                        showBookButton={user?.role === "STUDENT"}
                                                        isAdmin={isAdmin}
                                                        onEdit={handleEditRoom}
                                                        onDelete={(r) => setDeletingRoom(r)}
                                                        isTimeSelected={isTimeSelected}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[30%]">Nama Ruangan</TableHead>
                                            <TableHead>Kapasitas</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Jadwal Operasional</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRooms.map((room) => (
                                            <TableRow key={room.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-bold text-slate-700">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                            <Building2 className="h-4 w-4" />
                                                        </div>
                                                        {room.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600 font-medium">{room.capacity} Orang</TableCell>
                                                <TableCell>
                                                    {room.status === "MAINTENANCE" ? (
                                                        <Badge variant="destructive" className="gap-1 font-semibold">
                                                            <Settings className="h-3 w-3" />
                                                            Maintenance
                                                        </Badge>
                                                    ) : room.isOccupied ? (
                                                        <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20 font-semibold">
                                                            <XCircle className="h-3 w-3" />
                                                            Digunakan
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20 font-semibold shadow-none">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Tersedia
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-xs font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-blue-500" />
                                                        {room.openHour} - {room.closeHour}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => { e.stopPropagation(); handleEditRoom(room); }}
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => { e.stopPropagation(); setDeletingRoom(room); }}
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <BookingModal
                room={selectedRoom}
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                userId={user?.id || ""}
                onSuccess={() => {
                    loadData();
                }}
                preSelectedDate={bookingDate}
                preSelectedStartHour={startHour}
                preSelectedStartMinute={startMinute}
                preSelectedEndHour={endHour}
                preSelectedEndMinute={endMinute}
            />

            <RoomFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingRoom(null); }}
                onSuccess={loadData}
                room={editingRoom}
            />

            <RoomExcelUploadModal
                isOpen={isExcelModalOpen}
                onClose={() => setIsExcelModalOpen(false)}
                onSuccess={loadData}
            />

            {/* Delete Confirm Dialog */}
            <AlertDialog open={!!deletingRoom} onOpenChange={(o) => !o && setDeletingRoom(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-800">Hapus Ruangan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ruangan <span className="font-semibold text-slate-700">&quot;{deletingRoom?.name}&quot;</span> akan dihapus secara permanen.
                            Semua data peminjaman terkait juga akan terpengaruh.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-slate-200" onClick={() => setDeletingRoom(null)}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteLoading}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                        >
                            {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
