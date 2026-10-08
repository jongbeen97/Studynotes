interface Props {
  page: number; // 1부터
  total: number; // 전체 페이지 수
  onChange: (page: number) => void;
}

const SPAN = 5; // 한 번에 보여 줄 페이지 번호 개수

/** 게시판 아래 페이지 번호 */
export function Pagination({ page, total, onChange }: Props) {
  if (total <= 1) return null;
  const start = Math.max(1, Math.min(page - Math.floor(SPAN / 2), total - SPAN + 1));
  const pages = Array.from({ length: Math.min(SPAN, total) }, (_, i) => start + i);
  return (
    <nav className="pager" aria-label="페이지">
      <button type="button" className="btn small" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="이전 페이지">
        ‹
      </button>
      {pages.map((p) => (
        <button key={p} type="button" className={`btn small${p === page ? ' primary' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button type="button" className="btn small" disabled={page === total} onClick={() => onChange(page + 1)} aria-label="다음 페이지">
        ›
      </button>
    </nav>
  );
}
