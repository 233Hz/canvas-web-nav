/**
 * Normalize input URL: ensure it has http:// or https:// protocol
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Extract hostname/domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

/**
 * Get Google S2 Favicon service URL
 */
export function getGoogleFaviconUrl(url: string, size = 128): string {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * Extract initial letter / Chinese character for fallback icon
 */
export function getInitialChar(title: string): string {
  const clean = title.trim();
  if (!clean) return '?';
  // If starts with English letter or digit, return uppercase
  const first = clean[0];
  if (/[a-zA-Z]/i.test(first)) {
    return first.toUpperCase();
  }
  return first;
}

/**
 * Generate consistent elegant gradient background colors for letter avatars based on string hash
 */
const GRADIENT_PRESETS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-500 to-teal-700',
  'from-purple-600 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-red-600',
  'from-violet-600 to-indigo-700',
  'from-fuchsia-600 to-pink-500',
];

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % GRADIENT_PRESETS.length;
  return GRADIENT_PRESETS[index];
}
