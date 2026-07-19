export function isBirthdayToday(birthday: string | null | undefined): boolean {
  if (!birthday) return false;
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const [bm, bd] = birthday.split('-').map((n) => parseInt(n, 10));
  return bm === m && bd === d;
}

export function BirthdayBadge({ birthday }: { birthday: string | null | undefined }) {
  if (!isBirthdayToday(birthday)) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
      title="It's their birthday today!"
    >
      <span aria-hidden>🎂</span> Birthday
    </span>
  );
}
