"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Search,
    Calendar,
    Clock,
    MapPin,
    Megaphone,
    Building2,
    ArrowRight,
    Plus,
    Edit,
    Trash2,
    AlertCircle,
    RepeatIcon,
} from "lucide-react";
import { searchRooms, getRooms } from "@/actions/rooms";
import { createBooking, getUserBookings, getActiveBookings, cancelBooking } from "@/actions/bookings";
import { getAnnouncements, createAnnouncement } from "@/actions/announcements";
import { getCurrentUser } from "@/actions/users";
import { AdminBookingModal } from "@/components/booking/AdminBookingModal";
import { SlotManagementModal } from "@/components/booking/SlotManagementModal";
import { AnnouncementModal } from "@/components/announcement/AnnouncementModal";
import { EditBookingModal } from "@/components/booking/EditBookingModal";
import { RecurringBookingModal } from "@/components/booking/RecurringBookingModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

interface Room {
    id: number;
    name: string;
    capacity: number;
    status: string;
    facilities: string | null;
    imageUrl: string | null;
    description: string | null;
}

interface Booking {
    id: number;
    roomId: number;
    startTime: Date;
    endTime: Date;
    status: string;
    purpose: string | null;
}

interface Announcement {
    id: number;
    title: string;
    description: string | null;
    linkedRoomId: number | null;
    isActive: boolean;
    blockedFrom: Date | null;
    blockedUntil: Date | null;
    createdAt: Date;
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}

