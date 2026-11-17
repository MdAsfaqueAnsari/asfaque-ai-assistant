// ========================================================
// My First AI Project - Client Application
// Inspired by Rohit Negi's "Create Your FIRST AI Project"
// ========================================================

const STORAGE_KEYS = {
  API_KEY: 'first_ai_project_gemini_key',
  THEME: 'first_ai_project_theme',
  MODEL: 'first_ai_project_model',
  CHATS: 'first_ai_project_saved_chats',
  ACTIVE_CHAT_ID: 'first_ai_project_active_id'
};

// Application State
let state = {
  apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark',
  model: localStorage.getItem(STORAGE_KEYS.MODEL) || 'gemini-1.5-flash',
  chats: JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]'),
  activeChatId: localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID) || null,
  isGenerating: false,
  hasEnvKey: false
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
  suggestionCards: document.querySelectorAll('.suggestion-card')
};

// ========================================================
// Initialization
// ========================================================
function init() {
  applyTheme(state.theme);
  elements.modelSelect.value = state.model;
  elements.apiKeyInput.value = state.apiKey;

  checkServerHealth();
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
  saveChats();
  renderCurrentChat();

  if (shouldFocus) {
    elements.userInput.focus();
  }
}

function loadChat(chatId) {
  state.activeChatId = chatId;
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
    chat.messages.forEach(msg => appendMessageToDOM(msg.role, msg.content, false));
    scrollToBottom();
  }
}

// ========================================================
// Message Rendering & UI Helpers
// ========================================================
function appendMessageToDOM(role, content, shouldScroll = true) {
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
    bubble.textContent = content;
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
    // Avoid duplicate header if already added
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
  if (!text || state.isGenerating) return;

  const chat = getActiveChat();
  if (!chat) return;

  // Check if API key is present
  if (!state.apiKey && !state.hasEnvKey) {
    openSettings();
    return;
  }

  // Update title if first message
  if (chat.messages.length === 0) {
    chat.title = text.length > 32 ? text.substring(0, 32) + '...' : text;
  }

  // Append user message
  chat.messages.push({ role: 'user', content: text });
  appendMessageToDOM('user', text);

  // Clear input
  elements.userInput.value = '';
  adjustTextareaHeight();
  updateSendButtonState();

  // Show typing indicator
  state.isGenerating = true;
  elements.typingIndicator.style.display = 'flex';
  scrollToBottom();

  try {
    const historyPayload = chat.messages.slice(-10, -1);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: historyPayload,
        apiKey: state.apiKey,
        model: state.model
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error occurred.');
    }

    // Add assistant response
    chat.messages.push({ role: 'assistant', content: data.reply });
    appendMessageToDOM('assistant', data.reply);
    saveChats();

  } catch (err) {
    console.error('Chat error:', err);
    const errorMsg = `⚠️ **Error:** ${err.message}\n\n*Make sure your Gemini API key is valid and has not exceeded quota. Get your free key at [Google AI Studio](https://aistudio.google.com/).*`;
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
}

function adjustTextareaHeight() {
  const textarea = elements.userInput;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
}

function updateSendButtonState() {
  const hasText = !!elements.userInput.value.trim();
  elements.sendBtn.disabled = !hasText || state.isGenerating;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
