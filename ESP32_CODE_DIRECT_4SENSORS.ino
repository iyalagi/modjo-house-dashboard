#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <WiFiManager.h> // Tambahkan Library WiFiManager

// ==========================================
// 1. KONFIGURASI SUPABASE & NTP
// ==========================================
// SSID dan Password dikelola otomatis oleh WiFiManager
const char* supabase_url = "https://grrumsiewdegytaddsaj.supabase.co";
const char* supabase_key ="ISI_KEY_SUPABASE_ANDA_DI_SINI"; // Masukkan API Key Anda di sini

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "id.pool.ntp.org", 7 * 3600); // GMT+7 WIB

// ==========================================
// 2. PIN HARDWARE (DIRECT - TANPA MUX)
// ==========================================
const int mosfetPin = 26;
const int sensorPins[] = {34, 35, 32, 33};
const int jumlahSensor = 4;

const int pwmFreq = 20000; 
const int pwmRes  = 8;

// Kalibrasi Global
int nilaiKering = 2700;
int nilaiBasah  = 680;

// Konfigurasi Stabilitas (Software Filter Anti-Floating)
const int numSamples = 50; 
const int maxJitterAllowed = 80; 

// ==========================================
// 3. VARIABEL KONTROL & INTERVAL
// ==========================================
int sensorValues[7];
int currentHumidity = 0;
int h_low = 60;
int h_high = 80;
bool manualOverride = false;
bool systemError = false;

String scheduledTime = "22:00";
String scheduledMorningTime = "06:00";
int pumpPressureTarget = 100;

unsigned long lastHeartbeat = 0;
unsigned long lastPumpCheck = 0;
unsigned long lastDataLog   = 0;

const unsigned long intervalHeartbeat = 10000; // Melapor setiap 10 detik (Standar Industri)
const unsigned long intervalPumpCheck = 3000;
const unsigned long intervalDataLog   = 60000;

WiFiClientSecure client;

// Fungsi Pembacaan Stabil dengan Analisis Getaran (Jitter)
int bacaSensorStabil(int pin, int sensorIdx) {
  long sum = 0;
  int samples[numSamples];
  
  for (int i = 0; i < numSamples; i++) {
    samples[i] = analogRead(pin);
    sum += samples[i];
    delay(1);
  }
  
  int average = sum / numSamples;
  
  long totalVariance = 0;
  for (int i = 0; i < numSamples; i++) {
    totalVariance += abs(samples[i] - average);
  }
  int jitter = totalVariance / numSamples;

  if (jitter > maxJitterAllowed || average > 3000 || average < 200) {
    if (millis() % 5000 < 20) {
      Serial.printf("[S%d OFF/JITTER: %d] ", sensorIdx + 1, jitter);
    }
    return nilaiKering; 
  }
  
  return average;
}

// ==========================================
// 4. SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  ledcAttach(mosfetPin, pwmFreq, pwmRes);
  ledcWrite(mosfetPin, 0);

  for (int i = 0; i < jumlahSensor; i++) {
    pinMode(sensorPins[i], INPUT);
  }

  Serial.println("\n--- SISTEM SMART IRIGASI (WIFI MANAGER ACTIVE) ---");
  
  // LOGIKA WIFIMANAGER
  WiFiManager wm;
  
  // Set timeout agar jika tidak diatur dalam 3 menit, dia restart (opsional)
  wm.setConfigPortalTimeout(180);

  // Membuat Access Point otomatis jika WiFi tidak ditemukan
  // Nama AP: "Modjo-Smart-Config" tanpa password
  if (!wm.autoConnect("Modjo-Smart-Config")) {
    Serial.println("Gagal konek & timeout portal.");
    ESP.restart();
  }

  Serial.println("\nWiFi Terhubung via WiFiManager!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  client.setInsecure();
  timeClient.begin();
  jalankanCleanup();
}

