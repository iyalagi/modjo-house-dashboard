-- SCRIPT UNTUK MENAMBAHKAN DATA 7 SENSOR (MULTIPLEXER)
-- Jalankan di SQL Editor Supabase

-- 1. Tambahkan kolom sensor_nodes sebagai array integer
ALTER TABLE sensor_data 
ADD COLUMN IF NOT EXISTS sensor_nodes INT4[] DEFAULT '{0,0,0,0,0,0,0}';

-- 2. Tambahkan kolom untuk mencatat waktu alat kirim data (optional tapi bagus untuk debug)
ALTER TABLE sensor_data 
ADD COLUMN IF NOT EXISTS node_id TEXT DEFAULT 'ESP32_MAIN';

-- 3. Verifikasi struktur
-- SELECT * FROM sensor_data LIMIT 5;
