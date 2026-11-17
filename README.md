# 🚀 Asfaque's AI Assistant
*Powered by Google Gemini 3.5 API, Node.js, Express & Modern Vanilla Web Stack*

Live GitHub Repository: **[https://github.com/asfaque19/asfaque-ai-assistant](https://github.com/asfaque19/asfaque-ai-assistant)**

---

## ✨ Features
- 💬 **ChatGPT-style Modern UI:** Responsive Dark & Light themes with glowing accents.
- 📎 **Document & PDF Analysis:** Automatically reads local PDFs/documents or uploads via 📎 paperclip button.
- ⚡ **Multi-Model Support:** Google Gemini 3.5 Flash Lite (Ultra Fast), Gemini 3.5 Flash, Gemini 3.8 Flash.
- 📝 **Markdown & Code Highlighting:** Formats responses cleanly with code syntax highlighting and 1-click **Copy** button.
- 💾 **Local Chat History:** Remembers previous conversations using `localStorage`.
- ⚙️ **In-App API Key Manager:** Set your free Gemini API key directly from the browser UI or in `.env`.
- 🌐 **Cross-Device Ready:** Works on your local PC, across your local Wi-Fi network (mobile/tablet), or deployed online.
- ☁️ **1-Click Vercel Deployment:** Pre-configured `vercel.json` for live cloud deployment with URL `https://asfaque-ai-assistant.vercel.app`.

---

## 🏃 Quick Start (How to Run)

### 1. On this computer (Localhost):
Double-click **`start-app.bat`** on your Desktop, or run:
```bash
npm install
npm start
```
Then visit: **`http://localhost:3000/asfaque-ai-assistant`**

### 2. On other devices in your home/office (Mobile / Laptop on same Wi-Fi):
Open browser on your phone/tablet connected to the same Wi-Fi and visit:
👉 **`http://192.168.1.104:3000/asfaque-ai-assistant`**

### 3. On ANY other computer anywhere in the world:
Anyone can clone this GitHub repo:
```bash
git clone https://github.com/asfaque19/asfaque-ai-assistant.git
cd asfaque-ai-assistant
npm install
npm start
```

---

## ☁️ 1-Click Vercel Deployment (Permanent Online URL)
Deploy online for 24/7 access with URL **`https://asfaque-ai-assistant.vercel.app`**:

1. Go to **[Vercel](https://vercel.com/new)** and click **Continue with GitHub**.
2. Under "Import Git Repository", find **`asfaque19/asfaque-ai-assistant`** and click **Import**.
3. Under **Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: `YOUR_GEMINI_KEY`
4. Click **Deploy**!
5. Your assistant is now live on the internet at: **`https://asfaque-ai-assistant.vercel.app`**!

---

## 📄 License
MIT © Asfaque
