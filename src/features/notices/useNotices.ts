import { useEffect, useState } from 'react';
import type { NoticeRepository } from './repository/NoticeRepository';
import { sortNotices, type Notice } from './types';

interface NoticesState {
  notices: Notice[];
  loaded: boolean;
  error: string | null;
}

/** 공지사항을 실시간으로 받아 온다 (고정 공지 먼저, 최신순) */
export function useNotices(repo: NoticeRepository): NoticesState {
  const [state, setState] = useState<NoticesState>({ notices: [], loaded: false, error: null });

  useEffect(() => {
    setState((s) => ({ ...s, loaded: false, error: null }));
    return repo.subscribe(
      (list) => setState({ notices: sortNotices(list), loaded: true, error: null }),
      (err) => setState((s) => ({ ...s, loaded: true, error: err.message || '공지를 불러오지 못했어요.' })),
    );
  }, [repo]);

  return state;
}
