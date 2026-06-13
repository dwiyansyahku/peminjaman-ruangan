"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    ShieldCheck,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getUserByNim } from "@/actions/users";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load saved identifier if 'Remember Me' was previously checked
    useEffect(() => {
        const savedId = localStorage.getItem("rememberedEmail");
        if (savedId) {
            setIdentifier(savedId);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let loginEmail = identifier;

            // Login via NIM logic
            if (!identifier.includes("@")) {
                const user = await getUserByNim(identifier);
                if (!user) {
                    toast.error("NIM tidak ditemukan.");
                    setLoading(false);
                    return;
                }
                
                if (user.role === "ADMIN") {
                    toast.error("Admin wajib masuk menggunakan email.");
                    setLoading(false);
                    return;
                }
                
                loginEmail = user.email;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });

            if (error) {
                toast.error(error.message === "Invalid login credentials" ? "Email/NIM atau password salah" : error.message);
                return;
            }

            // Handle Remember Me logic
            if (rememberMe) {
                localStorage.setItem("rememberedEmail", identifier);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            toast.success("Login berhasil!");
            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            console.error("Login error:", error);
            toast.error("Terjadi kesalahan saat login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header showAuth={false} />

            <div className="flex-1 flex items-center justify-center py-20 px-4">
                <Card className="w-full max-w-md border-none shadow-2xl shadow-blue-900/10 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardHeader className="pt-10 pb-6 text-center space-y-2">
                        <div className="mx-auto w-20 h-20 bg-blue-600 rounded-[2rem] shadow-lg shadow-blue-600/30 flex items-center justify-center mb-4 transition-transform hover:scale-110">
                            <ShieldCheck className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Portal Masuk</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                            Silakan masuk ke akun Anda untuk akses dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <Label htmlFor="identifier" className="flex items-center gap-2 font-semibold text-slate-700">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    Email atau NIM
                                </Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    placeholder=""
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    className="mt-1 border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password" className="flex items-center gap-2 font-semibold text-slate-700">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                    Password
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder=""
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
                                <div className="flex justify-end">
                                    <Link 
                                        href="/forgot-password" 
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors mt-1"
                                    >
                                        Lupa password?
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 pt-1 pb-2">
                                <Checkbox 
                                    id="remember" 
                                    checked={rememberMe} 
                                    onCheckedChange={(c) => setRememberMe(c as boolean)} 
                                    className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 text-white"
                                />
                                <label
                                    htmlFor="remember"
                                    className="text-sm font-medium leading-none text-slate-600 cursor-pointer select-none"
                                >
                                    Remember Me
                                </label>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : "Masuk"}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm font-medium">
                            <span className="text-slate-500">Belum punya akun? </span>
                            <Link href="/register" className="text-blue-600 hover:underline">
                                Daftar sekarang
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
}
