# ILLIT WORLD

A gamified K-pop fan app where you watch official ILLIT content to level up character cards and unlock photo card collections for each member: Yunah, Minju, Moka, Wonhee, and Iroha.

Built with React Native + Expo, Supabase for auth/persistence, and YouTube for video playback.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node)

### Installation

```bash
git clone <repo-url>
cd IllitWorld
npm install
```

### Running the App

```bash
# Start the Expo dev server (opens a menu with platform options)
npm start

# Or launch directly for a specific platform:
npm run web       # Browser
npm run android   # Android emulator / device
npm run ios       # iOS simulator (macOS only)
```

The web version is the easiest to test — just press `w` after `npm start`.

### Signing In

The app uses Google Sign-In via Supabase Auth. Click "Sign In" in the top-right corner of the main screen. Your progress (levels, watched videos, favorites, photo cards) syncs to the cloud so it persists across sessions and devices.

Without signing in you can still use the app, but progress is lost when you close it.

### Developer Tools

When running in dev mode (`npm start`), go to Settings (gear icon) while signed in to access DevTools — buttons that add/remove XP and levels for quick testing.

#### Image Tool

A local web UI for adding member photo card images. Upload a photo, crop it to the 2:3 card ratio, select the member and era, and it auto-saves to the correct folder at the right size.

```bash
npm run image-tool
# then open http://localhost:3456
```

1. Drop or browse for a JPG, PNG, or WebP image
2. Drag the crop box to frame the shot (locked to 2:3 ratio)
3. Select the member and era
4. Click **Process & save** — the image is cropped, resized to 800×1200, compressed to ≤350KB, and saved to `assets/images/members/<member>/`

Supported era codes: `run`, `srm`, `ily`, `tyt`, `bomb`, `nca`, `misc`

Saved files are named `<era>-<n>.jpg` (e.g. `srm-3.jpg`) and are auto-detected by the app on the next build/reload — no code changes needed.

#### YouTube Playlist Import

Fetches all videos from a YouTube playlist and appends new entries to `data/videos.ts`. Safe to re-run — videos already in the file are skipped.

