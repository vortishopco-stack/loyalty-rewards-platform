import type { NextConfig } from "next";

/**
 * Defensive basePath resolver.
 *
 * GitHub Actions does NOT allow saving a truly empty secret — "clearing"
 * NEXT_PUBLIC_BASE_PATH often leaves whitespace or stale bytes, which then
 * makes Next.js throw:
 *   "basePath has to be either an empty string or a path prefix"
 * We trim whitespace, require a leading slash, and fall back to "".
 */
function resolveBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const cleaned = raw.trim();
  if (!cleaned) return "";
  if (!cleaned.startsWith("/")) {
    console.warn(
      `[next.config] NEXT_PUBLIC_BASE_PATH="${raw}" is invalid — must be empty or start with "/". Falling back to empty basePath.`
    );
    return "";
  }
  return cleaned.replace(/\/+$/, "");
}

const basePath = resolveBasePath();

const nextConfig: NextConfig = {
  output: "export",
  // For GitHub Pages deployment, set NEXT_PUBLIC_BASE_PATH to your repo name
  // e.g., if your repo is at https://username.github.io/your-repo/
  // then set NEXT_PUBLIC_BASE_PATH=/your-repo
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
