import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ActionButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ActionButtonProps {
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  children: ReactNode;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  className?: string;
}

export default function ActionButton({
  onClick,
  children,
  variant = 'secondary',
  disabled = false,
  type = 'button',
  title,
  className = '',
}: ActionButtonProps) {
  if (variant === 'primary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`btn-primary h-9 px-3 text-xs ${className}`}
      >
        {children}
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold
                    text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30
                    hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200
                    disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`btn-outline h-9 px-3 text-xs ${className}`}
    >
      {children}
    </button>
  );
}
