import { Fragment } from 'react';
import { COURSE } from '../../shared/lib/constants';
import { dayNumber, pad } from '../../shared/lib/dates';
import type { Entry } from '../entries/types';

/** 개강일부터 수료일 사이에 있는 매월 1일 */
function monthStarts(): { label: string; date: string }[] {
  const [sy, sm] = COURSE.start.split('-').map(Number);
  const end = dayNumber(COURSE.end);
  const out: { label: string; date: string }[] = [];
  let y = sy;
  let m = sm + 1;
  for (;;) {
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const date = `${y}-${pad(m)}-01`;
    if (dayNumber(date) > end) break;
    out.push({ label: `${m}월`, date });
    m += 1;
  }
  return out;
}

type Align = 'start' | 'center' | 'end';

interface Props {
  entries: Entry[];
  today: string;
}

/** 과정 전체를 자(ruler)처럼 보여 준다: 오늘 위치, 곳간 시작일, 수료일 */
export function CourseRuler({ entries, today }: Props) {
  const s = dayNumber(COURSE.start);
  const e = dayNumber(COURSE.end);
  const t = dayNumber(today);
  const total = e - s + 1;
  const loggedDays = new Set(entries.filter((x) => !x.example).map((x) => x.date)).size;
  const pct = (d: string) => Math.max(0, Math.min(1, (dayNumber(d) - s) / (e - s))) * 100;
  const g = dayNumber(COURSE.gokgan);
  const inCourse = t >= s && t <= e;
  const nearGokgan = inCourse && Math.abs(t - g) <= 14;

  /**
   * 글자 정렬: 끝에 가까우면 안쪽으로, '오늘'과 '곳간 시작'이 가까우면 서로 반대쪽으로 비켜 선다.
   * (표시선은 언제나 날짜 위치 그대로)
   */
  const align = (p: number, isEarlier: boolean | null): Align => {
    if (p < 8) return 'start';
    if (p > 92) return 'end';
    if (isEarlier === null) return 'center';
    return isEarlier ? 'end' : 'start';
  };
  const gokganAlign = align(pct(COURSE.gokgan), nearGokgan ? g < t : null);
  const todayAlign = align(pct(today), nearGokgan ? t <= g : null);
  const [, sm, sd] = COURSE.start.split('-').map(Number);
  const [, em, ed] = COURSE.end.split('-').map(Number);

  return (
    <section className="ruler-box" aria-label="과정 진행">
      <div className="ruler-head">
        <span className="eyebrow">과정 진행</span>
        <div className="ruler-stats">
          {t < s && (
            <span>
              개강까지 <b>{s - t}</b>일
            </span>
          )}
          {t > e && (
            <span>
              수료 완료 · 전체 <b>{total}</b>일
            </span>
          )}
          {t >= s && t <= e && (
            <>
              <span>
                <b>{t - s + 1}</b>일차 / {total}일
              </span>
              <span>
                수료까지 <b>{e - t}</b>일
              </span>
            </>
          )}
          <span>
            기록한 날 <b>{loggedDays}</b>일
          </span>
        </div>
      </div>
      <div className="ruler" aria-hidden="true">
        <div className="track" />
        <div className="fill" style={{ width: `${pct(today)}%` }} />
        {monthStarts().map((m) => {
          const p = pct(m.date);
          const edge = p < 12 || p > 88 ? ' near-edge' : '';
          return (
            <Fragment key={m.date}>
              <div className="tick" style={{ left: `${p}%` }} />
              <div className={`tlabel${edge}`} style={{ left: `${p}%` }}>
                {m.label}
              </div>
            </Fragment>
          );
        })}
        <div className="tlabel edge-l" style={{ left: 0 }}>
          {sm}/{sd}
        </div>
        <div className="tlabel edge-r" style={{ left: '100%' }}>
          {em}/{ed} 수료
        </div>
        <div className="mline event" style={{ left: `${pct(COURSE.gokgan)}%` }} />
        <div className={`mlabel event ${gokganAlign}`} style={{ left: `${pct(COURSE.gokgan)}%` }}>
          곳간 시작
        </div>
        {inCourse && (
          <>
            <div className="mline today" style={{ left: `${pct(today)}%` }} />
            <div className={`mlabel today ${todayAlign}`} style={{ left: `${pct(today)}%` }}>
              오늘
            </div>
          </>
        )}
      </div>
    </section>
  );
}
