// ========================================================
// Asfaque's AI Assistant - Client Application
// Powered by Google Gemini API
// ========================================================

const STORAGE_KEYS = {
  API_KEY: 'first_ai_project_gemini_key',
  THEME: 'first_ai_project_theme',
  MODEL: 'first_ai_project_model',
  CHATS: 'first_ai_project_saved_chats',
  ACTIVE_CHAT_ID: 'first_ai_project_active_id',
  DEVICE_ID: 'asfaque_ai_device_id',
  ADMIN_TOKEN: 'asfaque_admin_token'
};

// Device identification
let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
if (!deviceId) {
  deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
}

let adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '';

// Application State
let savedModel = localStorage.getItem(STORAGE_KEYS.MODEL);
if (!savedModel || savedModel.includes('1.5') || savedModel.includes('2.0') || savedModel.includes('2.5')) {
  savedModel = 'gemini-3.5-flash-lite';
  localStorage.setItem(STORAGE_KEYS.MODEL, savedModel);
}

let state = {
  apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark',
  model: savedModel,
  chats: JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]'),
  activeChatId: localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID) || null,
  isGenerating: false,
  hasEnvKey: false,
  attachedFile: null, // { name, size, mimeType, data }
  deviceId: deviceId,
  adminToken: adminToken,
  accessStatus: 'checking' // 'approved', 'pending', 'blocked', 'unregistered'
};

// Configure Marked for code highlighting
if (window.marked) {
  marked.setOptions({
    highlight: function(code, lang) {
      if (window.hljs) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }
      return code;
    },
    breaks: true,
    gfm: true
  });
}

// DOM Elements
const elements = {
  sidebar: document.getElementById('sidebar'),
  toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
  closeSidebarBtn: document.getElementById('closeSidebarBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  historyList: document.getElementById('historyList'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeLabel: document.getElementById('themeLabel'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModal: document.getElementById('closeSettingsModal'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveKeyBtn: document.getElementById('saveKeyBtn'),
  clearKeyBtn: document.getElementById('clearKeyBtn'),
  toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
  apiStatusBadge: document.getElementById('apiStatusBadge'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  modelSelect: document.getElementById('modelSelect'),
  chatViewport: document.getElementById('chatViewport'),
  heroScreen: document.getElementById('heroScreen'),
  messagesContainer: document.getElementById('messagesContainer'),
  typingIndicator: document.getElementById('typingIndicator'),
  userInput: document.getElementById('userInput'),
  sendBtn: document.getElementById('sendBtn'),
  attachBtn: document.getElementById('attachBtn'),
  fileInput: document.getElementById('fileInput'),
  fileAttachmentPreview: document.getElementById('fileAttachmentPreview'),
  fileChipIcon: document.getElementById('fileChipIcon'),
  fileChipName: document.getElementById('fileChipName'),
  fileChipSize: document.getElementById('fileChipSize'),
  removeFileBtn: document.getElementById('removeFileBtn'),
  suggestionCards: document.querySelectorAll('.suggestion-card'),
  // Access Control Elements
  accessGateModal: document.getElementById('accessGateModal'),
  accessIcon: document.getElementById('accessIcon'),
  accessTitle: document.getElementById('accessTitle'),
  accessDesc: document.getElementById('accessDesc'),
  accessRequestForm: document.getElementById('accessRequestForm'),
  requesterName: document.getElementById('requesterName'),
  requesterPhone: document.getElementById('requesterPhone'),
  pendingActionArea: document.getElementById('pendingActionArea'),
  checkStatusBtn: document.getElementById('checkStatusBtn')
};

// ========================================================
// Initialization
// ========================================================
function init() {
  applyTheme(state.theme);
  elements.modelSelect.value = state.model;
  elements.apiKeyInput.value = state.apiKey;

  checkServerHealth();
  checkAccessStatus();
  renderHistory();

  // Load existing chat or start fresh
  if (state.activeChatId && state.chats.find(c => c.id === state.activeChatId)) {
    loadChat(state.activeChatId);
  } else {
    createNewChat(false);
  }

  setupEventListeners();
}

// ========================================================
// Access Control Verification & Real-time Auto-polling
// ========================================================
let accessPollTimer = null;

function stopAccessPolling() {
  if (accessPollTimer) {
    clearInterval(accessPollTimer);
    accessPollTimer = null;
  }
}

function startAccessPolling() {
  if (accessPollTimer) return;
  accessPollTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/access/status?deviceId=${encodeURIComponent(state.deviceId)}&t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'approved') {
        stopAccessPolling();
        state.accessStatus = 'approved';
        if (elements.accessGateModal) elements.accessGateModal.style.display = 'none';
        elements.userInput.disabled = false;
        elements.userInput.focus();
        showApprovalNotification();
      } else if (data.status === 'blocked') {
        stopAccessPolling();
        state.accessStatus = 'blocked';
        checkAccessStatus();
      }
    } catch (_) {}
  }, 2000);
}

