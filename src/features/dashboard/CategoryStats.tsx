import { CATEGORIES } from '../../shared/lib/constants';
import type { Entry } from '../entries/types';

interface Props {
  entries: Entry[];
  loaded: boolean;
  onPick: (subject: string) => void;
}

/** 분야별로 일지를 몇 장 썼는지. 누르면 그 분야 일지 목록으로 간다 */
export function CategoryStats({ entries, loaded, onPick }: Props) {
  const real = entries.filter((e) => !e.example);
  const counts = new Map<string, number>(CATEGORIES.map((c) => [c.name, 0]));
  for (const e of real) counts.set(e.subject, (counts.get(e.subject) ?? 0) + 1);
  const max = Math.max(1, ...counts.values());
  const filled = [...counts.values()].filter((n) => n > 0).length;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>분야별 기록</h2>
        <span className="count">{loaded ? `${filled} / ${CATEGORIES.length}분야` : ''}</span>
      </div>
      <ul className="cover">
        {CATEGORIES.map((c) => {
          const n = counts.get(c.name) ?? 0;
          return (
            <li key={c.name}>
              <button type="button" className={n === 0 ? 'zero' : undefined} onClick={() => onPick(c.name)}>
                <span>{c.name}</span>
                <span className="cover-count">
                  <span className="bar" aria-hidden="true">
                    <span style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                  <em>{n}</em>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="note">분야를 누르면 그 분야 일지만 모아 봅니다.</p>
    </div>
  );
}
