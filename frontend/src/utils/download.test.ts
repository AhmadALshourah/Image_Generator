import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildShareUrl, downloadImage } from './download';

describe('buildShareUrl', () => {
  const realOrigin = window.location.origin;

  it('returns an empty string for nullish inputs', () => {
    expect(buildShareUrl(null)).toBe('');
    expect(buildShareUrl(undefined)).toBe('');
    expect(buildShareUrl('')).toBe('');
  });

  it('returns absolute URLs unchanged', () => {
    expect(buildShareUrl('https://example.com/foo.png')).toBe('https://example.com/foo.png');
    expect(buildShareUrl('http://example.com/x')).toBe('http://example.com/x');
  });

  it('prepends the current origin for relative paths', () => {
    expect(buildShareUrl('/api/images/files/abc.png')).toBe(`${realOrigin}/api/images/files/abc.png`);
  });
});

describe('downloadImage', () => {
  beforeEach(() => {
    // Stub URL.createObjectURL / revokeObjectURL — jsdom doesn't ship them.
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: vi.fn(() => 'blob:mock'),
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the URL and triggers a click on a synthesized <a>', async () => {
    const fakeBlob = new Blob(['x'], { type: 'image/png' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => fakeBlob,
    }) as unknown as typeof fetch;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadImage('/api/images/files/cat.png', 'cat.png');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/images/files/cat.png');
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('falls back to window.open when fetch fails, and rethrows', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    await expect(downloadImage('/x.png')).rejects.toThrow('network down');
    expect(openSpy).toHaveBeenCalledWith('/x.png', '_blank', 'noopener,noreferrer');
  });
});
