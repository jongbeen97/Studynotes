import { LEGACY_SUBJECTS, MAP_ROWS, SUBJECTS, topicsOf } from '../../shared/lib/constants';
import { isValidDate } from '../../shared/lib/dates';

export type ReviewKind = 'd1' | 'd7';

/** 사용자가 입력하는 값 (Spring으로 치면 요청 DTO) */
export interface EntryInput {
  date: string; // 'YYYY-MM-DD'
  subject: string; // 분야 (언어, 백엔드, AWS …)
  topic: string; // 세부 항목 (Java, Spring Boot …), 없으면 ''
  title: string;
  content: string; // 본문 (자유롭게 쓰는 글, ``` 로 코드 블록)
  summary: string; // 오늘 배운 것 — 한 줄에 하나
  concepts: string; // '용어 : 설명' 한 줄에 하나
  code: string;
  errors: string;
  questions: string;
  understanding: number; // 1~5
  mapRows: string[];
}

/** 저장된 기록 한 장 (Spring으로 치면 엔티티) */
export interface Entry extends EntryInput {
  id: string;
  reviewed: Record<ReviewKind, boolean>;
  example: boolean;
  createdAt: string; // ISO 시각
  updatedAt: string;
}

export function emptyInput(date: string): EntryInput {
  return {
    date,
    subject: '',
    topic: '',
    title: '',
    content: '',
    summary: '',
    concepts: '',
    code: '',
    errors: '',
    questions: '',
    understanding: 3,
    mapRows: [],
  };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** 분야·세부 항목 확인. 예전 과목 이름은 새 분야로 옮기고, 목록에 없는 값은 '기타' */
export function normalizeSubject(rawSubject: unknown, rawTopic: unknown): { subject: string; topic: string } {
  const s = str(rawSubject);
  const legacy = LEGACY_SUBJECTS[s];
  if (legacy) return legacy;
  const subject = SUBJECTS.includes(s) ? s : '기타';
  const topic = topicsOf(subject).includes(str(rawTopic)) ? str(rawTopic) : '';
  return { subject, topic };
}

/** '언어 · Java' 처럼 화면에 보여 줄 이름 */
export const subjectLabel = (e: { subject: string; topic: string }): string => (e.topic ? `${e.subject} · ${e.topic}` : e.subject);

/**
 * 저장소나 백업 파일에서 읽은 값은 모양을 믿지 않고 하나씩 확인해서 Entry로 만든다.
 * (다른 사람이 만든 파일, 예전 버전 데이터가 섞여도 화면이 깨지지 않게)
 */
export function normalizeEntry(id: string, raw: Record<string, unknown>): Entry {
  const reviewedRaw = (raw.reviewed ?? {}) as Record<string, unknown>;
  const level = Number(raw.understanding);
  return {
    id,
    date: isValidDate(raw.date) ? raw.date : '1970-01-01',
    ...normalizeSubject(raw.subject, raw.topic),
    title: str(raw.title),
    content: str(raw.content),
    summary: str(raw.summary),
    concepts: str(raw.concepts),
    code: str(raw.code),
    errors: str(raw.errors),
    questions: str(raw.questions),
    understanding: level >= 1 && level <= 5 ? Math.round(level) : 3,
    mapRows: Array.isArray(raw.mapRows) ? raw.mapRows.filter((m): m is string => typeof m === 'string' && MAP_ROWS.includes(m)) : [],
    reviewed: { d1: reviewedRaw.d1 === true, d7: reviewedRaw.d7 === true },
    example: raw.example === true,
    createdAt: str(raw.createdAt) || new Date(0).toISOString(),
    updatedAt: str(raw.updatedAt) || new Date(0).toISOString(),
  };
}

export function toInput(e: Entry): EntryInput {
  return {
    date: e.date,
    subject: e.subject,
    topic: e.topic,
    title: e.title,
    content: e.content,
    summary: e.summary,
    concepts: e.concepts,
    code: e.code,
    errors: e.errors,
    questions: e.questions,
    understanding: e.understanding,
    mapRows: [...e.mapRows],
  };
}

/** 처음 써 보는 사람을 위한 예시 기록 (내용 검증 완료) */
export const EXAMPLE_INPUT: EntryInput = {
  date: '2026-10-07',
  subject: 'Docker',
  topic: '',
  title: 'Docker 볼륨과 바인드 마운트',
  content: [
    '오늘은 컨테이너를 지웠다가 다시 만들었더니 DB 데이터가 전부 사라지는 걸 직접 겪었다.',
    '',
    '컨테이너 안에 쓴 파일은 컨테이너와 함께 지워진다. 데이터를 남기려면 볼륨을 연결해야 한다.',
    '',
    '```bash',
    'docker run -d --name mysql -v mysql-data:/var/lib/mysql mysql:8.0',
    '```',
  ].join('\n'),
  summary: [
    '컨테이너를 지우면 컨테이너 안에 쓴 파일도 함께 사라진다.',
    '데이터를 남기려면 컨테이너 밖에 저장해야 하고, 방법은 볼륨과 바인드 마운트 두 가지다.',
    '볼륨은 Docker가 관리하는 저장 공간이고, 바인드 마운트는 내 컴퓨터 폴더를 그대로 연결한다.',
    'DB 컨테이너(MySQL)는 데이터 폴더 /var/lib/mysql 을 볼륨에 연결해야 다시 만들어도 데이터가 남는다.',
  ].join('\n'),
  concepts: [
    '컨테이너 계층 : 컨테이너 안에 쓴 파일이 저장되는 곳. 컨테이너를 삭제하면 함께 지워진다',
    '볼륨(Volume) : Docker가 관리하는 저장 공간. 컨테이너를 지워도 남는다',
    '바인드 마운트(Bind mount) : 내 컴퓨터의 특정 폴더를 컨테이너 안 경로에 직접 연결하는 방식',
    "-v 옵션 : '저장소:컨테이너 안 경로' 형태로 볼륨이나 폴더를 연결한다",
  ].join('\n'),
  code: [
    'docker volume create mysql-data',
    'docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=pw -p 3306:3306 -v mysql-data:/var/lib/mysql mysql:8.0',
    'docker volume ls',
    'docker volume inspect mysql-data',
  ].join('\n'),
  errors: [
    '무엇을 하다가: 볼륨 없이 MySQL 컨테이너를 지우고 다시 만듦',
    '증상: 만들어 둔 테이블이 전부 사라짐',
    '원인: 데이터가 컨테이너 계층에만 있었음',
    '해결: -v mysql-data:/var/lib/mysql 를 붙여 다시 실행',
  ].join('\n'),
  questions: "Kubernetes의 PV/PVC도 같은 역할인가? (개념 지도 '데이터 보관' 칸에서 확인해 보기)",
  understanding: 3,
  mapRows: ['데이터 보관'],
};
