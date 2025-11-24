# Quick Start Guide - deBT App

## ✅ Apa yang sudah dibuat?

### 1. **Database Static** (`data/staticDatabase.ts`)
- 3 user demo dengan password
- 7 transaksi utang piutang sampel
- Helper functions lengkap untuk CRUD operations

### 2. **Authentication System**
- Context API untuk state management (`contexts/AuthContext.tsx`)
- Halaman Login (`app/auth/login.tsx`)
- Halaman Register (`app/auth/register.tsx`)
- Persistent session dengan AsyncStorage

### 3. **Debt Management**
- Context API untuk debt management (`contexts/DebtContext.tsx`)
- Dashboard/Beranda (`app/(tabs)/home.tsx`)
- Daftar Transaksi dengan filter (`app/(tabs)/list.tsx`)
- Tambah Transaksi (`app/debt/add.tsx`)
- Detail & Edit Transaksi (`app/debt/detail.tsx`)

## 🚀 Cara Menjalankan

```bash
# Install dependencies
npm install

# Jalankan aplikasi
npm start

# Pilih platform:
# - Tekan 'a' untuk Android
# - Tekan 'i' untuk iOS  
# - Tekan 'w' untuk Web
```

## 🔐 Login Demo

Gunakan salah satu akun ini:

```
Username: admin
Password: admin123

Username: john
Password: john123

Username: jane
Password: jane123
```

## 📱 Fitur Aplikasi

### Dashboard (Beranda)
- **Total Hutang**: Jumlah uang yang Anda berhutang ke orang lain
- **Total Piutang**: Jumlah uang yang orang lain berhutang ke Anda
- **Saldo Bersih**: Piutang - Hutang
- **Transaksi Terbaru**: 5 transaksi terakhir yang belum lunas

### Tambah Transaksi
1. Pilih tipe: **Hutang** atau **Piutang**
   - Hutang: Anda berhutang ke orang lain
   - Piutang: Orang lain berhutang ke Anda
2. Masukkan nama orang
3. Masukkan jumlah (otomatis format Rupiah)
4. Pilih tanggal
5. Tambah keterangan (opsional)

### Daftar Transaksi
- Filter berdasarkan: Semua, Hutang, Piutang
- Lihat status: Lunas atau Belum Lunas
- Tap untuk lihat detail

### Detail Transaksi
- Lihat semua informasi lengkap
- **Tandai sebagai Lunas**: Ubah status menjadi lunas
- **Hapus Transaksi**: Hapus dari database

## 📂 Struktur File

```
app/
├── (tabs)/              # Tab navigation
│   ├── home.tsx         # Dashboard
│   ├── list.tsx         # Daftar transaksi
│   └── _layout.tsx      # Tab layout
├── auth/                # Authentication
│   ├── login.tsx
│   └── register.tsx
├── debt/                # Debt management
│   ├── add.tsx
│   └── detail.tsx
└── _layout.tsx          # Root layout

contexts/
├── AuthContext.tsx      # Auth state management
└── DebtContext.tsx      # Debt state management

data/
└── staticDatabase.ts    # Static database
```

## 🎯 Cara Kerja

### Static Database
- Data disimpan di memori (untuk demo)
- Reset saat aplikasi di-reload
- User baru yang register akan ditambahkan (temporary)

### Authentication Flow
1. User login dengan username/password
2. Kredensial di-check dengan static database
3. User data disimpan di AsyncStorage
4. Session persistent sampai logout

### Debt Management Flow
1. Semua transaksi linked ke userId
2. CRUD operations melalui StaticDB class
3. Context API menyediakan state global
4. Auto-refresh setelah perubahan data

## 💡 Tips Penggunaan

1. **Saldo Positif**: Berarti orang berhutang lebih banyak ke Anda (bagus!)
2. **Saldo Negatif**: Berarti Anda berhutang lebih banyak (hati-hati!)
3. **Tandai Lunas**: Jangan lupa tandai transaksi yang sudah dibayar
4. **Keterangan**: Tambahkan keterangan untuk mengingat detail hutang piutang

## 🔧 Customization

Ingin mengubah sesuatu?

- **Tambah user demo**: Edit `STATIC_USERS` di `data/staticDatabase.ts`
- **Tambah transaksi demo**: Edit `STATIC_DEBTS` di `data/staticDatabase.ts`  
- **Ubah warna**: Edit styles di masing-masing screen
- **Tambah fitur**: Extend StaticDB class dengan method baru

## ⚠️ Catatan Penting

- Aplikasi ini menggunakan **database static** (bukan real database)
- Data akan **hilang** saat app di-restart
- Untuk production, ganti dengan:
  - Backend API (REST/GraphQL)
  - Database lokal (SQLite/Realm)
  - Cloud database (Firebase/Supabase)

## 🎉 Selamat Menggunakan!

Aplikasi deBT siap digunakan untuk demo manajemen utang piutang Anda!
