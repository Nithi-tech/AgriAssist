# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Environment variables ready

## Step-by-Step Deployment

### 1. Prepare Your Environment Variables
Before deploying, make sure you have all required environment variables. Check your `.env.local` file and prepare these values:

```bash
# Google AI API
GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here

# Weather API  
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Firebase Configuration (Main App)
NEXT_PUBLIC_FIREBASE_API_KEY=your_main_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Sensor Configuration (Separate Database)
NEXT_PUBLIC_FIREBASE_SENSOR_API_KEY=your_sensor_firebase_api_key
NEXT_PUBLIC_FIREBASE_SENSOR_AUTH_DOMAIN=your_sensor_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_SENSOR_DATABASE_URL=https://your_sensor_project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_SENSOR_PROJECT_ID=your_sensor_project_id
NEXT_PUBLIC_FIREBASE_SENSOR_STORAGE_BUCKET=your_sensor_project.appspot.com
NEXT_PUBLIC_FIREBASE_SENSOR_MESSAGING_SENDER_ID=987654321
NEXT_PUBLIC_FIREBASE_SENSOR_APP_ID=1:987654321:web:fedcba
```

### 2. Push to Git Repository
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. Deploy on Vercel

#### Option A: Using Vercel CLI (Recommended)
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from your project directory:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - Project name: `firestudio` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings? `N`

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 4. Configure Environment Variables
In your Vercel dashboard:
1. Go to your project settings
2. Click on "Environment Variables"
3. Add all the environment variables from step 1
4. Make sure to set the environment for "Production", "Preview", and "Development"

### 5. Configure Domain (Optional)
1. In project settings, go to "Domains"
2. Add your custom domain or use the provided vercel.app domain

### 6. Redeploy
After adding environment variables:
1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Important Notes

### Firebase Security Rules
Make sure your Firebase security rules allow public read access for sensor data:

```javascript
// Firebase Realtime Database Rules
{
  "rules": {
    "SensorData": {
      ".read": true,
      ".write": false
    }
  }
}
```

### API Rate Limits
- Google Gemini API: Check your quota limits
- OpenWeather API: Free tier has rate limits
- Firebase: Monitor usage in Firebase console

### Performance Optimization
- The project includes static optimization for faster loading
- Images are optimized automatically by Next.js
- API routes are serverless functions

## Troubleshooting

### Build Errors
If you encounter build errors:
1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript configuration

### Environment Variables Not Working
1. Ensure variables starting with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding new environment variables
3. Check variable names match exactly

### Firebase Connection Issues
1. Verify Firebase configuration in environment variables
2. Check Firebase security rules
3. Ensure Firebase project is active

## Success Checklist
- [ ] All environment variables configured
- [ ] Firebase projects are accessible
- [ ] Google Gemini API key is valid
- [ ] OpenWeather API key is working
- [ ] Build completes successfully
- [ ] Deployment shows "Ready"
- [ ] All pages load correctly
- [ ] Sensor data displays properly
- [ ] Disease diagnosis works
- [ ] Weather data loads
- [ ] Crop recommendations function
- [ ] Fertilizer shop displays data

## Post-Deployment
Your smart farming dashboard will be live at your Vercel URL with:
- ✅ Real-time sensor data from Firebase
- ✅ Weather information and chat
- ✅ Crop recommendations
- ✅ Disease diagnosis with AI
- ✅ Fertilizer shop directory
- ✅ Multi-language support
- ✅ Responsive design

Enjoy your deployed smart farming platform! 🌱
