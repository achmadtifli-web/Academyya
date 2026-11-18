import {
  BookOpen,
  Briefcase,
  Code,
  Globe,
  Languages,
  Palette,
  ShieldCheck,
} from 'lucide-react';

const ICON_MAP = {
  Code,
  Palette,
  Briefcase,
  ShieldCheck,
  Languages,
  Globe,
  BookOpen,
};

export function CategoryIcon({ name, className = 'w-4 h-4' }) {
  const IconComponent = ICON_MAP[name] || BookOpen;
  return <IconComponent className={className} aria-hidden="true" />;
}
