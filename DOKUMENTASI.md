# Dokumentasi Kode — Sistem Tracer Study SMK TI Bali Global Jimbaran

Panduan menjawab pertanyaan penguji. Semua nomor baris diambil dari kode versi
commit `5245d61`.

> **Kalau nomor barisnya meleset** (karena kode berubah), cari pakai teks yang
> terlihat di layar. Contoh: penguji menunjuk tombol "Setujui" →
> `grep -rn "Setujui" src/` langsung menunjukkan file dan barisnya.
> Di VS Code: **Ctrl+Shift+F**, ketik teks tombolnya.

---

## Daftar isi

1. [Peta cepat — di file mana?](#1-peta-cepat--di-file-mana)
2. [Empat alur utama](#2-empat-alur-utama)
3. [Pertanyaan: tombol & tampilan](#3-pertanyaan-tombol--tampilan)
4. [Pertanyaan: frontend ke database](#4-pertanyaan-frontend-ke-database)
5. [Pertanyaan: database](#5-pertanyaan-database)
6. [Pertanyaan: "baris ini buat apa?"](#6-pertanyaan-baris-ini-buat-apa)
7. [Pertanyaan sulit / jebakan](#7-pertanyaan-sulit--jebakan)
8. [Kalimat siap pakai](#8-kalimat-siap-pakai)

---

## 1. Peta cepat — di file mana?

### Halaman (yang dilihat pengguna)

| Yang di layar | File | Alamat URL |
|---|---|---|
| Halaman depan | `src/pages/LandingPage.tsx` | `/` |
| Login & daftar | `src/pages/AuthPage.tsx` | `/auth` |
| Kuisioner 4 langkah | `src/pages/FormWizard.tsx` | `/tracer-form` |
| Dashboard ringkasan | `src/pages/admin/Overview.tsx` | `/admin` |
| Data induk alumni | `src/pages/admin/AkunSiswa.tsx` | `/admin/akun-siswa` |
| Rekap jawaban | `src/pages/admin/DataKuisioner.tsx` | `/admin/data-kuisioner` |
| Antrean persetujuan | `src/pages/admin/Persetujuan.tsx` | `/admin/persetujuan` |

### Isi kuisioner per langkah

| Langkah | File |
|---|---|
| 1 — Identitas | `src/components/form/Step1Identitas.tsx` |
| 2 — Informasi Kegiatan | `src/components/form/Step2Status.tsx` |
| 3 — Evaluasi | `src/components/form/Step3Evaluasi.tsx` |
| 4 — Selesai | `src/components/form/Step4Selesai.tsx` |

### Otak sistem

| Tugas | File |
|---|---|
| Daftar semua halaman + penjaga | `src/App.tsx` |
| Koneksi ke Supabase | `src/lib/supabase.ts` |
| Login, daftar, sesi | `src/lib/AdminAuthProvider.tsx` |
| **Semua query database** | `src/lib/adminData.ts` |
| Ekspor Excel | `src/lib/exportResponses.ts` |
| Penanda online | `src/lib/usePresence.ts` |
| Daftar jurusan, pilihan form | `src/lib/tracerStudy.ts` |
| Format tanggal & angka | `src/lib/format.ts` |

### Database

Semua di `supabase/migrations/`, dijalankan berurutan 0001 → 0012.

| Berkas | Isinya |
|---|---|
| `0001` | Tabel `alumni`, `activity_log`, perluasan `tracer_study`, RPC dashboard |
| `0002` | Tabel `admin_users` + fungsi `is_admin()` |
| `0003` | Statistik publik untuk halaman depan |
| `0004` | Trigger sinkron jawaban → data induk |
| `0005` | Kolom `user_id` di `tracer_study` |
| `0006` | View `admin_alumni_overview` |
| `0007` | Wajib login untuk mengisi |
| `0008` | **Sistem persetujuan** |
| `0009` | Data lengkap saat daftar (NIK, jurusan, dll.) |
| `0010` | **Penanda online** (`user_presence`) |
| `0011` | Pencocokan online lewat email |
| `0012` | Perbaikan akurasi penanda online |

---

## 2. Empat alur utama

Kalau penguji tanya *"coba jelaskan alurnya"*, ini jawabannya. Ikuti panahnya.

### Alur A — Alumni mengisi kuisioner

```
1. LandingPage.tsx:155      klik "Mulai Isi Tracer Study"  →  /tracer-form
2. App.tsx:66               route dijaga RequireAuth + RequireApproval
3. RequireAuth.tsx:26       belum login?  → lempar ke /auth
4. RequireApproval.tsx:34   belum disetujui?  → tampilkan layar menunggu
5. FormWizard.tsx           4 langkah form
6. FormWizard.tsx:105       supabase.from('tracer_study').insert([...])
7. [DATABASE] policy "users submit as themselves"  (0012 lewat 0008:269)
8. [DATABASE] trigger sync_alumni_from_submission  (0004:49)
   → data induk alumni otomatis bertambah kalau NISN-nya belum ada
```

### Alur B — Admin membuka dashboard

```
1. AuthPage.tsx:473         klik "Masuk Sebagai Admin"
2. AdminAuthProvider:110    supabase.auth.signInWithPassword()
3. AdminAuthProvider:58     supabase.rpc('is_admin')
4. [DATABASE] is_admin()    cek tabel admin_users  (0002:38)
5. App.tsx:92               route /admin dijaga RequireAdmin
6. RequireAdmin.tsx:45      bukan admin? → tampilkan penolakan
7. Overview.tsx             panggil fetchDashboard()
8. adminData.ts:95          supabase.rpc('admin_dashboard')
9. [DATABASE] admin_dashboard()  hitung semua angka  (0001:170)
```

### Alur C — Admin menyetujui pendaftar

```
1. AuthPage.tsx             alumni daftar
2. AdminAuthProvider:114    supabase.auth.signUp()
3. [DATABASE] trigger open_account_request  (0009:94)
   → baris baru di account_requests, status 'pending'
4. Persetujuan.tsx:284      admin klik "Setujui"
5. adminData.ts:435         decideAccountRequest()
6. adminData.ts:443         .from('account_requests').update({ status })
7. [DATABASE] policy "admins decide requests"  (0008:252)
8. [DATABASE] trigger stamp_account_decision  (0008:76)
   → isi decided_at & decided_by otomatis
```

### Alur D — Penanda Aktif / Tidak Aktif

```
1. AdminAuthProvider        panggil usePresence(session.access_token)
2. usePresence.ts:38        supabase.rpc('touch_presence')  tiap 20 detik
3. [DATABASE] touch_presence()  catat waktu  (0010:56)
4. usePresence.ts:56        tab ditutup → fetch end_presence (keepalive)
5. [DATABASE] end_presence()  mundurkan waktunya  (0012:51)
6. AkunSiswa.tsx            tanya ulang tiap 15 detik
7. adminData.ts:159         .from('admin_alumni_overview')
8. [DATABASE] view menghitung kolom sedang_online  (0012:134)
```

---

## 3. Pertanyaan: tombol & tampilan

> **"Tombol ini ada di baris berapa?"**

| Tombol di layar | File & baris |
|---|---|
| "Mulai Isi Tracer Study" (hero) | `LandingPage.tsx:155` |
| "Mulai Isi Data Sekarang" (bawah) | `LandingPage.tsx:252` |
| "Masuk Sebagai Admin/Alumni" | `AuthPage.tsx:473` |
| "Daftar Sebagai Alumni" | `AuthPage.tsx:474` |
| "Lanjut ke Status Pekerjaan" | `Step1Identitas.tsx:166` |
| "Lanjut ke Evaluasi" | `Step2Status.tsx:198` |
| "Kirim Data Tracer Study" | `Step3Evaluasi.tsx:95` |
| "Periksa Status" (layar menunggu) | `RequireApproval.tsx:80` |
| "Setujui" | `Persetujuan.tsx:284` |
| "Tolak" | `Persetujuan.tsx:295` |
| "Export Excel" | `DataKuisioner.tsx:170` |
| "Import" (CSV) | `AkunSiswa.tsx:201` |
| "Tambah / Impor Data Siswa" | `AkunSiswa.tsx:219` |

**Contoh jawaban lengkap:**

> *P: Tombol "Mulai Isi Tracer Study" itu kodenya di mana?*
>
> "Di `src/pages/LandingPage.tsx` baris 155, Pak. Itu komponen `<Link>` dari
> react-router-dom, bukan `<button>`, karena tugasnya pindah halaman ke
> `/tracer-form` — bukan menjalankan fungsi. Dipakai `<Link>` supaya pindahnya
> tidak memuat ulang seluruh halaman."

---

### Kolom input

| Kolom | File & baris | Aturannya |
|---|---|---|
| NISN (kuisioner) | `Step1Identitas.tsx:63` | 10 digit, angka saja |
| Tahun Lulus | `Step1Identitas.tsx:88` | pemilih tahun, bukan dropdown |
| NISN (pendaftaran) | `AuthPage.tsx:303` | 10 digit |
| NIK (pendaftaran) | `AuthPage.tsx:327` | 16 digit |

> *P: Kenapa NISN cuma bisa 10 angka? Di mana kodenya?*
>
> "Di `Step1Identitas.tsx` baris 69, `maxLength={10}`. Tapi itu baru setengah,
> Pak. Pembatasannya juga ada di komponen `TextField` di
> `src/components/form/fields.tsx` yang menghapus karakter non-angka
> **sambil diketik**, jadi kalau di-paste dengan spasi atau strip pun otomatis
> bersih. Dan di database ada CHECK constraint
> `alumni_nisn_10_digits` di migrasi 0004 baris 70 — jadi kalaupun validasi di
> browser dilewati, Postgres tetap menolak."

---

## 4. Pertanyaan: frontend ke database

> **"Frontend-nya nyambung ke database lewat apa?"**

Jawaban singkat: **`src/lib/supabase.ts`**. Cuma satu file. Semua komunikasi
lewat objek `supabase` yang dibuat di sana (baris 10).

Semua query dikumpulkan di **`src/lib/adminData.ts`** supaya tidak tersebar di
mana-mana:

| Fungsi | Baris | Tabel/RPC yang dipanggil |
|---|---|---|
| `fetchDashboard()` | 94 | RPC `admin_dashboard` |
| `fetchAlumni()` | 108 | tabel `alumni` |
| `fetchAlumniOverview()` | 152 | view `admin_alumni_overview` |
| `fetchResponses()` | 189 | tabel `tracer_study` |
| `deleteAlumni()` | 224 | hapus dari `alumni` |
| `upsertAlumni()` | 229 | tambah/ubah `alumni` |
| `importAlumniCsv()` | 242 | impor massal |
| `fetchPublicStats()` | 306 | RPC `public_tracer_stats` |
| `fetchAllResponses()` | 320 | semua jawaban (untuk Excel) |
| `fetchAccountRequests()` | 392 | view `admin_account_requests` |
| `decideAccountRequest()` | 435 | setujui/tolak |

> *P: Kalau alumni klik Kirim, datanya masuk ke mana? Tunjukkan kodenya.*
>
> "`src/pages/FormWizard.tsx` baris 105:
> `supabase.from('tracer_study').insert([...])`. Isinya 51 kolom, dari baris
> 106 sampai sekitar baris 180.
>
> Satu hal yang sengaja, Pak — di baris 119 ada `user_id: session?.user?.id`.
> Itu menandai jawaban ini milik siapa. Dan sengaja **tidak** ada `.select()`
> setelah `.insert()`, karena `.select()` akan minta data kembalian, sedangkan
> RLS tidak mengizinkan itu."

> *P: Query-nya ditulis di mana, di frontend atau di database?*
>
> "Dua-duanya, tapi beda tugas. Yang sederhana seperti ambil daftar alumni
> ditulis di frontend pakai query builder — contohnya `adminData.ts` baris
> 159–172. Yang berat seperti menghitung statistik dashboard ditulis sebagai
> **fungsi SQL di database** (`admin_dashboard()`, migrasi 0001 baris 170),
> lalu frontend cukup memanggilnya satu kali dengan `.rpc()`.
>
> Alasannya: kalau dihitung di frontend, harus tarik semua baris dulu — berat,
> dan angkanya bisa tidak sinkron kalau ada jawaban masuk di tengah proses."

> *P: Filter dan pencarian itu diproses di browser atau di server?*
>
> "Di server, Pak. Lihat `adminData.ts` baris 164–172 — semua `.eq()` dan
> `.or()` itu diterjemahkan jadi WHERE di Postgres. Kalau difilter di browser,
> seluruh data harus diunduh dulu, padahal halamannya cuma menampilkan 8 baris.
> Boros, dan data yang mestinya disaring malah terkirim semua."

---

## 5. Pertanyaan: database

### Struktur

**6 tabel, 2 view, 16 fungsi, 15 RLS policy.**

| Tabel | Kolom | Isi |
|---|---|---|
| `tracer_study` | 51 | Jawaban kuisioner |
| `account_requests` | 13 | Pendaftaran & status persetujuan |
| `alumni` | 11 | Data induk alumni |
| `admin_users` | 4 | Daftar admin |
| `activity_log` | 4 | Riwayat aktivitas |
| `user_presence` | 2 | Penanda online |

> *P: Kenapa `tracer_study` kolomnya sampai 51?*
>
> "Karena satu tabel itu menampung semua cabang pertanyaan, Pak. Alumni yang
> bekerja ditanya nama perusahaan dan gaji, yang kuliah ditanya kampus, yang
> wirausaha ditanya omzet. Kolom yang tidak sesuai statusnya dibiarkan NULL.
>
> Kenapa tidak dipisah jadi beberapa tabel? Karena satu baris per orang membuat
> semua jawaban bisa dibandingkan dalam satu query. Kalau dipisah, setiap
> laporan harus JOIN empat tabel dulu."

> *P: Hubungan `alumni` dan `tracer_study` itu apa?*
>
> "Dicocokkan lewat kolom `nisn`, tapi **sengaja bukan foreign key**. Alasannya:
> alumni boleh mengisi NISN yang belum ada di data induk. Kalau dipasang foreign
> key, pengisian seperti itu akan ditolak.
>
> Gantinya ada trigger `sync_alumni_from_submission` di migrasi 0004 baris 49 —
> begitu ada jawaban masuk dengan NISN baru, alumni itu otomatis ditambahkan ke
> data induk."

### Keamanan (bagian paling sering ditanya)

> *P: Bagaimana sistem ini menjaga supaya data alumni tidak bisa dilihat
> sembarang orang?*
>
> "Lewat **Row Level Security** di PostgreSQL, Pak — bukan lewat kode React.
>
> Ini penting karena sistem ini tidak punya server backend sendiri. React
> langsung bicara ke Supabase. Kunci API-nya ikut terkirim ke browser dan bisa
> dilihat siapa saja lewat Inspect Element.
>
> Jadi kalau pengamanannya cuma `if (isAdmin)` di React, orang tinggal panggil
> API-nya langsung dan tidak pernah membuka halaman kita.
>
> Karena itu penjaganya ditaruh di database. Contohnya di migrasi 0002 baris 92:
>
> ```sql
> create policy "admins read responses"
>   on public.tracer_study for select to authenticated
>   using (public.is_admin());
> ```
>
> Artinya: siapa pun yang minta data dari `tracer_study`, Postgres cuma akan
> mengembalikan baris kalau `is_admin()` bernilai true. Bukan aplikasi yang
> memutuskan — database yang memutuskan."

> *P: Kalau begitu penjaga di React itu untuk apa?*
>
> "Untuk sopan santun, bukan keamanan. Supaya pengguna yang jujur dapat pesan
> yang jelas — 'Anda belum login', bukan tabel kosong tanpa penjelasan.
>
> Penjelasan ini saya tulis di komentar `src/App.tsx` baris 26–32."

> *P: Kenapa fungsi `is_admin()` pakai SECURITY DEFINER?*
>
> "Karena tabel `admin_users` sendiri dilindungi RLS, Pak. Kalau policy-nya
> membaca tabel itu langsung, dia akan memanggil dirinya sendiri terus-menerus —
> rekursi tak berujung.
>
> `SECURITY DEFINER` membuat fungsinya berjalan dengan hak pemilik, jadi bisa
> membaca tabel itu sekali tanpa kena RLS. Ada di migrasi 0002 baris 38."

> *P: Alumni bisa lihat jawaban alumni lain tidak?*
>
> "Tidak. Policy `users read own submission` di migrasi 0005 baris 46:
> `using (user_id = (select auth.uid()))`. `auth.uid()` itu ID pemilik token
> yang sedang dipakai, jadi dia hanya bisa melihat barisnya sendiri."

---

## 6. Pertanyaan: "baris ini buat apa?"

Baris-baris yang paling mungkin ditunjuk.

### `src/App.tsx:66`
```tsx
<RequireAuth>
  <RequireApproval>
```
"Dua penjaga bertingkat, Pak. Yang luar memastikan sudah login, yang dalam
memastikan sudah disetujui admin. Urutannya penting: percuma menanyakan
'sudah disetujui?' pada orang yang belum login."

### `src/components/RequireAuth.tsx:26`
```tsx
if (!session) {
  return <Navigate to="/auth?role=user" state={{ from: location.pathname }} replace />;
}
```
"Kalau belum login, lempar ke halaman masuk. `state={{ from: ... }}` menyimpan
halaman asalnya, jadi setelah login dia kembali ke tempat tadi, bukan ke
beranda. `replace` supaya tombol Back tidak memantul ke halaman terlarang."

### `src/components/RequireApproval.tsx:34`
```tsx
if (approval !== 'pending' && approval !== 'rejected') return <>{children}</>;
```
"Kalau statusnya bukan menunggu dan bukan ditolak, lanjutkan ke kuisioner.

Ditulis terbalik begitu supaya aman: kalau pengecekannya gagal — misalnya
migrasinya belum dijalankan — nilainya `null`, dan pengguna tetap diloloskan.
Yang menolak nanti tetap database. Lebih baik begitu daripada seluruh alumni
terkunci gara-gara satu pengecekan gagal."

### `src/pages/FormWizard.tsx:119`
```tsx
user_id: session?.user?.id ?? null,
```
"Menandai jawaban ini milik akun yang sedang login. Ini yang membuat admin bisa
tahu siapa yang mengisi. Tanda tanya itu optional chaining — kalau tidak ada
sesi, isinya `null`, tidak error."

### `src/lib/usePresence.ts:10`
```ts
const BEAT_MS = 20_000;
```
"Browser lapor 'saya masih di sini' tiap 20 detik. Angkanya harus lebih kecil
dari jendela di database yang 60 detik — supaya satu laporan gagal terkirim
pun, statusnya belum berubah jadi offline."

### `src/lib/usePresence.ts:58`
```ts
keepalive: true,
```
"Ini kuncinya, Pak. Saat tab ditutup, permintaan HTTP biasa ikut dibatalkan
bersama halamannya. `keepalive` menyuruh browser tetap menyelesaikannya.
Tanpa ini, status Aktif tidak pernah berubah waktu tab ditutup — itu bug yang
sempat saya temukan dan perbaiki."

### `src/lib/adminData.ts:159`
```ts
.from('admin_alumni_overview')
```
"Mengambil dari **view**, bukan tabel. View ini sudah menggabungkan data induk +
riwayat pengisian + status online, jadi satu query cukup. Kalau dari tabel
langsung, tiap baris butuh tiga query tambahan."

### `supabase/migrations/0012_presence_accuracy.sql:135`
```sql
with (security_invoker = true) as
```
"Ini wajib, Pak. Secara bawaan, view di Postgres berjalan dengan hak
**pembuatnya**, artinya RLS-nya dilewati — seluruh data alumni bisa terbaca
siapa saja. `security_invoker = true` membuatnya berjalan dengan hak
**pemanggilnya**, jadi policy tetap berlaku."

---

## 7. Pertanyaan sulit / jebakan

> *P: Ini bikin sendiri atau pakai template?*

Jujur saja. Desainnya dari Figma tim sendiri (node-nya masih tercatat di
komentar, misalnya `Step1Identitas.tsx` baris 19), CSS-nya ditulis manual ~3.940
baris tanpa Bootstrap/Tailwind, grafiknya SVG buatan sendiri tanpa library
chart. Kalau ada bagian yang dibantu AI, katakan saja — yang dinilai penguji
adalah apakah Anda **paham** kodenya.

> *P: Apa kelemahan sistem ini?*

Ini pertanyaan bagus, jangan dijawab "tidak ada". Tiga yang jujur:

1. **Belum ada reset password.** Alumni yang lupa sandi harus dibantu admin
   lewat dashboard Supabase.
2. **Impor CSV belum memvalidasi isi baris.** Kalau ada NISN salah format di
   file, tertolak di database tapi pesan errornya belum ramah.
3. **Penanda online butuh tab tetap terbuka dan terlihat.** Kalau tab-nya
   ditaruh di latar belakang, dihitung tidak aktif. Ini sengaja, tapi tetap
   sebuah batasan.

> *P: Kalau alumninya belum terdaftar di data induk, bisa mengisi?*

"Bisa mengisi formnya, tapi akunnya tetap harus disetujui admin dulu. Di layar
persetujuan, admin akan melihat keterangan 'Tidak ada di data induk'
(`Persetujuan.tsx` baris 239), jadi dia tahu harus mengecek manual
dulu."

> *P: Kalau internet mati saat mengisi, datanya hilang?*

"Ya, Pak, kalau matinya saat menekan Kirim. Jawaban disimpan di memori browser
selama pengisian dan baru dikirim sekali di akhir. Kalau gagal, pesan error
muncul dan datanya masih di form, jadi bisa dicoba kirim ulang tanpa mengetik
ulang — tapi kalau halamannya ditutup, hilang. Perbaikannya nanti bisa pakai
simpan otomatis ke localStorage."

> *P: Berapa banyak data yang bisa ditampung?*

"Batasnya bukan di kode, tapi di paket Supabase. Yang sudah saya antisipasi di
kode: tabel dibatasi 8 baris per halaman, dan ekspor Excel mengambil data
bertahap 1000 baris sekali jalan (`adminData.ts` baris 320) karena API-nya
memang membatasi segitu."

---

## 8. Kalimat siap pakai

Hafalkan lima ini. Kalau bingung, salah satunya biasanya cocok.

**1. Soal keamanan**
> "Sistem ini tidak punya backend sendiri, jadi keamanannya ada di database —
> 15 Row Level Security policy di PostgreSQL. Kode React hanya menjaga jalur
> yang jujur."

**2. Soal struktur kode**
> "Halaman ada di `src/pages`, komponen di `src/components`, dan semua query
> database dikumpulkan di `src/lib/adminData.ts` supaya tidak tersebar."

**3. Soal alur data**
> "React memanggil Supabase lewat satu klien di `src/lib/supabase.ts`. Supabase
> menerjemahkannya jadi query PostgreSQL, lalu RLS memutuskan baris mana yang
> boleh kembali."

**4. Kalau ditanya sesuatu yang tidak tahu**
> "Saya kurang hafal barisnya, Pak, tapi itu ada di file `___`. Boleh saya cari
> pakai Ctrl+Shift+F?"
>
> Ini jawaban yang baik. Menunjukkan Anda paham struktur, bukan menghafal.

**5. Soal database**
> "6 tabel, 2 view, 16 fungsi. Yang paling besar `tracer_study` dengan 51 kolom
> karena menampung semua cabang pertanyaan kuisioner dalam satu baris per orang."

---

## Persiapan sebelum presentasi

- [ ] `git pull origin main` — pastikan kode di laptop yang terbaru
- [ ] Jalankan `0012_presence_accuracy.sql` di Supabase
- [ ] Restart dev server, cek semua halaman terbuka
- [ ] Buka VS Code, pastikan Ctrl+Shift+F berfungsi
- [ ] Buka satu tab Supabase → Table Editor, untuk jaga-jaga ditanya isi tabel
- [ ] Siapkan satu akun alumni yang sudah disetujui, untuk demo
