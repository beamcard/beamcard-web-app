/** Helpers for sharing/printing the profile QR. Pure browser APIs, no app deps. */

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Download the QR as a vector SVG (best for print — scales infinitely). */
export function downloadSvg(svg: string, filename: string): void {
  triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), filename);
}

/** Rasterize the SVG to a high-res PNG (for tools that don't accept SVG). */
export async function downloadPng(svg: string, filename: string, size = 1024): Promise<void> {
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not render the QR image.'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not encode the PNG.');
    triggerDownload(blob, filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/** Open a clean, print-optimized poster (big QR + handle + URL) and trigger the print dialog. */
export function printQrPoster(svg: string, username: string, url: string): void {
  const win = window.open('', '_blank', 'width=600,height=800');
  if (!win) return; // popup blocked — caller may surface a hint
  const safeUser = escapeHtml(username);
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>@${safeUser} — Beamcard</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;color:#0f172a}
  .poster{text-align:center;padding:48px}
  .qr{width:340px;height:340px;margin:0 auto 28px}
  .qr svg{width:100%;height:100%}
  h1{font-size:30px;margin-bottom:6px}
  .url{color:#475569;font-size:15px;word-break:break-all}
  .tag{margin-top:18px;font-size:14px;color:#94a3b8;letter-spacing:.02em}
  @page{margin:1.5cm}
</style></head>
<body><div class="poster">
  <div class="qr">${svg}</div>
  <h1>@${safeUser}</h1>
  <div class="url">${escapeHtml(url)}</div>
  <div class="tag">Scan to view my Beamcard</div>
</div></body></html>`);
  win.document.close();
  win.focus();
  // Let the SVG paint before invoking print.
  setTimeout(() => win.print(), 250);
}

/** Native share sheet (mobile/desktop) when available; returns false if unsupported. */
export async function shareUrl(username: string, url: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title: `@${username} on Beamcard`, url });
    return true;
  } catch {
    return false; // user cancelled or share failed
  }
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
