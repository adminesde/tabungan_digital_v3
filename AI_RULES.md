# Aturan AI untuk Aplikasi Tabungan Digital Siswa

Dokumen ini menguraikan tumpukan teknologi dan panduan pengkodean untuk mengembangkan aplikasi "Aplikasi Tabungan Digital Siswa".

## Tumpukan Teknologi (Tech Stack)

Aplikasi ini dibangun menggunakan teknologi inti berikut:

*   **React**: Pustaka JavaScript untuk membangun antarmuka pengguna yang dinamis dan interaktif.
*   **TypeScript**: Supersets dari JavaScript yang menambahkan pengetikan statis, meningkatkan kualitas kode, keterbacaan, dan pemeliharaan.
*   **Vite**: Alat pembangunan modern dan cepat yang menyediakan pengalaman pengembangan yang sangat cepat.
*   **Tailwind CSS**: Kerangka kerja CSS berbasis utilitas yang digunakan untuk menata komponen dengan cepat dan memastikan desain yang konsisten.
*   **Lucide React**: Pustaka ikon komprehensif yang menyediakan berbagai ikon SVG yang dapat disesuaikan.
*   **React Router**: (Ditujukan untuk integrasi) Pustaka standar untuk perutean sisi klien deklaratif dalam aplikasi.
*   **Shadcn/ui**: (Ditujukan untuk integrasi) Kumpulan komponen UI yang dirancang dengan indah, mudah diakses, dan dapat disesuaikan yang dibangun di atas Radix UI dan Tailwind CSS.
*   **Radix UI**: (Dasar untuk Shadcn/ui) Sekumpulan primitif komponen tanpa gaya dan mudah diakses yang menjadi dasar pembangunan komponen shadcn/ui.

## Aturan Penggunaan Pustaka (Library Usage Rules)

Untuk menjaga konsistensi, efisiensi, dan praktik terbaik, patuhi aturan berikut saat menggunakan pustaka dan mengembangkan fitur:

*   **Komponen UI**:
    *   **Pilihan Utama**: Selalu prioritaskan penggunaan komponen dari **shadcn/ui** untuk elemen UI umum (misalnya, tombol, formulir, dialog, tabel).
    *   **Komponen Kustom**: Jika komponen tertentu tidak tersedia di shadcn/ui atau memerlukan kustomisasi unik dan kompleks, buat komponen kustom baru yang terfokus di `src/components/`.
*   **Penataan Gaya (Styling)**:
    *   **Penggunaan Eksklusif**: Semua penataan gaya komponen harus diimplementasikan menggunakan kelas utilitas **Tailwind CSS**.
    *   **Tidak Ada File CSS Kustom**: Hindari membuat file `.css` baru.
    *   **Tidak Ada Gaya Inline**: Minimalkan penggunaan atribut `style` inline; lebih suka kelas Tailwind untuk semua kebutuhan penataan gaya.
*   **Ikon**:
    *   **Pustaka Standar**: Gunakan ikon secara eksklusif dari **lucide-react**.
*   **Perutean (Routing)**:
    *   **Navigasi Sisi Klien**: Implementasikan semua navigasi sisi klien dan manajemen rute menggunakan **React Router**.
    *   **Definisi Rute**: Pertahankan rute aplikasi utama yang didefinisikan dalam `src/App.tsx`.
*   **Manajemen State**:
    *   **State Lokal**: Untuk state spesifik komponen, gunakan hook `useState` bawaan React.
    *   **State Global**: Untuk state di seluruh aplikasi (misalnya, status autentikasi), gunakan React's Context API (`useContext`). Hindari pustaka manajemen state eksternal kecuali disetujui secara eksplisit.
*   **Penanganan Data**:
    *   **Data Mock**: Saat ini, data mock dari `src/data/mockData.ts` digunakan untuk tujuan pengembangan dan demonstrasi.
    *   **Operasi Sisi Server**: Untuk autentikasi, interaksi basis data, atau fungsi sisi server apa pun (misalnya, menangani kunci API, rahasia), **Supabase** adalah integrasi yang direkomendasikan.