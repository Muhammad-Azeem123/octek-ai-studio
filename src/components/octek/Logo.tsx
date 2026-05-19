export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="3" y="3" width="14" height="14" rx="3" stroke="var(--accent)" strokeWidth="2" />
      <rect
        x="11"
        y="11"
        width="14"
        height="14"
        rx="3"
        fill="var(--accent)"
        fillOpacity="0.18"
        stroke="var(--accent)"
        strokeWidth="2"
      />
      <rect x="15" y="15" width="14" height="14" rx="3" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}
