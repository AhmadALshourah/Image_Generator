import { useState } from 'react';

import ActionButton from './ActionButton';
import { useLang } from '../context/LangContext';

export interface DeleteButtonProps {
  onConfirm?: () => void;
  disabled?: boolean;
}

export default function DeleteButton({ onConfirm, disabled = false }: DeleteButtonProps) {
  const { t } = useLang();
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onConfirm?.();
    setConfirming(false);
  };

  return (
    <ActionButton
      onClick={handleClick}
      variant="danger"
      disabled={disabled}
      title={confirming ? t('confirmDel') : t('deleteLabel')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="h-3.5 w-3.5">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
      {confirming ? t('confirmDel') : t('deleteLabel')}
    </ActionButton>
  );
}
