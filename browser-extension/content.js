// content.js - runs on youtube.com/watch pages

// Cross-browser API shim
const ext = globalThis.browser ?? globalThis.chrome;

let currentYtId = null;
let hasRewardedCurrentVideo = false;
let trackingInterval = null;
let keepAlivePort = null;

function getYouTubeVideoId() {
  return new URL(location.href).searchParams.get('v');
}

function getVideoElement() {
  return document.querySelector('video.html5-main-video') || document.querySelector('video');
}

// ── Keepalive port ────────────────────────────────────────────────────────────

function connectKeepAlive() {
  if (keepAlivePort) return;
  try {
    keepAlivePort = ext.runtime.connect({ name: 'keepalive' });
    keepAlivePort.onDisconnect.addListener(() => { keepAlivePort = null; });
  } catch (e) {}
}

function disconnectKeepAlive() {
  if (keepAlivePort) { keepAlivePort.disconnect(); keepAlivePort = null; }
}

// ── Messaging ─────────────────────────────────────────────────────────────────

function sendMessage(msg, callback) {
  connectKeepAlive();
  ext.runtime.sendMessage(msg, (response) => {
    if (ext.runtime.lastError) {
      setTimeout(() => {
        ext.runtime.sendMessage(msg, (retryResponse) => {
          if (ext.runtime.lastError) {
            if (callback) callback(null);
            return;
          }
          if (callback) callback(retryResponse);
        });
      }, 500);
      return;
    }
    if (callback) callback(response);
  });
}

// ── Tracking ──────────────────────────────────────────────────────────────────

function beginPolling(ytId) {
  if (trackingInterval) clearInterval(trackingInterval);

  trackingInterval = setInterval(() => {
    if (hasRewardedCurrentVideo) {
      clearInterval(trackingInterval);
      return;
    }

    const video = getVideoElement();
    if (!video) return;

    const { currentTime, duration } = video;
    if (!duration || duration === 0) return;

    if (currentTime / duration >= 0.9) {
      hasRewardedCurrentVideo = true;
      clearInterval(trackingInterval);

      const secondsWatched = Math.floor(duration);
      console.log(`[ILLIT World] Completed ${ytId} — awarding ${secondsWatched} XP`);

      connectKeepAlive();
      ext.runtime.sendMessage({ type: 'AWARD_XP', videoId: `yt_${ytId}`, secondsWatched });
      setTimeout(disconnectKeepAlive, 15000);
    }
  }, 3000);
}

async function onUrlChange() {
  const ytId = getYouTubeVideoId();
  if (ytId === currentYtId) return;

  currentYtId = ytId;
  hasRewardedCurrentVideo = false;
  if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null; }
  disconnectKeepAlive();

  if (!ytId) {
    sendMessage({ type: 'NOT_WATCHING' });
    return;
  }

  sendMessage({ type: 'CHECK_VIDEO', youtubeId: ytId }, (approved) => {
    if (approved) {
      console.log(`[ILLIT World] Approved video: ${ytId}`);
      sendMessage({ type: 'WATCHING', title: document.title, videoId: `yt_${ytId}` });
      connectKeepAlive();
      beginPolling(ytId);
    } else {
      sendMessage({ type: 'NOT_WATCHING' });
    }
  });
}

// ── SPA navigation watcher ────────────────────────────────────────────────────

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    onUrlChange();
  }
}).observe(document.body, { subtree: true, childList: true });

onUrlChange();
