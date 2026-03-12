# ☕ Brewhaus Café — E-Commerce Ordering System

A full-featured café ordering website with real-time admin dashboard, Firebase auth & Firestore, and QR table ordering.

---

## 🚀 Quick Start

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** → Name it `brewhaus-cafe`
3. Enable **Google Analytics** (optional)

### 2. Enable Firebase Services

#### Authentication
1. Firebase Console → **Authentication** → **Sign-in method**
2. Enable:
   - ✅ **Google** (configure your project)
   - ✅ **Email/Password**
   - ✅ **Phone** (requires billing plan)

#### Firestore Database
1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **production mode**
3. Select your region

#### Firestore Security Rules
Go to Firestore → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Orders: users can create and read their own
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || request.auth.token.admin == true);
      allow update: if request.auth != null; // Staff can update status
    }
    // Menu is publicly readable
    match /menu/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### 3. Configure Firebase in the App

1. Firebase Console → **Project Settings** ⚙️ → **Your apps**
2. Click **"Add app"** → Web (`</>`)
3. Copy the `firebaseConfig` object
4. Open `js/firebase.js` and replace:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Set Admin Emails

In `js/admin.js`, update the admin email list:

```javascript
const ADMIN_EMAILS = ['your-staff@email.com', 'another-staff@email.com'];
```

### 5. Enable Google Sign-In Domain

Firebase Console → Authentication → Settings → **Authorized domains**
Add your Vercel domain: `your-app.vercel.app`

---

## 🌐 Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)
1. Push this folder to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Select your GitHub repo
4. Click Deploy — done!

### Option B: Vercel CLI
```bash
npm install -g vercel
cd coffee-cafe
vercel --prod
```

---

## 📁 Project Structure

```
coffee-cafe/
├── index.html          # Home page with hero & featured menu
├── menu.html           # Full menu with category filter & search
├── cart.html           # Cart + checkout + order status tracker
├── orders.html         # Customer order history & live tracking
├── login.html          # Google / Email / Phone OTP auth
├── admin.html          # Staff real-time dashboard
├── vercel.json         # Vercel routing config
├── css/
│   └── style.css       # Full dark coffee theme
└── js/
    ├── firebase.js     # Firebase init + menu data
    ├── auth.js         # All auth methods + toast system
    ├── cart.js         # Cart logic + order placement
    ├── menu.js         # Menu rendering + QR table detection
    └── admin.js        # Real-time orders + QR generator
```

---

## ✨ Features

### Customer Side
- 🏠 **Home** — Hero section, featured drinks, about
- 📋 **Menu** — Filter by category, search, add to cart
- 🛒 **Cart** — Quantity control, remove items, subtotal + tax
- 📦 **Checkout** — Name, table/pickup, special notes
- 📱 **Order Tracker** — Live status steps (Pending → Ready)
- 📋 **Order History** — All past orders with real-time status

### Authentication
- 🔑 **Google Sign-In** — One-click OAuth
- ✉ **Email/Password** — Sign up & login with validation
- 📱 **Phone OTP** — SMS verification code

### Staff Dashboard (`/admin.html`)
- 📊 **Live Stats** — Pending, preparing, completed, revenue
- 🔴 **Real-time Orders** — Firestore live listener
- 📦 **Status Updates** — Accept → Preparing → Ready → Complete
- 🔔 **Sound + Browser Notifications** — Alert on new orders
- 📱 **QR Code Generator** — Per-table ordering codes

### Bonus Features
- 📍 **QR Table Ordering** — Customers scan QR → menu pre-loads their table
- 🧾 **Order Number System** — Human-readable IDs (e.g. `BH0930-847`)
- 💾 **Offline Cart** — LocalStorage persists between sessions
- 🌐 **Mobile Responsive** — Works on all screen sizes

---

## 🎨 Design System

| Token | Color | Use |
|-------|-------|-----|
| `--espresso` | `#2C1B12` | Deep backgrounds |
| `--mocha` | `#3E2723` | Card backgrounds |
| `--gold` | `#C8965A` | Primary accent, CTAs |
| `--cream` | `#F5F5F5` | Primary text |
| `--latte` | `#D7CCC8` | Secondary elements |

Fonts: **Playfair Display** (headings) + **DM Sans** (body)

---

## 🔧 Customization

### Add Menu Items
Edit `MENU_ITEMS` array in `js/firebase.js`:
```javascript
{ id: 'oat-latte', category: 'specialty', name: 'Oat Latte', 
  description: 'Espresso with creamy oat milk', price: 5.50, emoji: '🌾', popular: false }
```

### Change Café Name/Branding
Find and replace `Brewhaus` in all HTML files.

### Add Categories
1. Add items with the new `category` value in `firebase.js`
2. Add a filter button in `menu.html`:
   ```html
   <button class="category-btn" data-category="smoothies">🥤 Smoothies</button>
   ```

---

## 📞 Support

For Firebase setup issues: [Firebase Docs](https://firebase.google.com/docs)  
For Vercel deployment: [Vercel Docs](https://vercel.com/docs)
