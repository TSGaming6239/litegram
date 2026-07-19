import { useCallback, useEffect, useRef, useState } from 'react';

type Options<T> = {
  fetcher: (page: number) => Promise<T[]>;
  enabled?: boolean;
  pageSize?: number;
};

export function useInfiniteScroll<T>({ fetcher, enabled = true }: Options<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  const load = useCallback(
    async (reset: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        if (reset) {
          setLoading(true);
          setError(null);
          setHasMore(true);
          setPage(0);
        } else {
          setLoadingMore(true);
        }
        const next = await fetcher(reset ? 0 : page + 1);
        setItems((prev) => (reset ? next : [...prev, ...next]));
        if (next.length === 0 || next.length < 8) setHasMore(false);
        if (!reset) setPage((p) => p + 1);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [fetcher, page]
  );

  useEffect(() => {
    if (!enabled) return;
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !hasMore) return;
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && !loading) {
          load(false);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, hasMore, loadingMore, loading, load]);

  const refresh = useCallback(() => load(true), [load]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    sentinel,
    refresh,
  };
}