// ==========================================
// 5. LOOP UTAMA
// ==========================================
void loop() {
  // WiFiManager menangani koneksi ulang secara otomatis di latar belakang
  if (WiFi.status() != WL_CONNECTED) {
    ledcWrite(mosfetPin, 0);
    delay(1000);
    return;
  }

  timeClient.update();
  unsigned long currentMillis = millis();

  long totalPercent = 0;
  int validSensors = 0;

  for (int i = 0; i < jumlahSensor; i++) {
    int raw = bacaSensorStabil(sensorPins[i], i);
    int percent = map(raw, nilaiKering, nilaiBasah, 0, 100);
    percent = constrain(percent, 0, 100);

    if (raw > (nilaiKering - 50)) percent = 0;

    sensorValues[i] = percent;
    if (percent > 0) {
      totalPercent += percent;
      validSensors++;
    }
  }

  if (validSensors == 0) {
    currentHumidity = 0;
    systemError = true;
  } else {
    currentHumidity = totalPercent / validSensors;
    systemError = false;
  }

  for (int i = jumlahSensor; i < 7; i++) sensorValues[i] = 0;
  
  if (currentMillis - lastPumpCheck >= intervalPumpCheck) {
    lastPumpCheck = currentMillis;
    Serial.printf("AVG: %d%% | Sensors Active: %d\n", currentHumidity, validSensors);
    syncWithDatabase();
  }

  String currentTime = timeClient.getFormattedTime().substring(0, 5);
  bool finalPumpState = false;

  if (currentHumidity <= 0 || systemError) {
    finalPumpState = false; 
    if (manualOverride) resetCorMode();
  } else if (manualOverride) {
    finalPumpState = (currentHumidity < 75);
    if (!finalPumpState) resetCorMode();
  } else if (currentTime == scheduledTime || currentTime == scheduledMorningTime) {
    finalPumpState = true;
  } else {
    if (currentHumidity < h_low) finalPumpState = true;
    else if (currentHumidity >= h_high) finalPumpState = false;
    else finalPumpState = (ledcRead(mosfetPin) > 0);
  }

  if (finalPumpState) {
    int dutyCycle = map(pumpPressureTarget, 0, 100, 0, 255);
    ledcWrite(mosfetPin, dutyCycle);
  } else {
    ledcWrite(mosfetPin, 0);
  }

  if (currentMillis - lastHeartbeat >= intervalHeartbeat) {
    lastHeartbeat = currentMillis;
    kirimHeartbeat();
  }
  if (currentMillis - lastDataLog >= intervalDataLog) {
    lastDataLog = currentMillis;
    kirimDataSensor();
  }
}

// ... (Sisa fungsi komunikasi tetap sama)
void resetCorMode() {
  manualOverride = false;
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/device_controls?id=eq.1";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Content-Type", "application/json");
  http.PATCH("{\"manual_pump_override\": false}");
  http.end();
}

void syncWithDatabase() {
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/device_controls?id=eq.1&select=*";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);

    manualOverride     = doc[0]["manual_pump_override"];
    h_low              = doc[0]["humidity_low"];
    h_high             = doc[0]["humidity_high"];
    String fullTime    = doc[0]["misting_schedule"];
    scheduledTime      = fullTime.substring(0, 5);
    String morningTime = doc[0]["misting_morning"];
    if (morningTime != "null") scheduledMorningTime = morningTime.substring(0, 5);
    if (doc[0].containsKey("pump_pressure")) pumpPressureTarget = doc[0]["pump_pressure"];

    // LOGIKA RESET WIFI DARI WEB
    bool resetWiFiReq = doc[0]["reset_wifi_req"];
    if (resetWiFiReq) {
      Serial.println("PERINTAH RESET WIFI DITERIMA!");

      // 1. Kembalikan flag ke false di database agar tidak reset terus-menerus
      HTTPClient httpReset;
      String resetUrl = String(supabase_url) + "/rest/v1/device_controls?id=eq.1";
      httpReset.begin(client, resetUrl);
      httpReset.addHeader("apikey", supabase_key);
      httpReset.addHeader("Authorization", "Bearer " + String(supabase_key));
      httpReset.addHeader("Content-Type", "application/json");
      httpReset.PATCH("{\"reset_wifi_req\": false}");
      httpReset.end();

      // 2. Hapus Setting WiFi & Restart
      delay(1000);
      WiFiManager wm;
      wm.resetSettings(); 
      ESP.restart();
    }
  }
  http.end();
}


void kirimHeartbeat() {
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/rpc/heartbeat";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Content-Type", "application/json");
  http.POST("{}");
  http.end();
}

void kirimDataSensor() {
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/sensor_data";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["humidity"]    = currentHumidity;
  doc["pump_status"] = (ledcRead(mosfetPin) > 0) ? "ON" : "OFF";
  doc["pressure"]    = pumpPressureTarget;
  doc["wifi_rssi"]   = WiFi.RSSI(); // Ambil kekuatan sinyal (dBm)

  JsonArray individual = doc.createNestedArray("sensor_nodes");
  for (int i = 0; i < 7; i++) individual.add(sensorValues[i]);

  String jsonStr;
  serializeJson(doc, jsonStr);
  http.POST(jsonStr);
  http.end();
}


void jalankanCleanup() {
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/rpc/cleanup_old_data";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Content-Type", "application/json");
  http.POST("{}"); 
  http.end();
}
