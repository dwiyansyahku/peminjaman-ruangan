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
import { toast } from "sonner";
import { importRoomsBulk } from "@/actions/rooms";
import { UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as xlsx from "xlsx";

interface RoomExcelUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RoomExcelUploadModal({
    isOpen,
    onClose,
    onSuccess,
}: RoomExcelUploadModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
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

    const handleUpload = async () => {
        if (!file) {
            toast.error("Pilih file terlebih dahulu.");
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

            const roomsMap = new Map();

            for (const row of jsonData) {
                const rawName = String(row["nama ruangan"] || row["Nama Ruangan"] || "Tanpa Nama").trim();
                const name = rawName === "undefined" || rawName === "null" || rawName === "" ? "Tanpa Nama" : rawName;

                // Jam Operasional parsing
                const opsStr = String(row["jam operasional"] || row["Jam Operasional"] || "").trim();
                const jamArr = opsStr.split(",").map(j => j.trim()).filter(Boolean);

                // Hari Operasional parsing
                const hariStr = String(row["hari operasional"] || row["Hari Operasional"] || "").trim();
                const hariArr = hariStr.split(",").map(d => d.trim()).filter(Boolean);

                // Fasilitas parsing
                const fasStr = String(row["fasilitas"] || row["Fasilitas"] || "").trim();
                const fasArr = fasStr.split(",").map(f => f.trim()).filter(Boolean);

                const desc = (row["deskripsi"] || row["Deskripsi"] || undefined)?.trim();
                const cap = parseInt(row["kapasitas"] || row["Kapasitas"]) || 30;

                if (!roomsMap.has(name)) {
                    roomsMap.set(name, {
                        name,
                        capacity: cap,
                        openHourJson: {} as Record<string, string[]>,
                        facilitiesSet: new Set(fasArr),
                        description: desc,
                        status: "AVAILABLE" as const,
                    });
                }

                const room = roomsMap.get(name);
                
                // Allow tracking global (no day) intervals or map by day
                if (hariArr.length > 0 && jamArr.length > 0) {
                    for (const hari of hariArr) {
                        if (!room.openHourJson[hari]) room.openHourJson[hari] = [];
                        room.openHourJson[hari].push(...jamArr);
                    }
                } else if (jamArr.length > 0) {
                     // Empty hari but has jam -> assumed mapped to "all"? Map to a special key 
                     if (!room.openHourJson["_ALL_"]) room.openHourJson["_ALL_"] = [];
                     room.openHourJson["_ALL_"].push(...jamArr);
                }

                if (desc && !room.description) room.description = desc;
                for (const f of fasArr) room.facilitiesSet.add(f);
            }

            const parsedRooms = Array.from(roomsMap.values()).map(r => {
                const fasList = Array.from(r.facilitiesSet);
                const hariList = Object.keys(r.openHourJson).filter(k => k !== "_ALL_");

                return {
                    name: r.name,
                    capacity: r.capacity,
                    // If we have complex schedules, save as JSON. If empty, ""
                    openHour: Object.keys(r.openHourJson).length > 0 ? JSON.stringify(r.openHourJson) : "",
                    closeHour: "",
                    hari: hariList.length > 0 ? JSON.stringify(hariList) : undefined,
                    facilities: fasList.length > 0 ? JSON.stringify(fasList) : undefined,
                    description: r.description,
                    status: r.status,
                };
            });

            const res = await importRoomsBulk(parsedRooms);

            if (res.success) {
                toast.success(`Berhasil menambahkan ${res.count} ruangan.`);
                onSuccess();
                handleClose();
            } else {
                toast.error(res.error || "Gagal menyimpan data ke database.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Terjadi kesalahan saat memproses file.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Data Ruangan</DialogTitle>
                    <DialogDescription>
                        Unggah file Excel (<code>.xlsx</code>) untuk menambahkan banyak ruangan sekaligus.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center relative group"
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
                            <UploadCloud className="h-10 w-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-slate-700">Klik atau seret file ke sini</p>
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

                <div className="bg-blue-50/50 p-4 rounded-xl flex gap-3 text-sm text-slate-600 mt-4 border border-blue-100/50">
                    <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                            <div className="font-semibold mb-1 text-slate-800">Format Kolom Excel:</div>
                            <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-600">
                                <li><strong>Nama Ruangan</strong> (Wajib)</li>
                                <li><strong>Kapasitas</strong> (Angka)</li>
                                <li><strong>Jam Operasional</strong>: Jam kosong (Tersedia). Format <code>JJ:MM-JJ:MM</code>. Jika lebih dari satu jadwal kosong, pisahkan dengan koma. Contoh: <code>07:00-08:50, 10:40-12:20</code></li>
                                <li><strong>Hari Operasional</strong>: Nama hari dipisah koma (Cth: <code>Senin, Selasa</code>)</li>
                                <li><strong>Fasilitas</strong>: Item dipisah koma (Cth: <code>Proyektor, AC</code>)</li>
                                <li><strong>Deskripsi</strong>: Keterangan tambahan</li>
                            </ul>
                    </div>
                </div>

                <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button onClick={handleUpload} disabled={isLoading || !file} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? "Mengimpor..." : "Mulai Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
