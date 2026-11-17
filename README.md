# 🚀 My First AI Project (ChatGPT & Gemini Clone)
*Inspired by Rohit Negi's "Create Your FIRST AI Project" YouTube Guide*

A full-stack, responsive, resume-ready AI Chatbot application powered by **Google Gemini API** (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`), built with **Node.js, Express, JavaScript, HTML5, and CSS3**.

---

## ✨ Features
- 💬 **ChatGPT-like Modern UI:** Clean Dark & Light theme with glowing AI accents.
- ⚡ **Multi-Model Support:** Switch seamlessly between Gemini 1.5 Flash, 2.0 Flash, and 1.5 Pro.
- 📝 **Markdown & Code Highlighting:** Formats AI answers with syntax highlighting and a 1-click **Copy Code** button.
- 💾 **Local Chat History:** Remembers previous conversations using `localStorage`.
- ⚙️ **In-App API Key Manager:** Set your free Gemini API key directly from the browser UI or in `.env`.
- 🎯 **One-Click Local Launcher:** Double-click `start-app.bat` on Windows to install dependencies and open browser automatically.
- 🌐 **1-Click Vercel Deployment:** Pre-configured `vercel.json` for free production deployment.

---

## 🏃 Quick Start (Local Setup)

### Option 1: Double-Click Launcher (Easiest)
Simply double-click the **`start-app.bat`** file inside this folder.  
It will automatically install packages and open your browser at `http://localhost:3000`.

### Option 2: Terminal / Command Prompt
```bash
# 1. Navigate to the project directory
cd "C:\Users\DELL\OneDrive\Desktop\My-First-AI-Project"

# 2. Install dependencies
npm install

# 3. Start the application
npm start
```
Now open your browser and visit: **`http://localhost:3000`**

---

## 🔑 How to get your FREE Gemini API Key (30 Seconds)
1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Sign in with your Google account.
3. Click **"Create API Key"** (or **"Get API key"**).
4. Copy the generated key (starts with `AIzaSy...`).
5. In your web app, click **"API Key & Settings"** in the sidebar, paste your key, and click **Save & Connect**!  
*(Alternatively, paste it into the `.env` file as `GEMINI_API_KEY=your_key_here`)*.

---

## ☁️ Step-by-Step Vercel Deployment (Rohit Negi Method)

Deploy your chatbot online for free so you can share it with friends and put it on your resume!

### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "My First AI Project - Rohit Negi Guide"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-first-ai-project.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your `my-first-ai-project` repository.
4. In the **Environment Variables** section:
   - Name: `GEMINI_API_KEY`
   - Value: *(Your Gemini API key)*
5. Click **"Deploy"**.
6. Within 1 minute, Vercel will give you a live production URL (e.g., `https://my-first-ai-project.vercel.app`)!

---

## 📁 Project Structure
```
My-First-AI-Project/
├── public/
│   ├── index.html       # Full responsive ChatGPT / Gemini web UI
│   ├── style.css        # Modern Dark & Light theme stylesheet
│   └── app.js           # Client chat engine, history & marked parser
├── server.js            # Express API server with Gemini endpoint
├── package.json         # Node.js dependencies & scripts
├── vercel.json          # Vercel deployment configuration
├── start-app.bat        # One-click Windows desktop launcher
├── .env.example         # Environment template
└── README.md            # Documentation guide
```
