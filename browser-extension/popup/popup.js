// popup.js

// Cross-browser API shim
const ext = globalThis.browser ?? globalThis.chrome;

const MEMBER_COLORS = {
  yunah:  '#FF6B9D',
  minju:  '#C084FC',
  moka:   '#60A5FA',
  wonhee: '#34D399',
  iroha:  '#FBBF24',
};

const XP_PER_LEVEL = 200;

function show(id) {
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function renderMembers(characters) {
  const container = document.getElementById('members-list');
  container.innerHTML = '';
  for (const char of characters) {
    const xpIntoLevel = char.xp % XP_PER_LEVEL;
    const pct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);
    const color = MEMBER_COLORS[char.id] || '#ccc';

    const el = document.createElement('div');
    el.className = 'member';
    el.innerHTML = `
      <div class="member-info">
        <span class="member-name" style="color:${color}">${char.name}</span>
        <span class="member-level">Lv ${char.level}</span>
      </div>
      <div class="xp-bar-bg">
        <div class="xp-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="xp-label">${xpIntoLevel} / ${XP_PER_LEVEL} XP</div>
    `;
    container.appendChild(el);
  }
}

function applyStatus(status) {
  if (!status.isSignedIn) {
    show('view-signedout');
    return;
  }

  show('view-signedin');
  document.getElementById('user-email').textContent = status.user?.email || '';

  const watchingBanner = document.getElementById('watching-banner');
  const watchingTitle = document.getElementById('watching-title');

  if (status.watching) {
    watchingBanner.classList.remove('hidden');
    watchingTitle.textContent = `Earning XP: ${status.watching.title}`;
  } else {
    watchingBanner.classList.add('hidden');
  }

  if (status.characters?.length) {
    renderMembers(status.characters);
  }
}

// Load status + characters from background
async function loadStatus() {
  ext.runtime.sendMessage({ type: 'GET_STATUS' }, async (status) => {
    if (!status) { show('view-signedout'); return; }

    // If signed in, also load character data from Supabase
    if (status.isSignedIn) {
      ext.runtime.sendMessage({ type: 'GET_CHARACTERS' }, (characters) => {
        applyStatus({ ...status, characters });
      });
    } else {
      applyStatus(status);
    }
  });
}

document.getElementById('btn-signin').addEventListener('click', () => {
  show('view-loading');
  ext.runtime.sendMessage({ type: 'SIGN_IN' }, (result) => {
    if (result?.success) {
      loadStatus();
    } else {
      show('view-signedout');
    }
  });
});

document.getElementById('btn-signout').addEventListener('click', () => {
  ext.runtime.sendMessage({ type: 'SIGN_OUT' }, () => {
    show('view-signedout');
  });
});

document.getElementById('logo-link').addEventListener('click', () => {
  ext.tabs.create({ url: 'https://illit-world.vercel.app/' });
});

// Initial load
loadStatus();
