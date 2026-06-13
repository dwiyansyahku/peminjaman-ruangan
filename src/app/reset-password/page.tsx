"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionStatus, setSessionStatus] = useState<"checking" | "found" | "missing">("checking");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
                setSessionStatus("found");
            } else {
                // Wait for the browser client to parse the URL hash if it's an implicit flow
                const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === "PASSWORD_RECOVERY" || session) {
                        setSessionStatus("found");
                    } else if (event === "SIGNED_OUT") {
                        setSessionStatus("missing");
                    }
                });

                // Fallback timeout if no event happens
                setTimeout(() => {
                    setSessionStatus((prev) => prev === "checking" ? "missing" : prev);
                }, 2000);

                return () => listener.subscription.unsubscribe();
            }
        };
        checkSession();
    }, [supabase]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Password tidak cocok");
            return;
        }

        if (password.length < 6) {
            toast.error("Password minimal 6 karakter");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setShowSuccessModal(true);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Gagal mengubah password";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 text-slate-800 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center h-16">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                                <img
                                    src="/logo-itpb.png"
                                    alt="ITPB Logo"
                                    className="w-8 h-8 object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-lg font-extrabold text-blue-900 tracking-tight group-hover:text-blue-700 transition-colors">Sistem Peminjaman Ruangan</h1>
                                <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">Institut Teknologi Petroleum Balongan</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center py-20 px-4">
                <Card className="w-full max-w-md shadow-2xl border-blue-200 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-400"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="mx-auto w-16 h-16 bg-blue-50 border-4 border-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner transform -rotate-3">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                            Buat Password Baru
                        </CardTitle>
                        <CardDescription className="text-sm font-medium mt-1">Silakan masukkan password baru untuk akun Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        {sessionStatus === "checking" && (
                            <div className="flex flex-col items-center justify-center space-y-3 py-6 text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-sm font-medium">Memverifikasi tautan...</p>
                            </div>
                        )}
                        {sessionStatus === "missing" && (
                            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-4 mb-6 text-sm flex flex-col items-center text-center">
                                <AlertCircle className="w-8 h-8 mb-2" />
                                <strong className="font-bold text-base mb-1">Tautan Tidak Valid atau Kedaluwarsa</strong>
                                <p>Sesi autentikasi tidak ditemukan. Pastikan Anda membuka tautan yang paling baru dari email Anda, karena tautan yang lama mungkin sudah hangus.</p>
                                <Button
                                    onClick={() => router.push("/forgot-password")}
                                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Minta Tautan Baru
                                </Button>
                            </div>
                        )}
                        {sessionStatus === "found" && (
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div>
                                    <Label htmlFor="password" className="flex items-center gap-2 font-semibold text-slate-700">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                        Password Baru
                                    </Label>
                                    <div className="relative mt-1">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimal 6 karakter"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="border-slate-200 bg-slate-50 focus:bg-white transition-colors pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="confirmPassword" className="flex items-center gap-2 font-semibold text-slate-700">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                        Konfirmasi Password Baru
                                    </Label>
                                    <div className="relative mt-1">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Ulangi password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="border-slate-200 bg-slate-50 focus:bg-white transition-colors pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20"
                                        disabled={loading}
                                    >
                                        {loading ? "Menyimpan..." : "Simpan Password Baru"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm shadow-2xl border-none overflow-hidden transform animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                        <div className="h-2 bg-green-500"></div>
                        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-green-50/50">
                                <CheckCircle2 className="w-10 h-10 text-green-600 animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Password Diperbarui!</h3>
                            <p className="text-slate-600 mb-8 font-medium">
                                Password Anda telah berhasil diubah. Silakan masuk kembali dengan password baru Anda.
                            </p>
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                            >
                                OK, Masuk Sekarang
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
