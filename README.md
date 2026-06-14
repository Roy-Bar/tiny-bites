# 🍼 Tiny Bites — Baby Feeding & Sleep Tracker

A warm, friendly React app for tracking a newborn's **feedings and sleep** in real time. Sign in, set up a baby profile, and log feeds and naps from your phone or desktop — everything syncs live across devices.

🌐 **Live app:** https://tiny-bites-57104.web.app

---

## Features

| Feature | Description |
|---|---|
| **Auth** | Email/password sign up & sign in |
| **Baby Profile** | Name, birth date, oz/ml preference |
| **Log Feeding** | Type (breast L/R/both, formula, pumped bottle), amount, duration timer, time, notes |
| **Sleep Tracker** | One-tap **Start Sleep / Wake Up** with a live timer; the active session is stored in Firestore, so it survives reloads and syncs across devices |
| **Log Sleep** | Manually log or edit a past sleep (fell-asleep + woke-up times); leave the wake time empty for an ongoing sleep |
| **Sleep page** | Today's total sleep & nap count, live status, 7/30-day hours-slept chart, history grouped by day |
| **Dashboard** | Stats bar, today's timeline, 7-day feeding chart, recent feedings, and the sleep widget |
| **History** | All feedings, grouped by day, filter by type, search notes |
| **Edit / Delete** | Tap the pencil or trash on any feeding or sleep card |
| **Export** | Download CSV or copy JSON for a date range |
| **Live counters** | "Last fed" and "asleep for…" timers update on the dashboard |
| **Mobile-first** | Bottom nav on mobile, sidebar on desktop |

---

## Stack

- **React 18 + Vite** — fast frontend build
- **Firebase** — Auth (email/password) + Firestore (real-time DB) + Hosting
- **Tailwind CSS** — warm peach / lavender / cream design system
- **React Router v6** — client-side routing
- **React Hook Form** — feeding & sleep log forms
- **Recharts** — feeding & sleep bar charts
- **date-fns** — date formatting and math

---

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in your Firebase config
npm run dev                  # http://localhost:5173
```

Full setup (Firebase project, environment variables, deployment) is documented in **[SETUP.md](SETUP.md)**.

---

## Data Model

All data lives under `users/{uid}/` in Firestore:

- `babies/{babyId}` — profile (name, birth date, unit preference)
- `feedings/{feedingId}` — `{ babyId, startTime, items[], amount, durationSeconds, notes }`
- `sleeps/{sleepId}` — `{ babyId, startTime, endTime }` — `endTime: null` marks the currently-asleep session

Security rules (`firestore.rules`) restrict every user to their own data. Composite indexes for the `feedings` and `sleeps` queries are defined in `firestore.indexes.json`.

---

## Deploy

```bash
npm run deploy   # build + deploy Firestore rules, indexes, and hosting
```

See **[SETUP.md](SETUP.md#deploy-to-firebase-hosting)** for first-time Firebase CLI setup.

---

© Roy &amp; Miri Bar 2026
