import { CATEGORIES, MAP_ROWS, SUBJECTS, topicsOf } from '../../shared/lib/constants';
import { dayNumber, isValidDate } from '../../shared/lib/dates';
import { subjectLabel, type Entry, type EntryInput, type ReviewKind } from './types';

/** 최신 날짜가 위로 */
export function sortEntries(list: Entry[]): Entry[] {
  return [...list].sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : b.createdAt.localeCompare(a.createdAt)));
}

/** 예시를 뺀 기록에 오래된 순서로 No.001, No.002 … 번호를 붙인다 */
export function numbering(list: Entry[]): Map<string, number> {
  const asc = list
    .filter((e) => !e.example)
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.createdAt.localeCompare(b.createdAt)));
  return new Map(asc.map((e, i) => [e.id, i + 1]));
}

export interface EntryFilter {
  subject: string;
  topic: string;
  map: string;
  q: string;
}

export function filterEntries(list: Entry[], f: EntryFilter): Entry[] {
  const q = f.q.trim().toLowerCase();
  return list.filter((e) => {
    if (f.subject && e.subject !== f.subject) return false;
    if (f.topic && e.topic !== f.topic) return false;
    if (f.map && !e.mapRows.includes(f.map)) return false;
    if (q) {
      const hay = [e.title, e.content, e.summary, e.concepts, e.code, e.errors, e.questions, e.subject, e.topic].join('\n').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export interface ReviewItem {
  entry: Entry;
  kind: ReviewKind;
  age: number; // 기록한 날로부터 며칠 지났는지
}

/**
 * 간격 반복 복습: 기록한 다음 날(D+1)과 일주일 뒤(D+7)에 다시 본다.
 * D+1은 1~6일 사이, D+7은 7~45일 사이에만 띄운다 (너무 오래된 것은 큐에서 빠짐).
 */
export function reviewItems(list: Entry[], today: string): ReviewItem[] {
  const t = dayNumber(today);
  const out: ReviewItem[] = [];
  for (const entry of list) {
    if (!isValidDate(entry.date)) continue;
    const age = t - dayNumber(entry.date);
    if (age >= 7 && age <= 45 && !entry.reviewed.d7) out.push({ entry, kind: 'd7', age });
    else if (age >= 1 && age <= 6 && !entry.reviewed.d1) out.push({ entry, kind: 'd1', age });
  }
  return out.sort((a, b) => b.age - a.age);
}

export interface Concept {
  term: string;
  desc: string;
}

/** '용어 : 설명' 줄들을 표로 쓸 수 있게 나눈다. 콜론이 없으면 설명만 있는 줄로 본다. */
export function parseConcepts(text: string): Concept[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.+?)\s*[:：]\s*(.+)$/);
      return m ? { term: m[1].trim(), desc: m[2].trim() } : { term: '', desc: l };
    });
}

/** 노션·블로그에 붙여 넣을 마크다운 */
export function toMarkdown(e: Entry): string {
  let s = `## ${e.date} · ${subjectLabel(e)} · ${e.title}\n\n`;
  if (e.content.trim()) s += `${e.content.trim()}\n\n`;
  if (e.summary.trim()) s += `### 오늘 배운 것\n${e.summary.trim()}\n\n`;
  const cs = parseConcepts(e.concepts);
  if (cs.length) s += `### 핵심 개념\n${cs.map((c) => (c.term ? `- **${c.term}**: ${c.desc}` : `- ${c.desc}`)).join('\n')}\n\n`;
  if (e.code.trim()) s += `### 명령어 · 코드\n\`\`\`bash\n${e.code.trim()}\n\`\`\`\n\n`;
  if (e.errors.trim()) s += `### 에러 노트\n${e.errors.trim()}\n\n`;
  if (e.questions.trim()) s += `### 헷갈린 점 · 질문\n${e.questions.trim()}\n\n`;
  if (e.mapRows.length) s += `개념 지도: ${e.mapRows.join(', ')}\n`;
  s += `이해도: ${e.understanding}/5\n`;
  return s;
}

