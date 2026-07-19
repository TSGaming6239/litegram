import { cn } from '../utils/cn';

type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  ring?: boolean;
};

export function Avatar({ src, alt, size = 40, className, ring }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold shrink-0',
        ring && 'ring-2 ring-white dark:ring-slate-900',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials || '?'}</span>
      )}
    </span>
  );
}
