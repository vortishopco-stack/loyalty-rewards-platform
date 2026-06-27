# ☕ Loyalty & Rewards Platform (White-Label)

A complete, production-ready restaurant loyalty platform. Customers earn points
on visits, play mini-games, complete missions, and redeem rewards. Staff manage
customers, visits, and sign-up approvals. Admins manage everything.

Built with **Next.js 16 + Supabase**, configured for **GitHub Pages** static
deployment. Fully bilingual (English + Arabic, RTL).

> **🎯 Want to clone this for another restaurant?** See **[WHITE_LABEL_GUIDE.md](WHITE_LABEL_GUIDE.md)**
> — rebrand in under 30 minutes by editing one config file.

---

## ✨ Features

### Customer app
- Points dashboard with live balance
- Daily sign-in streaks with bonus multipliers
- Menu browsing (public — no login needed)
- **6 mini-games** (see below)
- Missions / challenges with point rewards
- Rewards store
- Visit & game history

### Employee portal
- Search customers by phone
- Add visits & award points
- Redeem rewards on behalf of customers
- **Sign-up approvals** — review and approve/reject new customer registrations

### Admin panel
- Analytics dashboard
- **Menu categories** — add/edit/delete/show-hide/reorder (with icon + color picker)
- Menu management with image upload
- Rewards CRUD
- Missions management
- Settings: points per $, signup bonus, daily sign-in points
- **Game management** — show/hide any game, set costs & cooldowns
- Game winnings config + spin wheel segments

### Platform
- Bilingual: English + Arabic with full RTL support
- Staff-only redemption (customers ask staff to redeem — prevents fraud)
- Public menu (anyone can browse without signing in)
- Sign-up approval workflow (staff approve new registrations)
- Mobile-first responsive design with sticky footer
- Static export — free hosting on GitHub Pages

---

## 🎮 Games (6 total)

| Game | Description | Admin toggle |
|------|-------------|--------------|
| 🍔 **Cup Catch** | Catch falling items in a basket | Show/Hide |
| ☕ **Bean Shooter** | Shoot coffee beans at targets | Show/Hide |
| 🎡 **Lounge Wheel** | Spin the wheel for instant prizes | Show/Hide |
| ⚽ **Predict the Match** | Predict a football match result | Show/Hide |
| 🥅 **Shoot on Target** | 5 penalty shots vs a diving keeper | Show/Hide |
| 🎟️ **Lucky Scratch** | Scratch card instant win | Show/Hide |

Each game has configurable **entry cost** (points), **cooldown** (hours between
plays), and **winnings tiers**. Admins can hide any game instantly — hidden
games disappear from the customer hub and are blocked from being played.

---

## 📦 What's in this ZIP

```
your-repo/
├── .github/workflows/deploy.yml   # GitHub Pages auto-deploy
├── .gitignore
├── .env.example                   # Environment variables template
├── README.md                      # ← Full deployment guide (this file)
├── SETUP_GUIDE.md                 # ← 5-minute quick start
├── WHITE_LABEL_GUIDE.md                   # ← Rebranding guide for new restaurants
├── package.json
├── bun.lock + package-lock.json   # Use either bun or npm
├── next.config.ts                 # Static export config
├── src/
│   ├── app/                       # Next.js app (page, layout, globals.css)
│   ├── lib/
│   │   ├── brand.ts               # ← ★ Rebrand here (name, tagline, colors)
│   │   ├── supabase.ts            # Supabase client + auth helper
│   │   ├── api.ts                 # All database functions
│   │   └── i18n/                  # English + Arabic translations
│   ├── components/
│   │   ├── admin/                 # Admin dashboard
│   │   ├── employee/              # Employee portal
│   │   ├── dashboard/             # Customer dashboard, games, menu, rewards
│   │   ├── games/                 # 6 game components
│   │   ├── auth/                  # Login + signup screen
│   │   └── ui/                    # shadcn/ui components
│   ├── store/                     # Zustand state
│   └── hooks/
├── public/
│   └── logo.svg                   # ← Replace with your logo
└── supabase/
    ├── schema.sql                 # ← Run first (tables + seed data)
    ├── seed.sql                   # ← Run second (demo users)
    ├── sample-menu-seed.sql          # Standalone menu/rewards seed
    ├── migrate-add-menu-categories.sql   # Migration: menu categories table
    ├── migrate-add-signup-approval.sql   # Migration: signup approval workflow
    ├── migrate-add-more-games.sql        # Migration: 3 new games + visibility
    └── fix-rls-recursion.sql             # Fix: RLS policy recursion
```

---

## 🚀 Deploy to GitHub Pages — Full Guide

