import { useState } from 'react';

import ActionButton from './ActionButton';
import { downloadImage } from '../utils/download';
import { useToast } from '../context/ToastContext';

export interface DownloadButtonProps {
  imageUrl: string;
  filename?: string;
  label?: string;
}

export default function DownloadButton({
  imageUrl,
  filename,
  label = 'Download',
}: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    if (!imageUrl) return;
    setBusy(true);
    try {
      await downloadImage(imageUrl, filename || 'image.png');
      toast.success('Download started');
    } catch {
      toast.error('Could not download — opened in new tab instead.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ActionButton onClick={handleDownload} disabled={busy} title="Download image">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
           className="h-3.5 w-3.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </ActionButton>
  );
}
