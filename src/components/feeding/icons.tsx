// Custom feeding icons, drawn in the same outline style as the nav bars.
// Uses `currentColor` for the stroke, so color follows the parent's text color —
// peach in nav/card contexts, white on the colored Log Feed button.

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

// The baby bottle used for the Feed nav item and the dashboard Log Feed button.
export function FeedingIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="10.5" y="1.8" width="3" height="2.8" rx="1.2" />
      <rect x="8.5" y="4" width="7" height="2.8" rx="1" />
      <path d="M9 6.8H15V8c1.7 0 2.5 1 2.5 3v7c0 2-1 3.5-3 3.5h-5c-2 0-3-1.5-3-3.5v-7c0-2 .8-3 2.5-3z" />
      <path d="M9 12h2.5M9 15h2.5" />
    </svg>
  )
}
