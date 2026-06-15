# Design: Multi-language support (English + Hebrew, RTL-ready)

**Status:** Approved, ready for implementation plan.
**Goal:** Let users use Tiny Bites in their language. Ship English (default) + Hebrew
with full right-to-left (RTL) support, and build the system so more languages can be
added later by dropping in a translation file.

## Decisions (locked)

- **Languages at launch:** English + Hebrew (RTL), with room to grow.
- **Translation layer:** `react-i18next`.
- **Language selection:** manual switcher **and** browser auto-detect.
- **Persistence:** Firestore user profile (`users/{uid}.language`), so it follows the
  user across devices.
- **Hebrew text:** Claude drafts all Hebrew translations; user reviews/corrects.

---

## 1. Architecture

Add dependencies: `react-i18next`, `i18next`, `i18next-browser-languagedetector`.

New module, imported once in [main.tsx](../../../src/main.tsx) **before** render:

```
src/i18n/
  index.ts              # i18next init: resources, fallbackLng:'en', detection order
  locales/en.json       # all UI strings, nested by feature
  locales/he.json       # Hebrew translations
```

Strings are namespaced by area: `common`, `nav`, `auth`, `dashboard`, `feeding`,
`sleep`, `history`, `profile`, `export`. Components consume via
`const { t } = useTranslation()` → `t('feeding.leftBreast')`.

i18next config:
- `fallbackLng: 'en'`
- `supportedLngs: ['en', 'he']`
- `interpolation.escapeValue: false` (React already escapes)
- detection order: `['localStorage', 'navigator']` (Firestore is layered on top by the
  LanguageProvider, see §2)

## 2. Language preference & persistence

A new `LanguageProvider` (mirroring the existing `BabyContext` / `AuthContext` pattern)
is the single source of truth. Exposes `useLanguage()` → `{ language, setLanguage }`.

**Resolution precedence on load:**
1. Firestore `users/{uid}.language` (if signed in)
2. `localStorage['tinybites:lang']`
3. `navigator.language` (browser auto-detect, mapped to a supported language)
4. `'en'`

**`setLanguage(lng)`** →
- `i18n.changeLanguage(lng)`
- write `localStorage['tinybites:lang']`
- if signed in, write `users/{uid}.language` via a new `setUserLanguage(uid, lng)`
  helper in [firestore.ts](../../../src/firebase/firestore.ts)

**On sign-in**, the provider reads the profile's `language` and applies it (Firestore
wins over a stale local value, since it represents the user's cross-device choice).

**Pre-auth** pages (Login/Register) rely on localStorage + browser detection only.
[signUp](../../../src/firebase/auth.ts) writes the current language into the new
`users` doc alongside `email`/`displayName`/`createdAt`.

**No firestore.rules change** — owners already have read/write on their own
`users/{uid}` doc ([firestore.rules](../../../firestore.rules) line 5).

## 3. RTL handling

On every language change the provider sets `document.documentElement.lang` and `dir`
(`he` → `rtl`, otherwise `ltr`).

The substantive work is an audit-and-convert pass replacing Tailwind **physical**
direction utilities with **logical** ones (supported in Tailwind 3.4), so layout flips
automatically with `dir` rather than per-component overrides:

- `ml-/mr-` → `ms-/me-`
- `pl-/pr-` → `ps-/pe-`
- `left-/right-` → `start-/end-`
- `text-left/right` → `text-start/end`
- `space-x-*` → use a reverse-aware approach

Directionally-meaningful icons (sign-out arrow, chevrons) are flipped under RTL. The
breast icon in [constants.ts](../../../src/utils/constants.ts) already carries a
`mirrorIcon` flag to reuse the pattern.

Recharts is largely numeric; axis-label alignment may need a small tweak under RTL but
no structural change.

## 4. Language switcher UI

A small `LanguageSwitcher` component (globe icon; toggles EN ⇄ עברית). Placement:
- In the [TopBar](../../../src/components/layout/TopBar.tsx) action group (next to
  profile / sign-out).
- On the Login and Register pages, since those are pre-auth and have no TopBar.

`PAGE_TITLES` currently hardcoded in TopBar move to translation keys.

## 5. Dates, numbers & formatters

[formatters.ts](../../../src/utils/formatters.ts) becomes locale-aware:
- Select the `date-fns` `he` locale and Hebrew-appropriate patterns (24-hour time for
  Hebrew) based on the active i18next language.
- i18next plural forms replace the hand-rolled `day/days`, `week(s)`, `month(s)` logic
  in `formatBabyAge`.

Feeding-type labels in [constants.ts](../../../src/utils/constants.ts) move to
translation keys, resolved at render time (not at module load, so they react to language
changes). Units (oz/ml) stay as data values; their displayed labels translate.

## 6. Out of scope (non-goals)

- **User-entered data** (baby name, notes) is never translated — kept exactly as typed.
  Text inputs get `dir="auto"` so mixed Hebrew/English entry renders correctly.
- **Announcement banner** content (authored manually in the Firestore console) stays
  English-only for now. Future follow-up: per-language announcement fields.

## 7. Verification

Per project convention (no automated tests — verify via typecheck + running the app):
- `npm run typecheck` passes.
- Toggle EN/HE: UI strings switch; `dir` flips to RTL for Hebrew with correct layout.
- Date/time formatting matches the active language (24h for Hebrew).
- Switcher works on Login/Register (pre-auth) and inside the app.
- Persistence: choice survives reload (localStorage) and follows a signed-in user in a
  fresh browser (Firestore profile).
- Mixed-language text inputs render with correct direction.
