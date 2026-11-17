import Image from 'next/image';

export function HeroVisual({ compact = false }) {
  return (
    <div
      className={`relative mx-auto flex items-center justify-center select-none overflow-visible ${
        compact
          ? 'w-60 h-60 sm:w-72 sm:h-72 mt-8'
          : 'w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 mt-8 lg:mt-6'
      }`}
    >
      {/* Dark Outline Ring */}
      <div
        aria-hidden="true"
        className="absolute inset-2 rounded-full border-2 border-ink/80 translate-x-3 -translate-y-1 z-0"
      />

      {/* Main Coral Circle */}
      <div aria-hidden="true" className="absolute inset-2 rounded-full bg-coral shadow-sm z-0" />

      {/* Hero Image: bottom clipped to circle curve while upper head rises naturally above */}
      <div className="absolute inset-x-2 bottom-2 -top-20 sm:-top-24 rounded-b-full overflow-hidden z-20 pointer-events-none">
        <Image
          src="/Object.svg"
          alt="Pelajar Academyya belajar daring menggunakan laptop"
          width={1669}
          height={1572}
          priority
          fetchPriority="high"
          unoptimized
          className={`absolute left-1/2 -translate-x-1/2 max-w-none h-auto object-contain object-bottom ${
            compact
              ? 'w-[130%] -bottom-1'
              : 'w-[138%] sm:w-[140%] -bottom-1'
          }`}
        />
      </div>

      {/* Top Right Purple Orb & Small Coral Dot */}
      <div aria-hidden="true" className="absolute -top-4 -right-3 sm:-top-6 sm:-right-5 w-16 h-16 sm:w-24 sm:h-24 z-10">
        <div className="absolute inset-0 rounded-full border border-ink translate-x-1.5 -translate-y-1" />
        <div className="relative w-full h-full rounded-full bg-purple" />
        <div className="absolute -bottom-3 -right-4 sm:-bottom-4 sm:-right-6 w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-coral" />
      </div>

      {/* Bottom Left Yellow Orb & Blue Dot */}
      <div aria-hidden="true" className="absolute -bottom-3 -left-3 sm:-bottom-5 sm:-left-6 w-14 h-14 sm:w-20 sm:h-20 z-10">
        <div className="absolute inset-0 rounded-full border border-ink -translate-x-1.5 translate-y-1" />
        <div className="relative w-full h-full rounded-full bg-accent" />
        <div className="absolute -top-7 left-1 sm:-top-10 sm:left-2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-primary" />
      </div>

      {/* 3D Floating Rocket */}
      <div
        aria-hidden="true"
        className={`absolute z-30 pointer-events-none -rotate-[22deg] drop-shadow-xl ${
          compact
            ? '-top-6 -left-6 w-24 h-24 sm:w-28 sm:h-28'
            : '-top-8 -left-8 sm:-top-12 sm:-left-12 w-28 h-28 sm:w-36 sm:h-36'
        }`}
      >
        <svg viewBox="0 0 120 140" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="rocketBody" x1="25" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="rocketNose" x1="40" y1="5" x2="75" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF7A45" />
              <stop offset="100%" stopColor="#E04F16" />
            </linearGradient>
            <linearGradient id="rocketFin" x1="0" y1="50" x2="100" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="smokeGrad" x1="40" y1="90" x2="80" y2="135" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* Smoke Cloud */}
          <circle cx="60" cy="108" r="12" fill="url(#smokeGrad)" />
          <circle cx="48" cy="118" r="11" fill="url(#smokeGrad)" />
          <circle cx="72" cy="116" r="13" fill="url(#smokeGrad)" />
          <circle cx="60" cy="124" r="14" fill="url(#smokeGrad)" />

          {/* Left & Right Fins */}
          <path d="M34 58C18 64 14 82 18 94C26 86 34 82 40 82Z" fill="url(#rocketFin)" />
          <path d="M86 58C102 64 106 82 102 94C94 86 86 82 80 82Z" fill="url(#rocketFin)" />

          {/* Thruster Base */}
          <rect x="44" y="84" width="32" height="10" rx="4" fill="#F59E0B" />

          {/* Main Body */}
          <path
            d="M60 8C42 24 34 50 36 84H84C86 50 78 24 60 8Z"
            fill="url(#rocketBody)"
          />

          {/* Nose Cone */}
          <path
            d="M60 8C51 16 44 26 41 36H79C76 26 69 16 60 8Z"
            fill="url(#rocketNose)"
          />

          {/* Windows */}
          <circle cx="60" cy="50" r="10" fill="#F59E0B" />
          <circle cx="60" cy="50" r="7" fill="#1E293B" />
          <circle cx="57" cy="47" r="2" fill="#FFFFFF" opacity="0.7" />

          <circle cx="60" cy="72" r="8" fill="#F59E0B" />
          <circle cx="60" cy="72" r="5.5" fill="#1E293B" />
          <circle cx="58" cy="70" r="1.5" fill="#FFFFFF" opacity="0.7" />
        </svg>
      </div>

      {/* 3D Floating Trophy */}
      <div
        aria-hidden="true"
        className={`absolute z-30 pointer-events-none rotate-[18deg] drop-shadow-xl ${
          compact
            ? '-bottom-6 -right-4 w-24 h-24 sm:w-28 sm:h-28'
            : '-bottom-8 -right-6 sm:-bottom-10 sm:-right-10 w-28 h-28 sm:w-36 sm:h-36'
        }`}
      >
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="goldCup" x1="30" y1="15" x2="90" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="55%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <linearGradient id="goldRim" x1="30" y1="15" x2="90" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Handles */}
          <path
            d="M34 30H22C16 30 14 38 17 45C20 52 28 56 38 56"
            stroke="url(#goldCup)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M86 30H98C104 30 106 38 103 45C100 52 92 56 82 56"
            stroke="url(#goldCup)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Cup Body */}
          <path
            d="M32 22H88V46C88 64 75 76 60 76C45 76 32 64 32 46V22Z"
            fill="url(#goldCup)"
          />

          {/* Top Oval Rim */}
          <ellipse cx="60" cy="22" rx="28" ry="6" fill="url(#goldRim)" />

          {/* Stem & Base */}
          <rect x="53" y="73" width="14" height="16" rx="3" fill="url(#goldCup)" />
          <ellipse cx="60" cy="90" rx="22" ry="6" fill="url(#goldRim)" />

          {/* Pedestal */}
          <rect x="34" y="92" width="52" height="16" rx="3" fill="#334155" />
          <rect x="44" y="96" width="32" height="8" rx="1.5" fill="#FACC15" />
        </svg>
      </div>
    </div>
  );
}