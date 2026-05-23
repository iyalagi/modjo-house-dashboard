# Panduan Setup Database Supabase

Jalankan script SQL berikut di **SQL Editor** pada Dashboard Supabase Anda:

### 1. Membuat Tabel Data Sensor
Tabel ini menyimpan riwayat kelembaban dari IoT (ESP32).
```sql
CREATE TABLE sensor_data (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  humidity FLOAT8 NOT NULL,
  pump_status TEXT DEFAULT 'OFF',
  pressure INTEGER DEFAULT 0
);

-- Aktifkan Realtime untuk tabel ini
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_data;
```

### 2. Membuat Tabel Kontrol Perangkat
Tabel ini digunakan untuk mengirim instruksi dari Web ke IoT.
```sql
CREATE TABLE device_controls (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Selalu gunakan ID 1 untuk satu alat
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  manual_pump_override BOOLEAN DEFAULT FALSE,
  misting_schedule TIME DEFAULT '22:00:00',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  humidity_low INTEGER DEFAULT 60,
  humidity_high INTEGER DEFAULT 80
);

-- Masukkan data awal
INSERT INTO device_controls (id, manual_pump_override, misting_schedule, last_seen, humidity_low, humidity_high) 
VALUES (1, false, '22:00:00', NOW(), 60, 80);
```
-- Aktifkan Realtime untuk tabel ini
ALTER PUBLICATION supabase_realtime ADD TABLE device_controls;
```

### 3. Setup Pembersihan Data Otomatis (pg_cron)
Script ini akan menghapus data sensor yang lebih lama dari 8 hari. Ini memastikan Anda selalu punya data lengkap 1 minggu terakhir (7 hari) sebelum data hari ke-9 dihapus.
*Catatan: Anda perlu mengaktifkan ekstensi `pg_cron` di menu Database -> Extensions di Supabase.*

```sql
SELECT cron.schedule(
  'cleanup-old-sensor-data', 
  '0 0 * * *', -- Setiap hari jam 00:00
  $$ DELETE FROM sensor_data WHERE created_at < NOW() - INTERVAL '8 days' $$
);
```
