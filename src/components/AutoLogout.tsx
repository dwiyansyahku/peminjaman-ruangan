"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Clock } from "lucide-react";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 menit
const WARNING_BEFORE = 2 * 60 * 1000; // Warning 2 menit sebelum logout

export function AutoLogout() {
    const router = useRouter();
    const supabase = createClient();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(120); // detik
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(async () => {
        setShowWarning(false);
        await supabase.auth.signOut();
        toast.info("Anda telah logout otomatis karena tidak ada aktivitas selama 15 menit.", {
            duration: 5000,
        });
        router.push("/login");
        router.refresh();
    }, [supabase, router]);

    const resetTimer = useCallback(() => {
        // Sembunyikan warning jika user kembali aktif
        setShowWarning(false);
        setCountdown(120);

        // Clear semua timer yang ada
        if (timerRef.current) clearTimeout(timerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        // Set warning timer (muncul 2 menit sebelum logout)
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(120);
            // Start countdown
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, IDLE_TIMEOUT - WARNING_BEFORE);

        // Set logout timer
        timerRef.current = setTimeout(() => {
            handleLogout();
        }, IDLE_TIMEOUT);
    }, [handleLogout]);

    useEffect(() => {
        // Events yang dianggap "aktivitas user"
        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

        const handleActivity = () => {
            resetTimer();
        };

        // Register semua event listener
        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Mulai timer pertama kali
        resetTimer();

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            if (timerRef.current) clearTimeout(timerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [resetTimer]);

    if (!showWarning) return null;

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-orange-600 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Sesi Akan Berakhir</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Anda tidak aktif cukup lama. Sesi akan berakhir dalam:
                    </p>
                    <div className="text-3xl font-black text-orange-600 tabular-nums mb-4">
                        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </div>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={resetTimer}
                            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                        >
                            Tetap Masuk
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Keluar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
