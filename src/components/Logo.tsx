import { cn } from '../utils/cn';

export function Logo({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="32" height="32" rx="9" fill="url(#lg-grad)" />
        <path
          d="M9 11h14M9 16h14M9 21h9"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="24" cy="21" r="2.2" fill="white" />
        <defs>
          <linearGradient
            id="lg-grad"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fb7185" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">
        Litegram
      </span>
    </span>
  );
}
