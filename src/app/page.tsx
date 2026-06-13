import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle,
  Lock,
  Search as SearchIcon,
  Sparkles,
} from "lucide-react";
import { db } from "@/db";
import { rooms, bookings } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { format, startOfDay, endOfDay, isWithinInterval, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { id as localeId } from "date-fns/locale";
import { Footer } from "@/components/layout/Footer";
import { LandingDatePicker } from "@/components/dashboard/LandingDatePicker";
import { LandingSearchInput } from "@/components/dashboard/LandingSearchInput";

import { getSystemSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    date?: string;
    q?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { date: selectedDateStr, q: searchQuery } = await searchParams;
  const now = new Date();
  
  // Parse selected date or fallback to today
  const selectedDate = selectedDateStr ? new Date(`${selectedDateStr}T00:00:00`) : now;
  const targetDate = isNaN(selectedDate.getTime()) ? now : selectedDate;
  
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);
  const isSelectedDateToday = isToday(targetDate);

  // Fetch data
  const [roomsData, targetDayBookings] = await Promise.all([
    db.select().from(rooms).orderBy(rooms.name),
    db.select({
      booking: bookings,
      room: rooms,
    })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(
      and(
        eq(bookings.status, "ACTIVE"),
        gte(bookings.startTime, dayStart),
        lte(bookings.startTime, dayEnd)
      )
    ),
  ]);
  const allRooms = searchQuery 
    ? roomsData.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : roomsData;

  const occupiedRoomIds = new Set(
    targetDayBookings
      .filter((b) => {
          if (!isSelectedDateToday) return false;
          return isWithinInterval(now, { start: b.booking.startTime, end: b.booking.endTime });
      })
      .map((b) => b.room.id)
  );

  const availableRoomsCount = allRooms.filter(r => r.status === "AVAILABLE" && !occupiedRoomIds.has(r.id)).length;
  const occupiedRoomsCount = occupiedRoomIds.size;
  const maintenanceCount = allRooms.filter(r => r.status === "MAINTENANCE").length;

  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 7);
  const emeraldGreen = "#10b981";

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group animate-in fade-in duration-500">
            <div className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 p-1">
              <img src="/logo-itpb.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-extrabold text-blue-950 tracking-tight leading-tight">Sistem Peminjaman Ruangan</h1>
              <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">ITPB Balongan</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-blue-900 font-bold hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors">Login</Button>
            </Link>
            <Link href="/register">
              <Button style={{ backgroundColor: emeraldGreen }} className="text-white rounded-xl shadow-lg shadow-emerald-500/20 font-bold px-6 hover:brightness-110 active:scale-95 transition-all">Daftar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12 flex-1">
        <section className="relative rounded-[2.5rem] bg-white p-8 md:p-14 overflow-hidden shadow-2xl shadow-blue-100 min-h-[500px] flex items-center justify-center animate-in zoom-in-95 duration-1000 border border-blue-50">

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-wrap justify-center gap-3">
              <Badge style={{ backgroundColor: emeraldGreen + '20', color: emeraldGreen }} className="border-emerald-400/30 backdrop-blur-md px-4 py-1.5 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">🚀 Real-time Availability</Badge>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-blue-950 leading-[1.1] tracking-tight">
              Sistem Informasi <br className="hidden md:block"/>
              <span style={{ color: emeraldGreen }}>Manajemen Ruangan</span>
            </h2>
            <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Cek jadwal pemakaian ruangan {isSelectedDateToday ? "hari ini" : format(targetDate, "dd MMMM", { locale: localeId })} secara transparan. <br className="hidden md:block"/>
              Portal resmi untuk kegiatan akademik mahasiswa ITPB.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-4">
              {[
                { label: "Total Ruangan", value: allRooms.length, bg: "bg-blue-50/50", text: "text-blue-600" },
                { label: "Tersedia Now", value: isSelectedDateToday ? availableRoomsCount : "-", bg: "bg-emerald-50", text: "text-emerald-600" },
                { label: isSelectedDateToday ? "Terpakai Now" : "Total Booking", value: isSelectedDateToday ? occupiedRoomsCount : targetDayBookings.length, bg: "bg-orange-50", text: "text-orange-600" },
                { label: "Maintenance", value: maintenanceCount, bg: "bg-slate-50", text: "text-slate-400" }
              ].map((stat, i) => (
                <Card key={i} className={`${stat.bg} border border-white shadow-xl shadow-blue-900/5 hover:scale-105 transition-transform`} suppressHydrationWarning>
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-black mb-1 ${stat.text}`}>{stat.value}</p>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <CalendarIcon style={{ color: emeraldGreen }} className="w-8 h-8" />
                Jadwal Peminjaman {isSelectedDateToday ? "Hari Ini" : format(targetDate, "dd MMM yyyy", { locale: localeId })}
              </h3>
                • {format(targetDate, "EEEE, dd MMMM yyyy", { locale: localeId })}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="space-y-1 w-full sm:w-auto"><LandingSearchInput /></div>
              <div className="space-y-1 w-full sm:w-auto"><LandingDatePicker /></div>
            </div>
          </div>

          <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-[220px_1fr] border-b border-slate-100 bg-slate-50/30 sticky top-0 z-40">
                    <div className="p-4 bg-slate-100/50 font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] border-r border-slate-100 text-center">Ruangan</div>
                    <div className="flex">
                      {timeSlots.map(h => (
                        <div key={h} className="flex-1 p-4 text-center font-black text-slate-400 text-[10px] border-r border-slate-50 last:border-0">{h.toString().padStart(2, '0')}:00</div>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100" style={{ scrollbarWidth: 'thin' }}>
                    {allRooms.length > 0 ? allRooms.map(room => {
                      const bookingsInRoom = targetDayBookings.filter(b => b.room.id === room.id);
                      const isOccupied = isSelectedDateToday && occupiedRoomIds.has(room.id);
                      return (
                        <div key={room.id} className="grid grid-cols-[220px_1fr] hover:bg-slate-50/30 transition-colors">
                          <div className="p-4 bg-white border-r border-slate-100 flex flex-col justify-center sticky left-0 z-20">
                            <p className="font-black text-slate-900 text-base truncate">{room.name}</p>
                            <div className="flex items-center gap-2 mt-0.5" suppressHydrationWarning>
                              {room.status === "MAINTENANCE" ? <Badge className="bg-slate-100 text-slate-500 text-[9px] uppercase">Maintenance</Badge> : 
                               isOccupied ? <Badge className="bg-red-50 text-red-600 text-[9px] uppercase">Terpakai</Badge> : 
                               <Link href="/login"><Badge style={{ backgroundColor: emeraldGreen + '1A', color: emeraldGreen }} className="text-[9px] uppercase cursor-pointer hover:scale-105 transition-transform">Tersedia</Badge></Link>}
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> {room.capacity}</span>
                            </div>
                          </div>
                          <div className="relative flex min-h-[70px] items-center">
                             <div className="absolute inset-0 flex">
                                {timeSlots.map(h => <div key={h} className="flex-1 border-r border-slate-50 last:border-0"></div>)}
                             </div>
                             {bookingsInRoom.map(b => {
                               const start = b.booking.startTime.getHours() + (b.booking.startTime.getMinutes() / 60);
                               const end = b.booking.endTime.getHours() + (b.booking.endTime.getMinutes() / 60);
                               const left = ((start - 7) / 12) * 100;
                               const width = ((end - start) / 12) * 100;
                               return (
                                 <div key={b.booking.id} className="absolute h-9 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center px-2 overflow-hidden z-20 cursor-not-allowed opacity-90 shadow-sm" style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100-left)}%` }}>
                                    <p className="text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1 whitespace-nowrap text-center">
                                      <Lock className="w-2.5 h-2.5 flex-shrink-0" /> 
                                      Ruangan dipakai pada pukul {format(b.booking.startTime, "HH:mm")} - {format(b.booking.endTime, "HH:mm")}
                                    </p>
                                 </div>
                               );
                             })}
                             {isSelectedDateToday && now.getHours() >= 7 && now.getHours() < 19 && (
                               <div style={{ backgroundColor: emeraldGreen, left: `${((now.getHours() + now.getMinutes()/60) - 7) / 12 * 100}%` }} className="absolute h-full w-0.5 z-30 shadow-lg" suppressHydrationWarning>
                                 <div style={{ backgroundColor: emeraldGreen }} className="absolute top-0 -translate-x-1/2 w-2 h-2 rounded-full border border-white"></div>
                               </div>
                             )}
                          </div>
                        </div>
                      );
                    }) : <div className="p-20 text-center text-slate-400 italic">Data tidak ditemukan.</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center gap-4 bg-white/40 p-5 rounded-2xl border border-white text-slate-500 text-xs font-medium backdrop-blur-md shadow-sm">
            <Sparkles style={{ color: emeraldGreen }} className="w-5 h-5 flex-shrink-0" />
            <p>Klik badge <b style={{ color: emeraldGreen }}>"Tersedia"</b> untuk meminjam ruangan. Slot yang bertanda <b>Lock</b> sudah dipesan oleh pengguna lain.</p>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-500">
          {[
            { icon: <SearchIcon />, title: "Cek Jadwal", desc: "Pantau ketersediaan real-time", color: "bg-blue-50 text-blue-600" },
            { icon: <Lock />, title: "Booking Aman", desc: "Portal login mahasiswa resmi", color: "bg-emerald-50 text-emerald-600" },
            { icon: <Clock />, title: "Slot 07:00-18:00", desc: "Sesuai jam operasional kampus", color: "bg-orange-50 text-orange-600" },
            { icon: <CheckCircle />, title: "Approval Cepat", desc: "Verifikasi sistem otomatis", color: "bg-indigo-50 text-indigo-600" }
          ].map((f, i) => (
            <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-all rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>{f.icon}</div>
                <div><h4 className="font-black text-slate-800 text-sm">{f.title}</h4><p className="text-[11px] text-slate-500 leading-tight">{f.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
