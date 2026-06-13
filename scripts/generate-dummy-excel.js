const xlsx = require('xlsx');

const data = [
    {
        "Nama Ruangan": "Lab Komputer A",
        "Kapasitas": 40,
        "Jam Operasional": "08:00 - 16:00",
        "Hari Operasional": "Senin, Selasa, Rabu, Kamis, Jumat",
        "Fasilitas": "AC, PC 40 Unit, Proyektor, WiFi",
        "Deskripsi": "Laboratorium komputer utama untuk praktikum."
    },
    {
        "Nama Ruangan": "Ruang Diskusi B",
        "Kapasitas": 15,
        "Jam Operasional": "08:00 - 18:00",
        "Hari Operasional": "Senin, Selasa, Rabu, Kamis, Jumat, Sabtu",
        "Fasilitas": "AC, Whiteboard",
        "Deskripsi": "Ruangan cocok untuk kerja kelompok."
    },
    {
        "Nama Ruangan": "Auditorium Utama",
        "Kapasitas": 200,
        "Jam Operasional": "07:00 - 18:00",
        "Hari Operasional": "Senin, Selasa, Rabu, Kamis, Jumat",
        "Fasilitas": "AC, Sound System, Proyektor Besar, Panggung",
        "Deskripsi": "Ruangan untuk seminar besar."
    }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Data Ruangan");
xlsx.writeFile(workbook, "Contoh_Data_Ruangan.xlsx");
console.log("File Contoh_Data_Ruangan.xlsx created successfully!");
