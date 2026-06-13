"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    User,
    Mail,
    Settings,
    Save,
} from "lucide-react";
import { getCurrentUser, updateUserProfile } from "@/actions/users";
import { getSystemSettings, updateSystemSetting } from "@/actions/settings";
import { toast } from "sonner";
import type { User as UserType } from "@/db/schema";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        nim: "",
        prodi: "",
        phone: "",
    });

    const loadData = async () => {
        setIsLoading(true);
        const userData = await getCurrentUser();
        setUser(userData);
        if (userData) {
            setFormData({
                fullName: userData.fullName || "",
                nim: userData.nim || "",
                prodi: userData.prodi || "",
                phone: userData.phone || "",
            });

        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Custom handling for phone number
        if (name === "phone") {
            // Remove any non-digit characters
            const numbersOnly = value.replace(/\D/g, "");
            setFormData((prev) => ({
                ...prev,
                [name]: numbersOnly,
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const result = await updateUserProfile(user.id, formData);

        if (result.success) {
            toast.success("Profil berhasil diperbarui");
            if (result.data) {
                setUser(result.data);
                router.refresh(); // Refresh layout to update Sidebar instantly
            }
        } else {
            toast.error(result.error || "Gagal memperbarui profil");
        }
        setIsSaving(false);
    };


    if (isLoading) {
        return (
            <div className="min-h-screen">
                <div className="flex h-96 items-center justify-center">
                    <div className="animate-pulse text-slate-400">Loading...</div>
                </div>
            </div>
        );
    }

    const isStudent = user?.role === "STUDENT";

    return (
        <div className="min-h-screen">
            <div className="p-6">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Profil</h1>
                    <p className="mt-1 text-slate-600">
                        {isStudent ? "Kelola data diri dan identitas Anda" : "Kelola profil dan preferensi akun Anda"}
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <Card className="lg:col-span-2 border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                    <User className="h-5 w-5 text-blue-500" />
                                    Profil Pengguna
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                                >
                                    {isSaving ? "Menyimpan..." : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </Button>
                            </CardTitle>
                            <CardDescription>
                                Perbarui informasi profil akun Anda di bawah ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-center gap-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                    <User className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800">
                                        {user?.fullName || "User"}
                                    </h3>
                                    <p className="text-slate-500">{user?.email}</p>
                                    <Badge
                                        className={
                                            user?.role === "ADMIN"
                                                ? "mt-2 bg-purple-500"
                                                : "mt-2 bg-blue-500"
                                        }
                                    >
                                        {user?.role === "ADMIN" ? "Administrator" : "Mahasiswa"}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap</Label>
                                    <Input
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-blue-500/20 rounded-xl font-medium text-slate-700 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email (Read-only)</Label>
                                    <Input
                                        value={user?.email || ""}
                                        disabled
                                        className="bg-slate-100 border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                                        title="Email tidak dapat diubah"
                                    />
                                </div>

                                {isStudent && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NIM</Label>
                                            <Input
                                                name="nim"
                                                placeholder="Contoh: 2204xxxx"
                                                value={formData.nim}
                                                onChange={handleChange}
                                                className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-blue-500/20 rounded-xl font-medium text-slate-700 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Program Studi (Prodi)</Label>
                                            <Input
                                                name="prodi"
                                                placeholder="Contoh: Rekayasa Keselamatan Kebakaran"
                                                value={formData.prodi}
                                                onChange={handleChange}
                                                className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-blue-500/20 rounded-xl font-medium text-slate-700 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor WhatsApp (WA)</Label>
                                            <Input
                                                name="phone"
                                                type="tel"
                                                placeholder="Contoh: 081234567890"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-blue-500/20 rounded-xl font-medium text-slate-700 transition-all"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                        </CardContent>
                    </Card>

                    {/* Quick Info & System Settings */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                                    <Settings className="h-5 w-5 text-blue-500" />
                                    Info Akun
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">ID Pengguna</span>
                                    <span className="font-mono text-xs text-slate-600">
                                        {user?.id?.slice(0, 8)}...
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Bergabung</span>
                                    <span className="text-slate-600">
                                        {user?.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString("id-ID")
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Status</span>
                                    <Badge className="bg-green-500">Aktif</Badge>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
