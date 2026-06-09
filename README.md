# KAMZYBOT'S MEDIA

Premium Social Media Logs & Digital Services.  
Stack: **React 19 + Vite + TypeScript + Tailwind CSS v4 + Supabase + Cloudflare Pages**

---

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Environment — `.env` is pre-filled with your keys.
The only thing to double-check is `SUPABASE_SERVICE_ROLE_KEY` is set for the API server.

### 3. Run frontend only
```bash
npm run dev
```

### 4. Run with API server (Replit / full local dev)
```bash
npm run dev:full
```

---

## Deploy to Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Add all env vars in Cloudflare Pages Settings → Environment Variables

## Deploy to Replit
- Run command: `npm run dev:full`
- Add all env vars in Replit Secrets

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Homepage |
| `/login` | User login |
| `/register` | Register |
| `/dashboard` | User shop & dashboard |
| `/dashboard/products` | My purchases |
| `/dashboard/orders` | Order history |
| `/dashboard/profile` | Profile |
| `/wallet` | Wallet top-up |
| `/products` | Public catalog |
| `/shop` | Authenticated shop |
| `/about` | About |
| `/contact` | Contact |
| `/admin` | Admin login |
| `/manage` | Admin panel |
| `/manage/products` | Products & credentials |
| `/manage/orders` | All orders |
| `/manage/users` | Users |
| `/manage/coupons` | Coupons |
| `/manage/payments` | Payment records |
| `/manage/admins` | Admins |
| `/manage/password` | Change password |
