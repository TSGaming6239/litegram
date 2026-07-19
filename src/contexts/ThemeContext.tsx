import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';
export type AccentKey = 'brand' | 'blue' | 'green' | 'orange' | 'rose';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'litegram-theme';
const ACCENT_KEY = 'litegram-accent';

// Each accent maps to a set of CSS variables we inject at runtime.
// Values are space-separated RGB channels (e.g. "244 63 94") so Tailwind's
// alpha-value opacity modifier works via rgb(var(--brand-500) / <alpha-value>).
const ACCENTS: Record<AccentKey, { name: string; shades: Record<string, string> }> = {
  brand: {
    name: 'Rose',
    shades: { '50':'255 241 242','100':'255 228 230','200':'254 205 211','300':'253 164 175','400':'251 113 133','500':'244 63 94','600':'225 29 72','700':'190 18 60','800':'159 18 57','900':'136 19 55' },
  },
  blue: {
    name: 'Blue',
    shades: { '50':'239 246 255','100':'219 234 254','200':'191 219 254','300':'147 197 253','400':'96 165 250','500':'59 130 246','600':'37 99 235','700':'29 78 216','800':'30 64 175','900':'30 58 138' },
  },
  green: {
    name: 'Green',
    shades: { '50':'236 253 245','100':'209 250 229','200':'167 243 208','300':'110 231 183','400':'52 211 153','500':'16 185 129','600':'5 150 105','700':'4 120 87','800':'6 95 70','900':'6 78 59' },
  },
  orange: {
    name: 'Orange',
    shades: { '50':'255 247 237','100':'255 237 213','200':'254 215 170','300':'253 186 116','400':'251 146 60','500':'249 115 22','600':'234 88 12','700':'194 65 12','800':'154 52 18','900':'124 45 18' },
  },
  rose: {
    name: 'Pink',
    shades: { '50':'253 242 248','100':'252 231 243','200':'251 207 232','300':'249 168 212','400':'244 114 182','500':'236 72 153','600':'219 39 119','700':'190 24 93','800':'157 23 77','900':'131 24 67' },
  },
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

function applyAccent(accent: AccentKey) {
  const root = document.documentElement;
  const palette = ACCENTS[accent].shades;
  for (const shade of Object.keys(palette)) {
    root.style.setProperty(`--brand-${shade}`, palette[shade]);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const [accent, setAccentState] = useState<AccentKey>(() => {
    if (typeof window === 'undefined') return 'brand';
    return (localStorage.getItem(ACCENT_KEY) as AccentKey) || 'brand';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );
  const setAccent = useCallback((a: AccentKey) => setAccentState(a), []);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, accent, setAccent }),
    [theme, toggleTheme, setTheme, accent, setAccent]
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export const ACCENT_OPTIONS = ACCENTS;
