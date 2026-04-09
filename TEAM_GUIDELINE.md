# Panduan Tim & SOP Hubz FOC

Dokumen ini adalah panduan resmi untuk tim operasional dalam menggunakan **Hubz FOC (Free of Charge) Inventory Tracker**. Sistem ini dirancang untuk memantau, mencatat, dan mengelola alur perangkat FOC secara cepat, akurat, dan terpusat.

---

## 1. Pendahuluan
**Tujuan FOC Tracker:**
Sistem Hubz FOC Inventory Tracker dibuat khusus untuk menyederhanakan manajemen aset perangkat yang dipinjamkan atau diberikan kepada Key Opinion Leaders (KOL) maupun kebutuhan kampanye lainnya.
Dengan sistem ini, tim dapat melacak dengan tepat:
- Siapa yang sedang memegang suatu unit / perangkat.
- Status setiap perangkat (Tersedia, Dipinjamkan, Hilang, dll).
- Riwayat pergerakan barang (Audit Log).

---

## 2. Dashboard & Monitoring
Dashboard adalah halaman utama yang menyajikan ringkasan data inventaris secara *real-time*.

**Cara Membaca Data Utama di Dashboard:**
- **Status Perangkat:** Menampilkan alokasi unit yang sedang `AVAILABLE` (Tersedia di gudang/bank invetaris) dan yang sedang `IN USE` (Sedang dipinjamkan/digunakan oleh KOL).
- **Return Tracking:** Memantau unit mana saja yang sebentar lagi harus dikembalikan atau sudah melewati tenggat waktu (Overdue).
- **Recent Activities:** Menampilkan log pergerakan barang terbaru, seperti *Request* baru, *Return*, atau *Transfer*.

---

## 3. Outbound / Request Process (Proses Pengeluaran Barang)
Proses ini digunakan ketika perangkat akan dikirimkan kepada KOL atau pihak ketiga.

**Langkah-langkah Outbound (Request):**
1. Buka form **New Request**.
2. **Pilih Kategori (Step 1):** Pilih kategori perangkat terlebih dahulu (misal: Smartphone, Tablet, dsb).
3. **Pilih Unit/IMEI (Step 2):** Setelah kategori dipilih, sistem hanya akan memunculkan unit yang berstatus **`AVAILABLE`** di *dropdown*. Anda tidak bisa memilih unit yang sedang dipinjam (sedang *In Use*).
4. Isi data Kampanye, nama KOL, Tujuan Pengiriman, dll.
5. Secara otomatis sistem akan mengisi field **Type of FOC** berdasarkan data master dari IMEI yang dipilih.
6. Klik **Submit Request**. Data akan langsung sinkron dengan Google Sheets.

> **Catatan Penting:** Hanya unit dengan status **AVAILABLE** yang bisa dikeluarkan. Jika unit tidak muncul, pastikan unit tersebut sudah dikembalikan (*Return*) di sistem.

---

## 4. Inbound / Return Process (Proses Pengembalian Barang)
Proses ini dilakukan ketika perangkat dikembalikan oleh KOL ke Hubz / Gudang.

**Langkah-langkah Inbound (Return):**
1. Pada tabel atau detail KOL, pilih opsi **Return** untuk unit yang sedang dipinjam.
2. Pastikan Anda mencocokkan IMEI fisik dengan IMEI pada sistem.
3. Update kondisi perangkat saat dikembalikan (Baik, Layar Retak, Hilang, dll).
4. Setelah di-submit, status unit akan secara otomatis kembali menjadi **AVAILABLE** di bank inventaris.

---

## 5. Transfer Between KOL (Transfer Langsung Antar KOL)
Fitur ini digunakan saat sebuah perangkat berpindah tangan dari satu KOL ke KOL lainnya secara langsung tanpa perlu dikembalikan (Return) ke gudang terlebih dahulu.

**Alur Direct Transfer:**
1. Gunakan tombol / form **Transfer** pada unit yang statusnya sedang dipinjam (*In Use*).
2. Sistem akan secara otomatis mendeteksi dan **mengisi field "Current Holder"** berdasarkan KOL yang sedang memegang unit tersebut saat ini.
3. Anda cukup mengisi **Penerima Baru (New KOL)** beserta detail kampanye dan pengirimannya.
4. Klik Submit. Form akan melakukan pencatatan ganda (*Double Append*) di database agar riwayat tetap rapi: tercatat bahwa barang dikembalikan oleh KOL lama, dan langsung dipinjamkan ke KOL baru.

---

## 6. Troubleshooting & FAQ
Berikut adalah masalah umum yang mungkin terjadi:

- **Unit tidak muncul di dropdown saat Request:**
  *Penyebab:* Status barang masih belum `AVAILABLE` atau sudah dipinjam orang lain.
  *Solusi:* Cek lokasi barang di menu Inventory Bank. Jika barang baru saja dikembalikan, pastikan proses Inbound (Return) sudah diselesaikan.
  
- **Muncul Error "Conflict / Unit Unavailable" saat Submit Request:**
  *Penyebab:* Ada anggota tim lain yang baru saja me-request unit yang sama pada detik/menit yang bersamaan (Race Condition).
  *Solusi:* Sistem akan me-reset *dropdown* Anda. Silakan pilih unit/IMEI lain yang masih tersedia.

- **Data di sistem berbeda dengan di fisik (gudang):**
  *Solusi:* Lakukan cross-check Audit Log untuk melihat siapa yang terakhir kali memproses perangkat tersebut. Selalu pastikan status update di-input secara real-time.

---

_Panduan ini dibuat untuk memastikan integritas data inventaris selalu terjaga. Harap patuhi langkah-langkah di atas selama operasional berlangsung._
