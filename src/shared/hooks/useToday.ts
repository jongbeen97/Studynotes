import { useEffect, useState } from 'react';
import { localDateString } from '../lib/dates';

/**
 * 오늘 날짜. 앱을 켜 둔 채 자정을 넘기거나, 며칠 뒤 다시 열어도 날짜가 맞게 바뀐다.
 */
export function useToday(): string {
  const [today, setToday] = useState(localDateString);

  useEffect(() => {
    const refresh = () => {
      const now = localDateString();
      setToday((prev) => (prev === now ? prev : now));
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return today;
}
