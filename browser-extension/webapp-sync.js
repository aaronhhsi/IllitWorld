// webapp-sync.js - runs on illit-world.vercel.app
// Syncs Supabase auth session between the extension and the web app

// Cross-browser API shim
const ext = globalThis.browser ?? globalThis.chrome;

const STORAGE_KEY = 'sb-fuqxdgywfliceqvlzhrl-auth-token';

ext.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PUSH_SESSION_TO_WEB') {
    // Extension signed in → write session into web app's localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message.session));
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
  }

  if (message.type === 'GET_WEB_SESSION') {
    // Pull whatever session the web app currently has
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      sendResponse({ session: raw ? JSON.parse(raw) : null });
    } catch (e) {
      sendResponse({ session: null });
    }
  }

  if (message.type === 'CLEAR_WEB_SESSION') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ success: false });
    }
  }

  return true; // keep channel open for async
});
