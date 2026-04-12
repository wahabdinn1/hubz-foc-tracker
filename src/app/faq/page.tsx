"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, Layers, ShieldCheck, MapPin, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Language = "en" | "id";

const uiTranslations = {
  en: {
    title: "Help Center & FAQ",
    description: "Complete guide on SOPs, workflow steps, and troubleshooting for the Hubz FOC Tracker system.",
    searchPlaceholder: "Search keywords... (e.g., Transfer)",
    noResults: "No guides match your search."
  },
  id: {
    title: "Pusat Bantuan & FAQ",
    description: "Panduan lengkap SOP, langkah-langkah penggunaan, dan troubleshooting sistem Hubz FOC Tracker.",
    searchPlaceholder: "Cari kata kunci... (misal: Transfer)",
    noResults: "Tidak ada panduan yang cocok dengan pencarian Anda."
  }
};

const faqsData = {
  en: [
    {
      id: "intro",
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      title: "1. Introduction & Purpose",
      content: (
        <div className="space-y-4">
          <p>The <strong>Hubz FOC Inventory Tracker</strong> system is built specifically to simplify the asset management of devices loaned or given to Key Opinion Leaders (KOLs) or for other campaign needs.</p>
          <p>With this system, the team can accurately track:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Who is currently holding a specific unit / device.</li>
            <li>The status of each device (Available, On Loan, Lost, etc.).</li>
            <li>The history of item movements (Audit Log).</li>
          </ul>
        </div>
      )
    },
    {
      id: "dashboard",
      icon: <Layers className="w-5 h-5 text-purple-500" />,
      title: "2. Dashboard & Inventory Bank",
      content: (
        <div className="space-y-4">
          <p>The system provides two central monitoring pages for the operations team:</p>
          
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">A. Dashboard</h4>
          <p className="text-sm">The main page that presents a summary of inventory data in <em>real-time</em>.</p>
          <ul className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-4">
            <li><strong>Device Status:</strong> Displays the overall allocation of units that are <code>AVAILABLE</code> (Available in locker/warehouse) and those that are <code>ON LOANED</code> (Currently loaned out/in use by KOLs).</li>
            <li><strong>Return Tracking:</strong> Monitors which units must be returned soon or have already passed their deadline (Overdue).</li>
            <li><strong>Recent Activities:</strong> Displays the latest item movement log, such as new <em>Requests</em>, <em>Returns</em>, or <em>Transfers</em>.</li>
          </ul>

          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mt-4">B. Inventory Bank (/inventory)</h4>
          <p className="text-sm">The main asset database page (Master List) for all FOC devices.</p>
          <ul className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Global Search:</strong> Allows you to search for specific IMEIs/Serial Numbers to find out their location, status, and latest holder history.</li>
            <li><strong>Data Filtering:</strong> You can filter units by Model/Category to see the detailed availability of each device type.</li>
            <li><strong>Physical Data Validation:</strong> Used as the most accurate reference when performing <em>stock opname</em> or matching physical locker items with system data.</li>
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
          <p>This process is used when a device will be sent out to a KOL or third party.</p>
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Outbound (Request) Steps:</h4>
          <ul className="list-decimal pl-5 space-y-2">
            <li>Open the <strong>New Request</strong> form.</li>
            <li><strong>Select Category (Step 1):</strong> Select the device category first (e.g., Mobile Phone, Tablet, etc.).</li>
            <li><strong>Select Unit/IMEI (Step 2):</strong> Once the category is selected, the system will only show units with an <strong><code>AVAILABLE</code></strong> status in the <em>dropdown</em>. You cannot select units that are currently borrowed (currently <em>On Loaned</em>).</li>
            <li>Fill in Campaign data, KOL name, Delivery Destination, etc.</li>
            <li>The system will automatically fill in the <strong>Type of FOC</strong> field based on the master data of the selected IMEI.</li>
            <li>Click <strong>Submit Request</strong>. Data will immediately sync with Google Sheets.</li>
          </ul>
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg text-sm text-orange-800 dark:text-orange-300">
            <strong>Important Note:</strong> Only units with an <strong>AVAILABLE</strong> status can be checked out. If a unit does not appear, ensure that the unit has been marked as returned (Return) in the system.
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
          <p>This process is carried out when a device is returned by a KOL to Hubz / Locker.</p>
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Inbound (Return) Steps:</h4>
          <ul className="list-decimal pl-5 space-y-2">
            <li>On the table or KOL details, select the <strong>Return</strong> option for the unit currently being borrowed.</li>
            <li>Ensure you match the physical IMEI and box with the IMEI in the system.</li>
            <li>Update the device condition upon return (Good, Cracked Screen, Lost, etc.).</li>
            <li>Once submitted, the unit's status will automatically revert to <strong>AVAILABLE</strong> in the inventory bank.</li>
          </ul>
        </div>
      )
    },
    {
      id: "transfer",
      icon: <Search className="w-5 h-5 text-blue-500" />,
      title: "5. Transfer Between KOL (Direct Transfer)",
      content: (
        <div className="space-y-4">
          <p>This feature is used when a device changes hands from one KOL to another KOL directly without needing to be returned (Return) to the warehouse first.</p>
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Direct Transfer Flow:</h4>
          <ul className="list-decimal pl-5 space-y-2">
            <li>Use the <strong>Transfer</strong> button/form on a unit that is currently borrowed (<em>On Loaned</em>).</li>
            <li>The system will automatically detect and <strong>fill in the "Current Holder" field</strong> based on the KOL currently holding the unit.</li>
            <li>You just need to fill in the <strong>New Receiver (New KOL)</strong> along with their campaign and delivery details.</li>
            <li>Click Submit. The form will perform a double entry (<em>Double Append</em>) in the database to keep the history neat: it records that the item was returned by the old KOL, and instantly loaned out to the new KOL.</li>
          </ul>
        </div>
      )
    },
    {
      id: "troubleshooting",
      icon: <ChevronDown className="w-5 h-5 text-red-500" />,
      title: "6. Troubleshooting & Top FAQ",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Unit does not appear in the dropdown during Request:</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Cause:</em> The item's status is not yet <code>AVAILABLE</code> or is already borrowed by someone else.</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Solution:</em> Check the item's location in the Inventory Bank menu. If the item was just returned, make sure the Inbound (Return) process has been completed.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">"Conflict / Unit Unavailable" Error appears when Submitting Request:</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Cause:</em> Another team member has just requested the same unit at the exact same exact second/minute (Race Condition).</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Solution:</em> The system will reset your dropdown. Please select another available unit/IMEI.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">System data differs from physical (locker) data:</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400"><em>Solution:</em> Cross-check the Audit Log to see who processed that device last. Always ensure status updates are input in real-time.</p>
          </div>
        </div>
      )
    }
  ],
  id: [
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
      title: "2. Dashboard & Inventory Bank",
      content: (
        <div className="space-y-4">
          <p>Sistem memfasilitasi dua halaman pemantauan sentral untuk tim operasional:</p>
          
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">A. Dashboard</h4>
          <p className="text-sm">Halaman utama yang menyajikan ringkasan data inventaris secara <em>real-time</em>.</p>
          <ul className="list-decimal pl-5 space-y-2 text-sm leading-relaxed mb-4">
            <li><strong>Status Perangkat:</strong> Menampilkan alokasi keseluruhan unit yang sedang <code>AVAILABLE</code> (Tersedia di loker/gudang) dan yang sedang <code>ON LOANED</code> (Sedang dipinjamkan/digunakan oleh KOL).</li>
            <li><strong>Return Tracking:</strong> Memantau unit mana saja yang sebentar lagi harus dikembalikan atau sudah melewati tenggat waktu (Overdue).</li>
            <li><strong>Recent Activities:</strong> Menampilkan log pergerakan barang terbaru, seperti <em>Request</em> baru, <em>Return</em>, atau <em>Transfer</em>.</li>
          </ul>
          
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mt-4">B. Inventory Bank (/inventory)</h4>
          <p className="text-sm">Halaman database aset utama (Master List) untuk seluruh perangkat FOC.</p>
          <ul className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
            <li><strong>Pencarian Global:</strong> Memungkinkan Anda mencari IMEI/Serial Number secara spesifik untuk mengetahui lokasi, status, dan riwayat pemegang terakhir.</li>
            <li><strong>Filter Data:</strong> Anda dapat memfilter unit berdasarkan Model/Kategori untuk melihat ketersediaan rinci dari masing-masing jenis perangkat.</li>
            <li><strong>Validasi Data Fisik:</strong> Digunakan sebagai acuan paling akurat saat melakukan <em>stock opname</em> atau mencocokkan data barang di loker fisik dengan data sistem.</li>
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
      title: "5. Transfer Between KOL (Direct Transfer)",
      content: (
        <div className="space-y-4">
          <p>Fitur ini digunakan saat sebuah perangkat berpindah tangan dari satu KOL ke KOL lainnya secara langsung tanpa perlu dikembalikan (Return) ke gudang terlebih dahulu.</p>
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Alur Direct Transfer:</h4>
          <ul className="list-decimal pl-5 space-y-2">
            <li>Gunakan tombol / form <strong>Transfer</strong> pada unit yang statusnya sedang dipinjam (<em>On Loaned</em>).</li>
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
  ]
};

function AccordionItem({ item, isOpen, onClick }: { item: { id: string; icon: React.ReactNode; title: string; content: React.ReactNode }, isOpen: boolean, onClick: () => void }) {
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
  const [lang, setLang] = useState<Language>("en");
  const [openIds, setOpenIds] = useState<string[]>(["intro", "troubleshooting"]);
  const [searchTerm, setSearchTerm] = useState("");

  const texts = uiTranslations[lang];
  const activeFaqs = faqsData[lang];

  const toggleItem = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredFaqs = activeFaqs.filter(faq =>
    faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">

        {/* Header Section */}
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-4">
               <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                 <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
               </div>
               <div>
                 <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{texts.title}</h1>
               </div>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                onClick={() => setLang("en")}
                className={`py-1.5 px-3 md:px-4 text-sm font-medium rounded-md transition-all ${lang === "en" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={`py-1.5 px-3 md:px-4 text-sm font-medium rounded-md transition-all ${lang === "id" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                ID
              </button>
            </div>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-3xl ml-1">
            {texts.description}
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
            placeholder={texts.searchPlaceholder}
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
                <p>{texts.noResults}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
