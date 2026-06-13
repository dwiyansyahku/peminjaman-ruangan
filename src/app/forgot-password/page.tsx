"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, RefreshCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/recovery`,
            });

            if (error) throw error;

            setSubmitted(true);
            toast.success("Tautan reset password telah dikirim ke email Anda!");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Gagal memproses permintaan";
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
                            <RefreshCcw className="w-8 h-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                            Lupa Password?
                        </CardTitle>
                        <CardDescription className="text-sm font-medium mt-1">Kami akan mengirimkan tautan untuk mengatur ulang password Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        {!submitted ? (
                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <Label htmlFor="email" className="flex items-center gap-2 font-semibold text-slate-700">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        Email Anda
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
                                    <p className="text-xs text-slate-500 mt-2">
                                        Masukkan alamat email yang terdaftar di akun Anda.
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20"
                                        disabled={loading}
                                    >
                                        {loading ? "Memproses..." : "Kirim Tautan Reset"}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Periksa Email Anda</h3>
                                <p className="text-slate-600 text-sm">
                                    Kami telah mengirimkan tautan reset password ke <br /><strong className="text-slate-800">{email}</strong>
                                </p>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm font-medium">
                            <Link href="/login" className="text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Kembali ke Halaman Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
