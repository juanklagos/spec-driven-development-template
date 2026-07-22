// The project mark (spec 018): a rounded square with the `s` knocked out of it —
// three bars and two connectors. Inline SVG rather than an <img>, so it lives in
// this document and `currentColor` follows the builder theme. The site needs two
// fixed-colour files for exactly the opposite reason: an embedded image cannot see
// the page it sits on.
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label="SDD"
    >
      <mask id="sdd-logo-mark">
        <rect width="96" height="96" fill="#fff" />
        <g fill="#000">
          <rect x="24" y="18" width="48" height="13" rx="6.5" />
          <rect x="24" y="41.5" width="48" height="13" rx="6.5" />
          <rect x="24" y="65" width="48" height="13" rx="6.5" />
          <rect x="24" y="18" width="13" height="36.5" rx="6.5" />
          <rect x="59" y="41.5" width="13" height="36.5" rx="6.5" />
        </g>
      </mask>
      <rect x="6" y="6" width="84" height="84" rx="20" fill="currentColor" mask="url(#sdd-logo-mark)" />
    </svg>
  );
}
