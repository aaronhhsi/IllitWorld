// background.js - MV3 service worker
// Handles Google OAuth via Supabase and XP awards to Supabase

// Cross-browser API shim (Firefox uses `browser`, Chrome uses `chrome`)
const ext = globalThis.browser ?? globalThis.chrome;

const SUPABASE_URL = 'https://fuqxdgywfliceqvlzhrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cXhkZ3l3ZmxpY2Vxdmx6aHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDI1ODIsImV4cCI6MjA4NzAxODU4Mn0.Nj1EzYLyJROCi__B9fbOqyAj7Wc0arXkp4H4cImyuDc';
const XP_PER_LEVEL = 200;

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateCodeVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

// ─── Session management ───────────────────────────────────────────────────────

async function getSession() {
  const { session } = await ext.storage.local.get('session');
  return session || null;
}

async function setSession(session) {
  await ext.storage.local.set({ session });
}

async function refreshSession(session) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) {
    await ext.storage.local.remove('session');
    return null;
  }
  const data = await res.json();
  const newSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await setSession(newSession);
  return newSession;
}

async function getValidSession() {
  let session = await getSession();
  if (!session) return null;
  // Refresh 5 min before expiry
  if (session.expires_at && Date.now() > session.expires_at - 5 * 60 * 1000) {
    session = await refreshSession(session);
  }
  return session;
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────

async function supabaseFetch(path, options = {}) {
  const session = await getValidSession();
  if (!session) throw new Error('Not authenticated');
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
}

async function loadGameData(userId) {
  const res = await supabaseFetch(
    `user_game_data?user_id=eq.${userId}&select=characters,watched_videos,favorite_videos,selected_background,show_photos,last_updated`
  );
  if (!res.ok) return null;
  const rows = await res.json();
  if (!rows[0]) return null;
  const d = rows[0];
  return {
    characters: d.characters,
    showPhotos: d.show_photos,
    watchedVideos: d.watched_videos || {},
    favoriteVideos: d.favorite_videos || {},
    selectedBackground: d.selected_background,
    lastUpdated: d.last_updated,
  };
}

async function saveGameData(userId, gameData) {
  const body = {
    user_id: userId,
    characters: gameData.characters,
    show_photos: gameData.showPhotos ?? false,
    watched_videos: gameData.watchedVideos,
    favorite_videos: gameData.favoriteVideos ?? {},
    selected_background: gameData.selectedBackground ?? 'japanese-classroom',
    last_updated: Date.now(),
  };
  const res = await supabaseFetch(`user_game_data?user_id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    console.error('saveGameData failed:', res.status, err);
    return false;
  }
  return true;
}

// ─── XP award ────────────────────────────────────────────────────────────────

async function awardXP(videoId, secondsWatched) {
  const session = await getValidSession();
  if (!session) return { success: false, reason: 'not_authenticated' };

  const userId = session.user.id;
  const gameData = await loadGameData(userId);
  if (!gameData) return { success: false, reason: 'no_game_data' };

  const xpEarned = secondsWatched;
  const watchedVideos = gameData.watchedVideos || {};

  const updatedCharacters = (gameData.characters || []).map(char => {
    const newXP = char.xp + xpEarned;
    return { ...char, xp: newXP, level: Math.floor(newXP / XP_PER_LEVEL) + 1 };
  });

  // Mark as watched on first view (used by the web app's Watched/Unwatched filter)
  const updatedWatchedVideos = watchedVideos[videoId]
    ? watchedVideos
    : { ...watchedVideos, [videoId]: Date.now() };

  const updatedData = {
    ...gameData,
    characters: updatedCharacters,
    watchedVideos: updatedWatchedVideos,
  };

  const saved = await saveGameData(userId, updatedData);
  return saved ? { success: true, xpEarned } : { success: false, reason: 'save_failed' };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function signIn() {
  const redirectUrl = ext.identity.getRedirectURL('auth');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier so we can use it after the redirect
  await ext.storage.local.set({ pkce_verifier: codeVerifier });

  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: redirectUrl,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?${params}`;

  let resultUrl;
  try {
    resultUrl = await ext.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
  } catch {
    await ext.storage.local.remove('pkce_verifier');
    return { success: false, reason: 'oauth_cancelled' };
  }

  if (!resultUrl) {
    await ext.storage.local.remove('pkce_verifier');
    return { success: false, reason: 'no_redirect' };
  }

  const url = new URL(resultUrl);
  const code = url.searchParams.get('code');
  if (!code) {
    await ext.storage.local.remove('pkce_verifier');
    return { success: false, reason: 'no_code' };
  }

  const { pkce_verifier } = await ext.storage.local.get('pkce_verifier');
  await ext.storage.local.remove('pkce_verifier');

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ auth_code: code, code_verifier: pkce_verifier }),
  });

  if (!res.ok) return { success: false, reason: 'token_exchange_failed' };

  const data = await res.json();
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await setSession(session);
  syncSessionToWebApp(session);
  return { success: true, user: data.user };
}

