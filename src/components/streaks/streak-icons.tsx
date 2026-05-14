// Custom inline SVG icons for the streaks feature.
// Distinct geometric forms — not the lucide-react/heroicons set every AI app uses.

interface IconProps {
  size?: number;
  className?: string;
}

// Filled solid square — used for "active streak day"
export function StreakDot({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5 5h14v14H5z"
        fill="currentColor"
      />
      <path
        d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

// Outlined hollow square — "inactive streak day"
export function StreakDotEmpty({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5 5h14v14H5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

// Brutalist padlock — for "locked" reward state
export function PadlockIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="11" width="16" height="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
      <rect x="11" y="14" width="2" height="4" fill="currentColor" />
    </svg>
  );
}

// Bold check inside a square frame — for "unlocked"
export function CheckSquareIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" />
      <path
        d="m7 12 3.5 3.5L17 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

// Geometric X-mark — for "lose"
export function CrossSquareIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8 8 8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

// Stacked diamonds — celebratory "win" mark
export function PrizeIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2 4 10l8 12 8-12-8-8Z"
        fill="currentColor"
      />
      <path
        d="M4 10h16M8 6l4 4 4-4M8 14l4 4 4-4"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1"
      />
    </svg>
  );
}

// Spark/burst — for "streak" header accent
export function SparkIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

// X to close modal
export function CloseIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 6 18 18M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}
