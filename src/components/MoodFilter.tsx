import type { MoodTag } from '../types';
import { cn } from '../utils/cn';

type Props = {
  moods: MoodTag[];
  value: string | null;
  onChange: (key: string | null) => void;
};

export function MoodFilter({ moods, value, onChange }: Props) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'chip shrink-0',
          value === null
            ? 'bg-brand-500 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
        )}
      >
        All
      </button>
      {moods.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={cn(
            'chip shrink-0',
            value === m.key
              ? 'bg-brand-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
          )}
        >
          <span aria-hidden>{m.emoji}</span> {m.label}
        </button>
      ))}
    </div>
  );
}
