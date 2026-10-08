import { useState, type FormEvent } from 'react';
import type { NoticeInput } from '../types';

interface Props {
  mode: 'new' | 'edit';
  initial: NoticeInput;
  onSave: (input: NoticeInput) => void;
  onCancel: () => void;
}

/** 공지 쓰기·수정 */
export function NoticeEditor({ mode, initial, onSave, onCancel }: Props) {
  const [value, setValue] = useState<NoticeInput>(initial);
  const [status, setStatus] = useState('');

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!value.title.trim()) return setStatus('제목을 적어 주세요.');
    if (!value.content.trim()) return setStatus('내용을 적어 주세요.');
    onSave({ ...value, title: value.title.trim(), content: value.content.replace(/\s+$/, '') });
  };

  return (
    <>
      <div className="compose-head">
        <h2>{mode === 'edit' ? '공지 수정' : '공지 쓰기'}</h2>
      </div>
      <form className="form" onSubmit={submit} noValidate>
        <input
          className="input compose-title"
          type="text"
          maxLength={120}
          placeholder="공지 제목"
          aria-label="공지 제목"
          value={value.title}
          onChange={(ev) => setValue((v) => ({ ...v, title: ev.target.value }))}
        />
        <textarea
          className="textarea compose-body"
          rows={14}
          aria-label="공지 내용"
          placeholder={'예) 이번 주 목표, 시험·과제 일정, 공부 규칙 등\n\n빈 줄로 문단을 나누고, ``` 로 코드 블록을 만들 수 있어요.'}
          value={value.content}
          onChange={(ev) => setValue((v) => ({ ...v, content: ev.target.value }))}
        />
        <label className="check">
          <input type="checkbox" checked={value.pinned} onChange={(ev) => setValue((v) => ({ ...v, pinned: ev.target.checked }))} />
          상단 고정 — 모든 게시판 맨 위와 대시보드에 보여요
        </label>
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
