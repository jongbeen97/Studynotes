import { useEffect, useState } from 'react';
import type { ScheduleRepository } from './repository/ScheduleRepository';
import { sortSchedules, type Schedule } from './types';

interface SchedulesState {
  schedules: Schedule[];
  loaded: boolean;
  error: string | null;
}

/** 일정 저장소를 구독해 일정 목록을 실시간으로 받아 온다 */
export function useSchedules(repo: ScheduleRepository): SchedulesState {
  const [state, setState] = useState<SchedulesState>({ schedules: [], loaded: false, error: null });

  useEffect(() => {
    setState((s) => ({ ...s, loaded: false, error: null }));
    return repo.subscribe(
      (list) => setState({ schedules: sortSchedules(list), loaded: true, error: null }),
      (err) => setState((s) => ({ ...s, loaded: true, error: err.message || '일정을 불러오지 못했어요.' })),
    );
  }, [repo]);

  return state;
}
