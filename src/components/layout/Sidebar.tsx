"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Calendar,
    Building2,
    User,
    Users,
    GraduationCap,
    Clock,
} from "lucide-react";

interface SidebarProps {
    userRole?: "ADMIN" | "STUDENT";
    userName?: string;
    nim?: string | null;
    prodi?: string | null;
}

const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/rooms", label: "Ruangan", icon: Building2 },
    { href: "/users", label: "Manajemen User", icon: Users },
    { href: "/bookings", label: "Riwayat Peminjaman", icon: Calendar },
];

const studentNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/rooms", label: "Ruangan", icon: Building2 },
    { href: "/bookings", label: "Riwayat Peminjaman", icon: Calendar },
];

export function Sidebar({ userRole = "STUDENT", userName, nim, prodi }: SidebarProps) {
    const pathname = usePathname();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const navItems = userRole === "ADMIN" ? adminNavItems : studentNavItems;

    const formattedDate = currentTime?.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }) || '';

    const formattedTime = currentTime?.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }) || '';

    const UserIcon = userRole === "ADMIN" ? User : GraduationCap;

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="flex h-full flex-col">
                {/* User Info (Top) */}
                <div className="border-b border-slate-700/50 p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 min-w-[48px] items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-inner">
                        <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate break-words whitespace-normal leading-tight">
                            {userRole === "ADMIN" ? (userName || "Administrator") : (userName || "Mahasiswa")}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            {userRole === "ADMIN" ? "Administrator" : "Mahasiswa"}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg shadow-blue-500/10"
                                        : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive && "text-blue-400")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section: Clock */}
                <div className="p-4 border-t border-slate-700/50">
                    {currentTime && (
                        <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white leading-tight">{formattedTime} WIB</span>
                                <span className="text-[10px] font-semibold text-slate-400 leading-tight">{formattedDate}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
