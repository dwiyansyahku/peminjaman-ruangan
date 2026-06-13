"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Eye, EyeOff, Building2, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getUserByEmail } from "@/actions/users";
import { Footer } from "@/components/layout/Footer";

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
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
            // Check if email already exists in the database
            const existingUser = await getUserByEmail(email);
            if (existingUser) {
                toast.error("Email sudah terdaftar. Silakan gunakan email lain atau masuk.");
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'STUDENT',
                    },
                },
            });

            if (error) {
                // Supabase might return User already registered error message
                if (error.message.includes('already registered') || error.message.includes('already exists')) {
                    throw new Error("Email sudah terdaftar. Silakan gunakan email lain atau masuk.");
                }
                throw error;
            }

            // Force sign out immediately after sign up to prevent auto-login
            await supabase.auth.signOut();

            toast.success("Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.", {
                duration: 3000,
            });

            // Delay redirect to show success message
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Pendaftaran gagal";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 text-slate-800 shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center h-16">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 p-1">
                                <img
                                    src="/logo-itpb.png"
                                    alt="ITPB Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-lg font-extrabold text-blue-950 tracking-tight group-hover:text-blue-700 transition-colors leading-tight">Sistem Peminjaman Ruangan</h1>
                                <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Institut Teknologi Petroleum Balongan</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Register Form */}
            <div className="flex-1 flex items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
                    <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30 transition-transform hover:scale-110">
                            <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Daftar Akun</CardTitle>
                        <CardDescription className="text-sm font-medium mt-1">Buat akun Mahasiswa untuk mulai meminjam ruangan</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <Label htmlFor="fullName" className="flex items-center gap-2 font-semibold text-slate-700">
                                    <User className="h-4 w-4 text-slate-400" />
                                    Nama Lengkap
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Masukkan nama lengkap"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="mt-1 border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email" className="flex items-center gap-2 font-semibold text-slate-700">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1 border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <Label htmlFor="password" className="flex items-center gap-2 font-semibold text-slate-700">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                    Password
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
                                    Konfirmasi Password
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

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20"
                                    disabled={loading}
                                >
                                    {loading ? "Memproses..." : "Daftar Akun"}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm font-medium">
                            <span className="text-slate-500">Sudah punya akun? </span>
                            <Link href="/login" className="text-blue-600 hover:underline">
                                Masuk sekarang
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
}
