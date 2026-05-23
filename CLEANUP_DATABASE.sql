-- ======================================================
-- SELF-CLEANUP FUNCTION (TANPA PG_CRON)
-- ======================================================

/* 
  LOGIKA:
  Karena pg_cron tidak bisa diakses, kita menggunakan fungsi RPC.
  Fungsi ini akan dipanggil oleh ESP32 atau Dashboard secara rutin.
*/

-- 1. Buat Fungsi Pembersih
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  DELETE FROM sensor_data 
  WHERE created_at < NOW() - INTERVAL '8 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Beri izin agar anon role bisa memanggil fungsi ini (lewat API)
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO anon;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO authenticated;

/*
  CARA PAKAI DI ESP32:
  Panggil endpoint: /rest/v1/rpc/cleanup_old_data
  Setiap 24 jam sekali atau saat startup.
*/
