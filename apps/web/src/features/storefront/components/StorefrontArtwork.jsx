function ArtFrame({ children, accent = "#38bdf8", fill = "#0f172a" }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className="h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`card-${accent.replace("#", "")}`} x1="40" y1="24" x2="270" y2="220">
          <stop stopColor={fill} />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
      </defs>

      <rect x="16" y="16" width="288" height="188" rx="30" fill={`url(#card-${accent.replace("#", "")})`} />
      <rect x="16" y="16" width="288" height="188" rx="30" stroke="rgba(148, 163, 184, 0.18)" />
      <circle cx="266" cy="52" r="36" fill={accent} opacity="0.12" />
      <circle cx="70" cy="174" r="48" fill={accent} opacity="0.08" />
      {children}
    </svg>
  );
}

export function HeroArtwork() {
  return (
    <svg
      viewBox="0 0 640 420"
      className="h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hero-bg" x1="60" y1="30" x2="570" y2="390">
          <stop stopColor="#081225" />
          <stop offset="0.6" stopColor="#132a4d" />
          <stop offset="1" stopColor="#04101f" />
        </linearGradient>
        <linearGradient id="hero-screen" x1="150" y1="80" x2="390" y2="260">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="hero-case" x1="410" y1="70" x2="560" y2="320">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      <rect x="18" y="20" width="604" height="380" rx="34" fill="url(#hero-bg)" />
      <rect x="18" y="20" width="604" height="380" rx="34" stroke="rgba(148, 163, 184, 0.16)" />

      <circle cx="116" cy="96" r="62" fill="#22d3ee" opacity="0.12" />
      <circle cx="556" cy="98" r="74" fill="#f59e0b" opacity="0.12" />
      <circle cx="518" cy="338" r="86" fill="#8b5cf6" opacity="0.12" />

      <path
        d="M80 300C160 248 215 250 278 268C340 286 403 332 536 284"
        stroke="#38bdf8"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.4"
      />

      <rect x="126" y="90" width="246" height="156" rx="18" fill="url(#hero-screen)" />
      <rect x="126" y="90" width="246" height="156" rx="18" stroke="rgba(255, 255, 255, 0.18)" />
      <path d="M152 212L214 150L258 190L312 126L346 158" stroke="#dbeafe" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="214" cy="150" r="10" fill="#f8fafc" />
      <circle cx="258" cy="190" r="10" fill="#f8fafc" />
      <circle cx="312" cy="126" r="10" fill="#f8fafc" />
      <rect x="218" y="252" width="68" height="16" rx="8" fill="#94a3b8" />
      <path d="M194 270H310L326 294H178L194 270Z" fill="#cbd5e1" opacity="0.9" />

      <rect x="410" y="76" width="136" height="222" rx="20" fill="url(#hero-case)" />
      <rect x="410" y="76" width="136" height="222" rx="20" stroke="rgba(148, 163, 184, 0.18)" />
      <rect x="432" y="98" width="92" height="136" rx="14" fill="#111827" stroke="rgba(148, 163, 184, 0.14)" />
      <circle cx="478" cy="132" r="24" fill="#0f172a" stroke="#22d3ee" strokeWidth="8" />
      <circle cx="478" cy="132" r="12" fill="#38bdf8" opacity="0.7" />
      <circle cx="478" cy="196" r="24" fill="#0f172a" stroke="#f59e0b" strokeWidth="8" />
      <circle cx="478" cy="196" r="12" fill="#fbbf24" opacity="0.7" />
      <rect x="432" y="246" width="92" height="14" rx="7" fill="#334155" />

      <rect x="74" y="102" width="22" height="138" rx="11" fill="#e2e8f0" opacity="0.75" />
      <rect x="550" y="126" width="18" height="118" rx="9" fill="#e2e8f0" opacity="0.4" />
      <rect x="550" y="112" width="18" height="8" rx="4" fill="#f59e0b" />

      <rect x="208" y="318" width="164" height="32" rx="16" fill="#0b1220" stroke="rgba(56, 189, 248, 0.24)" />
      <rect x="222" y="328" width="22" height="8" rx="4" fill="#22d3ee" />
      <rect x="250" y="328" width="22" height="8" rx="4" fill="#38bdf8" />
      <rect x="278" y="328" width="22" height="8" rx="4" fill="#f59e0b" />
      <rect x="306" y="328" width="22" height="8" rx="4" fill="#c084fc" />
    </svg>
  );
}