function showApprovalNotification() {
  const existing = document.getElementById('approvalNoticeBanner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'approvalNoticeBanner';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 24px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeInDown 0.3s ease;
  `;
  banner.innerHTML = `<span>🎉</span> Access Approved by Asfaque! You can now chat.`;
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.5s ease';
    setTimeout(() => banner.remove(), 500);
  }, 4000);
}

async function checkAccessStatus() {
  // If user has admin token saved, check admin session
  state.adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '';
  if (state.adminToken) {
    try {
      const adminRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': 'Bearer ' + state.adminToken }
      });
      if (adminRes.ok) {
        state.accessStatus = 'approved';
        stopAccessPolling();
        if (elements.accessGateModal) elements.accessGateModal.style.display = 'none';
        elements.userInput.disabled = false;
        return;
      }
    } catch (_) {}
  }

  try {
    const res = await fetch(`/api/access/status?deviceId=${encodeURIComponent(state.deviceId)}&t=${Date.now()}`);
    const data = await res.json();
    state.accessStatus = data.status;

    if (!elements.accessGateModal) return;

    if (data.status === 'approved') {
      stopAccessPolling();
      elements.accessGateModal.style.display = 'none';
      elements.userInput.disabled = false;
    } else if (data.status === 'pending') {
      elements.accessGateModal.style.display = 'flex';
      elements.accessIcon.textContent = '⏳';
      elements.accessTitle.textContent = 'Request Pending Approval';
      elements.accessDesc.innerHTML = `Hi <strong>${escapeHtml(data.user?.name || 'Friend')}</strong>, your request has been sent to Asfaque.<br><br>Please wait until Asfaque approves your device from his Admin Panel. It will unlock automatically!`;
      elements.accessRequestForm.style.display = 'none';
      elements.pendingActionArea.style.display = 'block';
      elements.userInput.disabled = true;
      startAccessPolling();
    } else if (data.status === 'blocked') {
      stopAccessPolling();
      elements.accessGateModal.style.display = 'flex';
      elements.accessIcon.textContent = '⛔';
      elements.accessTitle.textContent = 'Access Revoked';
      elements.accessDesc.innerHTML = `Hi <strong>${escapeHtml(data.user?.name || '')}</strong>, your access has been disabled by Asfaque.<br><br>Please contact Asfaque directly to regain access.`;
      elements.accessRequestForm.style.display = 'none';
      elements.pendingActionArea.style.display = 'none';
      elements.userInput.disabled = true;
    } else {
      // Unregistered
      stopAccessPolling();
      elements.accessGateModal.style.display = 'flex';
      elements.accessIcon.textContent = '🔒';
      elements.accessTitle.textContent = 'Access Required';
      elements.accessDesc.textContent = 'Welcome to Asfaque\'s AI Assistant! Access is strictly controlled. Please enter your name to request approval from Asfaque:';
      elements.accessRequestForm.style.display = 'block';
      elements.pendingActionArea.style.display = 'none';
      elements.userInput.disabled = true;
    }
  } catch (err) {
    console.warn('Access check error:', err);
  }
}

// ========================================================
// Server Health & API Key Status
// ========================================================
async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    state.hasEnvKey = data.hasEnvKey;

    updateApiStatus();
  } catch (err) {
    console.warn('Server health check failed:', err);
    updateApiStatus();
  }
}

function updateApiStatus() {
  const hasKey = !!state.apiKey || state.hasEnvKey;
  if (hasKey) {
    elements.statusDot.className = 'status-dot connected';
    elements.statusText.textContent = state.apiKey ? 'Key Connected' : 'Server Key Active';
  } else {
    elements.statusDot.className = 'status-dot disconnected';
    elements.statusText.textContent = 'Add Gemini Key';
  }
}

// ========================================================
// Theme Handling
// ========================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  elements.themeLabel.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

// ========================================================
// File Handling
// ========================================================
function processSelectedFile(file) {
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    alert('File size exceeds 25MB limit.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const base64Data = reader.result.split(',')[1];
    state.attachedFile = {
      name: file.name,
      size: formatFileSize(file.size),
      mimeType: file.type || 'application/octet-stream',
      data: base64Data
    };

    elements.fileChipName.textContent = file.name;
    elements.fileChipSize.textContent = `(${formatFileSize(file.size)})`;
    elements.fileChipIcon.textContent = file.name.toLowerCase().endsWith('.pdf') ? '📄' : 
                                      file.type.startsWith('image/') ? '🖼️' : '📁';
    elements.fileAttachmentPreview.style.display = 'flex';
    updateSendButtonState();
  };
  reader.readAsDataURL(file);
}

function removeAttachedFile() {
  state.attachedFile = null;
  if (elements.fileInput) elements.fileInput.value = '';
  elements.fileAttachmentPreview.style.display = 'none';
  updateSendButtonState();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ========================================================
// Chat Management & LocalStorage
// ========================================================
function getActiveChat() {
  return state.chats.find(c => c.id === state.activeChatId);
}

function saveChats() {
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(state.chats));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, state.activeChatId || '');
  renderHistory();
}

function createNewChat(shouldFocus = true) {
  const newChat = {
    id: 'chat_' + Date.now(),
    title: 'New conversation',
    createdAt: new Date().toISOString(),
    messages: []
  };

  state.chats.unshift(newChat);
  state.activeChatId = newChat.id;
  removeAttachedFile();
  saveChats();
  renderCurrentChat();

  if (shouldFocus) {
    elements.userInput.focus();
  }
}

function loadChat(chatId) {
  state.activeChatId = chatId;
  removeAttachedFile();
  saveChats();
  renderCurrentChat();
  if (window.innerWidth <= 768) {
    elements.sidebar.classList.remove('open');
  }
}

function deleteChat(chatId, e) {
  if (e) e.stopPropagation();
  state.chats = state.chats.filter(c => c.id !== chatId);
  if (state.activeChatId === chatId) {
    state.activeChatId = state.chats.length > 0 ? state.chats[0].id : null;
    if (!state.activeChatId) {
      createNewChat(false);
      return;
    }
  }
  saveChats();
  renderCurrentChat();
}

function renderHistory() {
  elements.historyList.innerHTML = '';
  state.chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = `history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
    item.innerHTML = `
      <span title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</span>
      <button class="history-delete-btn" title="Delete chat">✕</button>
    `;
    item.addEventListener('click', () => loadChat(chat.id));
    item.querySelector('.history-delete-btn').addEventListener('click', (e) => deleteChat(chat.id, e));
    elements.historyList.appendChild(item);
  });
}

