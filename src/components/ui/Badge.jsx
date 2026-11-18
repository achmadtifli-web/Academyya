import {
  CheckCircle2,
  Clock,
  EyeOff,
  FileEdit,
  Globe,
  Layers,
  Shield,
  Sparkles,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';

const STATUS_MAP = {
  published: {
    label: 'Published',
    classes: 'bg-success-light text-success border-success/25',
    Icon: Globe,
  },
  draft: {
    label: 'Draft',
    classes: 'bg-accent-light text-ink border-accent-dark/30',
    Icon: FileEdit,
  },
  completed: {
    label: 'Selesai',
    classes: 'bg-success-light text-success border-success/25',
    Icon: CheckCircle2,
  },
  active: {
    label: 'Sedang Belajar',
    classes: 'bg-primary-light text-primary-dark border-primary/25',
    Icon: Clock,
  },
  pending: {
    label: 'Menunggu Verifikasi',
    classes: 'bg-accent-light text-ink border-accent-dark/30',
    Icon: Clock,
  },
  approved: {
    label: 'Disetujui',
    classes: 'bg-success-light text-success border-success/25',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Ditolak',
    classes: 'bg-danger-light text-danger-ink border-danger/25',
    Icon: XCircle,
  },
  pemula: {
    label: 'Pemula',
    classes: 'bg-success-light text-success border-success/25',
    Icon: Layers,
  },
  menengah: {
    label: 'Menengah',
    classes: 'bg-accent-light text-ink border-accent-dark/30',
    Icon: Layers,
  },
  lanjut: {
    label: 'Lanjut',
    classes: 'bg-purple-light text-purple border-purple/25',
    Icon: Layers,
  },
  admin: {
    label: 'Admin',
    classes: 'bg-purple-light text-purple border-purple/25',
    Icon: Shield,
  },
  teacher: {
    label: 'Teacher',
    classes: 'bg-coral-light text-coral-ink border-coral/25',
    Icon: UserCheck,
  },
  student: {
    label: 'Student',
    classes: 'bg-primary-light text-primary-dark border-primary/25',
    Icon: User,
  },
  hidden: {
    label: 'Tersembunyi',
    classes: 'bg-page text-muted border-line-strong',
    Icon: EyeOff,
  },
};

export function StatusBadge({ status, labelOverride, className = '' }) {
  const entry = STATUS_MAP[status] || {
    label: labelOverride || status || 'Status',
    classes: 'bg-page text-ink border-line',
    Icon: Sparkles,
  };
  const Icon = entry.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-sm font-semibold leading-none ${entry.classes} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{labelOverride || entry.label}</span>
    </span>
  );
}
