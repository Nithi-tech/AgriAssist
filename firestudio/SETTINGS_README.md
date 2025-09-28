# AgriAssist Settings Implementation

This implementation adds a comprehensive Settings section to your AgriAssist project with multi-language support, contact forms, feedback forms, and email/SMS notifications.

## ✨ Features Implemented

### 1. Language Selection
- **13 Indian Languages**: English, Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Urdu
- **Persistent Storage**: Language preference saved to localStorage
- **Real-time Switching**: UI updates immediately when language is changed
- **Toast Notifications**: Success confirmation when language is updated
- **Firebase Ready**: Code ready to save preferences to Firestore when user authentication is implemented

### 2. About Section
- **Mission Statement**: Complete about page with feature descriptions
- **Responsive Design**: Works on all screen sizes
- **Accessible**: Proper ARIA labels and semantic HTML

### 3. Contact Us Form
- **Form Validation**: Client-side and server-side validation
- **Email Notifications**: Sends to admin email using SendGrid or SMTP
- **SMS Notifications**: Optional Twilio integration for instant notifications
- **Storage Fallback**: Saves to Firestore or local JSON files
- **Rate Limiting**: 5 requests per minute per IP
- **Success Feedback**: Shows confirmation with delivery status

### 4. Feedback Form
- **Anonymous Option**: Can submit without email
- **Opt-in Contact**: Optional checkbox to be contacted about feedback
- **Storage & Notifications**: Same robust system as contact form
- **Rate Limiting**: 3 feedback submissions per minute per IP

### 5. Robust Backend
- **Multiple Email Providers**: SendGrid (preferred) with SMTP fallback
- **SMS Integration**: Twilio for instant admin notifications
- **Storage Flexibility**: Firestore with file system fallback
- **Input Validation**: Server-side validation for security
- **Error Handling**: Graceful degradation when services are unavailable

## 📁 Files Added/Modified

### New Pages & Components
```
src/app/(app)/settings/page.jsx          # Main settings page
src/app/(app)/about/page.jsx             # Standalone about page
src/app/(app)/contact/page.jsx           # Standalone contact page
src/app/(app)/feedback/page.jsx          # Standalone feedback page
src/components/LanguageSelector.jsx      # Language selection component
src/components/AboutSection.jsx          # About content component
src/components/ContactForm.jsx           # Contact form component
src/components/FeedbackForm.jsx          # Feedback form component
```

### API Endpoints
```
src/app/api/contact/route.js             # Contact form handler
src/app/api/feedback/route.js            # Feedback form handler
```

### Utilities & Configuration
```
src/lib/i18n.js                          # i18next configuration
src/utils/email.js                       # Email sending utilities
src/utils/sms.js                         # SMS sending utilities
src/utils/storage.js                     # Storage utilities (Firestore/file)
```

### Translations
```
src/locales/en/common.json               # English translations
src/locales/hi/common.json               # Hindi translations
src/locales/[bn,te,mr,ta,gu,kn,ml,or,pa,as,ur]/common.json  # Other languages
```

### Data Storage
```
data/messages.json                       # Contact messages storage
data/feedback.json                       # Feedback storage
```

## 🚀 Setup Instructions

### 1. Dependencies Already Installed
The following packages were installed:
```bash
npm install react-i18next i18next @sendgrid/mail nodemailer twilio
```

### 2. Environment Configuration
Copy `.env.local.example` to `.env.local` and configure:

```bash
# Required - Admin email for notifications
ADMIN_EMAIL=nithivalavan6@gmail.com
NOTIFY_PHONE=+917449062509

# Email Provider (choose one)
# Option 1: SendGrid (Recommended)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# Option 2: SMTP Fallback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: SMS Notifications
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_NUMBER=+1234567890

# Optional: Firestore Storage
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 3. Service Setup

#### SendGrid Email Setup
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API Key in Settings > API Keys
3. Add key to `SENDGRID_API_KEY` in `.env.local`

#### Gmail SMTP Setup (Alternative)
1. Enable 2-factor authentication on Gmail
2. Generate an App Password: Account > Security > App passwords
3. Use your Gmail address for `SMTP_USER` and app password for `SMTP_PASS`

#### Twilio SMS Setup (Optional)
1. Sign up at [Twilio](https://twilio.com/)
2. Get Account SID, Auth Token, and phone number from dashboard
3. Add to environment variables

### 4. Run the Application
```bash
npm run dev
```

Visit `http://localhost:9002/settings` to access the settings page.

