/**
 * ============================================================================
 *  BRAND CONFIG — EDIT THIS ONE FILE TO REBRAND THE ENTIRE APP
 * ============================================================================
 *
 *  This is a white-label loyalty & rewards platform. To launch it for a new
 *  cafe or restaurant, change the values below. Colors live in
 *  src/app/globals.css (the --brand-* variables). The logo is
 *  public/logo.svg. Everything else — menu, rewards, games, points — is
 *  managed from the in-app Admin panel (no code).
 *
 *  Full step-by-step instructions: WHITE_LABEL_GUIDE.md
 *
 *  After editing, rebuild:  npm run build   (or:  bun run build)
 * ============================================================================
 */

export const BRAND = {
  /** Public-facing business name (English) — shown across the whole app */
  name: 'Your Cafe',

  /** Public-facing business name (Arabic) — used in RTL mode */
  nameAr: 'مقهاك',

  /** Short marketing tagline (English) */
  tagline: 'Earn. Play. Reward.',

  /** Short marketing tagline (Arabic) */
  taglineAr: 'اكسب. العب. استبدل.',

  /** SEO meta description (browser tab + search results) */
  description:
    'Earn points on every visit, play games, and unlock rewards. Your favorite loyalty program.',

  /**
   * Internal email domain used to make PHONE-ONLY login work.
   *
   * Customers sign in with a phone number + password only — they never see
   * or enter an email. Supabase Auth requires an email under the hood, so the
   * app synthesizes `{phone}@{emailDomain}` automatically. This value is never
   * shown to anyone and no email is ever sent.
   *
   * Pick any private-looking domain for a NEW deployment (e.g.
   * `yourcafe.local`). DO NOT change it after go-live — existing accounts are
   * keyed to it.
   */
  emailDomain: 'yourcafe.local',

  /** Supabase Storage bucket for menu images (must match schema.sql) */
  storageBucket: 'menu-images',

  /**
   * localStorage namespace for the auth session. Keep it unique per brand so
   * two of these apps on the same domain don't collide. Lowercase, no spaces.
   */
  storageKey: 'loyalty-auth',
} as const;

/**
 * Normalize a phone number to a canonical form used for BOTH auth and storage.
 *
 * Why: Supabase Auth requires a syntactically valid email. We synthesize
 * `{phone}@{emailDomain}`, so the phone must be email-local-part-safe.
 * Stripping to digits-only guarantees that, AND makes sure "000000" entered
 * as "000-000" or "+962 0 000 000" still resolves to the same account.
 *
 * This is the ONLY place phone normalization happens — every callsite that
 * needs the canonical form (login, signup, profile insert, employee lookup)
 * MUST go through this helper.
 */
export function normalizePhone(phone: string): string {
  // Strip everything that isn't a digit. Keep it simple and deterministic.
  return (phone || '').replace(/\D+/g, '')
}

/** The synthesized auth email for a phone number (internal use only) */
export function phoneToEmail(phone: string): string {
  return `${normalizePhone(phone)}@${BRAND.emailDomain}`;
}
