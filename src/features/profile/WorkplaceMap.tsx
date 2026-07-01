import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mapDirectionsUrl, mapEmbedUrl } from './maps';

/** Keep a value stable for `delayMs` after it stops changing (so an editor map doesn't reload per keystroke). */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return;
    }
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * A workplace mini-map: an interactive Google Maps embed (when a Maps key is configured)
 * plus a keyless "Get directions" link that always works. `query` is a human-readable
 * address; pass `debounceMs` in editors so the embed doesn't reload on every keystroke.
 */
export function WorkplaceMap({ query, debounceMs = 0 }: { query: string; debounceMs?: number }) {
  const { t, i18n } = useTranslation();
  const q = useDebounced(query, debounceMs);
  if (!q) return null;

  const embed = mapEmbedUrl(q, i18n.language);
  return (
    <div className="mt-2">
      {embed && (
        <iframe
          title={t('map.mapOf', { query: q })}
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-40 w-full rounded-lg border border-slate-200"
        />
      )}
      <a
        href={mapDirectionsUrl(q)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:underline"
      >
        <span aria-hidden="true">📍</span> {t('map.getDirections')}
      </a>
    </div>
  );
}
