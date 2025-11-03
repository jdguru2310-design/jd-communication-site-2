JD Communication Services - Full Site (EmailJS + Firebase)

Files:
- index.html
- style.css
- script.js
- assets/logo-placeholder.png

Quick setup:
1) EmailJS
   - Sign up at https://www.emailjs.com
   - Create an email service and an email template.
   - From the EmailJS dashboard copy: PUBLIC KEY, SERVICE ID, TEMPLATE ID.
   - Replace placeholders in script.js:
       EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID
   - Template should accept fields used in script (fullname, email, phone, message, to_email, request_id, etc.)

2) Firebase (optional but recommended)
   - Create a Firebase project at https://console.firebase.google.com
   - In project settings copy the Web SDK config (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
   - Replace FIREBASE_CONFIG object in script.js
   - In Firebase console enable Firestore and Storage (rules set appropriately during testing)

3) Upload & host
   - Upload all files to GitHub Pages, Netlify, or simply open index.html locally.
   - For file uploads to work, you must host and use a correct Firebase storage bucket.

Security note:
- Do NOT commit real API keys to public repositories. Use environment variables or server-side proxies for production.

Contact:
- All form submissions are configured to be sent to: jdguru2310@gmail.com

Generated on: 2025-11-03T07:04:49.085891 UTC
