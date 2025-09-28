# Firebase Realtime Sensor Database Integration

This implementation provides a **completely separate** Firebase Realtime Database integration for sensor data monitoring, designed to work alongside your existing project without any interference.

## 🔥 Database Configuration

### Firebase Project Details
- **Project ID**: `sensor-data-f9ac2`
- **Database URL**: `https://sensor-data-f9ac2-default-rtdb.firebaseio.com/`
- **API Key**: `AIzaSyDA3p5sH-HxjwlPNQoscdQNmQv-N3AGYOI`
- **Database Secret**: `sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF`

### Data Structure
```json
{
  "sensor": {
    "NPK": 80,
    "Nitrogen": 25,
    "Phosphorus": 15,
    "Potassium": 30,
    "pH": 6.8,
    "soilMoisture": 65,
    "timestamp": 1703123456789,
    "lastUpdated": "2023-12-21T10:30:56.789Z"
  }
}
```

## 🚀 Quick Start

### 1. Environment Setup

The environment variables have been added to your `.env.local` file:

```bash
# Sensor Firebase Configuration (Separate Instance)
NEXT_PUBLIC_SENSOR_FIREBASE_API_KEY=AIzaSyDA3p5sH-HxjwlPNQoscdQNmQv-N3AGYOI
NEXT_PUBLIC_SENSOR_FIREBASE_PROJECT_ID=sensor-data-f9ac2
NEXT_PUBLIC_SENSOR_FIREBASE_DATABASE_URL=https://sensor-data-f9ac2-default-rtdb.firebaseio.com/
SENSOR_FIREBASE_DATABASE_SECRET=sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF
SENSOR_UPDATE_FREQUENCY=5
```

### 2. Frontend Integration

#### View the Dashboard
Navigate to `/sensor-dashboard` in your Next.js app to see the real-time sensor data display.

#### Use in Components
```typescript
import { sensorDBService, SensorData } from '@/lib/sensorDatabaseService';

// Subscribe to real-time updates
const unsubscribe = sensorDBService.subscribeToSensorData((data: SensorData | null) => {
  console.log('Sensor data updated:', data);
});

// Manual updates
await sensorDBService.updateAllSensorValues({
  NPK: 80,
  Nitrogen: 25,
  Phosphorus: 15,
  Potassium: 30,
  pH: 6.8,
  soilMoisture: 65
});
```

## 🖥️ Backend Services

### Option 1: Node.js Backend

#### Installation
```bash
cd firestudio
node sensorBackend.js
```

#### Features
- Automatic sensor data simulation every 5 seconds
- HTTP API on port 3001
- Manual update endpoints

#### API Endpoints
- `GET /health` - Health check
- `POST /update` - Trigger manual update
- `POST /sensor-data` - Upload custom sensor data

### Option 2: FastAPI Backend (Recommended)

#### Installation
```bash
cd firestudio
pip install -r requirements.txt
python sensorBackendAPI.py
```

#### Features
- Advanced Python FastAPI with auto-documentation
- Automatic sensor simulation with start/stop controls
- Type validation with Pydantic
- ESP32 dedicated endpoint
- Interactive API documentation at `http://localhost:8000/docs`

#### API Endpoints
- `GET /` - Service information
- `GET /health` - Health check
- `POST /update` - Manual sensor data update
- `POST /sensor-data` - Upload custom data
- `POST /esp32/data` - Dedicated ESP32 endpoint
- `POST /simulation/start` - Start auto-simulation
- `POST /simulation/stop` - Stop auto-simulation
- `GET /simulation/status` - Get simulation status

## 🔧 ESP32 Integration

### Hardware Setup
```arduino
// Copy the code from esp32/esp32_sensor_firebase.ino
// Update WiFi credentials and sensor pins as needed

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Sensor pins
const int SOIL_MOISTURE_PIN = A0;
const int PH_SENSOR_PIN = A1;
```

### Data Upload
The ESP32 code automatically:
- Reads sensor values every 5 seconds
- Uploads data directly to Firebase Realtime Database
- Handles WiFi reconnection
- Provides serial output for debugging

