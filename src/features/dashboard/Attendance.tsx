import { COURSE, WEEKDAYS } from '../../shared/lib/constants';
import { dayNumber, formatLong, fromDayNumber, weekdayOf } from '../../shared/lib/dates';
import type { Entry } from '../entries/types';

interface Props {
  entries: Entry[];
  loaded: boolean;
  today: string;
}

const WEEKS = 8;

/** 최근 8주의 평일(월~금) 출석 격자 */
export function Attendance({ entries, loaded, today }: Props) {
  const t = dayNumber(today);
  const monday = t - ((weekdayOf(today) + 6) % 7);
  const first = monday - 7 * (WEEKS - 1);
  const start = dayNumber(COURSE.start);
  const end = dayNumber(COURSE.end);
  const has = new Set(entries.filter((e) => !e.example).map((e) => e.date));

  let on = 0;
  let days = 0;
  const rows = [1, 2, 3, 4, 5].map((wd) =>
    Array.from({ length: WEEKS }, (_, c) => {
      const n = first + 7 * c + (wd - 1);
      const date = fromDayNumber(n);
      let cls = 'cell';
      if (n < start || n > end) cls += ' off';
      else if (n > t) cls += ' future';
      else {
        days += 1;
        if (has.has(date)) {
          cls += ' on';
          on += 1;
        }
      }
      if (n === t) cls += ' today';
      return { date, cls, logged: has.has(date) };
    }),
  );

  let lastMonth = -1;
  const monthLabels = Array.from({ length: WEEKS }, (_, c) => {
    const m = Number(fromDayNumber(first + 7 * c).slice(5, 7));
    const label = m !== lastMonth ? `${m}월` : '';
    lastMonth = m;
    return label;
  });

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>출석 · 최근 8주</h2>
        <span className="count">{loaded ? `${on} / ${days}일` : ''}</span>
      </div>
      <div className="attend">
        <div className="mlabel" />
        {monthLabels.map((l, i) => (
          <div key={i} className="mlabel">
            {l}
          </div>
        ))}
        {rows.map((row, r) => (
          <div key={r} style={{ display: 'contents' }}>
            <div className="wd">{WEEKDAYS[r + 1]}</div>
            {row.map((c) => (
              <div
                key={c.date}
                className={c.cls}
                title={`${formatLong(c.date)}${c.logged ? ' · 기록 있음' : ''}`}
                aria-label={`${formatLong(c.date)} ${c.logged ? '기록 있음' : '기록 없음'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="legend">
        <span>
          <i className="on" />
          기록한 날
        </span>
        <span>
          <i />
          기록 없는 평일
        </span>
      </div>
    </div>
  );
}
