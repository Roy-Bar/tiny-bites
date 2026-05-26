export default function Logo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="#f96b3a" />
      <rect x="28" y="8" width="8" height="11" rx="4" fill="white" />
      <rect x="24" y="17" width="16" height="11" rx="2.5" fill="white" />
      <rect x="15" y="26" width="34" height="6" rx="3" fill="white" />
      <rect x="17" y="30" width="30" height="26" rx="8" fill="white" />
      <rect x="20" y="38" width="9" height="2.5" rx="1.25" fill="#f96b3a" opacity="0.4" />
      <rect x="20" y="45" width="7" height="2.5" rx="1.25" fill="#f96b3a" opacity="0.3" />
    </svg>
  )
}
