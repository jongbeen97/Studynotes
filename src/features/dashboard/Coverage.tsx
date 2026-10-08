import { MAP_ROWS } from '../../shared/lib/constants';
import type { Entry } from '../entries/types';
import { Squares } from '../../shared/components/Squares';

interface Props {
  entries: Entry[];
  loaded: boolean;
  active: string;
  onToggle: (row: string) => void;
}

/** 로드맵 "개념 연결 지도" 13칸을 얼마나 채웠는지 */
export function Coverage({ entries, loaded, active, onToggle }: Props) {
  const counts = new Map<string, number>(MAP_ROWS.map((m) => [m, 0]));
  for (const e of entries) for (const m of e.mapRows) counts.set(m, (counts.get(m) ?? 0) + 1);
  const filled = MAP_ROWS.filter((m) => (counts.get(m) ?? 0) > 0).length;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>개념 지도 채우기</h2>
        <span className="count">{loaded ? `${filled} / ${MAP_ROWS.length}칸` : ''}</span>
      </div>
      <ul className="cover">
        {MAP_ROWS.map((m) => {
          const n = counts.get(m) ?? 0;
          return (
            <li key={m}>
              <button
                type="button"
                className={`${active === m ? 'active ' : ''}${n === 0 ? 'zero' : ''}`}
                aria-pressed={active === m}
                onClick={() => onToggle(m)}
              >
                <span>{m}</span>
                <span className="cover-count">
                  <Squares filled={Math.min(n, 5)} />
                  <em>{n}</em>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="note">칸을 누르면 그 개념으로 기록한 날만 모아 봅니다.</p>
    </div>
  );
}