async function signOut() {
  const session = await getSession();
  if (session) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    });
  }
  await ext.storage.local.remove('session');
  syncSessionToWebApp(null);
}

// ─── Web app session sync ──────────────────────────────────────────────────────

async function syncSessionToWebApp(session) {
  const tabs = await ext.tabs.query({ url: 'https://illit-world.vercel.app/*' });
  for (const tab of tabs) {
    if (session) {
      // Supabase JS client expects expires_at in seconds (epoch), not milliseconds
      const webSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_type: 'bearer',
        expires_at: Math.floor(session.expires_at / 1000),
        user: session.user,
      };
      ext.tabs.sendMessage(tab.id, { type: 'PUSH_SESSION_TO_WEB', session: webSession }).catch(() => {});
    } else {
      ext.tabs.sendMessage(tab.id, { type: 'CLEAR_WEB_SESSION' }).catch(() => {});
    }
  }
}

// ─── XP video list (cached from Supabase) ────────────────────────────────────

const XP_VIDEOS_TTL = 60 * 60 * 1000; // 1 hour

async function fetchXpVideos() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/xp_videos?select=youtube_id`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return new Set(rows.map(r => r.youtube_id));
}

async function getXpVideoSet() {
  const { xp_videos_cache, xp_videos_fetched_at } = await ext.storage.local.get([
    'xp_videos_cache',
    'xp_videos_fetched_at',
  ]);
  if (xp_videos_cache && Date.now() - (xp_videos_fetched_at || 0) < XP_VIDEOS_TTL) {
    return new Set(xp_videos_cache);
  }
  const fresh = await fetchXpVideos();
  if (fresh) {
    const arr = [...fresh];
    await ext.storage.local.set({ xp_videos_cache: arr, xp_videos_fetched_at: Date.now() });
    return fresh;
  }
  return new Set(xp_videos_cache || []);
}

// ─── Keep service worker alive via port connections ───────────────────────────

ext.runtime.onConnect.addListener((port) => {
  // Content scripts connect a 'keepalive' port while tracking a video.
  // Simply holding this connection open prevents the service worker from sleeping.
  if (port.name !== 'keepalive') return;
  port.onDisconnect.addListener(() => {});
});

// ─── Per-tab watching state (for popup) ──────────────────────────────────────

const watchingState = {};

// ─── Message handler ──────────────────────────────────────────────────────────

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'WATCHING':
      watchingState[tabId] = { title: message.title, videoId: message.videoId };
      sendResponse(true);
      break;

    case 'NOT_WATCHING':
      delete watchingState[tabId];
      sendResponse(true);
      break;

    case 'CHECK_VIDEO':
      getXpVideoSet().then(set => sendResponse(set.has(message.youtubeId)));
      return true;

    case 'AWARD_XP':
      awardXP(message.videoId, message.secondsWatched).then(result => {
        if (result.success) {
          console.log(`[ILLIT World] +${result.xpEarned} XP saved for ${message.videoId}`);
        } else {
          console.warn('[ILLIT World] XP award failed:', result.reason);
        }
      });
      break; // no sendResponse needed

    case 'GET_STATUS':
      getValidSession().then(async (session) => {
        const tabs = await ext.tabs.query({ active: true, currentWindow: true });
        const activeTabId = tabs[0]?.id;
        sendResponse({
          isSignedIn: !!session,
          user: session?.user || null,
          watching: watchingState[activeTabId] || null,
        });
      });
      return true;

    case 'SIGN_IN':
      signIn().then(sendResponse);
      return true;

    case 'GET_CHARACTERS':
      getValidSession().then(async (session) => {
        if (!session) { sendResponse(null); return; }
        const gameData = await loadGameData(session.user.id);
        sendResponse(gameData?.characters || null);
      });
      return true;

    case 'SIGN_OUT':
      signOut().then(() => sendResponse({ success: true }));
      return true;
  }
});
