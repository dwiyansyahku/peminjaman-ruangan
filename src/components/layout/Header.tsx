"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "./NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface HeaderProps {
    userName?: string;
    userRole?: string;
    showAuth?: boolean;
}

export function Header({ userName, userRole, showAuth = true }: HeaderProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 text-slate-800 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Title */}
                    <Link href={userName ? "/dashboard" : "/"} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <img
                                src="/logo-itpb.png"
                                alt="ITPB Logo"
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-blue-900 tracking-tight group-hover:text-blue-700 transition-colors">Sistem Peminjaman Ruangan</h1>
                            <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">Institut Teknologi Petroleum Balongan</p>
                        </div>
                    </Link>

                    {/* Right Side: User Menu */}
                    <div className="flex items-center gap-6">
                        {userName && userRole === "STUDENT" && <NotificationBell />}
                        {/* User Menu */}
                        {showAuth && userName ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="text-slate-700 hover:text-blue-900 hover:bg-blue-50/50 rounded-full transition-colors h-auto p-1">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-inner flex items-center justify-center">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                                    <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer py-2">
                                        <User className="mr-2 h-4 w-4 text-slate-500" />
                                        <span className="font-medium">Profil User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600 py-2">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span className="font-medium">Keluar</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : showAuth ? (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <Button variant="ghost" className="text-blue-900 hover:text-blue-900 hover:bg-blue-50 font-semibold rounded-xl transition-colors">
                                        Masuk
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-blue-900 text-white hover:bg-blue-800 font-semibold rounded-xl shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5">
                                        Daftar
                                    </Button>
                                </Link>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </header>
    );
}
