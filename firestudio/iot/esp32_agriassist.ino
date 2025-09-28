#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <WiFiClientSecure.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend endpoints - Production URLs
const char* primary_endpoint = "https://agriassist-backend.onrender.com/sensor-data";
const char* fallback_endpoint = "https://agriassist.vercel.app/api/sensor-realtime";

// Sensor pins
#define DHT_PIN 4
#define SOIL_MOISTURE_PIN A0
#define PH_PIN A1
#define NITROGEN_PIN A2
#define PHOSPHORUS_PIN A3  
#define POTASSIUM_PIN A4
#define MOTION_PIN 2

// DHT sensor
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Device configuration
const char* device_token = "ESP32_FIELD_001";
const char* device_location = "Field_A_Zone_1";

// Timing
unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 30000; // 30 seconds
const unsigned long retryDelay = 5000; // 5 seconds

// SSL Certificate for HTTPS
const char* root_ca = R"(
-----BEGIN CERTIFICATE-----
[Your SSL Certificate Here]
-----END CERTIFICATE-----
)";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize sensors
  dht.begin();
  pinMode(MOTION_PIN, INPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("ESP32 AgriAssist Sensor Node Started");
  Serial.println("Device Token: " + String(device_token));
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Read and send sensor data
  if (millis() - lastSensorRead >= sensorInterval) {
    readAndSendSensorData();
    lastSensorRead = millis();
  }
  
  delay(1000);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed. Retrying...");
    delay(5000);
    connectToWiFi();
  }
}

void readAndSendSensorData() {
  Serial.println("Reading sensors...");
  
  // Read sensor values
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int soilMoisture = map(analogRead(SOIL_MOISTURE_PIN), 0, 4095, 0, 100);
  float ph = mapFloat(analogRead(PH_PIN), 0, 4095, 0, 14);
  int nitrogen = map(analogRead(NITROGEN_PIN), 0, 4095, 0, 100);
  int phosphorus = map(analogRead(PHOSPHORUS_PIN), 0, 4095, 0, 100);
  int potassium = map(analogRead(POTASSIUM_PIN), 0, 4095, 0, 100);
  bool motion = digitalRead(MOTION_PIN);
  
  // Validate sensor readings
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_token"] = device_token;
  doc["location"] = device_location;
  doc["timestamp"] = getTimestamp();
  doc["temperature"] = round(temperature * 100) / 100.0;
  doc["humidity"] = round(humidity * 100) / 100.0;
  doc["soil_moisture"] = soilMoisture;
  doc["ph"] = round(ph * 100) / 100.0;
  doc["nitrogen"] = nitrogen;
  doc["phosphorus"] = phosphorus;
  doc["potassium"] = potassium;
  doc["motion"] = motion;
  doc["battery_level"] = getBatteryLevel();
  doc["signal_strength"] = WiFi.RSSI();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Print sensor data to Serial
  Serial.println("Sensor Data:");
  Serial.println(jsonString);
  
  // Send to primary endpoint
  if (!sendData(primary_endpoint, jsonString)) {
    Serial.println("Primary endpoint failed. Trying fallback...");
    sendData(fallback_endpoint, jsonString);
  }
}

bool sendData(const char* endpoint, String payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return false;
  }
  
  WiFiClientSecure client;
  client.setCACert(root_ca);
  
  HTTPClient http;
  http.begin(client, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", device_token);
  http.addHeader("User-Agent", "ESP32-AgriAssist/1.0");
  
  Serial.println("Sending to: " + String(endpoint));
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.println("Data sent successfully!");
      http.end();
      return true;
    }
  } else {
    Serial.println("Error in HTTP request: " + String(httpResponseCode));
  }
  
  http.end();
  return false;
}

String getTimestamp() {
  // Simple timestamp - in production, use NTP
  return String(millis());
}

float getBatteryLevel() {
  // Read battery voltage - adjust for your setup
  int rawValue = analogRead(A5);
  float voltage = (rawValue / 4095.0) * 3.3 * 2; // Assuming voltage divider
  return map(voltage * 100, 300, 420, 0, 100); // Map to percentage
}

float mapFloat(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
