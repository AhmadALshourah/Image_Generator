/**
 * Trigger a real browser download of a remote image.
 * Falls back to opening in a new tab if fetch/blob is unavailable.
 */
export async function downloadImage(
  url: string,
  filename: string = 'generated-image.png'
): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (err) {
    window.open(url, '_blank', 'noopener,noreferrer');
    throw err;
  }
}

export function buildShareUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${window.location.origin}${imageUrl}`;
}
