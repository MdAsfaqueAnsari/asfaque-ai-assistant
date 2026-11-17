const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'My First AI Project server is running smoothly!',
    hasEnvKey: !!process.env.GEMINI_API_KEY
  });
});

// Chat endpoint with Gemini API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, apiKey, model = 'gemini-1.5-flash' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a message.' });
    }

    // Use user-provided key OR environment variable
    const key = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(401).json({
        error: 'Gemini API Key missing! Please enter your free Gemini API key in Settings or add it to .env. Get one free at: https://aistudio.google.com/'
      });
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

    // Append the new user question
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: 'You are an intelligent, helpful, and friendly AI Assistant created as a First AI Project following Rohit Negi\'s tutorial. Format responses cleanly with Markdown, including syntax highlighting for code blocks, bullet points, and headers where appropriate.'
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

    if (!response.ok) {
      const errorMsg = data.error?.message || `Gemini API error (Status: ${response.status})`;
      console.error('Gemini API Error:', data.error);
      return res.status(response.status).json({ error: errorMsg });
    }

    // Extract text from Gemini response
    const candidate = data.candidates?.[0];
    const replyText = candidate?.content?.parts?.map(p => p.text).join('') || 'No response generated.';

    res.json({
      reply: replyText,
      model: model,
      finishReason: candidate?.finishReason || 'STOP'
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'An unexpected error occurred while communicating with AI service: ' + err.message
    });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server if not running in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 My First AI Project is LIVE!`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`💡 Created following Rohit Negi's AI Project guide`);
    console.log(`=================================================\n`);
  });
}

module.exports = app;
