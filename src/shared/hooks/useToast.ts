import { useCallback, useEffect, useRef, useState } from 'react';

/** 화면 아래에 잠깐 떴다 사라지는 알림 */
export function useToast(duration = 2800) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { message, show };
}
