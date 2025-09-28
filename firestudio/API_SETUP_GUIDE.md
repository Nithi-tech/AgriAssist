# 🔧 API Setup Guide - Fix Loading Issues

## 🚨 Problem Identified

Your features are showing "loading..." and not working because **API keys are missing** from your environment configuration. This is the root cause of the loading issues.

## 🛠️ Solution Steps

### Step 1: Get Required API Keys

#### 🤖 Google AI (Gemini) API Key - **CRITICAL**
- **Purpose**: Powers crop recommendations and disease diagnosis AI
- **Get it**: Visit [Google AI Studio](https://ai.google.dev/)
- **Steps**:
  1. Sign in with Google account
  2. Click "Get API Key"
  3. Create new API key
  4. Copy the key

#### 🌤️ WeatherAPI Key - **CRITICAL**
- **Purpose**: Powers weather features and weather chat
- **Get it**: Visit [WeatherAPI.com](https://www.weatherapi.com/)
- **Steps**:
  1. Sign up for free account
  2. Go to dashboard
  3. Copy your API key

#### ☁️ Google Cloud API Keys - **OPTIONAL**
- **Purpose**: Voice features and translation
- **Get it**: Visit [Google Cloud Console](https://console.cloud.google.com/)
- **Steps**:
  1. Create project or select existing one
  2. Enable Text-to-Speech API
  3. Enable Translation API
  4. Create credentials → API Key

### Step 2: Configure Environment Variables

1. **Open** the `.env.local` file in your project root
2. **Replace** these placeholders with your actual API keys:

```bash
# Replace with your actual keys:
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
GEMINI_API_KEY=your_google_ai_api_key_here  # Same as above
WEATHERAPI_KEY=your_weatherapi_key_here

# Optional (for voice features):
NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
```

### Step 3: Restart Development Server

After adding your API keys:

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🔧 Feature Status After Setup

| Feature | API Required | Status |
|---------|-------------|--------|
| Crop Recommendations | Google AI ✅ | Will work after setup |
| Disease Diagnosis | Google AI ✅ | Will work after setup |
| Weather Data | WeatherAPI ✅ | Will work after setup |
| Weather Chat | Google AI + WeatherAPI ✅ | Will work after setup |
| Voice Features | Google Cloud (optional) | Enhanced experience |
| Translation | Google Cloud (optional) | Enhanced experience |

## 🚀 Immediate Testing

After setup, test these features:

1. **Crop Recommendation**: Add location and soil type → Submit
2. **Disease Diagnosis**: Upload plant image → Analyze
3. **Weather**: Enter city name → Get forecast
4. **Chat**: Ask weather questions

## 💡 Common Issues & Solutions

### Issue: "API key not configured" errors
**Solution**: Double-check your `.env.local` file has the correct variable names

### Issue: Still showing loading after API key setup
**Solution**: Restart your development server completely

### Issue: Features work but no voice/translation
**Solution**: Google Cloud API keys are optional - main features will work without them

## 🔐 Security Notes

- ✅ Never commit `.env.local` to version control
- ✅ Use different API keys for development and production
- ✅ Monitor API usage to avoid unexpected charges
- ✅ Keep your API keys secure and don't share them

## 📞 Support

If you continue to experience issues after following this guide:

1. Check browser console for error messages
2. Verify API keys are correctly formatted
3. Ensure no extra spaces or quotes around keys
4. Test individual API endpoints to confirm keys work

---

**Your app will be fully functional once API keys are configured!** 🎉
