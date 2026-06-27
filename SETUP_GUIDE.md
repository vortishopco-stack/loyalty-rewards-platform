# ⚡ SETUP_GUIDE.md — Quick Start

> **New here?** This is the 5-minute version. For full details see **README.md**.
> For rebranding/customization see **WHITE_LABEL_GUIDE.md**.

---

## 1. Supabase setup (3 min)

1. Go to [supabase.com](https://supabase.com) → **New Project** → wait 2 min
2. **SQL Editor** → paste `supabase/schema.sql` → **Run**
3. (Optional) paste `supabase/seed.sql` → **Run** (adds demo users)
4. **Authentication** → **Providers** → **Email** → turn OFF "Confirm email"
5. **Storage** → **New bucket** → name: `menu-images` → **Public** = ON

## 2. Get your keys (30 sec)

**Project Settings** → **API** → copy:
- **Project URL** (`https://xxxx.supabase.co`)
- **anon public key** (`eyJhbGci...`)

## 3. Deploy to GitHub Pages (3 min)

1. Create a GitHub repo (e.g. `your-repo`)
2. Push this code:
   ```bash
   git init && git add . && git commit -m "initial"
   git remote add origin https://github.com/YOU/your-repo.git
   git push -u origin main
   ```
3. Add 3 **Secrets** (Settings → Secrets → Actions):

   | Secret | Value |
   |--------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_BASE_PATH` | `/your-repo` (or empty for a custom domain) |

4. **Settings** → **Pages** → Source: **GitHub Actions**

## 4. Done! 🎉

Your site is live at `https://USERNAME.github.io/your-repo/`

**Demo accounts** (if you ran `seed.sql`):

| Role | Phone | Password |
|------|-------|----------|
| Admin | `000000` | `admin123` |
| Employee | `111111` | `emp123` |
| Customer | `123456` | `cust123` |

---

## Test locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev                  # open http://localhost:3000
```

---

## Customize for your restaurant

👉 **See [CUSTOMIZE.md](CUSTOMIZE.md)** for the full guide.

**Quickest rebrand** — edit `src/lib/brand.ts`:
```ts
export const BRAND = {
  name: "Your Restaurant Name",
  nameAr: "اسم مطعمك",
  tagline: 'Your Tagline',
  ...
}
```