## 🧪 Testing

### Test Contact Form
```bash
# PowerShell
$headers = @{"Content-Type" = "application/json"}
$body = @{
    name="Test User"
    email="test@example.com" 
    message="This is a test message"
    language="en"
} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:9002/api/contact" -Method POST -Headers $headers -Body $body
```

### Test Feedback Form
```bash
# PowerShell
$headers = @{"Content-Type" = "application/json"}
$body = @{
    message="This is test feedback"
    contactEmail="test@example.com"
    optIn=$true
} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:9002/api/feedback" -Method POST -Headers $headers -Body $body
```

### Expected Response
```json
{
  "success": true,
  "message": "Message sent successfully",
  "details": {
    "saved": true,
    "emailSent": true,
    "smsSent": false,
    "smsConfigured": false
  }
}
```

## 🔧 Features & Fallbacks

### Graceful Degradation
- **No Email Provider**: Forms still save data, show appropriate message
- **No SMS Provider**: Email notifications still work
- **No Firestore**: Data saved to local JSON files
- **Network Issues**: User-friendly error messages

### Security Features
- Rate limiting on API endpoints
- Input validation and sanitization
- XSS protection
- No sensitive data exposure

### User Experience
- Form validation with inline errors
- Loading states during submission
- Success/error toast notifications
- Responsive design for all devices

## 📧 Email Templates

### Contact Notification
- Subject: "New Contact Message from AgriAssist - [Name]"
- Includes: Name, email, message, language, timestamp
- HTML formatted with proper styling

### Feedback Notification
- Subject: "New Feedback - AgriAssist"
- Includes: Feedback message, contact email (if provided), opt-in status
- HTML formatted with proper styling

## 🌐 Internationalization

### Language Support
- 13 Indian languages implemented
- Fallback to English for missing translations
- Real-time language switching
- Language preference persistence

### Adding New Languages
1. Create folder in `src/locales/[language-code]/`
2. Copy `common.json` from English folder
3. Translate all keys
4. Add language to `src/lib/i18n.js` languages array

## 🔍 Troubleshooting

### Common Issues

1. **"Module not found" errors**: Make sure all dependencies are installed
2. **API endpoints not working**: Check environment variables are set
3. **Email not sending**: Verify SendGrid API key or SMTP credentials
4. **SMS not working**: Confirm Twilio configuration
5. **Language not persisting**: Check localStorage in browser dev tools

### Development Tips

1. Use browser dev tools to inspect localStorage for language preferences
2. Check `data/` folder for saved messages/feedback
3. Monitor console for detailed error messages
4. Test with different language selections
5. Verify email delivery in SendGrid dashboard

## 📊 Monitoring & Analytics

### Data Storage
- Messages stored with timestamps and language info
- Feedback tracked with opt-in preferences
- All data includes unique IDs for tracking

### Admin Features (Future)
The storage system is ready for admin dashboards:
- View all contact messages
- Review feedback submissions
- Export data for analysis
- Respond to user inquiries

## 🔄 Git Commit Message
```
feat(settings): add language, about, contact, feedback with email/sms and storage fallback

- Add 13 Indian language support with i18next
- Implement contact form with email/SMS notifications
- Add feedback system with opt-in contact preferences
- Create robust storage with Firestore/file fallback
- Add rate limiting and input validation
- Include comprehensive error handling and user feedback
```

## 🎯 Next Steps

1. **Firebase Integration**: Connect user authentication to save language preferences to Firestore
2. **Admin Dashboard**: Create admin interface to view messages and feedback
3. **Analytics**: Add tracking for form submissions and language usage
4. **CAPTCHA**: Add Google reCAPTCHA for additional security
5. **Email Templates**: Customize HTML templates for better branding
6. **Push Notifications**: Add browser push notifications for admin alerts
