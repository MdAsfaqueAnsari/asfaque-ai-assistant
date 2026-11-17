const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GITHUB_REPO = process.env.GITHUB_REPO || 'MdAsfaqueAnsari/asfaque-ai-assistant';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'asfaque2026';
const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json');

// In-memory cache with timestamp
let memoryCache = {
  users: [],
  sha: null,
  lastFetched: 0
};

const CACHE_TTL_MS = 5000; // 5 seconds cache

function getAdminToken() {
  return crypto.createHash('sha256').update(ADMIN_PASSWORD + '_salt_asfaque_ai').digest('hex');
}

function verifyAdmin(token) {
  if (!token) return false;
  return token === getAdminToken();
}

// Read database
async function loadUsers() {
  const now = Date.now();
  if (memoryCache.users.length > 0 && (now - memoryCache.lastFetched) < CACHE_TTL_MS) {
    return memoryCache.users;
  }

  // 1. Try GitHub API if token available
  if (GITHUB_TOKEN && GITHUB_REPO) {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/users.json`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'User-Agent': 'NodeJS',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const contentStr = Buffer.from(data.content, 'base64').toString('utf8');
        const parsed = JSON.parse(contentStr);
        memoryCache.users = Array.isArray(parsed.users) ? parsed.users : [];
        memoryCache.sha = data.sha;
        memoryCache.lastFetched = now;

        // Also sync local file if possible
        try {
          const dir = path.dirname(DATA_FILE);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(DATA_FILE, JSON.stringify({ users: memoryCache.users }, null, 2));
        } catch (_) {}

        return memoryCache.users;
      }
    } catch (err) {
      console.warn('[AccessControl] GitHub read error:', err.message);
    }
  }

  // 2. Fallback to local file
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(fileData);
      memoryCache.users = Array.isArray(parsed.users) ? parsed.users : [];
      memoryCache.lastFetched = now;
      return memoryCache.users;
    }
  } catch (err) {
    console.warn('[AccessControl] Local file read error:', err.message);
  }

  return memoryCache.users;
}

// Save database
async function saveUsers(users) {
  memoryCache.users = users;
  memoryCache.lastFetched = Date.now();

  const payload = JSON.stringify({ users }, null, 2);

  // 1. Save to local file
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, payload);
  } catch (err) {
    console.warn('[AccessControl] Local write failed:', err.message);
  }

  // 2. Save to GitHub repository
  if (GITHUB_TOKEN && GITHUB_REPO) {
    try {
      // If sha is unknown, fetch latest sha first
      if (!memoryCache.sha) {
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/users.json`, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'NodeJS',
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (getRes.ok) {
          const getData = await getRes.json();
          memoryCache.sha = getData.sha;
        }
      }

      const body = {
        message: `Update access users database (${users.length} users)`,
        content: Buffer.from(payload).toString('base64'),
        sha: memoryCache.sha
      };

      const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/users.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'User-Agent': 'NodeJS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        const putData = await putRes.json();
        memoryCache.sha = putData.content?.sha;
        console.log(`[AccessControl] Synced ${users.length} users to GitHub. SHA: ${memoryCache.sha}`);
      } else {
        const errData = await putRes.json();
        console.warn('[AccessControl] GitHub sync error:', errData.message);
        // If conflict (409), invalidate sha
        if (putRes.status === 409) memoryCache.sha = null;
      }
    } catch (err) {
      console.warn('[AccessControl] GitHub save failed:', err.message);
    }
  }

  return true;
}

// Helper: Check status by deviceId
async function checkDeviceAccess(deviceId) {
  if (!deviceId) return { status: 'unregistered' };
  const users = await loadUsers();
  const user = users.find(u => u.deviceId === deviceId);
  if (!user) return { status: 'unregistered' };
  return { status: user.status, user };
}

// Helper: Request access
async function requestAccess({ name, phone, deviceId }) {
  if (!name || !name.trim()) throw new Error('Please enter your name.');
  if (!deviceId) throw new Error('Device identifier missing.');

  const users = await loadUsers();
  let existing = users.find(u => u.deviceId === deviceId);

  if (existing) {
    if (existing.status === 'blocked') {
      return { status: 'blocked', user: existing };
    }
    if (existing.status === 'approved') {
      return { status: 'approved', user: existing };
    }
    // Update name/phone if pending
    existing.name = name.trim();
    if (phone) existing.phone = phone.trim();
    existing.requestedAt = new Date().toISOString();
    await saveUsers(users);
    return { status: 'pending', user: existing };
  }

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    deviceId: deviceId,
    name: name.trim(),
    phone: phone ? phone.trim() : '',
    status: 'pending',
    requestedAt: new Date().toISOString(),
    approvedAt: null,
    blockedAt: null
  };

  users.push(newUser);
  await saveUsers(users);
  return { status: 'pending', user: newUser };
}

// Helper: Admin action
async function performAdminAction(userId, action) {
  const users = await loadUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');

  const now = new Date().toISOString();
  if (action === 'approve') {
    user.status = 'approved';
    user.approvedAt = now;
    user.blockedAt = null;
  } else if (action === 'block') {
    user.status = 'blocked';
    user.blockedAt = now;
  } else if (action === 'unblock') {
    user.status = 'approved';
    user.approvedAt = now;
    user.blockedAt = null;
  } else if (action === 'delete') {
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) users.splice(idx, 1);
  } else {
    throw new Error('Invalid action: ' + action);
  }

  await saveUsers(users);
  return { success: true, users };
}

module.exports = {
  ADMIN_PASSWORD,
  getAdminToken,
  verifyAdmin,
  loadUsers,
  checkDeviceAccess,
  requestAccess,
  performAdminAction
};
