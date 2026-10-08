import { useState, type FormEvent } from 'react';
import { paths } from '../../app/router';
import { COURSE, WEEKDAYS } from '../../shared/lib/constants';
import { dayNumber, formatShort, fromDayNumber, pad, weekdayOf } from '../../shared/lib/dates';
import type { Entry } from '../entries/types';
import { isValidTime, type Schedule, type ScheduleInput } from './types';

interface Props {
  schedules: Schedule[];
  entries: Entry[];
  loaded: boolean;
  today: string;
  onAdd: (input: ScheduleInput) => void;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
}

/** 과정 일정에서 자동으로 달력에 찍히는 날 */
const MILESTONES: Record<string, string> = {
  [COURSE.start]: '개강',
  [COURSE.gokgan]: '곳간 시작',
  [COURSE.end]: '수료',
};

const MAX_CHIPS = 2;
const UPCOMING = 5;

/** 'YYYY-MM' 달의 첫날부터 마지막 날까지 덮는 주(週) 단위 칸 */
function monthCells(month: string): { date: string; inMonth: boolean }[] {
  const [y, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
  const start = dayNumber(first) - weekdayOf(first);
  const weeks = Math.ceil((dayNumber(next) - start) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const date = fromDayNumber(start + i);
    return { date, inMonth: date.startsWith(month) };
  });
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

/** 대시보드 달력: 월 단위로 일정·기록한 날·과정 일정을 보고, 고른 날에 일정을 추가한다 */
export function ScheduleCalendar({ schedules, entries, loaded, today, onAdd, onToggle, onRemove }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');

  const byDate = new Map<string, Schedule[]>();
  for (const s of schedules) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  const logged = new Map<string, Entry[]>();
  for (const e of entries) logged.set(e.date, [...(logged.get(e.date) ?? []), e]);

  const cells = monthCells(month);
  const [y, m] = month.split('-').map(Number);
  const daySchedules = byDate.get(selected) ?? [];
  const dayEntries = logged.get(selected) ?? [];
  const upcoming = schedules.filter((s) => !s.done && s.date >= today && s.date !== selected).slice(0, UPCOMING);

  const pick = (date: string) => {
    setSelected(date);
    setStatus('');
    if (!date.startsWith(month)) setMonth(date.slice(0, 7));
  };

  const goToday = () => {
    setMonth(today.slice(0, 7));
    pick(today);
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const t = title.trim();
    if (!t) return setStatus('일정 내용을 적어 주세요.');
    if (time && !isValidTime(time)) return setStatus('시간 형식이 올바르지 않아요.');
    onAdd({ date: selected, time, title: t.slice(0, 100) });
    setTitle('');
    setTime('');
    setStatus('');
  };

  return (
    <section className="panel cal-panel" aria-label="일정 달력">
      <div className="panel-head cal-head">
        <h2>
          일정 <span className="cal-month">{`${y}년 ${m}월`}</span>
        </h2>
        <div className="row">
          <button type="button" className="btn small" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>
            ‹
          </button>
          <button type="button" className="btn small" onClick={goToday}>
            오늘
          </button>
          <button type="button" className="btn small" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>
            ›
          </button>
        </div>
      </div>

      <div className="cal">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`cal-wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>
            {w}
          </div>
        ))}
        {cells.map(({ date, inMonth }) => {
          const list = byDate.get(date) ?? [];
          const milestone = MILESTONES[date];
          const hasLog = logged.has(date);
          const wd = weekdayOf(date);
          let cls = 'cal-day';
          if (!inMonth) cls += ' out';
          if (date === today) cls += ' today';
          if (date === selected) cls += ' sel';
          if (wd === 0) cls += ' sun';
          if (wd === 6) cls += ' sat';
          const label = [
            formatShort(date),
            milestone,
            list.length ? `일정 ${list.length}건` : '',
            hasLog ? '일지 있음' : '',
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <button key={date} type="button" className={cls} aria-label={label} aria-pressed={date === selected} onClick={() => pick(date)}>
              <span className="cal-num">
                {Number(date.slice(8))}
                {hasLog && <i className="cal-log" title="일지 있음" />}
              </span>
              {milestone && <span className="cal-chip milestone">{milestone}</span>}
              {list.slice(0, MAX_CHIPS).map((s) => (
                <span key={s.id} className={`cal-chip${s.done ? ' done' : ''}`}>
                  {s.title}
                </span>
              ))}
              {list.length > MAX_CHIPS && <span className="cal-more">+{list.length - MAX_CHIPS}</span>}
              {list.length > 0 && <span className="cal-dots" aria-hidden="true">{'•'.repeat(Math.min(list.length, 3))}</span>}
            </button>
          );
        })}
      </div>

      <div className="agenda">
        <div className="agenda-head">
          <h3>
            {formatShort(selected)}
            {selected === today && <span className="tag">오늘</span>}
          </h3>
          {MILESTONES[selected] && <span className="tag ex">{MILESTONES[selected]}</span>}
        </div>

        {!loaded ? (
          <p className="note">일정을 불러오는 중…</p>
        ) : daySchedules.length === 0 && dayEntries.length === 0 ? (
          <p className="note">이 날은 일정이 없어요. 아래에서 추가해 보세요.</p>
        ) : (
          <ul className="agenda-list">
            {daySchedules.map((s) => (
              <li key={s.id} className={s.done ? 'done' : undefined}>
                <label className="agenda-check">
                  <input type="checkbox" checked={s.done} onChange={() => onToggle(s.id, !s.done)} />
                  <span className="mono agenda-time">{s.time || '종일'}</span>
                  <span className="agenda-title">{s.title}</span>
                </label>
                <button type="button" className="btn small ghost" aria-label={`${s.title} 일정 지우기`} onClick={() => onRemove(s.id)}>
                  ×
                </button>
              </li>
            ))}
            {dayEntries.map((e) => (
              <li key={e.id}>
                <a className="agenda-entry" href={paths.post(e.id)}>
                  <span className="tag">일지</span>
                  <span className="agenda-title">{e.title || '(제목 없음)'}</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <form className="agenda-form" onSubmit={submit} noValidate>
          <input className="input" type="time" aria-label="시간 (선택)" value={time} onChange={(ev) => setTime(ev.target.value)} />
          <input
            className="input"
            type="text"
            maxLength={100}
            placeholder={`${formatShort(selected)} 일정 추가`}
            aria-label="일정 내용"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
          />
          <button type="submit" className="btn primary">
            추가
          </button>
        </form>
        {status && (
          <p className="status error" role="alert">
            {status}
          </p>
        )}

        {upcoming.length > 0 && (
          <div className="upcoming">
            <h3>다가오는 일정</h3>
            <ul>
              {upcoming.map((s) => (
                <li key={s.id}>
                  <button type="button" className="linkish" onClick={() => pick(s.date)}>
                    <small>{formatShort(s.date)}</small> {s.time && <small>{s.time}</small>} {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
