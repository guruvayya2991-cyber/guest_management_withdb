import { useEffect, useRef, useState } from 'react';

export function useNow(intervalMs: number = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  const ref = useRef<number | null>(null);

  useEffect(() => {
    ref.current = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [intervalMs]);

  return now;
}
