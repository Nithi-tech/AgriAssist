import requests
import json

# Simple test to verify Firebase Realtime Database connection
def test_firebase_connection():
    print("🧪 Testing Firebase Realtime Database Connection...")
    
    # Firebase configuration
    DATABASE_URL = "https://sensor-data-f9ac2-default-rtdb.firebaseio.com/"
    DATABASE_SECRET = "sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF"
    
    # Test data
    test_data = {
        "NPK": 75,
        "Nitrogen": 20,
        "Phosphorus": 12,
        "Potassium": 25,
        "pH": 6.5,
        "soilMoisture": 45,
        "timestamp": 1703123456789,
        "lastUpdated": "2023-12-21T10:30:56.789Z",
        "testMode": True
    }
    
    url = f"{DATABASE_URL}sensor.json?auth={DATABASE_SECRET}"
    
    try:
        # Write test data
        print("📤 Writing test data to Firebase...")
        response = requests.put(url, json=test_data)
        
        if response.status_code == 200:
            print("✅ Write successful!")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Write failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            return False
        
        # Read test data
        print("📥 Reading data from Firebase...")
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Read successful!")
            print(f"   Data: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Read failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Sensor Database Integration Test")
    print("=" * 50)
    
    # Test Firebase connection
    firebase_ok = test_firebase_connection()
    
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    print(f"   Firebase Connection: {'✅ PASS' if firebase_ok else '❌ FAIL'}")
    
    if firebase_ok:
        print("\n✅ Integration is working!")
        print("💡 Next Steps:")
        print("   1. Start your Next.js app: npm run dev")
        print("   2. Visit: http://localhost:3000/sensor-dashboard")
        print("   3. Firebase Console: https://console.firebase.google.com/project/sensor-data-f9ac2/database")
    else:
        print("\n❌ Integration test failed")
        print("💡 Check Firebase configuration and network connection")
