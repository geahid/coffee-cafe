# 🚀 How to Deploy to Vercel (Step by Step)

## ✅ Method 1: Drag & Drop (Easiest — No Git needed!)

1. Go to https://vercel.com and sign in
2. Click **"Add New Project"**
3. Click **"Import from local"** or drag your `coffee-cafe` folder
4. Click **Deploy** — done in 30 seconds!

---

## ✅ Method 2: Via GitHub + Vercel

### Step 1 — Initialize Git (run these in your coffee-cafe folder)
```bash
git init
git add .
git commit -m "Initial commit: Brewhaus Café"
```

### Step 2 — Push to GitHub
```bash
# Create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/coffee-cafe.git
git branch -M main
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Click **Deploy**

---

## ✅ Method 3: Vercel CLI (requires login first!)
```bash
# Login first (opens browser)
vercel login

# Then deploy
cd coffee-cafe
vercel --prod
```

---

## ⚠️ If CSS still doesn't load after deploy

Check your browser console (F12 → Console tab) for errors.
Common fix: Make sure you're visiting the root URL, e.g.:
`https://your-app.vercel.app/` (not a subfolder)

