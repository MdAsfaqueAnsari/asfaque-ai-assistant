const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auto-redirect root to /asfaque-ai-assistant so custom name always appears in URL bar
app.get('/', (req, res) => {
  res.redirect('/asfaque-ai-assistant');
});

// Dedicated route for Asfaque's AI Assistant
app.get('/asfaque-ai-assistant', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Static assets (CSS, JS, icons) without default index.html hijack
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'My First AI Project server is running smoothly!',
    hasEnvKey: !!process.env.GEMINI_API_KEY
  });
});

// Map deprecated model names to active Gemini 3.x models
const MODEL_MAP = {
  'gemini-1.5-flash': 'gemini-3.5-flash-lite',
  'gemini-1.5-pro': 'gemini-3.5-flash-lite',
  'gemini-2.0-flash': 'gemini-3.5-flash-lite',
  'gemini-2.5-flash': 'gemini-3.5-flash-lite',
  'gemini-2.5-pro': 'gemini-3.5-flash-lite'
};

// Resilient priority list of available models for free tier
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash'
];

// Helper to determine mimeType
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.txt': return 'text/plain';
    case '.csv': return 'text/csv';
    case '.json': return 'application/json';
    case '.md': return 'text/markdown';
    default: return 'application/octet-stream';
  }
}

// Helper to detect local path in text
function extractLocalFilePath(text) {
  if (!text) return null;
  // Match Windows paths like C:\folder\file.ext or "C:\folder\file.ext"
  const winMatch = text.match(/([a-zA-Z]:\\[^\r\n"':*?<>|]+?\.(pdf|png|jpe?g|webp|gif|txt|csv|json|md))/i);
  if (winMatch && fs.existsSync(winMatch[1].trim())) {
    return winMatch[1].trim();
  }
  // Match forward slash paths C:/folder/file.ext
  const slashMatch = text.match(/([a-zA-Z]:\/[^\r\n"':*?<>|]+?\.(pdf|png|jpe?g|webp|gif|txt|csv|json|md))/i);
  if (slashMatch && fs.existsSync(slashMatch[1].trim())) {
    return slashMatch[1].trim();
  }
  return null;
}

async function callGemini(model, key, contents) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{
          text: 'You are an intelligent, helpful, and friendly AI Assistant created as a First AI Project following Rohit Negi\'s tutorial. Format responses cleanly with Markdown, including syntax highlighting for code blocks, bullet points, tables, and headers where appropriate. You have full capability to analyze documents, PDFs, images, and data.'
        }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data, model };
}

// Chat endpoint with Gemini API and auto-resilience
app.post('/api/chat', async (req, res) => {
  try {
    let { message, history, apiKey, model, file } = req.body;

    if ((!message || typeof message !== 'string' || !message.trim()) && !file) {
      return res.status(400).json({ error: 'Please enter a message or upload a file.' });
    }

    message = (message || '').trim();
    const key = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(401).json({
        error: 'Gemini API Key missing! Please enter your free Gemini API key in Settings or add it to .env. Get one free at: https://aistudio.google.com/'
      });
    }

    // Automatically normalize deprecated model names
    if (model && MODEL_MAP[model]) {
      model = MODEL_MAP[model];
    }
    if (!model) {
      model = 'gemini-3.5-flash-lite';
    }

    // Format conversation history for Gemini API
    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn && turn.role && turn.content) {
          contents.push({
            role: turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(turn.content) }]
          });
        }
      }
    }

    // Build user turn parts
    const userParts = [];
    if (message) {
      userParts.push({ text: message });
    }

    // 1. Check if user attached a file via upload
    if (file && file.data && file.mimeType) {
      userParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    } else {
      // 2. Check if the message contains a local file path on this computer
      const detectedLocalPath = extractLocalFilePath(message);
      if (detectedLocalPath) {
        try {
          const mimeType = getMimeType(detectedLocalPath);
          const fileBuffer = fs.readFileSync(detectedLocalPath);
          
          if (mimeType.startsWith('text/') || detectedLocalPath.endsWith('.json') || detectedLocalPath.endsWith('.csv')) {
            userParts.push({
              text: `\n\n--- Content of local file [${path.basename(detectedLocalPath)}] ---\n` + fileBuffer.toString('utf-8')
            });
          } else {
            // PDF or image
            userParts.push({
              inlineData: {
                mimeType: mimeType,
                data: fileBuffer.toString('base64')
              }
            });
          }
          console.log(`[File Auto-Loaded]: ${detectedLocalPath} (${fileBuffer.length} bytes, ${mimeType})`);
        } catch (fileErr) {
          console.warn('Could not read detected local file:', fileErr.message);
        }
      }
    }

    contents.push({
      role: 'user',
      parts: userParts
    });

    // Try primary requested model, then fallbacks if needed
    const modelsToTry = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
    let lastResult = null;

    for (const tryModel of modelsToTry) {
      const result = await callGemini(tryModel, key, contents);
      if (result.ok) {
        const candidate = result.data.candidates?.[0];
        const replyText = candidate?.content?.parts?.map(p => p.text).join('') || 'No response generated.';
        return res.json({
          reply: replyText,
          model: tryModel,
          finishReason: candidate?.finishReason || 'STOP'
        });
      }

      lastResult = result;
      // If it's an auth error (401), stop immediately
      if (result.status === 401) {
        break;
      }
      console.warn(`Model ${tryModel} returned ${result.status}, trying fallback...`);
    }

    const errorMsg = lastResult?.data?.error?.message || `Gemini API error (Status: ${lastResult?.status})`;
    return res.status(lastResult?.status || 500).json({ error: errorMsg });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'An unexpected error occurred while communicating with AI service: ' + err.message
    });
  }
});

// Dedicated route for Asfaque's AI Assistant
app.get('/asfaque-ai-assistant', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Auto-redirect root to /asfaque-ai-assistant so the custom English name always appears in the URL bar
app.get('/', (req, res) => {
  res.redirect('/asfaque-ai-assistant');
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=================================================`);
    console.log(`🚀 Asfaque's AI Assistant is LIVE!`);
    console.log(`🌐 URL: http://localhost:${PORT}/asfaque-ai-assistant`);
    console.log(`🌐 Custom Name: http://asfaque-ai-assistant:${PORT}/asfaque-ai-assistant`);
    console.log(`📎 PDF & File Upload: ENABLED`);
    console.log(`💻 Local File Path Detection: ENABLED`);
    console.log(`=================================================\n`);
  });
}

module.exports = app;
