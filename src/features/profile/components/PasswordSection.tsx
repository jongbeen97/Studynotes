import { useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { accountErrorMessage, addPassword, changePassword, hasPassword, PASSWORD_MIN } from '../../../shared/lib/account';

/** 비밀번호 정하기·바꾸기 (Firebase 로그인을 쓸 때만) */
export function PasswordSection({ user }: { user: User | null }) {
  const [linked, setLinked] = useState(() => (user ? hasPassword(user) : false));
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <section className="panel" aria-label="비밀번호">
        <div className="panel-head">
          <h2>아이디 · 비밀번호</h2>
        </div>
        <p className="note">Firebase를 설정하면 로그인 아이디와 비밀번호를 쓸 수 있어요. (README 2~3단계)</p>
      </section>
    );
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (next.length < PASSWORD_MIN) return setStatus({ ok: false, text: `새 비밀번호는 ${PASSWORD_MIN}자 이상으로 정해 주세요.` });
    if (next !== confirm) return setStatus({ ok: false, text: '새 비밀번호 두 칸이 서로 달라요.' });
    if (linked && !current) return setStatus({ ok: false, text: '지금 비밀번호를 적어 주세요.' });
    setBusy(true);
    setStatus(null);
    try {
      if (linked) await changePassword(user, current, next);
      else await addPassword(user, next);
      setStatus({ ok: true, text: linked ? '비밀번호를 바꿨어요.' : `비밀번호를 정했어요. 이제 ${user.email} 과 이 비밀번호로도 로그인할 수 있어요.` });
      setLinked(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setStatus({ ok: false, text: accountErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-label="비밀번호">
      <div className="panel-head">
        <h2>아이디 · 비밀번호</h2>
        <span className="count">{linked ? '비밀번호 설정됨' : '비밀번호 없음'}</span>
      </div>
      <p className="note">
        아이디는 로그인 이메일 <b className="mono">{user.email}</b> 입니다.
        {linked ? ' 비밀번호를 바꾸려면 지금 비밀번호를 함께 적어 주세요.' : ' 비밀번호를 정하면 Google 없이 아이디·비밀번호로도 로그인할 수 있어요.'}
      </p>
      <form className="pw-form" onSubmit={submit} noValidate>
        {/* 비밀번호 관리자가 어느 계정의 비밀번호인지 알 수 있게 아이디를 숨겨 둔다 */}
        <input type="email" autoComplete="username" value={user.email ?? ''} readOnly hidden />
        {linked && (
          <div className="field">
            <label htmlFor="pw-current">지금 비밀번호</label>
            <input id="pw-current" className="input" type="password" autoComplete="current-password" value={current} onChange={(ev) => setCurrent(ev.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="pw-next">새 비밀번호</label>
          <input id="pw-next" className="input" type="password" autoComplete="new-password" value={next} onChange={(ev) => setNext(ev.target.value)} />
          <span className="hint">{PASSWORD_MIN}자 이상</span>
        </div>
        <div className="field">
          <label htmlFor="pw-confirm">새 비밀번호 확인</label>
          <input id="pw-confirm" className="input" type="password" autoComplete="new-password" value={confirm} onChange={(ev) => setConfirm(ev.target.value)} />
        </div>
        <div className="row">
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? '처리 중…' : linked ? '비밀번호 변경' : '비밀번호 정하기'}
          </button>
        </div>
        {status && (
          <p className={`status${status.ok ? '' : ' error'}`} role={status.ok ? 'status' : 'alert'}>
            {status.text}
          </p>
        )}
      </form>
    </section>
  );
}
