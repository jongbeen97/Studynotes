import { useEffect, useState } from 'react';
import { sortEntries } from './entryUtils';
import type { Entry } from './types';
import type { EntryRepository } from './repository/EntryRepository';

interface EntriesState {
  entries: Entry[];
  loaded: boolean;
  error: string | null;
}

/**
 * 저장소를 구독해 기록 목록을 실시간으로 받아 온다.
 * 다른 기기(아이패드 등)에서 저장해도 곧바로 이 화면에 반영된다.
 */
export function useEntries(repo: EntryRepository | null): EntriesState {
  const [state, setState] = useState<EntriesState>({ entries: [], loaded: false, error: null });

  useEffect(() => {
    if (!repo) {
      setState({ entries: [], loaded: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loaded: false, error: null }));
    const unsubscribe = repo.subscribe(
      (list) => setState({ entries: sortEntries(list), loaded: true, error: null }),
      (err) => setState((s) => ({ ...s, loaded: true, error: err.message || '기록을 불러오지 못했어요.' })),
    );
    return unsubscribe; // 화면이 바뀌거나 로그아웃하면 구독을 끊는다
  }, [repo]);

  return state;
}
