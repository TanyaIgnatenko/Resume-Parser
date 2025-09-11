type ResumeParserLogoProps = {
  className?: string;
  title?: string;
};

export function ResumeParserLogo({ className = "h-8 w-8", title = "Resume Parser logo" }: ResumeParserLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <title>{title}</title>

      {/* --- subtle shadow for depth without hurting small-size clarity --- */}
      <defs>
        <filter id="rpShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.12" />
        </filter>

        {/* clip to recolor document lines inside the lens (parsing highlight) */}
        <clipPath id="lensClip">
          <circle cx="68" cy="60" r="18" />
        </clipPath>
      </defs>

      {/* --- Document with folded corner --- */}
      <g filter="url(#rpShadow)">
        {/* Body */}
        <rect x="16" y="12" width="54" height="72" rx="8" ry="8" fill="#3B82F6" />
        {/* Fold (kept same palette: darker stroke only) */}
        <path d="M62 12 L70 20 L70 32 A8 8 0 0 1 62 24 Z" fill="#3B82F6" />
        {/* Stroke */}
        <rect x="16" y="12" width="54" height="72" rx="8" ry="8" stroke="#2563EB" strokeWidth="2" />
      </g>

      {/* --- Document lines (base in white) --- */}
      <g strokeLinecap="round">
        <line x1="26" y1="28" x2="50" y2="28" stroke="white" strokeWidth="3" />
        <line x1="26" y1="38" x2="58" y2="38" stroke="white" strokeWidth="3" />
        <line x1="26" y1="48" x2="53" y2="48" stroke="white" strokeWidth="3" />
        <line x1="26" y1="58" x2="46" y2="58" stroke="white" strokeWidth="3" />
      </g>

      {/* --- Parsed highlight: recolor the parts of lines inside the lens to green --- */}
      <g clipPath="url(#lensClip)">
        <line x1="26" y1="28" x2="50" y2="28" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="38" x2="58" y2="38" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="48" x2="53" y2="48" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="58" x2="46" y2="58" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* --- Magnifying glass --- */}
      <circle cx="68" cy="60" r="18" fill="none" stroke="#10B981" strokeWidth="4" />
      <line x1="80.5" y1="72.5" x2="90.5" y2="82.5" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />

      {/* Success/validation cue inside lens */}
      <path
        d="M59 61.5 L65.5 68 L79 54.5"
        fill="none"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
