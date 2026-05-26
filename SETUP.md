# Tiny Bites — Baby Feeding Tracker

A warm, friendly React app for tracking newborn feedings. Multiple users can log in, set up a baby profile, and track feedings in real time.

---

## Stack

- **React 18 + Vite** — fast frontend build
- **Firebase** — Auth (email/password) + Firestore (real-time DB) + Hosting (deploy)
- **Tailwind CSS** — warm peach/lavender/cream design system
- **React Router v6** — client-side routing
- **React Hook Form** — feeding log form
- **Recharts** — 7-day feeding bar chart
- **date-fns** — date formatting and math

---

## Quick Start

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project**, give it a name (e.g. `tiny-bites`)
3. In the project, go to **Authentication → Sign-in method** → enable **Email/Password**
4. Go to **Firestore Database → Create database** → choose **Production mode**
5. Go to **Project Settings → Your Apps → Add App → Web**
6. Copy the config values

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Firebase config values:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## Deploy to Firebase Hosting

### One-time setup

```bash
npm install -g firebase-tools
firebase login
firebase init
```

When `firebase init` asks:
- Select **Firestore** and **Hosting**
- Public directory: `dist`
- Single-page app rewrite: **Yes**
- GitHub auto-deploy: optional

### Deploy

```bash
npm run deploy
```

This runs `npm run build` then deploys rules, indexes, and the hosting bundle. Your app will be live at `https://<project-id>.web.app`.

---

## Firestore Security Rules

Rules are in `firestore.rules`. Each user can only read/write their own data under `users/{userId}/**`.

---

## Features

| Feature | Description |
|---|---|
| Auth | Email/password sign up & sign in |
| Baby Profile | Name, birth date, oz/ml preference |
| Log Feeding | Type (breast L/R/both, formula, pumped bottle), amount, duration timer, time, notes |
| Dashboard | Stats bar, today's timeline, 7-day chart, recent feedings |
| History | All feedings, grouped by day, filter by type, search notes |
| Edit / Delete | Tap pencil or trash on any feeding card |
| Export | Download CSV or copy JSON for a date range |
| Live "last fed" counter | Updates every 30 seconds on dashboard |
| Mobile-first | Bottom nav on mobile, sidebar on desktop |
