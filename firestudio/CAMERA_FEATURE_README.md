# 📸 Camera Feature Documentation

## Overview
The Fire Studio camera feature provides a modern, cross-browser compatible solution for capturing plant images directly from the device camera for disease diagnosis.

## Features

### ✨ Modern UI Components
- **Full-screen camera modal** with gradient backgrounds and smooth animations
- **Live camera preview** with aspect ratio preservation
- **Professional capture interface** with circular capture button
- **Image preview with actions** (Retake/Use Photo)
- **Error handling with user-friendly messages**
- **Cross-platform responsive design**

### 🎛️ Camera Controls
- **Front/Back camera switching** (mobile devices)
- **High-quality capture** (1280x720 ideal resolution)
- **Auto-focus and exposure** handling
- **Proper stream cleanup** to prevent camera staying on

### 🌐 Browser Compatibility
- ✅ Chrome Desktop/Mobile
- ✅ Firefox Desktop/Mobile  
- ✅ Safari Desktop/Mobile
- ✅ Edge Desktop/Mobile

## Usage Instructions

### For Users
1. **Click "Open Camera"** button on the disease diagnosis page
2. **Allow camera permissions** when prompted by browser
3. **Position your plant** in the camera viewfinder
4. **Click the capture button** (circular camera icon)
5. **Review the captured image** in preview
6. **Choose "Retake"** to capture again or **"Use Photo"** to proceed
7. **The image is automatically processed** for disease diagnosis

### For Developers

#### Component Integration
```tsx
import { ModernCamera } from '@/components/ui/modern-camera';

function YourComponent() {
  const [showCamera, setShowCamera] = useState(false);
  
  const handleCapture = (imageDataUrl: string) => {
    // Process captured image
    console.log('Captured image:', imageDataUrl);
    setShowCamera(false);
  };
  
  return (
    <>
      <button onClick={() => setShowCamera(true)}>
        Open Camera
      </button>
      
      {showCamera && (
        <ModernCamera
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
```

## Technical Implementation

### Frontend Architecture
- **React Hooks**: `useRef`, `useState`, `useEffect`, `useCallback`
- **MediaStream API**: `navigator.mediaDevices.getUserMedia()`
- **Canvas API**: For image capture and processing
- **TailwindCSS**: For responsive styling and animations

### Camera Configuration
```javascript
const constraints = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    facingMode: 'environment', // Prefer back camera
  },
  audio: false
};
```

### Error Handling
The component handles various camera errors:
- **NotAllowedError**: Permission denied
- **NotFoundError**: No camera available
- **NotSupportedError**: Browser doesn't support camera
- **NotReadableError**: Camera in use by another app

## Backend Integration

### FastAPI Endpoint
```python
# backend/camera_api.py
@app.post("/api/upload")
async def upload_camera_image(file: UploadFile = File(...)):
    # Validate and save uploaded image
    # Return success response with file details
```

### Starting the Backend
```bash
cd backend
pip install -r requirements.txt
python camera_api.py
```

## Troubleshooting

### Common Issues

**Camera not opening:**
- Check browser permissions (camera icon in address bar)
- Ensure HTTPS (required for camera access)
- Close other apps using the camera
- Try refreshing the page

**Permission denied:**
- Click camera icon in browser address bar
- Select "Allow" for camera access
- Refresh the page and try again

**Poor image quality:**
- Ensure good lighting
- Clean camera lens
- Hold device steady while capturing

**Browser compatibility:**
- Update browser to latest version
- Enable camera permissions in browser settings
- Try incognito/private mode

### Mobile-Specific Tips
- **iOS Safari**: Requires HTTPS for camera access
- **Android Chrome**: Works with both HTTP (localhost) and HTTPS
- **Camera switching**: Use the camera switch button for front/back toggle

## File Structure
```
src/
├── components/
│   ├── ui/
│   │   └── modern-camera.tsx     # Main camera component
│   └── disease-diagnosis-form.tsx # Integration example
└── backend/
    ├── camera_api.py            # FastAPI upload endpoint
    └── requirements.txt         # Python dependencies
```

## Security Considerations
- Camera access requires user permission
- Images are processed locally before upload
- No automatic camera activation
- Proper stream cleanup prevents privacy issues

## Performance Optimization
- Lazy loading of camera component
- Efficient image compression (90% JPEG quality)
- Stream cleanup on component unmount
- Responsive image sizing based on device

## Future Enhancements
- [ ] Multiple camera selection
- [ ] Flash/torch control
- [ ] Image filters and effects
- [ ] Batch capture mode
- [ ] OCR text recognition
- [ ] Real-time AI analysis overlay

---

## Support
If you encounter any issues with the camera feature, please check:
1. Browser compatibility list above
2. Troubleshooting section
3. Console errors in browser dev tools
4. Camera permissions in browser settings
