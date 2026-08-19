# Deployment Guide

This guide covers deploying the Kendra & Diego Wedding PWA to production.

## Option A: Cloudflare Pages (Recommended)

### 1. Push to GitHub

The repo is already on GitHub at `oneal-chase/kendra-diego-wedding`.

### 2. Connect to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** > **Create** > **Pages** > **Connect to Git**
3. Select the `kendra-diego-wedding` repository
4. Configure the build:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `22` (in Environment Variables)

### 3. Set Environment Variables

In the Cloudflare Pages project settings, go to **Settings** > **Environment variables** and add:

| Variable | Value |
|----------|-------|
| `VITE_GAS_WEBHOOK_URL` | `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` |

### 4. Deploy

Click **Save and Deploy**. Cloudflare will build and deploy automatically.

Your site will be live at: `https://kendra-diego-wedding.pages.dev`

---

## Option B: Vercel

### 1. Connect to Vercel

1. Log in to [vercel.com](https://vercel.com)
2. Click **Add New** > **Project**
3. Import the `kendra-diego-wedding` repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2. Set Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_GAS_WEBHOOK_URL` | `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` |

### 3. Deploy

Click **Deploy**. Vercel will build and deploy.

Your site will be live at: `https://kendra-diego-wedding.vercel.app`

---

## Custom Domain

### Cloudflare Pages

1. Go to your Pages project > **Custom domains**
2. Add your domain (e.g., `kendraanddiego.me`)
3. If the domain is on Cloudflare DNS, it auto-configures
4. If not on Cloudflare, update your DNS:
   - Type: `CNAME`
   - Name: `@` (or subdomain like `www`)
   - Target: `kendra-diego-wedding.pages.dev`
   - Proxy status: **Proxied** (orange cloud)

### Vercel

1. Go to your project > **Settings** > **Domains**
2. Add `kendraanddiego.me`
3. Vercel provides DNS records to configure at your registrar

---

## Post-Deployment Checklist

- [ ] Open the live URL on your phone
- [ ] Grant camera permission — verify viewfinder works
- [ ] Take a test photo — verify Polaroid frame renders
- [ ] Tap "Add Voice Toast" — verify recording starts
- [ ] Complete upload — verify HUD shows "All photos synced"
- [ ] Check Google Drive — verify photo appears in correct phase folder
- [ ] Check Google Sheet — verify metadata row appended
- [ ] Open `/live` on another device — verify photo appears in slideshow
- [ ] Test offline: enable Airplane Mode, take photo, disable — verify it syncs
- [ ] Open `/qr` — generate and download a table card

## PWA Install

Guests can install the app to their home screen:

### iOS Safari
1. Open the site in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Tap **Add**

### Android Chrome
1. Open the site in Chrome
2. Tap the **Install** prompt (or tap the three-dot menu > **Install app**)
3. Confirm installation

Once installed, the app opens full-screen with no browser chrome — perfect for the wedding day.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GAS_WEBHOOK_URL` | Yes | Google Apps Script deployment URL for photo uploads and feed polling |

## Build Output

```
dist/
├── index.html
├── manifest.json
├── favicon.svg
├── icon-192.png
├── icon-512.png
└── assets/
    ├── index-[hash].css    (~6 KB gzipped)
    └── index-[hash].js     (~93 KB gzipped)
```

Total bundle: ~100 KB gzipped. Loads fast on 3G connections.
