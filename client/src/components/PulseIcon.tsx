/** Logoto na Pulse kato SVG — skalira se bez da se razmazva. */
function PulseIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"   // vzima cveta ot roditelya
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12h4l2-5 3.5 10L15 9l2 3h5" />
    </svg>
  );
}

export default PulseIcon;
