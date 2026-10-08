interface Props {
  filled: number;
  total?: number;
  label?: string;
  size?: 'sm' | 'md';
}

/** 모눈 칸 모양의 작은 막대 (이해도, 개념 지도 개수 등) */
export function Squares({ filled, total = 5, label, size = 'sm' }: Props) {
  return (
    <span className={`squares squares-${size}`} role={label ? 'img' : undefined} aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < filled ? 'on' : undefined} />
      ))}
    </span>
  );
}
