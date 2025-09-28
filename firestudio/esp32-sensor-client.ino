/*
ESP32 Arduino sketch to send sensor data to your Firebase Realtime Database
Install required libraries:
- ArduinoJson
- WiFi
- HTTPClient

Connect your sensors:
- pH sensor to analog pin
- Soil moisture sensor to analog pin
- NPK sensor (if available) or use analog readings
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Your API endpoint
const char* serverURL = "http://YOUR_SERVER_IP:3000/api/sensor-realtime";

// Sensor pins
#define SOIL_MOISTURE_PIN A0
#define PH_SENSOR_PIN A1
// For NPK, you might need a specific sensor module

void setup() {
  Serial.begin(115200);
  
  // Initialize WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read sensor values
    float nitrogen = readNitrogen();
    float phosphorus = readPhosphorus();
    float potassium = readPotassium();
    float pH = readPH();
    float soilMoisture = readSoilMoisture();
    
    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["Nitrogen"] = nitrogen;
    doc["Phosphorus"] = phosphorus;
    doc["Potassium"] = potassium;
    doc["pH"] = pH;
    doc["soilMoisture"] = soilMoisture;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send to server
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Data sent successfully!");
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error sending data: " + String(httpResponseCode));
    }
    
    http.end();
    
    // Print sensor values to Serial Monitor
    Serial.println("=== Sensor Readings ===");
    Serial.println("Nitrogen: " + String(nitrogen) + " mg/kg");
    Serial.println("Phosphorus: " + String(phosphorus) + " mg/kg");
    Serial.println("Potassium: " + String(potassium) + " mg/kg");
    Serial.println("pH: " + String(pH));
    Serial.println("Soil Moisture: " + String(soilMoisture) + "%");
    Serial.println("=======================");
  }
  
  // Wait 30 seconds before next reading
  delay(30000);
}

// Sensor reading functions - implement based on your actual sensors
float readNitrogen() {
  // Implement your nitrogen sensor reading
  // This is a placeholder - replace with actual sensor code
  return random(50, 150); // Simulated value
}

float readPhosphorus() {
  // Implement your phosphorus sensor reading
  return random(20, 80); // Simulated value
}

float readPotassium() {
  // Implement your potassium sensor reading
  return random(100, 300); // Simulated value
}

float readPH() {
  // Read pH sensor
  int sensorValue = analogRead(PH_SENSOR_PIN);
  float voltage = sensorValue * (3.3 / 4095.0); // ESP32 ADC conversion
  float pH = 7.0 + ((voltage - 1.65) / 0.18); // Calibrate based on your sensor
  return constrain(pH, 0, 14);
}

float readSoilMoisture() {
  // Read soil moisture sensor
  int sensorValue = analogRead(SOIL_MOISTURE_PIN);
  float moisture = map(sensorValue, 0, 4095, 0, 100); // Convert to percentage
  return constrain(moisture, 0, 100);
}
