import { useState } from 'react';

import ActionButton from './ActionButton';
import { buildShareUrl } from '../utils/download';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';

export interface ShareButtonProps {
  imageUrl: string;
  prompt?: string;
}

export default function ShareButton({ imageUrl, prompt }: ShareButtonProps) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { t } = useLang();

  const handleShare = async () => {
    if (!imageUrl) return;
    setBusy(true);
    const url = buildShareUrl(imageUrl);
    const shareData: ShareData = {
      title: 'AI Generated Image',
      text: prompt ? `Check out this AI-generated image: "${prompt.slice(0, 120)}"` : 'Check out this AI-generated image',
      url,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success(t('toastShared'));
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(t('toastLinkCopied'));
      } else {
        toast.info(url);
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') toast.error(t('toastShareFail'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ActionButton onClick={handleShare} disabled={busy} title={t('share')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="h-3.5 w-3.5">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {t('share')}
    </ActionButton>
  );
}
