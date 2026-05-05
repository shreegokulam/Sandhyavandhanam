# 🌅 Rhythm — Daily Activity Tracker
### React + Netlify Functions + Supabase

Track 3 fixed daily activities across **Morning**, **Afternoon**, and **Evening** — with per-slot counters, done toggles, and a 7-day history view.

---

## 🗂️ Project Structure

```
daily-tracker/
├── netlify.toml                    # Netlify build + redirect config
├── package.json                    # React app dependencies
├── supabase-setup.sql              # Run once in Supabase SQL Editor
├── .env.example                    # Env variable template
├── public/index.html
├── src/
│   ├── App.js                      # Auth context + routing
│   ├── App.css                     # All styles
│   ├── index.js
│   └── components/
│       ├── AuthPage.js             # Login + Register UI
│       └── Dashboard.js            # Main activity dashboard
└── netlify/functions/
    ├── package.json                # @supabase/supabase-js
    ├── auth.js                     # /register + /login
    └── activities.js               # /today + /log + /history
```

---

## 🚀 Deployment Guide

### Step 1 — Set up Supabase (free, ~5 min)

1. Go to **https://supabase.com** → Sign up free
2. Click **"New project"** → name it `daily-tracker` → set a DB password → Create
3. Wait ~1 minute for it to spin up
4. Go to **SQL Editor** (left sidebar) → **New query**
5. Paste the entire contents of `supabase-setup.sql` → click **Run**
6. Go to **Project Settings** → **API** and copy:
   - **Project URL** (e.g. `https://abcxyz.supabase.co`)
   - **service_role** secret key (under "Project API keys")

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/daily-tracker.git
git push -u origin main
```

### Step 3 — Deploy on Netlify

1. **https://netlify.com** → Add new site → Import from GitHub → select repo
2. Build settings auto-fill from `netlify.toml` ✅
3. Click **"Show advanced"** → add these environment variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Project URL |
| `SUPABASE_SERVICE_KEY` | Your `service_role` key |
| `REACT_APP_API_URL` | `/.netlify/functions` |

4. Click **Deploy site** 🎉

---

## 💻 Local Dev

```bash
npm install
cd netlify/functions && npm install && cd ../..
cp .env.example .env.local   # fill in your Supabase keys
npx netlify dev              # runs at http://localhost:8888
```

---

## 🔧 Customize Activities

In `src/components/Dashboard.js`, edit the `SLOTS` array:

```js
const SLOTS = [
  { key: 'morning',   label: 'Morning',   icon: '🌅', activity: 'Exercise / Movement' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', activity: 'Reading / Learning' },
  { key: 'evening',   label: 'Evening',   icon: '🌙', activity: 'Meditation / Reflection' },
];
```
