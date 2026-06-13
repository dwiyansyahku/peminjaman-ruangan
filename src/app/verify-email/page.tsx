"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { KeyRound, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const emailParam = searchParams.get("email");

    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [emailParam]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (token.length < 6) {
            toast.error("Kode verifikasi tidak valid. Masukkan 6 digit kode.");
            return;
        }

        if (!email) {
            toast.error("Email tidak ditemukan. Silakan ulangi pendaftaran.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'signup',
            });

            if (error) throw error;

            toast.success("Verifikasi email berhasil! Silakan login untuk melanjutkan.");

            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Verifikasi gagal";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleVerify} className="space-y-4">
            <div>
                <Label htmlFor="token" className="flex items-center gap-2 font-semibold text-slate-700">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                    Kode Verifikasi (OTP)
                </Label>
                <div className="text-xs text-slate-500 mb-2">
                    Cek email <strong>{email || "Anda"}</strong> untuk mendapatkan kode 6-digit.
                </div>
                <Input
                    id="token"
                    type="text"
                    placeholder="Masukkan 6 digit kode"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    required
                    className="mt-1 border-slate-200 bg-slate-50 focus:bg-white text-center text-xl tracking-[0.5em] font-mono transition-colors"
                />
            </div>

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20"
                    disabled={loading || token.length < 6}
                >
                    {loading ? "Memverifikasi..." : "Verifikasi Email"}
                </Button>
            </div>
        </form>
    );
}

export default function VerifyEmailPage() {
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

            {/* Content */}
            <div className="flex-1 flex items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md shadow-2xl border-blue-200 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-400"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="mx-auto w-16 h-16 bg-blue-50 border-4 border-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner transform -rotate-3">
                            <MailCheck className="w-8 h-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                            Verifikasi Email
                        </CardTitle>
                        <CardDescription className="text-sm font-medium mt-1">
                            Masukkan kode yang kami kirim ke email Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <Suspense fallback={<div className="text-center py-4 text-slate-500">Memuat formulir...</div>}>
                            <VerifyEmailForm />
                        </Suspense>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm font-medium">
                            <span className="text-slate-500">Kembali ke </span>
                            <Link href="/login" className="text-blue-600 hover:underline">
                                Halaman Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
