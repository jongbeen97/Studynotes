import { navigate, paths } from '../app/router';
import { Attendance } from '../features/dashboard/Attendance';
import { CategoryStats } from '../features/dashboard/CategoryStats';
import { CourseRuler } from '../features/dashboard/CourseRuler';
import { Coverage } from '../features/dashboard/Coverage';
import { NoticesPanel } from '../features/dashboard/NoticesPanel';
import { RecentEntries } from '../features/dashboard/RecentEntries';
import { ReviewQueue } from '../features/dashboard/ReviewQueue';
import type { Entry, ReviewKind } from '../features/entries/types';
import type { Notice } from '../features/notices/types';
import { ScheduleCalendar } from '../features/schedule/ScheduleCalendar';
import type { Schedule, ScheduleInput } from '../features/schedule/types';

interface Props {
  entries: Entry[];
  entriesLoaded: boolean;
  schedules: Schedule[];
  schedulesLoaded: boolean;
  notices: Notice[];
  noticesLoaded: boolean;
  today: string;
  activeMap: string;
  onMapFilter: (row: string) => void;
  onSubjectFilter: (subject: string) => void;
  onReviewed: (id: string, kind: ReviewKind) => void;
  onAddSchedule: (input: ScheduleInput) => void;
  onToggleSchedule: (id: string, done: boolean) => void;
  onRemoveSchedule: (id: string) => void;
}

/** 메인 화면: 과정 진행, 일정 달력, 공지사항, 최근 글, 복습, 분야별 기록, 출석, 개념 지도 */
export function DashboardPage(p: Props) {
  return (
    <>
      <CourseRuler entries={p.entries} today={p.today} />

      <section className="dash-top" aria-label="오늘의 계기판">
        <ScheduleCalendar
          schedules={p.schedules}
          entries={p.entries}
          loaded={p.schedulesLoaded}
          today={p.today}
          onAdd={p.onAddSchedule}
          onToggle={p.onToggleSchedule}
          onRemove={p.onRemoveSchedule}
        />
        <div className="dash-side">
          <NoticesPanel notices={p.notices} loaded={p.noticesLoaded} />
          <RecentEntries entries={p.entries} loaded={p.entriesLoaded} />
          <ReviewQueue
            entries={p.entries}
            loaded={p.entriesLoaded}
            today={p.today}
            onOpen={(id) => navigate(paths.post(id))}
            onReviewed={p.onReviewed}
          />
        </div>
      </section>

      <section className="dash" aria-label="학습 현황">
        <CategoryStats entries={p.entries} loaded={p.entriesLoaded} onPick={p.onSubjectFilter} />
        <Attendance entries={p.entries} loaded={p.entriesLoaded} today={p.today} />
        <Coverage entries={p.entries} loaded={p.entriesLoaded} active={p.activeMap} onToggle={p.onMapFilter} />
      </section>
    </>
  );
}
