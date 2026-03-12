# ILLIT World Extension — From Code to Published

## 1. Build the distribution zips

From the project root:

```bash
npm run extension:build
```

This creates two files:
- `dist/illit-world-chrome.zip` — for Chrome, Edge, Brave, Opera
- `dist/illit-world-firefox.zip` — for Firefox

Run this every time you make changes before testing or publishing.

---

## 2. Testing on Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select the `browser-extension/` folder (not the zip — the folder itself)
5. The extension appears in your toolbar. Pin it for easy access.

**After making code changes:**
- Go back to `chrome://extensions`
- Click the **refresh icon** on the ILLIT World card
- No need to reload unpacked unless you change `manifest.json`

**Viewing background script logs:**
- On the extension card, click **"Service Worker"** link → opens DevTools for the background script
- Content script logs appear in the normal DevTools console on YouTube pages

---

## 3. Testing on Firefox

1. Go to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on...**
4. Navigate to `browser-extension/` and select `manifest.json`
5. The extension is loaded until you close Firefox

**After making code changes:**
- Click **Reload** next to the extension in `about:debugging`

**Viewing background script logs:**
- Click **Inspect** next to the extension in `about:debugging` → opens DevTools for the service worker

**Important — Firefox OAuth redirect URL:**

Firefox uses a different OAuth redirect URL than Chrome. To find yours:
1. Load the extension in Firefox (steps above)
2. Open the background script console via **Inspect**
3. Run: `ext.identity.getRedirectURL('auth')`
4. Copy the URL (looks like `https://illit-world@illit-world.vercel.app.extensions.allizom.org/auth`)
5. Add it to **Supabase → Authentication → URL Configuration → Redirect URLs**

Without this step, sign-in works on Chrome but fails on Firefox.

---

## 4. Publishing on Chrome Web Store

### One-time setup
1. Go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
2. Sign in with a Google account
3. Pay the **$5 one-time developer registration fee**

### Submitting
1. Run `npm run extension:build`
2. Click **New Item** → upload `dist/illit-world-chrome.zip`
3. Fill in the store listing:
   - **Description** — explain what the extension does
   - **Screenshots** — at least 1 screenshot at 1280×800 or 640×400 (take these from the popup and a YouTube video)
   - **Category** — Entertainment
   - **Privacy policy URL** — `https://illit-world.vercel.app/privacy`
4. Under **Permissions justification**, explain why each permission is needed:
   - `identity` — Google OAuth sign-in
   - `storage` — saves session and XP video cache locally
   - `tabs` — detects active YouTube tab for watching status
   - Host permissions — reads YouTube video IDs; writes XP to Supabase
5. Click **Submit for Review**

**Review time:** 1–3 business days for new extensions, faster for updates.

### Publishing updates
1. Run `npm run extension:build`
2. In the developer console, click the extension → **Package** tab → **Upload new package**
3. Upload `dist/illit-world-chrome.zip`
4. Submit — updates typically review faster than initial submissions

---

## 5. Publishing on Firefox Add-ons (AMO)

### One-time setup
1. Create a Mozilla account at [accounts.firefox.com](https://accounts.firefox.com)
2. Go to [addons.mozilla.org/developers](https://addons.mozilla.org/developers)
3. No fee required

### Submitting
1. Run `npm run extension:build`
2. Click **Submit a New Add-on**
3. Choose **On this site** (public AMO listing)
4. Upload `dist/illit-world-firefox.zip`
5. AMO will ask for **source code** — upload a zip of the `browser-extension/` folder
6. Fill in the listing:
   - **Description**, **screenshots**, **categories**
   - **Privacy policy URL** — `https://illit-world.vercel.app/privacy`
7. Submit

**Review time:** A few days to a few weeks for first submission. Updates to already-approved extensions are often auto-approved.

### Publishing updates
1. Run `npm run extension:build`
2. In your AMO developer dashboard, click the extension → **Upload New Version**
3. Upload `dist/illit-world-firefox.zip` and the source zip
4. Submit

---

## 6. Checklist before first submission (both stores)

- [ ] Privacy policy is live at `https://illit-world.vercel.app/privacy`
- [ ] Firefox OAuth redirect URL added to Supabase (see section 3)
- [ ] Extension tested end-to-end: sign in → watch an ILLIT video → XP awarded
- [ ] Screenshots taken of popup (signed in, watching state, member XP bars)
- [ ] `npm run extension:build` run and both zips verified by loading unpacked

---

## Quick reference

| Task | Command / Location |
|---|---|
| Build zips | `npm run extension:build` |
| Test on Chrome | `chrome://extensions` → Load unpacked → `browser-extension/` |
| Test on Firefox | `about:debugging` → Load Temporary Add-on → `manifest.json` |
| Chrome background logs | `chrome://extensions` → Service Worker link |
| Firefox background logs | `about:debugging` → Inspect |
| Chrome publish | [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole) |
| Firefox publish | [addons.mozilla.org/developers](https://addons.mozilla.org/developers) |
| Privacy policy | `https://illit-world.vercel.app/privacy` |
