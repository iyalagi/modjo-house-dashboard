#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// ==========================================
// 1. KONFIGURASI WIFI & SUPABASE & NTP
// ==========================================
const char* ssid       = "bonabrian";
const char* password   = "enjel2702";

const char* supabase_url = "https://grrumsiewdegytaddsaj.supabase.co";
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycnVtc2lld2RlZ3l0YWRkc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ0ODgsImV4cCI6MjA5NDc1MDQ4OH0.5ZW0xzkS0-knrfr4VBIfNSE7WxBcKcxsYGQ3Jpxs0cg";

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "id.pool.ntp.org", 7 * 3600); // GMT+7 WIB

// ==========================================
// 2. PIN HARDWARE (4 SENSOR DIRECT)
// ==========================================
const int mosfetPin = 26; 

// Hanya 4 Sensor
const int sensorPins[] = {34, 35, 32, 33}; 
const int jumlahSensor = 4;

// PWM ESP32 (Core 3.x)
const int pwmFreq = 5000;
const int pwmRes  = 8;

// Kalibrasi Final (Fixed)
int nilaiKering = 2700; 
int nilaiBasah  = 680;

// ==========================================
// 3. VARIABEL KONTROL
// ==========================================
int sensorValues[4]; // Array diperkecil jadi 4
int currentHumidity = 0;
int h_low = 60;
int h_high = 80;
bool manualOverride = false;
String scheduledTime = "22:00";
String scheduledMorningTime = "06:00";
int pumpPressureTarget = 100;

unsigned long lastHeartbeat = 0;
unsigned long lastPumpCheck = 0;
unsigned long lastDataLog   = 0;

const unsigned long intervalHeartbeat = 30000; 
const unsigned long intervalPumpCheck = 3000;  
const unsigned long intervalDataLog   = 60000; 

WiFiClientSecure client;

// ==========================================
// 4. SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  
  ledcAttach(mosfetPin, pwmFreq, pwmRes);
  ledcWrite(mosfetPin, 0);

  for(int i=0; i<jumlahSensor; i++) {
    pinMode(sensorPins[i], INPUT);
  }

  Serial.println("\n--- SISTEM SMART IRIGASI G0 (FINAL 4 SENSORS) ---");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Terhubung!");
  
  client.setInsecure();
  timeClient.begin();
}

// ==========================================
// 5. LOOP UTAMA
// ==========================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    ledcWrite(mosfetPin, 0);
    WiFi.begin(ssid, password);
    delay(1000);
    return;
  }

  timeClient.update();
  unsigned long currentMillis = millis();

  // A. Baca 4 Sensor
  long totalPercent = 0;
  for (int i = 0; i < jumlahSensor; i++) {
    int raw = analogRead(sensorPins[i]);
    int percent = map(raw, nilaiKering, nilaiBasah, 0, 100);
    percent = constrain(percent, 0, 100);
    
    sensorValues[i] = percent;
    totalPercent += percent;
    Serial.printf("S%d:%d%% ", i+1, percent);
  }
  
  currentHumidity = totalPercent / jumlahSensor;
  Serial.printf("| AVG: %d%%\n", currentHumidity);

  // B. Sinkronisasi & Logika
  if (currentMillis - lastPumpCheck >= intervalPumpCheck) {
    lastPumpCheck = currentMillis;
    syncWithDatabase();
  }

  String currentTime = timeClient.getFormattedTime().substring(0, 5);
  bool finalPumpState = false;

  if (currentHumidity <= 0) {
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

  // C. Heartbeat & Logging
  if (currentMillis - lastHeartbeat >= intervalHeartbeat) {
    lastHeartbeat = currentMillis;
    kirimHeartbeat();
  }
  if (currentMillis - lastDataLog >= intervalDataLog) {
    lastDataLog = currentMillis;
    kirimDataSensor();
  }
}

// ==========================================
// 6. FUNGSI KOMUNIKASI
// ==========================================

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
  doc["humidity"] = currentHumidity;
  doc["pump_status"] = (ledcRead(mosfetPin) > 0) ? "ON" : "OFF";
  doc["pressure"] = pumpPressureTarget;
  JsonArray individual = doc.createNestedArray("sensor_nodes");
  for(int i=0; i<4; i++) individual.add(sensorValues[i]);

  String jsonStr;
  serializeJson(doc, jsonStr);
  http.POST(jsonStr);
  http.end();
}
