import type { Schedule, ScheduleInput } from '../types';

/**
 * 일정 저장소 인터페이스. 기록 저장소(EntryRepository)와 같은 방식으로,
 * 화면은 이 인터페이스만 알고 실제 저장 위치(Firestore / 이 기기)는 모른다.
 */
export interface ScheduleRepository {
  subscribe(onChange: (schedules: Schedule[]) => void, onError: (err: Error) => void): () => void;
  create(id: string, input: ScheduleInput): Promise<void>;
  setDone(id: string, done: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  /** 백업 파일 가져오기. 같은 id가 있으면 덮어쓴다. */
  importSchedules(schedules: Schedule[]): Promise<void>;
}
