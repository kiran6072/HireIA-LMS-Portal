import type { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'secondary';

const toneClasses: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  primary: 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200',
  secondary: 'bg-secondary-50 text-secondary-700 ring-1 ring-inset ring-secondary-200',
};

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${toneClasses[tone]}`}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  published: 'success',
  draft: 'neutral',
  archived: 'danger',
  submitted: 'info',
  graded: 'success',
  resubmit_requested: 'warning',
  applied: 'info',
  interview_scheduled: 'warning',
  interviewed: 'secondary',
  offered: 'success',
  rejected: 'danger',
  joined: 'success',
  active: 'success',
  inactive: 'danger',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] || 'neutral';
  return <Badge tone={tone}>{status.replace(/_/g, ' ')}</Badge>;
}
