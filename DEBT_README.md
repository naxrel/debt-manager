# deBT - Aplikasi Manajemen Utang Piutang

Aplikasi mobile untuk memudahkan pengelolaan utang piutang Anda. Dibangun dengan React Native dan Expo.

## 📋 Fitur

- **Autentikasi User**: Login dan register dengan database static untuk demo
- **Dashboard**: Ringkasan total hutang, piutang, dan saldo bersih
- **Manajemen Transaksi**: 
  - Tambah transaksi hutang atau piutang
  - Lihat detail transaksi
  - Tandai sebagai lunas
  - Hapus transaksi
- **Daftar Transaksi**: Filter berdasarkan semua, hutang, atau piutang
- **Database Static**: Data demo yang sudah tersedia untuk testing

## 🔐 Akun Demo

Gunakan salah satu akun berikut untuk login:

| Username | Password | Nama |
|----------|----------|------|
| admin | admin123 | Admin User |
| john | john123 | John Doe |
| jane | jane123 | Jane Smith |

Setiap akun sudah memiliki data transaksi hutang piutang untuk demo.

## 🚀 Cara Menjalankan

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan aplikasi:**
   ```bash
   npm start
   ```

3. **Pilih platform:**
   - Tekan `a` untuk Android
   - Tekan `i` untuk iOS
   - Tekan `w` untuk Web
   - Scan QR code dengan Expo Go untuk mobile

## 📱 Struktur Aplikasi

```
app/
├── (tabs)/          # Tab navigation screens
│   ├── home.tsx     # Dashboard/beranda
│   └── list.tsx     # Daftar transaksi
├── auth/            # Authentication screens
│   ├── login.tsx    # Halaman login
│   └── register.tsx # Halaman registrasi
├── debt/            # Debt management screens
│   ├── add.tsx      # Tambah transaksi
│   └── detail.tsx   # Detail transaksi
└── _layout.tsx      # Root layout dengan providers

contexts/
├── AuthContext.tsx  # Context untuk autentikasi
└── DebtContext.tsx  # Context untuk manajemen debt

data/
└── staticDatabase.ts # Static database dengan helper functions
```

## 💾 Database Static

Database static berisi:
- **3 User** dengan kredensial login
- **7 Transaksi** hutang piutang yang terdistribusi ke semua user
- Helper functions untuk CRUD operations

### Struktur Data

**User:**
```typescript
{
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
}
```

**Debt (Utang Piutang):**
```typescript
{
  id: string;
  userId: string;
  type: 'hutang' | 'piutang';
  name: string;         // Nama orang yang terlibat
  amount: number;
  description: string;
  date: string;
  isPaid: boolean;
}
```

## 🎨 Fitur Utama

### 1. Dashboard (Beranda)
- Total hutang yang belum dibayar
- Total piutang yang belum dibayar
- Saldo bersih (piutang - hutang)
- 5 transaksi terbaru yang belum lunas

### 2. Tambah Transaksi
- Pilih tipe: Hutang atau Piutang
- Input nama orang yang terlibat
- Input jumlah uang (format Rupiah otomatis)
- Input tanggal transaksi
- Tambahkan keterangan (opsional)

### 3. Detail Transaksi
- Lihat semua informasi transaksi
- Tandai sebagai lunas
- Hapus transaksi

### 4. Daftar Transaksi
- Filter: Semua, Hutang, atau Piutang
- Lihat semua transaksi dengan status lunas/belum

## 🔧 Teknologi

- **React Native** - Framework mobile
- **Expo** - Development platform
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **AsyncStorage** - Local storage untuk session
- **React Context** - State management

## 📝 Catatan

- Aplikasi ini menggunakan **database static** untuk keperluan demo
- Data disimpan di memori dan akan reset jika aplikasi di-reload
- User session disimpan di AsyncStorage untuk persistensi login
- Registrasi user baru akan menambahkan ke database static (tidak permanen)

## 🎯 Konsep

**Hutang**: Anda berhutang kepada orang lain
**Piutang**: Orang lain berhutang kepada Anda

**Saldo Bersih** = Total Piutang - Total Hutang
- Positif: Anda memiliki surplus (lebih banyak piutang)
- Negatif: Anda memiliki defisit (lebih banyak hutang)

## 📄 License

MIT

## 👨‍💻 Developer

Dibuat untuk memudahkan pengelolaan utang piutang pribadi.
