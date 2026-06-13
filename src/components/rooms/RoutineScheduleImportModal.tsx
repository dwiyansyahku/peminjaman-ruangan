"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { importRoutineBookings } from "@/actions/bookings";
import { UploadCloud, FileSpreadsheet, AlertCircle, CalendarRange } from "lucide-react";
import * as xlsx from "xlsx";

interface RoutineScheduleImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RoutineScheduleImportModal({
    isOpen,
    onClose,
    onSuccess,
}: RoutineScheduleImportModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (
                droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                droppedFile.name.endsWith(".xlsx") ||
                droppedFile.name.endsWith(".xls")
            ) {
                setFile(droppedFile);
            } else {
                toast.error("Mohon unggah file Excel (.xlsx atau .xls).");
            }
        }
    };

    const formatTime = (timeValue: any): string => {
        // If it's a fractional day (Excel time format), convert it
        if (typeof timeValue === 'number') {
            let totalSeconds = Math.round(timeValue * 24 * 60 * 60);
            let hours = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds % 3600) / 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        // Otherwise assume it's a string like "07:10" or "07.10"
        let str = String(timeValue).trim().replace(".", ":");
        const parts = str.split(":");
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return str;
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Pilih file terlebih dahulu.");
            return;
        }

        if (!startDate || !endDate) {
            toast.error("Mohon tentukan tanggal mulai dan tanggal selesai periode.");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error("Tanggal selesai harus setelah tanggal mulai.");
            return;
        }

        setIsLoading(true);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = xlsx.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);

            if (jsonData.length === 0) {
                toast.error("Data kosong di dalam file Excel.");
                setIsLoading(false);
                return;
            }

            const parsedSchedules = jsonData.map((row: any) => {
                const roomName = String(row["nama ruangan"] || row["Nama Ruangan"] || "").trim();
                const dayName = String(row["hari"] || row["Hari"] || "").trim();
                const purpose = String(row["mata kuliah"] || row["Mata Kuliah"] || row["kegiatan"] || row["Kegiatan"] || "Jadwal Perkuliahan").trim();
                
                const startTimeRaw = row["jam mulai"] || row["Jam Mulai"];
                const endTimeRaw = row["jam selesai"] || row["Jam Selesai"];

                return {
                    roomName,
                    dayName,
                    startTime: formatTime(startTimeRaw),
                    endTime: formatTime(endTimeRaw),
                    purpose,
                };
            }).filter((s) => s.roomName && s.dayName && s.startTime && s.endTime);

            if (parsedSchedules.length === 0) {
                toast.error("Tidak ada data jadwal valid yang ditemukan. Pastikan nama kolom sesuai.");
                setIsLoading(false);
                return;
            }

            const res = await importRoutineBookings(parsedSchedules, startDate, endDate);

            if (res.success) {
                toast.success(`Berhasil memproses! Meng-generate ${res.count} record peminjaman dari ${res.classesProcessed} kelas.`);
                if (res.skipped && res.skipped > 0) {
                    toast.warning(`${res.skipped} kelas dilewati (tidak valid atau ruangan tidak ditemukan).`);
                }
                onSuccess();
                handleClose();
            } else {
                toast.error(res.error || "Gagal menyimpan jadwal kelas ke database.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Terjadi kesalahan saat memproses file. Pastikan format tabel benar.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setStartDate("");
        setEndDate("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Jadwal Kelas (Rutin)</DialogTitle>
                    <DialogDescription>
                        Sistem akan meng-generate &quot;Peminjaman&quot; (Booking) secara otomatis setiap minggu berdasarkan rentang tanggal periode ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="startDate" className="text-slate-700">Tanggal Mulai (Awal Periode)</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="endDate" className="text-slate-700">Tanggal Selesai (Akhir Periode)</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                            />
                        </div>
                    </div>

                    <div
                        className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center relative group"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {file ? (
                            <>
                                <FileSpreadsheet className="h-10 w-10 text-green-500 mb-3" />
                                <p className="font-medium text-slate-800">{file.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="h-10 w-10 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                                <p className="font-medium text-slate-700">Klik atau seret file Excel ke sini</p>
                                <p className="text-sm text-slate-500 mt-1">Format: xlsx, xls</p>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="bg-orange-50/50 p-4 rounded-xl flex gap-3 text-sm text-slate-600 mt-2 border border-orange-100/50">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                        <div>
                            Pastikan Excel memiliki format kolom berikut:
                            <ul className="list-disc pl-4 mt-1 font-mono text-xs">
                                <li>Nama Ruangan <span className="text-slate-400">(mis: A-1)</span></li>
                                <li>Hari <span className="text-slate-400">(mis: Senin)</span></li>
                                <li>Jam Mulai <span className="text-slate-400">(mis: 07:10)</span></li>
                                <li>Jam Selesai <span className="text-slate-400">(mis: 08:50)</span></li>
                                <li>Mata Kuliah <span className="text-slate-400">(mis: Algoritma)</span></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button onClick={handleUpload} disabled={isLoading || !file || !startDate || !endDate} className="bg-orange-500 hover:bg-orange-600">
                        {isLoading ? "Memproses Jadwal..." : "Buat Jadwal Perkuliahan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
