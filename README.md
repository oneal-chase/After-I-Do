# Kendra & Diego Wedding PWA

A zero-cost, offline-first progressive web app that lets wedding guests capture Polaroid-style photos and leave voice guestbook messages — all syncing live to a reception projection wall.

## Features

- **Polaroid Camera** — WebRTC viewfinder with client-side frame stamping (KD monogram, gold border, phase badge)
- **Voice Guestbook** — Web Speech API real-time transcription + MediaRecorder audio capture (no API keys needed)
- **Offline Queue** — IndexedDB-backed upload engine with exponential backoff retry; zero lost photos
- **Live Reception Wall** — Ken Burns slideshow with calligraphy voice toast overlay, 10-second polling
- **QR Table Cards** — 300 DPI printable generator matching the floral invitation suite
- **Auto Phase Sorting** — Photos organize into Drive folders by ceremony timeline (Pre-Ceremony, Ceremony, Cocktail Hour, Reception)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| Build | Vite 8 |
| Offline Storage | idb-keyval (IndexedDB) |
| Icons | lucide-react |
| QR Generation | qrcode |
| Backend | Google Apps Script (free serverless) |
| Storage | Google Drive + Google Sheets |
| Hosting | Cloudflare Pages / Vercel (free tier) |

## Architecture

```
[ Guest Phone (PWA) ]
        │
   ┌────┴────┐
   ▼         ▼
[ Camera ] [ Voice ]
   │         │
   ▼         ▼
[ Polaroid Stamp ] [ Transcript ]
   └────┬────┘
        ▼
[ IndexedDB Queue ]
        │  (Base64 JSON)
        ▼
[ Google Apps Script ]
        │
   ┌────┴────┐
   ▼         ▼
[ Drive ] [ Sheets ]
   │
   ▼
[ /live Wall ]
```

## Quick Start

```bash
git clone https://github.com/oneal-chase/kendra-diego-wedding.git
cd kendra-diego-wedding
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` on your phone (same network) to test the camera.

## Configuration

### Environment Variables

Create a `.env` file (already gitignored):

```
VITE_GAS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

See [docs/BACKEND_SETUP.md](docs/BACKEND_SETUP.md) for full backend setup.

### Wedding Timeline

Edit `src/config/wedding.config.ts` to customize:

```typescript
export const WEDDING_CONFIG = {
  coupleNames: "Kendra & Diego",
  weddingDate: "2026-09-11",
  venue: "The Starlight Garden • Spring, TX",
  timezone: "America/Chicago",
  timeline: [
    { id: "pre-ceremony",  folderName: "00_Pre_Ceremony",   start: "00:00", end: "17:00" },
    { id: "ceremony",      folderName: "01_Ceremony",       start: "17:00", end: "18:00" },
    { id: "cocktail-hour", folderName: "02_Cocktail_Hour",  start: "18:00", end: "19:30" },
    { id: "reception",     folderName: "03_Reception_Party", start: "19:30", end: "23:59" },
  ],
};
```

Photos are automatically sorted into matching Google Drive subfolders based on the current time.

## Project Structure

```
src/
├── config/
│   └── wedding.config.ts        # Timeline, venue, GAS endpoint
├── utils/
│   ├── frameProcessor.ts        # Canvas Polaroid frame stamping
│   ├── syncEngine.ts            # IndexedDB offline queue + retry
│   └── audioGuestbook.ts        # MediaRecorder + Web Speech API
├── hooks/
│   └── usePhotoSync.ts          # Upload hook (frame + queue)
├── components/
│   ├── CameraViewfinder.tsx     # Fullscreen WebRTC camera
│   ├── AudioGuestbook.tsx       # Voice recorder + transcript
│   └── SyncHUD.tsx             # Floating sync status widget
├── pages/
│   ├── HomePage.tsx             # Landing with phase badge
│   ├── CameraPage.tsx           # Capture → Voice → Upload flow
│   ├── LiveWall.tsx             # Projection slideshow
│   └── QRPage.tsx               # Printable QR card generator
├── speech.d.ts                  # Web Speech API types
├── index.css                    # Tailwind + animations
├── main.tsx                     # Entry point
└── App.tsx                      # Route definitions
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run oxlint |

## Routes

| Path | Page |
|------|------|
| `/` | Landing page — camera, live wall, QR links |
| `/camera` | Capture photo → optional voice toast → upload |
| `/live` | Reception projection wall with slideshow |
| `/qr` | Printable QR table card generator |

## Browser Support

| Feature | iOS Safari | Android Chrome | Desktop |
|---------|-----------|---------------|---------|
| Camera (WebRTC) | ✅ | ✅ | ✅ |
| Voice Recording | ✅ | ✅ | ✅ |
| Speech-to-Text | ✅ (14.3+) | ✅ | ✅ |
| Offline Queue | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | — |

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Cloudflare Pages / Vercel setup with custom domain.