/** Claude 앱에 붙여 넣을 정리 요청 프롬프트 */
export function claudePrompt(notes: string): string {
  return [
    "너는 개발 공부를 하는 사람의 '개발일지'를 정리하는 조교다.",
    '아래 <필기> 안에 적힌 내용만 사용해 정리한다. 필기에 없는 사실, 명령어, 설명을 새로 지어내지 않는다.',
    "필기 내용이 틀려 보이면 고치지 말고 questions에 '확인 필요: ...'로 적는다.",
    '한국어로, 중학생도 이해할 쉬운 말로 쓴다. 명령어와 코드는 필기 그대로 옮긴다.',
    '',
    'JSON 객체 하나로만 답한다. 형식:',
    '{"title":"30자 이내 제목","subject":"분야 목록 중 하나","topic":"세부 항목 목록 중 하나, 맞는 게 없으면 빈 문자열","summary":"오늘 배운 것 3~5줄, 줄바꿈으로 구분","concepts":[{"term":"용어","desc":"한 줄 설명"}],"code":"명령어·코드, 없으면 빈 문자열","errors":"에러와 해결, 없으면 빈 문자열","questions":"헷갈린 점·확인할 것, 없으면 빈 문자열","mapRows":["개념 지도 칸 목록 중 해당하는 것"]}',
    '',
    `분야 목록: ${SUBJECTS.join(', ')}`,
    `세부 항목 목록: ${CATEGORIES.filter((c) => c.topics.length)
      .map((c) => `${c.name}(${c.topics.join(', ')})`)
      .join(' / ')}`,
    `개념 지도 칸 목록: ${MAP_ROWS.join(', ')}`,
    '',
    '<필기>',
    notes,
    '</필기>',
  ].join('\n');
}

/**
 * Claude가 돌려준 답(JSON)을 읽어 입력 칸에 넣을 값으로 바꾼다.
 * 답 앞뒤에 설명 문장이나 ```json 코드 블록이 붙어 있어도 읽는다. 읽지 못하면 null.
 */
export function parseClaudeAnswer(text: string, base: EntryInput): EntryInput | null {
  const candidates: string[] = [text.trim()];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) candidates.push(fence[1].trim());
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));

  let obj: Record<string, unknown> | null = null;
  for (const c of candidates) {
    try {
      const v: unknown = JSON.parse(c);
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        obj = v as Record<string, unknown>;
        break;
      }
    } catch {
      /* 다음 후보로 */
    }
  }
  if (!obj) return null;

  const pick = (k: string, fallback: string): string => {
    const v = obj![k];
    return typeof v === 'string' && v.trim() ? v.trim() : fallback;
  };
  const next: EntryInput = { ...base };
  next.title = pick('title', base.title);
  if (typeof obj.subject === 'string' && SUBJECTS.includes(obj.subject)) {
    next.subject = obj.subject;
    next.topic = typeof obj.topic === 'string' && topicsOf(obj.subject).includes(obj.topic) ? obj.topic : '';
  }
  next.summary = pick('summary', base.summary);
  if (Array.isArray(obj.concepts)) {
    const lines = obj.concepts
      .map((c) => {
        if (c && typeof c === 'object') {
          const o = c as Record<string, unknown>;
          const term = typeof o.term === 'string' ? o.term : '';
          const desc = typeof o.desc === 'string' ? o.desc : '';
          return term ? `${term} : ${desc}` : desc;
        }
        return typeof c === 'string' ? c : '';
      })
      .filter((l) => l.trim());
    if (lines.length) next.concepts = lines.join('\n');
  }
  next.code = pick('code', base.code);
  next.errors = pick('errors', base.errors);
  next.questions = pick('questions', base.questions);
  if (Array.isArray(obj.mapRows)) {
    const found = obj.mapRows.filter((m): m is string => typeof m === 'string' && MAP_ROWS.includes(m));
    next.mapRows = Array.from(new Set([...base.mapRows, ...found]));
  }
  return next;
}
