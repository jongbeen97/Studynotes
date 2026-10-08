interface Block {
  kind: 'text' | 'code';
  text: string;
  lang: string;
}

/** ``` 로 감싼 부분은 코드 블록, 나머지는 빈 줄 기준 문단으로 나눈다 */
function splitBlocks(src: string): Block[] {
  const out: Block[] = [];
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  let buf: string[] = [];
  let inCode = false;
  let lang = '';
  const flush = (kind: Block['kind']) => {
    const text = kind === 'code' ? buf.join('\n') : buf.join('\n').trim();
    if (text) out.push({ kind, text, lang });
    buf = [];
  };
  for (const line of lines) {
    const fence = line.match(/^\s*```\s*([\w+#.-]*)\s*$/);
    if (fence) {
      if (inCode) {
        flush('code');
        lang = '';
      } else {
        flush('text');
        lang = fence[1];
      }
      inCode = !inCode;
    } else {
      buf.push(line);
    }
  }
  flush(inCode ? 'code' : 'text');
  return out;
}

interface Props {
  text: string;
  onCopyCode?: (code: string) => void;
}

/** 게시글 본문. HTML로 해석하지 않고 글자 그대로 보여 준다 (스크립트 삽입 걱정 없음) */
export function PostBody({ text, onCopyCode }: Props) {
  const blocks = splitBlocks(text);
  return (
    <div className="post-body">
      {blocks.map((b, i) =>
        b.kind === 'code' ? (
          <div key={i} className="codebox">
            {b.lang && <span className="code-lang">{b.lang}</span>}
            <pre>
              <code>{b.text}</code>
            </pre>
            {onCopyCode && (
              <button type="button" className="btn small" onClick={() => onCopyCode(b.text)}>
                복사
              </button>
            )}
          </div>
        ) : (
          b.text.split(/\n{2,}/).map((p, j) => <p key={`${i}-${j}`}>{p}</p>)
        ),
      )}
    </div>
  );
}
