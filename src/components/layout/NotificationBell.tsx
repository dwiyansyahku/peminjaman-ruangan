"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAnnouncements } from "@/actions/announcements";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";

export function NotificationBell() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const data = await getAnnouncements(true);
            setAnnouncements(data);

            // For simple unread logic, we could use localStorage to store the last seen count or latest ID
            const lastSeenId = localStorage.getItem("lastSeenAnnouncementId");
            if (data.length > 0) {
                const latestId = data[0].announcement.id;
                if (String(latestId) !== lastSeenId) {
                    setUnreadCount(data.length); // Simplified: show all as unread if latest is new
                }
            }
        };

        fetchAnnouncements();
        // Refresh every 5 minutes
        const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);

        // Also update the local current time for filtering
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 10000);

        return () => {
            clearInterval(interval);
            clearInterval(timeInterval);
        };
    }, []);

    // Filter announcements based on current time
    const activeAnnouncements = announcements.filter(({ announcement }) => {
        return announcement.isActive;
    });

    const handleOpen = () => {
        if (activeAnnouncements.length > 0) {
            localStorage.setItem("lastSeenAnnouncementId", String(activeAnnouncements[0].announcement.id));
            setUnreadCount(0);
        }
    };

    const handleAnnouncementClick = (roomId: number | null) => {
        if (roomId) {
            router.push(`/dashboard?roomId=${roomId}`);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && handleOpen()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 border-2 border-white text-white text-[10px] font-bold rounded-full">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Pengumuman</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Berita dan informasi terbaru</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {activeAnnouncements.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bell className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500 italic">Belum ada pengumuman</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {activeAnnouncements.map(({ announcement, room, isOccupied }) => {
                                const isPast = announcement.blockedUntil ? new Date(announcement.blockedUntil) <= currentTime : false;
                                const isDisabled = isOccupied || isPast;
                                return (
                                    <DropdownMenuItem
                                        key={announcement.id}
                                        className={`p-4 flex flex-col items-start gap-1 transition-colors outline-none focus:outline-none ${!isDisabled ? "cursor-pointer hover:bg-blue-50/50 focus:bg-blue-50/50" : "opacity-50 cursor-not-allowed"}`}
                                        onClick={(e) => {
                                            if (isDisabled) {
                                                e.preventDefault();
                                                return;
                                            }
                                            handleAnnouncementClick(announcement.linkedRoomId);
                                        }}
                                    >
                                        <div className="flex justify-between w-full items-start gap-2">
                                            <span className={`font-bold text-sm leading-tight ${!isDisabled ? "text-slate-800" : "text-slate-500"}`}>{announcement.title}</span>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium uppercase tracking-tighter">
                                                {format(new Date(announcement.createdAt), "dd MMM", { locale: id })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                                            {announcement.description}
                                        </p>
                                        {room && (
                                            <div className="mt-2 flex justify-between w-full items-center">
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="outline" className={`text-[9px] font-bold py-0 h-4 ${isDisabled ? 'text-slate-400 border-slate-200' : 'text-blue-600 border-blue-200 bg-blue-50/50'}`}>
                                                        {room.name}
                                                    </Badge>
                                                </div>
                                                {isPast ? (
                                                    <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase tracking-wider h-4 py-0">Kedaluwarsa</Badge>
                                                 ) : isOccupied ? (
                                                    <Badge className="bg-red-50 text-red-600 border-red-100 font-bold text-[9px] uppercase tracking-wider h-4 py-0">BOOKED</Badge>
                                                ) : (
                                                    <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Klik untuk booking →</span>
                                                )}
                                            </div>
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>
                    )}
                </div>
                {activeAnnouncements.length > 0 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 p-0 h-auto hover:bg-transparent"
                            onClick={() => router.push('/dashboard')}
                        >
                            Lihat Semua Pengumuman
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