### Required Libraries
```arduino
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
```

## 📊 Frontend Components

### SensorDashboard Component
```typescript
import SensorDashboard from '@/components/SensorDashboard';

<SensorDashboard 
  refreshInterval={5}      // Update frequency in seconds
  showMockControls={true}  // Show development controls
/>
```

### Features
- Real-time data display with automatic updates
- Visual status indicators (Good/Warning/Critical)
- Health monitoring and alerts
- Mock data simulation for development
- Responsive card-based layout

## 🔒 Security Configuration

### Current Status (Development)
The database is currently configured for public access to facilitate development and testing.

### Production Security Rules
For production deployment, update Firebase Realtime Database rules:

```json
{
  "rules": {
    "sensor": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### Additional Security Measures
1. **API Key Rotation**: Regularly rotate your Firebase API keys
2. **Database Secret**: Keep the database secret secure and rotate periodically
3. **Network Security**: Use HTTPS for all communications
4. **Authentication**: Implement proper user authentication for data access

## 🧪 Testing and Development

### Manual Testing
1. Visit `http://localhost:3000/sensor-dashboard`
2. Use "Update Once" button to trigger single updates
3. Use "Start Auto-Update" for continuous simulation
4. Monitor real-time changes in the dashboard

### Backend Testing
```bash
# Test Node.js backend
curl http://localhost:3001/health

# Test FastAPI backend
curl http://localhost:8000/health

# Manual data update
curl -X POST http://localhost:8000/update

# Upload custom data
curl -X POST http://localhost:8000/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"NPK": 100, "Nitrogen": 30, "Phosphorus": 20, "Potassium": 40, "pH": 7.0, "soilMoisture": 75}'
```

### Firebase Console
Monitor real-time data at:
https://console.firebase.google.com/project/sensor-data-f9ac2/database

## 📝 File Structure

```
firestudio/
├── src/
│   ├── lib/
│   │   ├── sensorFirebase.ts           # Firebase configuration
│   │   └── sensorDatabaseService.ts    # Service layer
│   ├── components/
│   │   └── SensorDashboard.tsx         # React dashboard
│   └── app/
│       └── sensor-dashboard/
│           └── page.tsx                # Dashboard page
├── sensorBackend.js                    # Node.js backend
├── sensorBackendAPI.py                 # FastAPI backend
├── requirements.txt                    # Python dependencies
└── esp32/
    └── esp32_sensor_firebase.ino       # Arduino code
```

## 🔧 Configuration Options

### Update Frequency
Configure sensor update frequency via environment variable:
```bash
SENSOR_UPDATE_FREQUENCY=10  # Update every 10 seconds
```

### Custom Sensor Thresholds
Modify thresholds in `sensorDatabaseService.ts`:
```typescript
getSensorDataHealth(data: SensorData | null): {
  // Customize warning/critical thresholds here
  if (data.pH < 6.0 || data.pH > 8.0) {
    // pH threshold logic
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify environment variables are set correctly
   - Check Firebase project ID and database URL
   - Ensure database secret is correct

2. **No Data Showing**
   - Check browser console for errors
   - Verify Firebase configuration
   - Test backend endpoints manually

3. **ESP32 Upload Fails**
   - Check WiFi connection
   - Verify Firebase database URL and secret
   - Monitor serial output for errors

### Debug Mode
Enable debug logging by checking browser console for detailed Firebase connection information.

## 📞 Support

### Resources
- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [ESP32 Arduino Documentation](https://docs.espressif.com/projects/arduino-esp32/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### Database Access
- **Firebase Console**: https://console.firebase.google.com/project/sensor-data-f9ac2
- **Direct Database URL**: https://sensor-data-f9ac2-default-rtdb.firebaseio.com/sensor.json

## ✅ Integration Complete

This sensor database integration is completely isolated and will not interfere with any existing Firebase instances or databases in your project. The separate Firebase app instance ensures zero conflicts while providing full real-time sensor monitoring capabilities.
