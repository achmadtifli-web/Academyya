'use client';

import { useState } from 'react';
import Image from 'next/image';

const SIZE_MAP = {
  xs: { box: 'w-6 h-6 text-xs', px: 24 },
  sm: { box: 'w-8 h-8 text-sm', px: 32 },
  md: { box: 'w-9 h-9 text-sm', px: 36 },
  lg: { box: 'w-12 h-12 text-lg', px: 48 },
  xl: { box: 'w-24 h-24 text-3xl', px: 96 },
};

export function Avatar({ src, name = 'U', size = 'sm', alt = '', className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const cleanSrc = src && String(src).trim() ? String(src).trim() : null;
  const showImage = Boolean(cleanSrc) && failedSrc !== cleanSrc;
  const { box, px } = SIZE_MAP[size] || SIZE_MAP.sm;
  const initial = String(name || 'U').trim().charAt(0).toUpperCase() || 'U';

  return (
    <span
      className={`rounded-full bg-primary-light text-primary-dark font-heading font-semibold flex items-center justify-center overflow-hidden shrink-0 ${box} ${className}`}
    >
      {showImage ? (
        <Image
          src={cleanSrc}
          alt={alt}
          width={px}
          height={px}
          unoptimized
          onError={() => setFailedSrc(cleanSrc)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span aria-hidden={alt === '' ? 'true' : undefined}>{initial}</span>
      )}
    </span>
  );
}
