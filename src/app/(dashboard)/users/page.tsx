"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { getAllUsers, adminUpdateUser, deleteUser, getCurrentUser } from "@/actions/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Users, Search } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/db/schema";
import { useRouter } from "next/navigation";

export default function UsersManagementPage() {
    const router = useRouter();
    const [usersList, setUsersList] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Edit Form State
    const [formData, setFormData] = useState({
        fullName: "",
        nim: "",
        prodi: "",
        phone: "",
        role: "STUDENT" as "ADMIN" | "STUDENT",
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const me = await getCurrentUser();
        if (me?.role !== "ADMIN") {
            toast.error("Anda tidak memiliki akses ke halaman ini");
            router.push("/dashboard");
            return;
        }
        setCurrentUser(me);
        
        const all = await getAllUsers();
        setUsersList(all as User[]);
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers
    const handleOpenEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            fullName: user.fullName || "",
            nim: user.nim || "",
            prodi: user.prodi || "",
            phone: user.phone || "",
            role: user.role,
        });
        setIsEditModalOpen(true);
    };

    const handleOpenDelete = (user: User) => {
        if (user.id === currentUser?.id) {
            toast.error("Anda tidak dapat menghapus akun Anda sendiri");
            return;
        }
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        
        try {
            const result = await adminUpdateUser(selectedUser.id, formData);
            if (result.success) {
                toast.success("Profil pengguna berhasil diperbarui");
                setIsEditModalOpen(false);
                loadData();
            } else {
                toast.error(result.error || "Gagal memperbarui profil pengguna");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan pada sistem");
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;

        try {
            const result = await deleteUser(selectedUser.id);
            if (result.success) {
                toast.success("Pengguna berhasil dihapus");
                setIsDeleteDialogOpen(false);
                loadData();
            } else {
                toast.error(result.error || "Gagal menghapus pengguna");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan pada sistem");
        }
    };

    const filteredUsers = usersList.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nim && user.nim.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-8 w-8 text-blue-500" />
                        Manajemen User
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola data mahasiswa dan admin sistem</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cari nama, email, atau NIM..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white rounded-xl border-slate-200"
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-600">Pengguna</TableHead>
                                <TableHead className="font-semibold text-slate-600">NIM</TableHead>
                                <TableHead className="font-semibold text-slate-600">Jurusan (Prodi)</TableHead>
                                <TableHead className="font-semibold text-slate-600">Role</TableHead>
                                <TableHead className="font-semibold text-slate-600 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                        Tidak ada pengguna yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{user.fullName || "User"}</span>
                                                <span className="text-xs text-slate-500">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">{user.nim || "-"}</TableCell>
                                        <TableCell className="text-slate-600">{user.prodi || "-"}</TableCell>
                                        <TableCell>
                                            <Badge className={user.role === "ADMIN" ? "bg-purple-100 text-purple-700 border-none" : "bg-blue-100 text-blue-700 border-none"}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleOpenEdit(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleOpenDelete(user)}
                                                    disabled={user.id === currentUser?.id}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
                    <DialogHeader className="border-b border-slate-100 pb-4">
                        <DialogTitle className="text-xl font-bold text-slate-800">Edit Pengguna</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap</Label>
                            <Input 
                                value={formData.fullName} 
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                                className="bg-slate-50 border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NIM</Label>
                            <Input 
                                value={formData.nim} 
                                onChange={(e) => setFormData({...formData, nim: e.target.value})} 
                                className="bg-slate-50 border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jurusan (Prodi)</Label>
                            <Input 
                                value={formData.prodi} 
                                onChange={(e) => setFormData({...formData, prodi: e.target.value})} 
                                className="bg-slate-50 border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor HP</Label>
                            <Input 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})} 
                                className="bg-slate-50 border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</Label>
                            <Select 
                                value={formData.role} 
                                onValueChange={(val: "ADMIN" | "STUDENT") => setFormData({...formData, role: val})}
                                disabled={selectedUser?.id === currentUser?.id}
                            >
                                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl">
                                    <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            {selectedUser?.id === currentUser?.id && (
                                <p className="text-[10px] text-orange-500 mt-1 leading-tight">Anda tidak dapat mengubah role Anda sendiri.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="border-t border-slate-100 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">Batal</Button>
                        <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-slate-800">Hapus pengguna ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Menghapus pengguna <b>{selectedUser?.fullName}</b> juga akan menghapus seluruh data peminjaman yang terkait dengan pengguna ini.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                            Hapus Pengguna
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
