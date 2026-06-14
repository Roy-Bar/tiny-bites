# Plan: Notify users about updates & new features

**Status:** Option A built (in-app banner). Option B (email) deferred.
**Goal:** A simple way to let existing users know when we ship an update or new feature.
**Scope guard:** Keep it minimal. This is *announcements*, not a full marketing/newsletter system.

---

## What we already have

- Firebase email/password auth ([src/firebase/auth.js](../src/firebase/auth.js)).
- On sign-up, each user's email is stored in a `users` Firestore collection
  as `{ email, displayName, createdAt }`, keyed by `uid`.
- So we already have a queryable list of every user's email. No new data collection needed.

## What we don't have

- Any way to *send* email.
- Any marketing-consent field or unsubscribe handling.

---

## Recommended approach (simplest first)

### Option A — In-app announcement banner (no email at all) ✅ DONE
The simplest possible thing. No email infra, no consent/compliance concerns.

**Implemented:**
- `announcements` Firestore collection: `{ title, body, publishedAt, active }`.
  Authored manually in the Firebase console; set `active: false` to retire one.
- [src/firebase/firestore.js](../src/firebase/firestore.js) — `getLatestAnnouncement()`
  reads the newest active doc (orders by `publishedAt`, filters active client-side
  so no composite index is needed).
- [src/hooks/useAnnouncement.js](../src/hooks/useAnnouncement.js) — loads it and
  tracks dismissals in `localStorage` (`tinybites:dismissedAnnouncements`).
- [src/components/ui/AnnouncementBanner.jsx](../src/components/ui/AnnouncementBanner.jsx)
  — dismissible lavender banner, rendered in
  [AppShell](../src/components/layout/AppShell.jsx) above page content.
- [firestore.rules](../firestore.rules) — signed-in users can read `announcements`;
  writes stay denied (console authoring bypasses rules).

**To publish an announcement:** in the Firebase console, add a doc to the
`announcements` collection with `title`, `body`, `publishedAt` (timestamp = now),
and `active: true`. Deploy updated rules with `npm run deploy` (first time only).

**Pros:** zero email setup, zero compliance risk, fully in our control.
**Cons:** only reaches users who open the app; "seen" is per-browser (localStorage).

### Option B — Email announcements (when we want to reach inactive users)
Layer this on later if Option A isn't enough.

- **Consent first:** the stored email was collected for account creation, not marketing.
  Add an `updatesOptIn` boolean to each `users` doc + a toggle in the profile/settings UI.
  Default it sensibly and respect it.
- **Sending:** use Firebase's *Trigger Email* extension backed by a provider
  (SendGrid / Brevo / Resend). A Cloud Function reads opted-in emails and queues sends.
- **Unsubscribe:** every email needs a working unsubscribe link (legal requirement —
  CAN-SPAM / GDPR). The provider can manage this, or flip `updatesOptIn` to false.

**Pros:** reaches everyone, including inactive users.
**Cons:** needs a provider account, consent UX, and unsubscribe handling.

---

## Suggested rollout

1. Build **Option A** (in-app banner) — covers most of the need with almost no risk.
2. Only if we need to reach users who don't open the app, add **Option B**.

## Open questions for when we pick this up

- Is in-app notification enough, or do we specifically need email?
- Who authors/publishes announcements — hardcoded, or a small admin view?
- If email: which provider, and what's the default opt-in stance?
