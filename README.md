# HuntFit — Free Deployment Guide

## Total Cost: €0

Everything used here is 100% free:
- **Google Gemini API** — free tier, 15 requests/minute
- **Vercel hosting** — free hobby plan
- **GitHub** — free account

---

## What You Need
1. A **Google account** (you probably already have one)
2. A **GitHub account** → https://github.com/signup
3. A **Vercel account** → https://vercel.com/signup (sign up with GitHub)

---

## Step-by-Step

### Step 1: Get your free Gemini API key (2 minutes)

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API key"**
4. Select any project (or create a new one)
5. Copy the key — it looks like `AIzaSy...`
6. Done! No credit card needed, no payment.

### Step 2: Upload to GitHub (3 minutes)

1. Go to https://github.com and log in
2. Click the **+** button (top right) → **New repository**
3. Name it `huntfit` → click **Create repository**
4. On the next page, click **"uploading an existing file"**
5. Unzip the `huntfit-app.zip` file on your computer
6. Drag and drop ALL files and folders into GitHub:
   ```
   huntfit-free/
   ├── package.json
   ├── next.config.js
   └── app/
       ├── layout.jsx
       ├── page.jsx
       └── api/
           └── chat/
               └── route.js
   ```
7. IMPORTANT: Keep the folder structure! The `app` folder must be at the root.
8. Click **Commit changes**

### Step 3: Deploy on Vercel (2 minutes)

1. Go to https://vercel.com/new
2. Find your `huntfit` repo → click **Import**
3. Leave all settings as default
4. Expand **Environment Variables** and add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** paste your `AIzaSy...` key
5. Click **Deploy**
6. Wait ~60 seconds

### Step 4: Use your app!

- Vercel gives you a URL like `huntfit-xxxx.vercel.app`
- Open it on your phone or computer
- Share the link with anyone

### Bonus: Make it feel like a phone app

On your phone:
- **iPhone**: Open the URL in Safari → tap Share → "Add to Home Screen"
- **Android**: Open in Chrome → tap the menu (⋮) → "Add to Home Screen"

Now it has its own icon and opens fullscreen like a real app!

---

## Free Tier Limits

The Gemini free tier gives you:
- 15 requests per minute
- 1,500 requests per day
- That's more than enough for personal use

If you hit limits, just wait a minute and try again.

---

## Troubleshooting

**"API key not configured" error?**
→ Check that you added `GEMINI_API_KEY` (not `GOOGLE_API_KEY`) in Vercel environment variables.

**Blank screen?**
→ Make sure the `app` folder is at the root of your GitHub repo, not nested inside another folder.

**No results showing?**
→ The AI might not format results perfectly every time. Try rephrasing your search.