### Prerequisites
- A **GitHub** account (free)
- A **Supabase** account (free tier is fine) — [supabase.com](https://supabase.com)

### Step 1 — Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → sign in → **New Project**
2. Name it `your-repo` (or anything), set a DB password, pick a region
3. Wait ~2 minutes for provisioning

### Step 2 — Get your API keys
**Project Settings** (gear) → **API** → copy:
- **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
- **anon public key**: `eyJhbGciOi...` (long JWT)

### Step 3 — Run the database schema
1. Supabase → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this ZIP, copy everything, paste, **Run**
3. This creates all tables, RLS policies, RPC functions, and seeds:
   - 6 menu categories (Main, Burgers, Coffee, Salads, Sides, Desserts)
   - 24 menu items (cafe-themed)
   - 12 rewards
   - 6 games with default costs/cooldowns
   - Default app settings (points per $, signup bonus, etc.)

### Step 4 — Create demo users (optional but recommended)
1. Supabase → **Authentication** → **Providers** → **Email** → turn OFF "Confirm email" → Save
2. **SQL Editor** → **New query** → paste `supabase/seed.sql` → **Run**
3. Creates 4 demo accounts:

| Role | Phone | Password |
|------|-------|----------|
| Admin | `000000` | `admin123` |
| Employee | `111111` | `emp123` |
| Customer | `123456` | `cust123` |
| Customer | `654321` | `cust123` |

> Must be run from Supabase SQL Editor (inserts into `auth.users`).

### Step 5 — Storage bucket (auto-created)
Running `schema.sql` in Step 3 **automatically creates** the `menu-images`
storage bucket (public, 5 MB file limit, images only) with the correct RLS
policies. **No manual setup needed.**

> If you skipped Step 3 or the bucket wasn't created, create it manually:
> Supabase → **Storage** → **New bucket** → Name: `menu-images` → **Public** = ON → **Save**.

### Step 6 — Push to GitHub
1. [github.com](https://github.com) → **New repository** → name it `your-repo`
2. Set **Public** (free Pages) — or Pro for private
3. Don't initialize with README/license
4. Unzip locally, then:
```bash
cd your-repo
git init
git add .
git commit -m "your business - initial deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/your-repo.git
git push -u origin main
```
### Step 7 — Configure GitHub Secrets
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name | Required | Value |
|-------------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase Project URL (Step 2) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anon public key (Step 2) |
| `NEXT_PUBLIC_BASE_PATH` | ✅ Yes | `/your-repo` (repo name with leading slash). **Set empty for custom domain.** |
| `CUSTOM_DOMAIN` | ❌ Optional | Your custom domain, e.g. `yourcafe.com` (only if using a custom domain — see below) |

> **`NEXT_PUBLIC_BASE_PATH`** cheat sheet:
> - GitHub Pages project site (`USERNAME.github.io/repo/`): set to `/repo-name`
> - Custom domain (`yourdomain.com`): set to **empty**
> - GitHub Pages user/org site (`USERNAME.github.io`): set to **empty**

### Step 8 — Enable GitHub Pages
**Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**

### Step 9 — Trigger the first deploy
**Actions** tab → "Deploy to GitHub Pages" running → wait 3-5 min →
**Settings → Pages** shows: `https://USERNAME.github.io/your-repo/`

🎉 **Done!**
---

## 🧪 Test locally

```bash
cd your-repo
npm install        # or: bun install

# Create .env.local with your Supabase keys (see .env.example):
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

npm run dev        # or: bun run dev
# Open http://localhost:3000
```

---

## 🌐 Custom domain (recommended for production)

Using a custom domain (e.g. `yourcafe.com`) instead of `USERNAME.github.io/repo/`
is free on GitHub Pages and makes your site look professional.

### Option A — Via GitHub UI (simplest)

1. **DNS provider**: add a **CNAME** record:
   - **Name/Host**: `yourcafe` (or `@` for root, or `www`)
   - **Value/Target**: `USERNAME.github.io` (your GitHub username)
   - TTL: default (or 600 seconds for faster propagation)
2. **GitHub repo**: **Settings → Pages → Custom domain** → enter `yourcafe.yourdomain.com` → **Save**
3. Wait for DNS to propagate (5 min – 24 hrs). GitHub shows a green ✓ when verified.
4. Check **Enforce HTTPS** (GitHub issues a free Let's Encrypt certificate automatically)
5. **Important — update the `NEXT_PUBLIC_BASE_PATH` secret to empty**:
   - Go to **Settings → Secrets → Actions** → edit `NEXT_PUBLIC_BASE_PATH` → set value to empty
   - Re-trigger a deploy: **Actions → Deploy to GitHub Pages → Run workflow**
   - With a custom domain, the site lives at the root (`https://yourcafe.com/`), so no base path is needed.

### Option B — Via CNAME file in the repo (automated)

The deploy workflow supports a `CUSTOM_DOMAIN` secret that automatically writes
a `CNAME` file to the build output:

1. Add a GitHub secret named `CUSTOM_DOMAIN` = `yourcafe.yourdomain.com`
2. Set `NEXT_PUBLIC_BASE_PATH` secret to **empty**
3. Push to main (or run the workflow manually)
4. The workflow writes `out/CNAME` automatically, and GitHub Pages serves the site at your domain.
5. Configure DNS as in Option A, step 1.

### DNS cheat sheet

| Domain type             | Record type | Name        | Target                |
|-------------------------|-------------|-------------|-----------------------|
| Subdomain (`app.foo.com`) | CNAME       | `app`       | `USERNAME.github.io`  |
| `www.foo.com`           | CNAME       | `www`       | `USERNAME.github.io`  |
| Root/apex (`foo.com`)   | A record    | `@`         | `185.199.108.153` (see below) |

GitHub Pages apex A records (use all four for redundancy):
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

---

## 💰 Supabase Free Tier — what you get & limits

This app is designed to run 100% on Supabase's **free tier** + GitHub Pages (also free).
Here's what you get and what to watch:

| Resource           | Free tier limit                          | This app's usage                         |
|---------------------|------------------------------------------|------------------------------------------|
| **Database**        | 500 MB                                   | ~1 MB for schema + seed data             |
| **Auth users**      | 50,000 MAU (monthly active users)        | One row per customer                     |
| **Storage**         | 1 GB                                     | Menu/reward images (~500 KB each = ~2000 images) |
| **Bandwidth**       | 5 GB/month egress                        | Static site assets served by GitHub Pages (free, unlimited) — only API calls count |
| **API requests**    | Unlimited (fair use)                     | One request per user action              |
| **Edge Functions**  | 500K invocations/month                   | Not used (all logic via RPC functions)   |
| **Concurrent connections** | 60 (direct), 200 (pooler)        | Static site uses connection pool         |

### When you'll need to upgrade (Supabase Pro = $25/month)
- More than ~500 MB of menu/reward images → upgrade Storage
- More than 50,000 active customers per month → upgrade Auth
- More than 5 GB/month API bandwidth → upgrade Bandwidth

For a single restaurant, the free tier comfortably handles thousands of customers.

### Free-tier best practices (already built in)
- ✅ **RLS enabled on every table** — no data leaks, no server needed
- ✅ **RPC functions** (add_visit, play_game, redeem_reward) — atomic operations, minimal round-trips
- ✅ **Storage policies** — admins upload, public reads (no auth for menu images = faster loads)
- ✅ **Phone-based auth** — no email service needed (saves the 4 emails/month Supabase Auth allows on free tier)
- ✅ **Static export** — all assets served by GitHub Pages (free, CDN-backed, unlimited bandwidth)
- ✅ **localStorage session persistence** — fewer auth API calls

### To stay within free limits
- Compress menu images before uploading (aim for < 500 KB each)
- Don't run the seed.sql demo data on your production project (only for testing)
- Delete inactive customers periodically if you expect > 10K users

---

## 🎨 Customization

### Quick rebrand (2 min)
Edit **`src/lib/brand.ts`** — change `name`, `tagline`, `description`. This
single file controls the restaurant name everywhere it appears.

### Full customization
See **[WHITE_LABEL_GUIDE.md](WHITE_LABEL_GUIDE.md)** for the complete guide:
- Logo replacement
- Brand colors (with color presets for different restaurant types)
- Menu categories (admin panel — no code)
- Menu items & rewards (admin panel — no code)
- Games show/hide, costs, cooldowns (admin panel — no code)
- Points settings (admin panel — no code)
- Sign-up approval workflow
- Languages & translations
- Full cloning checklist for a new restaurant

---

## 🔧 For existing deployments — migrations

If you already deployed an earlier version and want the new features, run
these migrations in Supabase SQL Editor (safe, re-runnable):

| Migration file | Adds |
|----------------|------|
| `supabase/migrate-add-menu-categories.sql` | Menu categories table + 6 defaults |
| `supabase/migrate-add-signup-approval.sql` | Signup approval workflow (status column) |
| `supabase/migrate-add-more-games.sql` | 3 new games + visibility settings |
| `supabase/fix-rls-recursion.sql` | Fixes RLS policy recursion on customers |
| `supabase/migrate-fix-auth-issues.sql` | **Auth fixes** — missions self-insert RLS policy (so new customers actually get their 3 default missions). Run this if sign-up was creating accounts with no missions. |

Run them in any order — each is idempotent.

---

## 📋 Production deployment checklist

### Supabase setup
- [ ] Supabase project created (free tier)
- [ ] `schema.sql` run in Supabase SQL Editor (creates tables + storage bucket + seed data)
- [ ] `seed.sql` run (for demo users — skip for production)
- [ ] Email confirmation disabled (Authentication → Providers → Email)
- [ ] `menu-images` Storage bucket visible in Dashboard (auto-created by schema.sql)

### GitHub setup
- [ ] Code pushed to GitHub repo (Public for free Pages, or Pro for private)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` secret set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` secret set
- [ ] `NEXT_PUBLIC_BASE_PATH` secret set (`/repo-name` OR empty for custom domain)
- [ ] (Optional) `CUSTOM_DOMAIN` secret set (only if using a custom domain)
- [ ] GitHub Pages source set to "GitHub Actions" (Settings → Pages)

### First deploy
- [ ] Actions tab shows "Deploy to GitHub Pages" run succeeded
- [ ] Site opens at `https://USERNAME.github.io/your-repo/`
- [ ] Can log in with admin (`000000` / `admin123`)
- [ ] Can upload a menu image (verifies storage bucket)

### Custom domain (optional, recommended for production)
- [ ] DNS CNAME/A record configured (see [Custom domain](#-custom-domain-recommended-for-production))
- [ ] Custom domain added in GitHub Settings → Pages
- [ ] `NEXT_PUBLIC_BASE_PATH` secret set to **empty**
- [ ] (Optional) `CUSTOM_DOMAIN` secret set for automated CNAME file
- [ ] HTTPS enforced (green lock in browser)
- [ ] Re-deploy triggered after clearing base path

### Post-launch
- [ ] Real admin/employee accounts created (delete demo accounts)
- [ ] Menu items, categories, rewards configured via admin panel
- [ ] Games show/hide + costs configured via admin settings
- [ ] Sign-up approval workflow tested (signup → employee approves → login)

---

## 🆘 Troubleshooting

**Blank page after deploy** — `NEXT_PUBLIC_BASE_PATH` doesn't match your repo
name. For `USERNAME.github.io/repo/`, set it to `/repo` (lowercase, leading
slash, no trailing slash). Re-run the workflow.

**"Supabase not configured"** — The 3 required secrets aren't reaching the
build. Verify them in GitHub Settings → Secrets. Check the Actions build log
— if the secrets show as empty, the workflow can't inject them.

**Can't log in with demo accounts** — You skipped Step 4 (running `seed.sql`),
or email confirmation is still ON. Re-check Authentication → Providers → Email.

**Menu images don't upload** — The `menu-images` bucket wasn't created (rare —
`schema.sql` auto-creates it) or isn't public. Verify in Supabase → Storage.
Re-run the storage INSERT from `schema.sql` (section 7) if missing.

**404 on page refresh** — Handled by the `404.html` SPA fallback. Ensure the
"Add 404.html" workflow step ran. If using a custom domain, make sure
`NEXT_PUBLIC_BASE_PATH` is empty.

**Custom domain shows GitHub 404** — DNS hasn't propagated yet (can take 24h),
or the CNAME points to the wrong target (must be `USERNAME.github.io`, not
`USERNAME.github.io/repo`). Check with `dig yourcafe.yourdomain.com`.

**"Account pending approval"** — This is the sign-up approval workflow (a
feature, not an error). New signups must be approved by staff. Sign in as
employee (`111111`) → **Approvals** tab → approve the pending customer.

**Assets 404 after switching to custom domain** — You forgot to clear
`NEXT_PUBLIC_BASE_PATH`. With a custom domain, it must be **empty**. Update
the secret and re-run the workflow.

**Supabase rate limit (429)** — Free tier has fair-use limits. If you see 429
errors, check Supabase Dashboard → Reports → API for usage spikes. For high
traffic, upgrade to Pro ($25/month).

---

## 📝 Tech stack

- **Framework**: Next.js 16 (App Router, static export)
- **Backend**: Supabase (Auth + PostgreSQL + Storage + RLS + RPC functions)
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **State**: Zustand
- **Icons**: Lucide
- **i18n**: Custom (English + Arabic, RTL-aware)
- **Deploy**: GitHub Pages via GitHub Actions

---

## 📄 License

This is your copy — modify and deploy freely. See **WHITE_LABEL_GUIDE.md** for
instructions on cloning it for other restaurants.

Enjoy your loyalty platform! ☕🎉