function renderCurrentChat() {
  const chat = getActiveChat();
  if (!chat || chat.messages.length === 0) {
    elements.heroScreen.style.display = 'block';
    elements.messagesContainer.innerHTML = '';
  } else {
    elements.heroScreen.style.display = 'none';
    elements.messagesContainer.innerHTML = '';
    chat.messages.forEach(msg => appendMessageToDOM(msg.role, msg.content, false, msg.fileName));
    scrollToBottom();
  }
}

// ========================================================
// Message Rendering & UI Helpers
// ========================================================
function appendMessageToDOM(role, content, shouldScroll = true, fileName = null) {
  elements.heroScreen.style.display = 'none';

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const isUser = role === 'user';
  const avatar = document.createElement('div');
  avatar.className = `avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`;
  avatar.textContent = isUser ? '👤' : '✨';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (isUser) {
    if (fileName) {
      const fileBadge = document.createElement('div');
      fileBadge.className = 'file-badge-in-chat';
      fileBadge.innerHTML = `📎 <strong>${escapeHtml(fileName)}</strong>`;
      bubble.appendChild(fileBadge);
    }
    const textNode = document.createElement('div');
    textNode.textContent = content;
    bubble.appendChild(textNode);
  } else {
    // Markdown parsed content for AI responses
    bubble.innerHTML = window.marked ? marked.parse(content) : content;
    attachCopyCodeButtons(bubble);
  }

  if (isUser) {
    row.appendChild(bubble);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(bubble);
  }

  elements.messagesContainer.appendChild(row);

  if (shouldScroll) {
    scrollToBottom();
  }
}

