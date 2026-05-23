-- SCRIPT UNTUK MEMPERBARUI TABEL KONTROL (device_controls)
-- Jalankan ini di SQL Editor Supabase Anda

-- 1. Menambahkan kolom untuk Jadwal Misting Pagi
ALTER TABLE device_controls 
ADD COLUMN IF NOT EXISTS misting_morning TEXT DEFAULT '06:00:00';

-- 2. Menambahkan kolom untuk Kekuatan Pompa (PWM 0-100%)
ALTER TABLE device_controls 
ADD COLUMN IF NOT EXISTS pump_pressure INTEGER DEFAULT 100;

-- 3. Inisialisasi data untuk alat pertama (ID 1) agar tidak kosong
UPDATE device_controls 
SET 
  misting_morning = '06:00:00',
  pump_pressure = 100
WHERE id = 1;

-- 4. Verifikasi (Opsional: Jalankan ini untuk melihat hasilnya)
-- SELECT * FROM device_controls;
