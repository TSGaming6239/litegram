import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { cn } from '../utils/cn';

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
  '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
  '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫',
  '🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬',
  '😮','😯','😪','😫','🥱','😴','😌','😛','🤤','😒',
  '🥳','🥺','😎','🤓','🧐','😕','😟','🙁','😮','😯',
  '😲','😳','🥵','🥶','😱','😨','😰','😥','😢','😭',
  '🔥','✨','🎉','🎂','🌟','💯','❤️','🧡','💛','💚',
  '💙','💜','🖤','🤍','🤎','💪','👍','👏','🙌','🙏',
  '🌍','🌸','🍔','☕','🎮','📚','✈️','🏖️','⚽','🎵',
];

type Props = {
  onPick: (emoji: string) => void;
  className?: string;
  label?: string;
};

export function EmojiPicker({ onPick, className, label = 'Insert emoji' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((s) => !s)}
        className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-800"
      >
        <Smile className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft animate-scale-in dark:border-slate-700 dark:bg-slate-900">
          <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto">
            {EMOJIS.map((e, i) => (
              <button
                key={`${e}-${i}`}
                type="button"
                onClick={() => {
                  onPick(e);
                  setOpen(false);
                }}
                className="grid h-7 w-7 place-items-center rounded-md text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
