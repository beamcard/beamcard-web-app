/**
 * Google Maps helpers for workplace locations. We pass the human-readable address
 * string straight to Google (no geocoding / no stored coordinates), so this needs
 * no backend changes. The Embed API key is client-side — RESTRICT it by HTTP
 * referrer in Google Cloud. When no key is set, callers fall back to a plain
 * "Get directions" link (which needs no key).
 */

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;

/** A full, human-readable query from a workplace street address + the profile's city/country. */
export function mapQuery(parts: { address?: string; city?: string; country?: string }): string {
  return [parts.address, parts.city, parts.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

/** Embed iframe src, or null when no Maps key is configured (caller shows just the link). */
export function mapEmbedUrl(query: string, language?: string): string | null {
  if (!MAPS_KEY || !query) return null;
  const lang = language ? `&language=${encodeURIComponent(language)}` : '';
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${encodeURIComponent(query)}${lang}`;
}

/** Universal "open in Google Maps" link — works with no API key; opens the app on mobile. */
export function mapDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
