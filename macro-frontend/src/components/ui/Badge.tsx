import React from 'react';

interface Props {
  variant: 'G+' | 'G=' | 'G-' | 'I+' | 'I=' | 'I-' | 'neutral' | string;
  children: React.ReactNode;
}

const NAMED_VARIANTS: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

export function Badge({ variant, children }: Props) {
  let colorClass =
    NAMED_VARIANTS[variant] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  if (variant.startsWith('G+')) colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
  if (variant.startsWith('G-')) colorClass = 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300';
  if (variant.startsWith('G=')) colorClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';

  if (variant.startsWith('I+')) colorClass = 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300';
  if (variant.startsWith('I-')) colorClass = 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300';
  if (variant.startsWith('I=')) colorClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
}
