# 🏷️ White-Label Guide — Reuse This Platform for Any Cafe or Restaurant

This is a **white-label loyalty & rewards platform**. One codebase → unlimited
restaurants. You clone it, change a handful of values, and you have a brand-new
branded app running on **free hosting** (GitHub Pages) with a **free backend**
(Supabase free tier). **No email is ever collected — customers sign in with a
phone number and password only.**

This guide takes you from a fresh copy to a launched, rebranded app. Most of it
is editing **two files** plus the in-app admin panel. Budget ~30 minutes for a
full rebrand, ~10 minutes if you only change the name and colors.

> Already deployed an older version and just want the new look / phone-only
> login? Jump to **[§9 Upgrading an existing deployment](#9-upgrading-an-existing-deployment)**.

---

## What you can change, and where

| What | Where | Code needed? |
|------|-------|--------------|
| Business name, tagline, language defaults | `src/lib/brand.ts` | 1 file |
| Colors / whole visual theme | `src/app/globals.css` (the `--brand-*` block) | 1 block |
| Logo | `public/logo.svg` | replace a file |
| Menu, categories, items, prices, photos | **Admin panel** (in-app) | none |
| Rewards | **Admin panel** | none |
| Games: show/hide, cost, cooldown, prizes | **Admin panel** | none |
| Points rules (per $, signup bonus, daily sign-in) | **Admin panel** | none |
| Languages / translations | `src/lib/i18n/locales/` | per-string |

The golden rule: **content is managed in the app, identity is two files.**

---

## 1. The one-file rebrand — `src/lib/brand.ts`

Open `src/lib/brand.ts` and edit the values. This single object controls the
business name everywhere it appears (header, login screen, page title, SEO).

```ts
export const BRAND = {
  name: 'Your Cafe',                 // English name — shown everywhere
  nameAr: 'مقهاك',                   // Arabic name (RTL mode)
  tagline: 'Earn. Play. Reward.',    // short slogan
  taglineAr: 'اكسب. العب. استبدل.',
  description: 'Earn points ...',    // browser-tab + SEO text

  emailDomain: 'yourcafe.local',     // ⚠️ see note below — phone-only login
  storageBucket: 'menu-images',      // keep as-is (matches schema.sql)
  storageKey: 'loyalty-auth',        // unique per brand; lowercase, no spaces
};
```

### ⚠️ About `emailDomain` (this is what makes login phone-only)

Customers **never enter an email**. Supabase Auth needs an email internally, so
the app invisibly turns a phone number into `{phone}@{emailDomain}` (e.g.
`555123@yourcafe.local`). Nobody sees it and **no email is ever sent**.

- For a **new** project, set it to anything private-looking: `yourcafe.local`.
- **Do not change it after go-live** — every existing account is keyed to it.
- It must **match the demo-user seed** if you use `supabase/seed.sql` (the seed
  ships with `yourcafe.local`; if you change the domain, update the seed too).

---

## 2. Recolor the whole app — one CSS block

Open `src/app/globals.css`. Near the top is a block labelled
**"THEME — Evergreen & Gold"**. You only need the three `--brand-*` pairs:

```css
:root {
  --brand-primary: #0E7C66;        /* main brand color */
  --brand-primary-rgb: 14,124,102; /* SAME color as r,g,b */
  --brand-accent:  #D9A521;        /* secondary / reward pop */
  --brand-accent-rgb: 217,165,33;
  --brand-deep:    #0A5A4A;        /* darker shade for gradient ends */
  --brand-deep-rgb: 10,90,74;
  ...
}
```

Every gradient, button, glass panel, progress bar, scrollbar and nav highlight
reads from these variables — change them once and the app re-themes itself.

If you want the **shadcn/ui components** (cards, inputs, badges, charts) to match
exactly, also update the semantic tokens just below: `--primary`, `--accent`,
`--background`, `--foreground`. They're written in **oklch**; the easiest path is
to paste a hex into any "hex → oklch" converter, or use one of the presets below
which already include both.

### Ready-made color presets

Copy a block over the `--brand-*` lines. (For `--primary` / `--accent` /
`--background` swaps, see the hex in the comment and convert, or keep the
default neutrals — the `--brand-*` variables alone already carry the personality.)

**Evergreen & Gold** _(default — fresh, premium, all-cuisine)_
```css
--brand-primary:#0E7C66; --brand-primary-rgb:14,124,102;
--brand-accent:#D9A521;  --brand-accent-rgb:217,165,33;
--brand-deep:#0A5A4A;    --brand-deep-rgb:10,90,74;
```

**Espresso & Cream** _(classic coffee house)_
```css
--brand-primary:#6F4E37; --brand-primary-rgb:111,78,55;
--brand-accent:#C8A15A;  --brand-accent-rgb:200,161,90;
--brand-deep:#4A3326;    --brand-deep-rgb:74,51,38;
```

**Berry & Plum** _(dessert bar, bubble tea, bakery)_
```css
--brand-primary:#8E2D5B; --brand-primary-rgb:142,45,91;
--brand-accent:#E8A23D;  --brand-accent-rgb:232,162,61;
--brand-deep:#5E1E3C;    --brand-deep-rgb:94,30,60;
```

**Midnight & Citrus** _(lounge, late-night, bar)_
```css
--brand-primary:#1F3A5F; --brand-primary-rgb:31,58,95;
--brand-accent:#F2B705;  --brand-accent-rgb:242,183,5;
--brand-deep:#13263F;    --brand-deep-rgb:19,38,63;
```

**Chili & Lime** _(taqueria, grill, fast-casual)_
```css
--brand-primary:#C0392B; --brand-primary-rgb:192,57,43;
--brand-accent:#7FB800;  --brand-accent-rgb:127,184,0;
--brand-deep:#8E2A20;    --brand-deep-rgb:142,42,32;
```

> Keep `*-rgb` numerically identical to its hex — they must be the same color.

---

## 3. Swap the logo

Replace **`public/logo.svg`** with your own (the favicon and login mark use it).
SVG is sharpest, but a square PNG works too — if you use PNG, also update the
icon path in `src/app/layout.tsx` (`icons.icon`). Aim for a square, ~512×512
artwork that reads well at small sizes.

---

## 4. Fonts (optional)

Headings/body use **Geist** via `next/font/google` in `src/app/layout.tsx`.
To change, swap the import, e.g.:

```ts
import { Poppins, Inter } from "next/font/google";
```

and update the two `--font-*` variables. Leave it as-is if you're unsure —
Geist is clean and neutral. (Arabic text falls back to the system Arabic font;
for a custom Arabic face, add it and set it on `[dir="rtl"]` in `globals.css`.)

---

## 5. Database — one script, phone-only, free tier

In Supabase → **SQL Editor**, run **`supabase/schema.sql`** once. It creates all
tables, security policies, the points logic, the `menu-images` storage bucket,
and a small generic starter menu. **No email column is required** — the schema
ships email as optional.

Optional extras:
- **`supabase/seed.sql`** — 4 demo accounts for testing (delete before launch).
- **`supabase/sample-menu-seed.sql`** — a larger neutral demo menu/rewards set.

Then in Supabase: **Authentication → Providers → Email → turn OFF "Confirm
email"** and **Save**. This is required even though customers don't see an email,
because login uses the synthesized address under the hood. No SMTP, no email
service, nothing to pay for.

### Demo accounts (from `seed.sql`)

| Role | Phone | Password |
|------|-------|----------|
| Admin | `000000` | `admin123` |
| Employee | `111111` | `emp123` |
| Customer | `123456` | `cust123` |

> Phone numbers `000000` and `111111` are mapped to the admin/employee roles in
> code (`getDefaultRole` in `src/lib/api.ts`). Change those mappings, or just
> create your real staff accounts and delete the demos before going live.

---

## 6. Deploy free on GitHub Pages

1. Push the code to a new GitHub repo (Public = free Pages).
2. **Settings → Secrets and variables → Actions** — add:

   | Secret | Value |
   |--------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `NEXT_PUBLIC_BASE_PATH` | `/your-repo-name` — **or empty** for a custom domain |
   | `CUSTOM_DOMAIN` _(optional)_ | e.g. `loyalty.yourcafe.com` |

3. **Settings → Pages → Source: GitHub Actions**. Push → the included workflow
   (`.github/workflows/deploy.yml`) builds the static export and publishes it.

Full deploy walkthrough, custom-domain DNS, and troubleshooting are in
**README.md**.

> The build downloads the Geist font from Google Fonts at build time and
> self-hosts it into the output. GitHub Actions has internet access, so this
> just works; if you build on an offline machine, swap to a system font in
> `layout.tsx` first.

---

## 7. Configure everything else from the Admin panel (no code)

Log in as the admin (`000000` / `admin123`, or your real admin) and set up:

- **Menu** — categories (icon + color), items, prices, photos, show/hide.
- **Rewards** — name, description, point cost, availability.
- **Missions** — challenges that grant points.
- **Games** — show/hide each of the 6 games, set entry cost, cooldown, and
  prize tiers; configure the spin-wheel segments.
- **Settings** — points per $ spent, signup bonus, daily sign-in points.
- **Approvals** (Employee portal) — new customer signups arrive as *pending*;
  staff approve them before the customer can log in (anti-fraud).

This is where each restaurant becomes itself — two installs can share the
codebase yet look and behave completely differently with zero code changes.

---

## 8. New-restaurant launch checklist

**Identity (code — once)**
- [ ] `src/lib/brand.ts`: name, tagline, description, `emailDomain`, `storageKey`
- [ ] `src/app/globals.css`: `--brand-*` colors (and optionally semantic tokens)
- [ ] `public/logo.svg`: real logo

**Backend (Supabase — free)**
- [ ] New Supabase project created
- [ ] `schema.sql` run (tables + bucket + starter data)
- [ ] Email confirmation turned **OFF**
- [ ] Real admin + employee accounts created; demo accounts deleted
- [ ] Did **not** run `seed.sql` on the production project (demo only)

**Hosting (GitHub Pages — free)**
- [ ] Repo created and pushed
- [ ] 3 required secrets set (URL, anon key, base path)
- [ ] Pages source = GitHub Actions; first deploy green
- [ ] Site loads; can log in by **phone only** (no email field on signup ✅)

**Content (Admin panel)**
- [ ] Menu categories + items + photos
- [ ] Rewards
- [ ] Games shown/hidden + costs + prizes
- [ ] Points settings tuned

---

## 9. Upgrading an existing deployment

If you previously ran a version where signup asked for an email (and the
`customers.email` column was required), apply the phone-only change safely:

1. Run **`supabase/migrate-phone-only-auth.sql`** in the SQL Editor. It makes
   `email` optional and removes its uniqueness requirement. Existing rows are
   untouched; it's idempotent.
2. Redeploy the updated frontend (the signup form no longer has an email field).

Other migrations (all idempotent, run in any order) remain available in
`supabase/`: menu categories, signup approval, extra games, and the RLS fix.

---

## 10. Staying inside the free tiers

Built-in already: phone-only auth (no email service), static hosting (GitHub
serves all assets — only API calls hit Supabase), row-level security, and atomic
RPC functions to minimize round-trips. To stay comfortable on free:

- Compress menu/reward images before upload (< 500 KB each).
- Don't load `seed.sql` demo data into production.
- One Supabase project per restaurant keeps quotas and data cleanly separated.

A single restaurant with thousands of customers fits the free tier with room to
spare. See README → *Supabase Free Tier* for the exact limits.

---

## Where things live (quick map)

```
src/lib/brand.ts          ← name, tagline, phone-only email domain  ★ edit
src/app/globals.css       ← --brand-* colors / whole theme          ★ edit
public/logo.svg           ← logo                                    ★ replace
src/lib/i18n/locales/     ← English + Arabic strings
src/lib/api.ts            ← phone↔login logic, role mapping
src/components/           ← admin / employee / customer / games / ui
supabase/schema.sql       ← run once: tables, policies, bucket, starter data
supabase/seed.sql         ← optional demo accounts (testing only)
supabase/sample-menu-seed.sql      ← optional larger demo menu
supabase/migrate-phone-only-auth.sql ← upgrade older installs to phone-only
.github/workflows/deploy.yml       ← GitHub Pages auto-deploy
```

That's it — change the two files, drop in a logo, run one SQL script, set three
secrets, and configure the rest from the admin panel. Enjoy your platform. ☕
