import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canNativeShare, downloadPng, downloadSvg, printQrPoster, shareUrl } from './shareUtils';

interface Props {
  username: string;
  url: string;
  qrSvg: string | undefined;
  isLoading: boolean;
  onClose: () => void;
}

/**
 * Modal to share/print the card's QR: large preview + copy link, download (PNG/SVG),
 * print poster, and native share when the browser supports it.
 */
export function ShareDialog({ username, url, qrSvg, isLoading, onClose }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('share.title')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label={t('share.close')}
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-xl leading-none"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold text-slate-900 mb-1">{t('share.title')}</h2>
        <p className="text-sm text-slate-500 mb-5">{t('share.subtitle')}</p>

        <div className="mx-auto mb-5 h-56 w-56 rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-center">
          {qrSvg ? (
            <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          ) : (
            <span className="text-sm text-slate-400">{isLoading ? t('share.generating') : t('share.unavailable')}</span>
          )}
        </div>

        <p className="text-base font-semibold text-slate-900">@{username}</p>
        <p className="text-xs text-slate-500 break-all mb-4">{url}</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copy}
            className="py-2 px-3 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {copied ? t('share.copied') : t('share.copy')}
          </button>
          <button
            onClick={() => printQrPoster(qrSvg ?? '', username, url)}
            disabled={!qrSvg}
            className="py-2 px-3 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            {t('share.print')}
          </button>
          <button
            onClick={() => downloadPng(qrSvg ?? '', `beamcard-${username}.png`)}
            disabled={!qrSvg}
            className="py-2 px-3 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            {t('share.downloadPng')}
          </button>
          <button
            onClick={() => downloadSvg(qrSvg ?? '', `beamcard-${username}.svg`)}
            disabled={!qrSvg}
            className="py-2 px-3 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            {t('share.downloadSvg')}
          </button>
          {canNativeShare() && (
            <button
              onClick={() => shareUrl(username, url)}
              className="col-span-2 py-2 px-3 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
            >
              {t('share.shareEllipsis')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