function DashboardContent() {
    const [user, setUser] = useState<{ id: string; fullName: string; role: string } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Data state
    const [announcements, setAnnouncements] = useState<{ announcement: Announcement; room: Room | null; isOccupied?: boolean }[]>([]);
    const [myBookings, setMyBookings] = useState<{ booking: Booking; room: Room }[]>([]);
    const [allBookings, setAllBookings] = useState<{ booking: Booking; room: Room; user: { fullName: string } }[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Modal state
    const [bookingModal, setBookingModal] = useState(false);
    const [adminBookingModal, setAdminBookingModal] = useState(false);
    const [announcementModal, setAnnouncementModal] = useState(false);
    const [slotModal, setSlotModal] = useState(false);
    const [editBookingModal, setEditBookingModal] = useState(false);
    const [recurringModal, setRecurringModal] = useState(false);
    const [selectedBookingToEdit, setSelectedBookingToEdit] = useState<{ booking: Booking; room: Room } | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; start: string; end: string } | null>(null);
    const [bookingForm, setBookingForm] = useState({ name: "", nim: "", phone: "", purpose: "" });

    // Admin stats
    const [stats, setStats] = useState({ totalBookings: 0, totalRooms: 0 });

    // Realtime time state
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10 seconds
        return () => clearInterval(timer);
    }, []);

    // Filter announcements based on current time
    const activeAnnouncements = useMemo(() => {
        return announcements.filter(({ announcement }) => {
            if (announcement.blockedUntil) {
                return new Date(announcement.blockedUntil) > currentTime;
            }
            return announcement.isActive;
        });
    }, [announcements, currentTime]);

    // Map bookings to update status in realtime
    const realTimeMyBookings = myBookings.map((item) => {
        const isFinished = new Date(item.booking.endTime) <= currentTime;
        return {
            ...item,
            booking: {
                ...item.booking,
                status: isFinished && item.booking.status === "ACTIVE" ? "Selesai" : item.booking.status
            }
        };
    });

    const realTimeAllBookings = allBookings.map((item) => {
        const isFinished = new Date(item.booking.endTime) <= currentTime;
        return {
            ...item,
            booking: {
                ...item.booking,
                status: isFinished && item.booking.status === "ACTIVE" ? "Selesai" : item.booking.status
            }
        };
    });

    // Realtime active bookings stats based on frontend time status
    const currentActiveBookingsStats = realTimeAllBookings.filter(b => b.booking.status === "ACTIVE").length;

    // Load initial data
    const loadData = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setIsAdmin(currentUser.role === "ADMIN");
                setBookingForm(prev => ({
                    ...prev,
                    name: currentUser.fullName,
                    nim: (currentUser as any).nim || "",
                    phone: (currentUser as any).phone || ""
                }));

                // Load user bookings
                const userBookings = await getUserBookings(currentUser.id);
                setMyBookings(userBookings as typeof myBookings);

                // Load all bookings for admin
                if (currentUser.role === "ADMIN") {
                    const allBookingsData = await getActiveBookings();
                    setAllBookings(allBookingsData as typeof allBookings);

                    const roomsData = await getRooms();
                    setRooms(roomsData);

                    setStats({
                        totalBookings: allBookingsData.length,
                        totalRooms: roomsData.length
                    });
                }
            }

            // Load announcements
            const announcementsData = await getAnnouncements(true);
            setAnnouncements(announcementsData as typeof announcements);

        } catch (error) {
            console.error("Error loading data:", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const roomId = searchParams.get("roomId");
        if (roomId && activeAnnouncements.length > 0) {
            const match = activeAnnouncements.find(a => a.room?.id === parseInt(roomId) && !a.isOccupied);
            if (match) {
                handleAnnouncementClick(match.announcement, match.room, match.isOccupied);
                // Clear the query parameter to prevent infinite loop & auto-reopening on closing modal
                router.replace('/dashboard');
            }
        }
    }, [searchParams, activeAnnouncements, router]);


    // Open booking modal
    const openBookingModal = (room: Room) => {
        setSelectedRoom(room);
        setBookingModal(true);
    };

    const handleAnnouncementClick = (ann: Announcement, room: Room | null, isOccupied?: boolean) => {
        if (!room || isOccupied || !ann.blockedFrom || !ann.blockedUntil) return;

        const date = format(new Date(ann.blockedFrom), "yyyy-MM-dd");
        const start = format(new Date(ann.blockedFrom), "HH:mm");
        const end = format(new Date(ann.blockedUntil), "HH:mm");

        setSelectedSlot({ date, start, end });
        setSelectedRoom(room);
        setBookingModal(true);
    };

    // Submit booking
    const handleBooking = async () => {
        if (!selectedRoom || !selectedSlot || !user) return;
        if (!bookingForm.name || !bookingForm.nim || !bookingForm.phone || !bookingForm.purpose) {
            toast.error("Mohon lengkapi formulir (Nama, NIM, No HP, dan Keperluan)");
            return;
        }

        try {
            const startDateTime = new Date(`${selectedSlot.date}T${selectedSlot.start}`);
            const endDateTime = new Date(`${selectedSlot.date}T${selectedSlot.end}`);

            await createBooking({
                userId: user.id,
                roomId: selectedRoom.id,
                startTime: startDateTime,
                endTime: endDateTime,
                purpose: `${bookingForm.purpose} | No. Telp: ${bookingForm.phone}`,
            });

            toast.success("Booking berhasil!");
            setBookingModal(false);
            setBookingForm({
                name: user.fullName,
                nim: (user as any).nim || "",
                phone: (user as any).phone || "",
                purpose: ""
            });
            loadData();
        } catch {
            toast.error("Gagal melakukan booking");
        }
    };

    // Cancel booking
    const handleCancelBooking = async (bookingId: number) => {
        try {
            await cancelBooking(bookingId);
            toast.success("Booking dibatalkan");
            loadData();
        } catch {
            toast.error("Gagal membatalkan booking");
        }
    };

    return (
        <div className="space-y-6">
            {/* Admin Dashboard */}
            {isAdmin ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                        <Card className="border-none shadow-md shadow-orange-500/10 bg-gradient-to-br from-white to-orange-50 rounded-2xl overflow-hidden relative group transition-all hover:shadow-lg hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-orange-600/80 uppercase tracking-wider">Total Booking Aktif</p>
                                        <p className="text-3xl font-black text-slate-800 mt-1">{currentActiveBookingsStats}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-md shadow-blue-500/10 bg-gradient-to-br from-white to-blue-50 rounded-2xl overflow-hidden relative group transition-all hover:shadow-lg hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-blue-600/80 uppercase tracking-wider">Total Ruangan</p>
                                        <p className="text-3xl font-black text-slate-800 mt-1">{stats.totalRooms}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setAdminBookingModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20 rounded-xl transition-all hover:-translate-y-0.5 font-semibold"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Booking
                        </Button>
                        <Button
                            onClick={() => setAnnouncementModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl transition-all hover:-translate-y-0.5 font-semibold"
                        >
                            <Megaphone className="h-4 w-4 mr-2" />
                            Buat Pengumuman
                        </Button>
                        <Button
                            onClick={() => setSlotModal(true)}
                            className="bg-slate-800 hover:bg-slate-900 text-white shadow-md shadow-slate-800/20 rounded-xl transition-all hover:-translate-y-0.5 font-semibold"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Kelola Slot
                        </Button>
                        <Button
                            onClick={() => setRecurringModal(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20 rounded-xl transition-all hover:-translate-y-0.5 font-semibold"
                        >
                            <RepeatIcon className="h-4 w-4 mr-2" />
                            Booking Berulang
                        </Button>
                    </div>

                    {/* Announcements */}
                    <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-green-500" />
                                Pengumuman Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {activeAnnouncements.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Tidak ada pengumuman</p>
                            ) : (
                                <div className="space-y-3">
                                    {activeAnnouncements.slice(0, 3).map(({ announcement }) => {
                                        const isPast = announcement.blockedUntil ? new Date(announcement.blockedUntil) <= currentTime : false;
                                        return (
                                            <div key={announcement.id} className={`p-4 border border-slate-100 rounded-xl transition-all group ${isPast ? 'bg-slate-50/50 opacity-70' : 'bg-slate-50 hover:bg-white hover:border-blue-100 hover:shadow-sm'}`}>
                                                <div className="flex justify-between items-start">
                                                    <p className={`font-bold ${isPast ? 'text-slate-500' : 'text-slate-800 group-hover:text-blue-700'} transition-colors`}>{announcement.title}</p>
                                                    {isPast && (
                                                        <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase tracking-wider h-4 py-0">Kedaluwarsa</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{announcement.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Bookings Mahasiswa List */}
                    <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden mt-6">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-bold text-slate-800">Booking Aktif Mahasiswa</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {realTimeAllBookings.filter(b => b.booking.status === "ACTIVE").length === 0 ? (
                                    <p className="text-slate-500 text-sm italic">Tidak ada booking yang sedang aktif</p>
                                ) : (
                                    realTimeAllBookings.filter(b => b.booking.status === "ACTIVE").map(({ booking, room, user: bookingUser }) => (
                                        <div key={booking.id} className="border border-green-100/50 bg-green-50/10 rounded-xl p-4 flex items-center justify-between hover:bg-green-50/30 hover:shadow-sm transition-all group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-800">{room.name}</span>
                                                    <Badge variant="outline" className="text-[10px] font-bold tracking-wider text-blue-600 border-blue-200 bg-blue-50/50">{`R${String(room.id).padStart(3, '0')}`}</Badge>
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none text-[10px] tracking-wider uppercase">Aktif</Badge>
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">👤 {bookingUser?.fullName || "Mahasiswa"}</p>
                                                <p className="text-sm text-slate-500">
                                                    ⏰ {format(new Date(booking.startTime), "dd MMM yyyy HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                                </p>
                                                <p className="text-sm text-slate-500 truncate max-w-[250px]">📝 {booking.purpose}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 bg-white shadow-sm" onClick={() => {
                                                    setSelectedBookingToEdit({ booking, room });
                                                    setEditBookingModal(true);
                                                }}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm" onClick={() => handleCancelBooking(booking.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Batal
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                /* Mahasiswa Dashboard */
                <>

                    {/* Announcements */}
                    <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-green-500" />
                                Pengumuman
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {activeAnnouncements.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Tidak ada pengumuman</p>
                            ) : (
                                <div className="space-y-3">
                                    {activeAnnouncements.map(({ announcement, room, isOccupied }) => {
                                        const isPast = announcement.blockedUntil ? new Date(announcement.blockedUntil) <= currentTime : false;
                                        const isDisabled = isOccupied || isPast;

                                        return (
                                            <div
                                                key={announcement.id}
                                                onClick={() => {
                                                    if (!isDisabled) {
                                                        handleAnnouncementClick(announcement, room, isOccupied);
                                                    }
                                                }}
                                                className={`p-4 border rounded-xl transition-all group ${room && !isDisabled
                                                    ? "bg-white border-blue-100 hover:border-blue-300 hover:shadow-md cursor-pointer"
                                                    : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className={`font-bold ${room && !isDisabled ? "text-slate-800 group-hover:text-blue-700" : "text-slate-500"}`}>
                                                            {announcement.title}
                                                        </p>
                                                        {room && (
                                                            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-1">
                                                                <Badge variant="outline" className={`text-[10px] ${isDisabled ? "text-slate-400 border-slate-200" : "text-blue-600 border-blue-200 bg-blue-50/50"}`}>
                                                                    {`R${String(room.id).padStart(3, '0')}`}
                                                                </Badge>
                                                                • {format(new Date(announcement.createdAt), "dd MMM yyyy")}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {room && (
                                                        <div className="text-right">
                                                            {isPast ? (
                                                                <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[10px] uppercase tracking-wider">Kedaluwarsa</Badge>
                                                            ) : isOccupied ? (
                                                                <Badge className="bg-red-50 text-red-600 border-red-100 font-bold text-[10px] uppercase tracking-wider">BOOKED</Badge>
                                                            ) : (
                                                                <Badge className="bg-green-50 text-green-700 border-green-100 font-bold text-[10px] uppercase tracking-wider">Tersedia</Badge>
                                                            )}
                                                            {announcement.blockedFrom && announcement.blockedUntil && (
                                                                <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
                                                                    Slot: {format(new Date(announcement.blockedFrom), "HH:mm")} - {format(new Date(announcement.blockedUntil), "HH:mm")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2">
                                                    {announcement.description}
                                                </p>
                                                {room && !isDisabled && (
                                                    <div className="mt-3 flex items-center text-[11px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Klik untuk Booking Cepat <ArrowRight className="h-3 w-3 ml-1" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Removed Available Rooms Grid */}

                    {/* My Bookings */}
                    <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden mt-6">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-bold text-slate-800">Booking Saya</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {realTimeMyBookings.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Anda belum memiliki riwayat booking</p>
                            ) : (
                                <div className="space-y-4">
                                    {realTimeMyBookings.map(({ booking, room }) => (
                                        <div key={booking.id} className="border border-slate-100 rounded-2xl p-4 hover:shadow-sm hover:border-slate-200 transition-all bg-white group">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-slate-800 text-lg">{room.name}</span>
                                                        <Badge className={`${booking.status === "ACTIVE" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-600"} border-none text-[10px] tracking-wider uppercase`}>
                                                            {booking.status === "ACTIVE" ? "Aktif" : booking.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {format(new Date(booking.startTime), "dd MMM yyyy")} • <Clock className="h-3.5 w-3.5 ml-1" /> {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">{booking.purpose}</p>
                                                </div>
                                                {booking.status === "ACTIVE" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl font-semibold shadow-sm transition-colors"
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                    >
                                                        Batalkan
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Booking Modal */}
            <Dialog open={bookingModal} onOpenChange={setBookingModal}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                    <DialogHeader className="pb-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-800">Booking Ruangan</DialogTitle>
                        <p className="text-sm font-medium text-slate-500">{selectedRoom?.name}</p>
                    </DialogHeader>

                    {/* Date/Time Info Box */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-amber-700/70 uppercase tracking-wider mb-1">Tanggal</p>
                                <p className="font-bold text-amber-900">
                                    {selectedSlot && format(new Date(selectedSlot.date), "EEEE, dd MMM yyyy", { locale: id })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-700/70 uppercase tracking-wider mb-1">Waktu</p>
                                <p className="font-bold text-amber-900 bg-white/50 inline-block px-2 py-0.5 rounded-md border border-amber-100">
                                    <Clock className="h-3.5 w-3.5 inline mr-1 text-amber-600" />
                                    {selectedSlot && `${selectedSlot.start} - ${selectedSlot.end}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-5 pt-2">
                        <div>
                            <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                                <span>👤</span> Nama Peminjam <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="Masukkan nama lengkap"
                                value={bookingForm.name}
                                onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all"
                            />
                        </div>
                        <div>
                            <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                                <span>🆔</span> NIM <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="Masukkan NIM"
                                value={bookingForm.nim}
                                onChange={(e) => setBookingForm({ ...bookingForm, nim: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all"
                                readOnly={!!(user as any)?.nim}
                            />
                        </div>
                        <div>
                            <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                                <span>📞</span> No Telepon (WA) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="Contoh: 081234567890"
                                value={bookingForm.phone}
                                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all"
                            />
                        </div>
                        <div>
                            <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                                <span>📝</span> Keperluan <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                placeholder="Contoh: Rapat Organisasi"
                                value={bookingForm.purpose}
                                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all resize-none h-24"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" className="flex-1 rounded-xl font-semibold border-slate-200 hover:bg-slate-50 text-slate-600" onClick={() => setBookingModal(false)}>
                            Batal
                        </Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl font-semibold transition-all hover:-translate-y-0.5" onClick={handleBooking}>
                            Booking Sekarang
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Admin Booking Modal */}
            <AdminBookingModal
                isOpen={adminBookingModal}
                onClose={() => setAdminBookingModal(false)}
                onSuccess={loadData}
                adminId={user?.id || ""}
            />

            {/* Announcement Modal */}
            <AnnouncementModal
                isOpen={announcementModal}
                onClose={() => setAnnouncementModal(false)}
                onSuccess={loadData}
            />

            {/* Slot Management Modal */}
            <SlotManagementModal
                isOpen={slotModal}
                onClose={() => setSlotModal(false)}
                onSuccess={loadData}
            />

            {/* Edit Booking Modal */}
            <EditBookingModal
                isOpen={editBookingModal}
                onClose={() => setEditBookingModal(false)}
                onSuccess={loadData}
                booking={selectedBookingToEdit}
            />

            <RecurringBookingModal
                isOpen={recurringModal}
                onClose={() => setRecurringModal(false)}
                onSuccess={loadData}
                adminId={user?.id || ""}
            />
        </div>
    );
}