export function CategoryArtwork({ type }) {
  if (type === "laptop") {
    return (
      <ArtFrame accent="#22d3ee">
        <rect x="74" y="74" width="172" height="96" rx="16" fill="#0f172a" stroke="#67e8f9" strokeWidth="4" />
        <rect x="88" y="88" width="144" height="68" rx="10" fill="#082f49" />
        <path d="M104 142L136 112L164 128L194 98L216 116" stroke="#67e8f9" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="58" y="176" width="204" height="18" rx="9" fill="#cbd5e1" />
        <rect x="132" y="181" width="56" height="7" rx="3.5" fill="#94a3b8" />
      </ArtFrame>
    );
  }

  if (type === "desktop") {
    return (
      <ArtFrame accent="#f59e0b">
        <rect x="116" y="46" width="108" height="142" rx="20" fill="#111827" stroke="#fb923c" strokeWidth="4" />
        <rect x="136" y="66" width="68" height="84" rx="16" fill="#0f172a" stroke="rgba(251, 146, 60, 0.3)" />
        <circle cx="170" cy="92" r="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="8" />
        <circle cx="170" cy="92" r="11" fill="#fb923c" opacity="0.65" />
        <circle cx="170" cy="132" r="16" fill="#0f172a" stroke="#22d3ee" strokeWidth="6" />
        <circle cx="170" cy="132" r="8" fill="#38bdf8" opacity="0.7" />
        <rect x="138" y="160" width="64" height="10" rx="5" fill="#334155" />
        <rect x="84" y="170" width="34" height="16" rx="8" fill="#e2e8f0" opacity="0.8" />
      </ArtFrame>
    );
  }

  if (type === "monitor") {
    return (
      <ArtFrame accent="#a855f7">
        <rect x="60" y="54" width="200" height="118" rx="18" fill="#0f172a" stroke="#c084fc" strokeWidth="4" />
        <rect x="78" y="72" width="164" height="82" rx="12" fill="#312e81" />
        <path d="M94 134C112 106 142 92 168 102C195 112 212 98 228 82" stroke="#e9d5ff" strokeWidth="8" strokeLinecap="round" />
        <path d="M132 174H188L202 194H118L132 174Z" fill="#cbd5e1" />
        <rect x="138" y="160" width="44" height="14" rx="7" fill="#94a3b8" />
        <circle cx="248" cy="150" r="16" fill="#f59e0b" opacity="0.6" />
      </ArtFrame>
    );
  }

  return (
    <ArtFrame accent="#34d399">
      <rect x="76" y="58" width="168" height="112" rx="18" fill="#0f172a" stroke="#34d399" strokeWidth="4" />
      <rect x="100" y="82" width="120" height="64" rx="12" fill="#052e2b" />
      <path d="M116 114H204" stroke="#6ee7b7" strokeWidth="6" strokeLinecap="round" />
      <path d="M160 92V136" stroke="#6ee7b7" strokeWidth="6" strokeLinecap="round" />
      <circle cx="116" cy="92" r="7" fill="#6ee7b7" />
      <circle cx="204" cy="92" r="7" fill="#6ee7b7" />
      <circle cx="116" cy="136" r="7" fill="#6ee7b7" />
      <circle cx="204" cy="136" r="7" fill="#6ee7b7" />
      <rect x="84" y="176" width="152" height="12" rx="6" fill="#cbd5e1" opacity="0.85" />
    </ArtFrame>
  );
}