**Prerequisites:**
1. Enable **YouTube Data API v3** in [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Library
2. Create a plain **API key** under Credentials → Create credentials → API key
3. Get the **playlist ID** from the URL: `youtube.com/playlist?list=`**PLxxxxxxxxxx**

```bash
node scripts/import-playlist.js <PLAYLIST_ID> <API_KEY>
```

Category is auto-detected from the video title (`M/V` → Music Video, `Dance Practice` → Dance Practice, `SUPER ILLIT` → SUPER ILLIT, anything else → Misc). After running, search for `category: 'Misc'` in `data/videos.ts` to review and fix any miscategorized entries.

---

## Project Structure

```
app/index.tsx              Main game screen (characters, video player, modals)
app/_layout.tsx            Root layout, wraps the app in AuthProvider

config/supabase.ts         Supabase client init (Auth + database)
contexts/AuthContext.tsx   Google sign-in provider & useAuth() hook
services/gameDataService.ts  Save/load game data to Supabase

data/videos.ts             YouTube video list
data/photoCards.ts         Auto-generated photo card data from image files

assets/images/members/          Member photo card images (.jpg)
assets/images/members/index.ts  Auto-detect system using require.context

components/DevTools.tsx    Dev-only XP/Level testing buttons
scripts/import-playlist.js  CLI tool — bulk-import videos from a YouTube playlist
scripts/image-tool-server.js  Local web UI — add and crop member photo images
```

---

## Design Decisions & How They Work

### Play Button: Smart Video Queue

The main Play button on the home screen prioritizes **unwatched content** so new users see fresh videos first, then loops through everything once they've watched it all.

**Logic** (`getUnwatchedOrdered` at [index.tsx:562](app/index.tsx#L562)):

1. Filter `videos` to only those not in `watchedVideos`
2. If there are unwatched videos, use those; otherwise fall back to **all** videos
3. Within the list, sort music videos first, then other categories
4. The first video plays immediately; the rest become the auto-play queue

```ts
const getUnwatchedOrdered = (): Video[] => {
  const unwatched = videos.filter(v => !watchedVideos[v.id]);
  const list = unwatched.length > 0 ? unwatched : videos;
  const musicVideos = list.filter(v => v.category === 'Music Video');
  const others = list.filter(v => v.category !== 'Music Video');
  return [...musicVideos, ...others];
};
```

`handleAutoPlay` ([index.tsx:571](app/index.tsx#L571)) calls this, takes the first video, and sets the rest as `autoPlayQueue`. A `queueSourceRef` remembers *how* the queue was built so that when the queue runs out, next/prev can regenerate a fresh list and loop seamlessly.

The Shuffle button does the same thing but applies a Fisher-Yates shuffle before playing.

### Video Player: Prev/Next with Looping

When you're watching a video, the left/right arrows navigate through the queue. **When you reach either end, the player loops** by calling `getFreshQueueList()` ([index.tsx:496](app/index.tsx#L496)) which re-evaluates the source function (unwatched list, filtered list, etc.) and optionally re-shuffles:

```ts
const getFreshQueueList = (): Video[] => {
  let list = queueSourceRef.current.getList();
  if (queueSourceRef.current.shuffle) {
    // Fisher-Yates shuffle
    list = [...list];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  return list;
};
```

The video modal's own Play/Shuffle buttons ([index.tsx:1034](app/index.tsx#L1034)) work similarly but use the **currently filtered** video list instead of the unwatched-first logic, so if you're viewing the "Favorites" tab the queue will only contain your favorited videos.

### XP & Leveling: Duration-Based Rewards

XP is awarded when you watch **90% of a video** — this prevents skipping. The reward is **1 XP per second of watch time**, so longer videos give more XP. All five members gain XP simultaneously from every video.

**Key code** (`handleVideoComplete` at [index.tsx:430](app/index.tsx#L430)):

```ts
const secondsWatched = Math.floor(selectedVideo.duration * percentageWatched);
const xpEarned = secondsWatched; // 1 XP per second

const updatedCharacters = characters.map(char => {
  const newXP = char.xp + xpEarned;
  const newLevel = Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1;
  return { ...char, xp: newXP, level: newLevel };
});
```

The 90% threshold is tracked differently on each platform:
- **Web**: A `WebYouTubePlayer` component polls `getCurrentTime()/getDuration()` every second via `setInterval` ([index.tsx:81](app/index.tsx#L81))
- **Native**: Uses `react-native-youtube-iframe`'s `onProgress` callback ([index.tsx:1221](app/index.tsx#L1221))

A `hasRewarded` flag ensures XP is only granted once per video play session.

### Photo Card System: Auto-Generated from Image Files

Photo cards are **not hardcoded** — they're auto-generated at build time from the images sitting in `assets/images/members/{member}/`.

**How it works:**

1. `assets/images/members/index.ts` uses `require.context` to scan each member folder for `.jpg` files at build time
2. Image keys follow the pattern `{member}-{era}-{number}` (derived from filename `{era}-{number}.jpg`)
3. `data/photoCards.ts` reads those image maps and generates `PhotoCard` objects with unlock rules from `ERA_CONFIG`

To add a new photo card: just drop a file like `srm-5.jpg` into `assets/images/members/yunah/` and rebuild. No code changes needed.

**Unlock rules** are configured per-era in `ERA_CONFIG` ([photoCards.ts:33](data/photoCards.ts#L33)):
- `run` (R U Next?) and `misc` — unlocked by default
- `srm` (Super Real Me) — unlock by watching "Magnetic"
- `ily` (I'll Like You) — unlock by watching "Cherish"
- `bomb` (Bomb) — unlock by watching "Do the Dance"
- `tyt` (Toki Yo Tomare) — unlock by watching "Toki Yo Tomare"
- `nca` (Not Cute Anymore) — unlock by watching "NOT CUTE ANYMORE"

Per-member exceptions go in `MEMBER_ERA_OVERRIDES` (e.g., Wonhee's `run` era unlocks from watching "Aim High" instead). Individual card overrides go in `CARD_OVERRIDES`.

### Watched Videos: HashMap for O(1) Lookup

Watched videos are stored as `Record<string, number>` (video ID to timestamp), not an array. This gives O(1) lookup when checking unlock conditions for photo cards, and the timestamp records *when* the video was first completed.

The code includes a migration path from the old array format ([index.tsx:314](app/index.tsx#L314)) so existing users' data converts automatically on load.

### Cloud Persistence

When signed in, all game state auto-saves to Firestore on every change via a `useEffect` that watches `[characters, showPhotos, watchedVideos, favoriteVideos, selectedBackground, user]` ([index.tsx:368](app/index.tsx#L368)). A `hasLoadedData` ref prevents the initial default state from overwriting cloud data before load completes.

Data lives in the `user_game_data` table in Supabase Postgres, keyed by the Supabase user UUID. Row Level Security ensures each user can only access their own row. The schema and service functions are in `services/gameDataService.ts`.