function attachCopyCodeButtons(container) {
  const codeBlocks = container.querySelectorAll('pre');
  codeBlocks.forEach(pre => {
    if (pre.querySelector('.code-header')) return;

    const code = pre.querySelector('code');
    const lang = (code.className.match(/language-(\w+)/) || [])[1] || 'code';

    const header = document.createElement('div');
    header.className = 'code-header';
    header.innerHTML = `
      <span>${lang}</span>
      <button class="copy-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      </button>
    `;

    const copyBtn = header.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        copyBtn.innerHTML = `<span>✓ Copied!</span>`;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          `;
        }, 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });

    pre.insertBefore(header, code);
  });
}

function scrollToBottom() {
  elements.chatViewport.scrollTo({
    top: elements.chatViewport.scrollHeight,
    behavior: 'smooth'
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ========================================================
// Chat Interaction & API Call
// ========================================================
async function handleSend() {
  const text = elements.userInput.value.trim();
  const file = state.attachedFile;

  if ((!text && !file) || state.isGenerating) return;

  const chat = getActiveChat();
  if (!chat) return;

  // Check if API key is present
  if (!state.apiKey && !state.hasEnvKey) {
    openSettings();
    return;
  }

  const promptText = text || (file ? `Analyze this file: ${file.name}` : '');

  // Update title if first message
  if (chat.messages.length === 0) {
    chat.title = promptText.length > 32 ? promptText.substring(0, 32) + '...' : promptText;
  }

  // Append user message
  const userMsgObj = { 
    role: 'user', 
    content: promptText,
    fileName: file ? file.name : null
  };
  chat.messages.push(userMsgObj);
  appendMessageToDOM('user', promptText, true, file ? file.name : null);

  // Clear input & attached file
  elements.userInput.value = '';
  const fileToSend = state.attachedFile;
  removeAttachedFile();
  adjustTextareaHeight();
  updateSendButtonState();

  // Show typing indicator
  state.isGenerating = true;
  elements.typingIndicator.style.display = 'flex';
  scrollToBottom();

  try {
    const historyPayload = chat.messages.slice(-10, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: promptText,
        history: historyPayload,
        apiKey: state.apiKey,
        model: state.model,
        file: fileToSend,
        deviceId: state.deviceId,
        adminToken: state.adminToken
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // If access revoked or pending, refresh access modal
      if (response.status === 401 || response.status === 403) {
        checkAccessStatus();
      }
      throw new Error(data.error || 'Server error occurred.');
    }

    // Add assistant response
    chat.messages.push({ role: 'assistant', content: data.reply });
    appendMessageToDOM('assistant', data.reply);
    saveChats();

  } catch (err) {
    console.error('Chat error:', err);
    const errorMsg = `⚠️ **Error:** ${err.message}`;
    chat.messages.push({ role: 'assistant', content: errorMsg });
    appendMessageToDOM('assistant', errorMsg);
    saveChats();
  } finally {
    state.isGenerating = false;
    elements.typingIndicator.style.display = 'none';
    scrollToBottom();
    elements.userInput.focus();
  }
}

// ========================================================
// Settings Modal
// ========================================================
function openSettings() {
  elements.apiKeyInput.value = state.apiKey;
  elements.settingsModal.style.display = 'flex';
  elements.apiKeyInput.focus();
}

function closeSettings() {
  elements.settingsModal.style.display = 'none';
}

function saveKey() {
  const key = elements.apiKeyInput.value.trim();
  state.apiKey = key;
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  updateApiStatus();
  closeSettings();
}

function clearKey() {
  state.apiKey = '';
  elements.apiKeyInput.value = '';
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  updateApiStatus();
}

// ========================================================
// Event Listeners & UI Binding
// ========================================================
function setupEventListeners() {
  // Sidebar Toggle
  elements.toggleSidebarBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      elements.sidebar.classList.toggle('open');
    } else {
      elements.sidebar.classList.toggle('closed');
    }
  });

  elements.closeSidebarBtn.addEventListener('click', () => {
    elements.sidebar.classList.remove('open');
  });

  // New Chat
  elements.newChatBtn.addEventListener('click', () => createNewChat(true));

  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Settings Modal
  elements.openSettingsBtn.addEventListener('click', openSettings);
  elements.apiStatusBadge.addEventListener('click', openSettings);
  elements.closeSettingsModal.addEventListener('click', closeSettings);
  elements.saveKeyBtn.addEventListener('click', saveKey);
  elements.clearKeyBtn.addEventListener('click', clearKey);

  // Modal backdrop click
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeSettings();
  });

  // Toggle API Key visibility
  elements.toggleKeyVisibility.addEventListener('click', () => {
    const isPass = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPass ? 'text' : 'password';
    elements.toggleKeyVisibility.textContent = isPass ? '🔒' : '👁️';
  });

  // Model Selection
  elements.modelSelect.addEventListener('change', (e) => {
    state.model = e.target.value;
    localStorage.setItem(STORAGE_KEYS.MODEL, state.model);
  });

  // File Upload Handlers
  elements.attachBtn.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  });

  elements.removeFileBtn.addEventListener('click', removeAttachedFile);

  // Drag and Drop files onto input area
  const dropZone = document.querySelector('.input-box-wrapper');
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.style.borderColor = 'var(--accent)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.style.borderColor = '';
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      processSelectedFile(files[0]);
    }
  });

  // Input & Auto-growing Textarea
  elements.userInput.addEventListener('input', () => {
    adjustTextareaHeight();
    updateSendButtonState();
  });

  elements.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  elements.sendBtn.addEventListener('click', handleSend);

  // Suggestion Cards
  elements.suggestionCards.forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      elements.userInput.value = prompt;
      adjustTextareaHeight();
      updateSendButtonState();
      handleSend();
    });
  });

  // Access Request Form Submission
  if (elements.accessRequestForm) {
    elements.accessRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = elements.requesterName.value.trim();
      const phone = elements.requesterPhone.value.trim();
      if (!name) return;

      try {
        const res = await fetch('/api/access/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            deviceId: state.deviceId
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit request.');
        checkAccessStatus();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (elements.checkStatusBtn) {
    elements.checkStatusBtn.addEventListener('click', checkAccessStatus);
  }
}

function adjustTextareaHeight() {
  const textarea = elements.userInput;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
}

function updateSendButtonState() {
  const hasText = !!elements.userInput.value.trim();
  const hasFile = !!state.attachedFile;
  elements.sendBtn.disabled = (!hasText && !hasFile) || state.isGenerating;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
