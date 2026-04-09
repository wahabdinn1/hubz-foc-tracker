"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, Layers, ShieldCheck, MapPin, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const faqs = [
  {
    id: "intro",
    icon: <BookOpen className="w-5 h-5 text-blue-500" />,
    title: "1. Pendahuluan & Tujuan",
    content: (
      <div className="space-y-4">
        <p>Sistem <strong>Hubz FOC Inventory Tracker</strong> dibuat khusus untuk menyederhanakan manajemen aset perangkat yang dipinjamkan atau diberikan kepada Key Opinion Leaders (KOL) maupun kebutuhan kampanye lainnya.</p>
        <p>Dengan sistem ini, tim dapat melacak dengan tepat:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Siapa yang sedang memegang suatu unit / perangkat.</li>
          <li>Status setiap perangkat (Tersedia, Dipinjamkan, Hilang, dll).</li>
          <li>Riwayat pergerakan barang (Audit Log).</li>
        </ul>
      </div>
    )
  },
  {
    id: "dashboard",
    icon: <Layers className="w-5 h-5 text-purple-500" />,
    title: "2. Dashboard & Monitoring",
    content: (
      <div className="space-y-4">
        <p>Dashboard adalah halaman utama yang menyajikan ringkasan data inventaris secara <em>real-time</em>.</p>
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Cara Membaca Data Utama di Dashboard:</h4>
        <ul className="list-decimal pl-5 space-y-2">
          <li><strong>Status Perangkat:</strong> Menampilkan alokasi unit yang sedang <code>AVAILABLE</code> (Tersedia di Loker/bank invetaris) dan yang sedang <code>ON LOANED</code> (Sedang dipinjamkan/digunakan oleh KOL).</li>
          <li><strong>Return Tracking:</strong> Memantau unit mana saja yang sebentar lagi harus dikembalikan atau sudah melewati tenggat waktu (Overdue).</li>
          <li><strong>Recent Activities:</strong> Menampilkan log pergerakan barang terbaru, seperti <em>Request</em> baru, <em>Return</em>, atau <em>Transfer</em>.</li>
        </ul>
      </div>
    )
  },
  {
    id: "outbound",
    icon: <MapPin className="w-5 h-5 text-orange-500" />,
    title: "3. Outbound / Request Process",
    content: (
      <div className="space-y-4">
        <p>Proses ini digunakan ketika perangkat akan dikirimkan kepada KOL atau pihak ketiga.</p>
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Langkah-langkah Outbound (Request):</h4>
        <ul className="list-decimal pl-5 space-y-2">
          <li>Buka form <strong>New Request</strong>.</li>
          <li><strong>Pilih Kategori (Step 1):</strong> Pilih kategori perangkat terlebih dahulu (misal: Handphone, Tablet, dsb).</li>
          <li><strong>Pilih Unit/IMEI (Step 2):</strong> Setelah kategori dipilih, sistem hanya akan memunculkan unit yang berstatus <strong><code>AVAILABLE</code></strong> di <em>dropdown</em>. Anda tidak bisa memilih unit yang sedang dipinjam (sedang <em>On Loaned</em>).</li>
          <li>Isi data Kampanye, nama KOL, Tujuan Pengiriman, dll.</li>
          <li>Secara otomatis sistem akan mengisi field <strong>Type of FOC</strong> berdasarkan data master dari IMEI yang dipilih.</li>
          <li>Klik <strong>Submit Request</strong>. Data akan langsung sinkron dengan Google Sheets.</li>
        </ul>
        <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg text-sm text-orange-800 dark:text-orange-300">
          <strong>Catatan Penting:</strong> Hanya unit dengan status <strong>AVAILABLE</strong> yang bisa dikeluarkan. Jika unit tidak muncul, pastikan unit tersebut sudah dikembalikan (Return) di sistem.
        </div>
      </div>
    )
  },
  {
    id: "inbound",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    title: "4. Inbound / Return Process",
    content: (
      <div className="space-y-4">
        <p>Proses ini dilakukan ketika perangkat dikembalikan oleh KOL ke Hubz / Locker.</p>
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Langkah-langkah Inbound (Return):</h4>
        <ul className="list-decimal pl-5 space-y-2">
          <li>Pada tabel atau detail KOL, pilih opsi <strong>Return</strong> untuk unit yang sedang dipinjam.</li>
          <li>Pastikan Anda mencocokkan IMEI fisik dan box dengan IMEI pada sistem.</li>
          <li>Update kondisi perangkat saat dikembalikan (Baik, Layar Retak, Hilang, dll).</li>
          <li>Setelah di-submit, status unit akan secara otomatis kembali menjadi <strong>AVAILABLE</strong> di bank inventaris.</li>
        </ul>
      </div>
    )
  },
  {
    id: "transfer",
    icon: <Search className="w-5 h-5 text-blue-500" />,
    title: "5. Transfer Between KOL",
    content: (
      <div className="space-y-4">
        <p>Fitur ini digunakan saat sebuah perangkat berpindah tangan dari satu KOL ke KOL lainnya secara langsung tanpa perlu dikembalikan (Return) ke gudang terlebih dahulu.</p>
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Alur Direct Transfer:</h4>
        <ul className="list-decimal pl-5 space-y-2">
          <li>Gunakan tombol / form <strong>Transfer</strong> pada unit yang statusnya sedang dipinjam (<em>In Use</em>).</li>
          <li>Sistem akan secara otomatis mendeteksi dan <strong>mengisi field "Current Holder"</strong> berdasarkan KOL yang sedang memegang unit tersebut saat ini.</li>
          <li>Anda cukup mengisi <strong>Penerima Baru (New KOL)</strong> beserta detail kampanye dan pengirimannya.</li>
          <li>Klik Submit. Form akan melakukan pencatatan ganda (<em>Double Append</em>) di database agar riwayat tetap rapi: tercatat bahwa barang dikembalikan oleh KOL lama, dan langsung dipinjamkan ke KOL baru.</li>
        </ul>
      </div>
    )
  },
  {
    id: "troubleshooting",
    icon: <ChevronDown className="w-5 h-5 text-red-500" />,
    title: "6. Troubleshooting & FAQ Teratas",
    content: (
      <div className="space-y-6">
        <div className="space-y-2">
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Unit tidak muncul di dropdown saat Request:</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Penyebab:</em> Status barang masih belum <code>AVAILABLE</code> atau sudah dipinjam orang lain.</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Solusi:</em> Cek lokasi barang di menu Inventory Bank. Jika barang baru saja dikembalikan, pastikan proses Inbound (Return) sudah diselesaikan.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Muncul Error "Conflict / Unit Unavailable" saat Submit Request:</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Penyebab:</em> Ada anggota tim lain yang baru saja me-request unit yang sama pada detik/menit yang bersamaan (Race Condition).</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Solusi:</em> Sistem akan me-reset dropdown Anda. Silakan pilih unit/IMEI lain yang masih tersedia.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Data di sistem berbeda dengan di fisik (gudang):</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Solusi:</em> Lakukan cross-check Audit Log untuk melihat siapa yang terakhir kali memproses perangkat tersebut. Selalu pastikan status update di-input secara real-time.</p>
        </div>
      </div>
    )
  }
];

function AccordionItem({ item, isOpen, onClick }: { item: typeof faqs[0], isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900/50 transition-colors">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            {item.icon}
          </div>
          <span className="font-semibold text-left text-neutral-900 dark:text-neutral-100 text-lg">
            {item.title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-neutral-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800">
              <div className="pt-4">
                {item.content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [openIds, setOpenIds] = useState<string[]>(["intro", "troubleshooting"]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">

        {/* Header Section */}
        <div className="space-y-2 mt-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Help Center & FAQ</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-2xl">
            Panduan lengkap SOP, langkah-langkah penggunaan, dan troubleshooting sistem Hubz FOC Tracker.
          </p>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-14 rounded-xl text-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
            placeholder="Cari kata kunci... (misal: Transfer)"
          />
        </div>

        {/* Accordions */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0 space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  item={faq}
                  isOpen={openIds.includes(faq.id)}
                  onClick={() => toggleItem(faq.id)}
                />
              ))
            ) : (
              <div className="text-center py-10 opacity-70">
                <Search className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
                <p>Tidak ada panduan yang cocok dengan pencarian Anda.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
