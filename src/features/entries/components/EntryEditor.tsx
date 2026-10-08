import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LEVELS, MAP_ROWS, STORAGE_KEYS, SUBJECTS, topicsOf } from '../../../shared/lib/constants';
import { isValidDate } from '../../../shared/lib/dates';
import { copyText, storageSet } from '../../../shared/lib/platform';
import { claudePrompt, parseClaudeAnswer } from '../entryUtils';
import type { EntryInput } from '../types';

interface Props {
  mode: 'new' | 'edit';
  initial: EntryInput;
  restoredDraft: boolean;
  onSave: (input: EntryInput) => void;
  onCancel: () => void;
}

const hasStudy = (v: EntryInput) => Boolean(v.summary || v.concepts || v.code || v.errors || v.questions || v.mapRows.length);

/** 게시글 쓰기·수정: 게시판 → 제목 → 본문, 학습 정리는 필요할 때 펼친다 */
export function EntryEditor({ mode, initial, restoredDraft, onSave, onCancel }: Props) {
  const [value, setValue] = useState<EntryInput>(initial);
  const [status, setStatus] = useState('');
  const [studyOpen, setStudyOpen] = useState(() => hasStudy(initial));

  // Claude 정리 도우미
  const [notes, setNotes] = useState('');
  const [answer, setAnswer] = useState('');
  const [helperStatus, setHelperStatus] = useState('');

  // 새 글은 쓰는 도중에 임시 저장 (앱을 닫아도 남는다)
  useEffect(() => {
    if (mode === 'new') storageSet(STORAGE_KEYS.draft, JSON.stringify(value));
  }, [mode, value]);

  const topics = topicsOf(value.subject);
  const set = <K extends keyof EntryInput>(key: K, v: EntryInput[K]) => setValue((prev) => ({ ...prev, [key]: v }));

  const toggleMap = (row: string) =>
    setValue((prev) => ({
      ...prev,
      mapRows: prev.mapRows.includes(row) ? prev.mapRows.filter((m) => m !== row) : [...prev.mapRows, row],
    }));

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!value.subject) return setStatus('게시판(분야)을 골라 주세요.');
    if (!value.title.trim()) return setStatus('제목을 적어 주세요.');
    if (!isValidDate(value.date)) return setStatus('날짜를 골라 주세요.');
    if (!value.content.trim() && !hasStudy(value)) return setStatus('본문을 적어 주세요.');
    setStatus('');
    onSave({
      ...value,
      title: value.title.trim(),
      content: value.content.replace(/\s+$/, ''),
      summary: value.summary.trim(),
      concepts: value.concepts.trim(),
      code: value.code.replace(/\s+$/, ''),
      errors: value.errors.trim(),
      questions: value.questions.trim(),
    });
  };

  const copyPrompt = async () => {
    if (!notes.trim()) return setHelperStatus('필기를 먼저 붙여 넣어 주세요.');
    const ok = await copyText(claudePrompt(notes.trim()));
    setHelperStatus(
      ok
        ? '복사했어요. Claude에 붙여 넣어 보내고, 받은 답 전체를 아래 칸에 붙여 넣으세요.'
        : '자동 복사가 막혀 있어요. 필기 칸 내용을 직접 복사해 Claude에 보내 주세요.',
    );
  };

  const applyAnswer = () => {
    const next = parseClaudeAnswer(answer, value);
    if (!next) return setHelperStatus('답을 읽지 못했어요. Claude가 준 답 전체(중괄호 { } 포함)를 그대로 붙여 넣어 주세요.');
    setValue(next);
    setStudyOpen(true);
    setHelperStatus('칸을 채웠어요. 등록하기 전에 내용이 필기와 맞는지 꼭 확인하세요.');
  };

  return (
    <>
      <div className="compose-head">
        <h2>{mode === 'edit' ? '글 수정' : '글쓰기'}</h2>
        {restoredDraft && <span className="note">임시 저장된 내용을 불러왔어요.</span>}
      </div>

      <form className="form" onSubmit={submit} noValidate>
        <div className="compose-board">
          <div className="field">
            <label htmlFor="f-subject">게시판</label>
            <select
              id="f-subject"
              className="select"
              value={value.subject}
              onChange={(ev) => setValue((prev) => ({ ...prev, subject: ev.target.value, topic: '' }))}
            >
              <option value="">게시판 고르기</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {topics.length > 0 && (
            <div className="field">
              <label htmlFor="f-topic">세부 게시판</label>
              <select id="f-topic" className="select" value={value.topic} onChange={(ev) => set('topic', ev.target.value)}>
                <option value="">선택 안 함</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="f-date">날짜</label>
            <input id="f-date" className="input" type="date" value={value.date} onChange={(ev) => set('date', ev.target.value)} />
          </div>
        </div>

        <input
          id="f-title"
          className="input compose-title"
          type="text"
          maxLength={120}
          placeholder="제목을 입력하세요"
          aria-label="제목"
          value={value.title}
          onChange={(ev) => set('title', ev.target.value)}
        />

        <div className="field">
          <textarea
            id="f-content"
            className="textarea compose-body"
            rows={16}
            aria-label="본문"
            placeholder={'오늘 배운 것, 실습한 것, 느낀 점을 자유롭게 적어 보세요.\n\n빈 줄로 문단을 나누고, 코드는 아래처럼 ``` 로 감싸면 코드 블록이 됩니다.\n```java\nSystem.out.println("hello");\n```'}
            value={value.content}
            onChange={(ev) => set('content', ev.target.value)}
          />
          <span className="hint">빈 줄 = 문단 나누기 · ```언어 … ``` = 코드 블록</span>
        </div>

        <div className="field">
          <span className="lab" id="f-level-label">
            이해도
          </span>
          <div className="levels" role="radiogroup" aria-labelledby="f-level-label">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} title={LEVELS[n - 1]} className={value.understanding === n ? 'checked' : undefined}>
                <input type="radio" name="f-level" id={`f-level-${n}`} value={n} checked={value.understanding === n} onChange={() => set('understanding', n)} />
                <span>{n}</span>
              </label>
            ))}
            <span className="hint level-hint">{LEVELS[value.understanding - 1]}</span>
          </div>
        </div>

        <details className="helper" open={studyOpen} onToggle={(ev) => setStudyOpen(ev.currentTarget.open)}>
          <summary>학습 정리 (선택) — 복습 카드·개념 지도에 쓰여요</summary>
          <div className="inner">
            <details className="helper inner-helper">
              <summary>수업 필기를 Claude로 정리해서 칸 채우기</summary>
              <div className="inner">
                <ol className="steps">
                  <li>오늘 필기를 아래에 붙여 넣고 ‘프롬프트 복사’를 누릅니다.</li>
                  <li>
                    <a href="https://claude.ai/new" target="_blank" rel="noreferrer">
                      Claude
                    </a>
                    에 붙여 넣어 보냅니다.
                  </li>
                  <li>Claude가 준 답을 그대로 복사해 두 번째 칸에 붙여 넣고 ‘칸 채우기’를 누릅니다.</li>
                </ol>
                <textarea
                  className="textarea"
                  rows={5}
                  placeholder="오늘 수업 필기, 판서, 실습 명령어를 그대로 붙여 넣으세요."
                  aria-label="수업 필기"
                  value={notes}
                  onChange={(ev) => setNotes(ev.target.value)}
                />
                <div className="row">
                  <button type="button" className="btn small primary" onClick={copyPrompt}>
                    프롬프트 복사
                  </button>
                </div>
                <textarea
                  className="textarea code"
                  rows={4}
                  placeholder='Claude의 답을 붙여 넣으세요. 예) {"title": "...", "summary": "..."}'
                  aria-label="Claude의 답"
                  value={answer}
                  onChange={(ev) => setAnswer(ev.target.value)}
                />
                <div className="row">
                  <button type="button" className="btn small" onClick={applyAnswer} disabled={!answer.trim()}>
                    칸 채우기
                  </button>
                </div>
                {helperStatus && <p className="status">{helperStatus}</p>}
              </div>
            </details>

            <Field id="f-summary" label="오늘 배운 것" hint="강의 없이 다시 설명할 수 있게 내 말로, 한 줄에 한 가지씩.">
              <textarea id="f-summary" className="textarea" rows={4} placeholder="3~5줄" value={value.summary} onChange={(ev) => set('summary', ev.target.value)} />
            </Field>
            <Field id="f-concepts" label="핵심 개념" hint="한 줄에 하나씩 ‘용어 : 설명’ 형태로 쓰면 표로 정리돼요.">
              <textarea
                id="f-concepts"
                className="textarea"
                rows={4}
                placeholder={'볼륨 : Docker가 관리하는 저장 공간\n바인드 마운트 : 내 컴퓨터 폴더를 직접 연결'}
                value={value.concepts}
                onChange={(ev) => set('concepts', ev.target.value)}
              />
            </Field>
            <Field id="f-code" label="명령어 · 코드">
              <textarea
                id="f-code"
                className="textarea code"
                rows={5}
                spellCheck={false}
                placeholder="docker run -d -p 8080:8080 ..."
                value={value.code}
                onChange={(ev) => set('code', ev.target.value)}
              />
            </Field>
            <Field id="f-errors" label="에러 노트">
              <textarea
                id="f-errors"
                className="textarea"
                rows={4}
                placeholder="무엇을 하다가 → 에러 원문 → 원인 → 해결"
                value={value.errors}
                onChange={(ev) => set('errors', ev.target.value)}
              />
            </Field>
            <Field id="f-questions" label="헷갈린 점 · 질문">
              <textarea
                id="f-questions"
                className="textarea"
                rows={3}
                placeholder="아직 모르겠는 것. 다음 수업이나 Claude에게 물어볼 것."
                value={value.questions}
                onChange={(ev) => set('questions', ev.target.value)}
              />
            </Field>
            <div className="field">
              <span className="lab">개념 지도 칸</span>
              <span className="hint">개념 연결 지도에서 오늘 내용이 들어가는 칸</span>
              <div className="maps">
                {MAP_ROWS.map((m, i) => (
                  <label key={m} htmlFor={`f-map-${i}`} className={value.mapRows.includes(m) ? 'checked' : undefined}>
                    <input id={`f-map-${i}`} type="checkbox" checked={value.mapRows.includes(m)} onChange={() => toggleMap(m)} />
                    {m}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </details>

        <div className="formbar">
          <button type="submit" className="btn primary">
            {mode === 'edit' ? '수정 완료' : '등록'}
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            취소
          </button>
          {status && (
            <p className="status error" role="alert">
              {status}
            </p>
          )}
        </div>
      </form>
    </>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      {children}
    </div>
  );
}
