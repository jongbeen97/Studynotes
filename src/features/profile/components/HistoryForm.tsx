import { useState, type FormEvent } from 'react';
import { EDU_DEGREES, EDU_STATUSES, newRowId, type CourseHistory, type Education, type Profile, type ProfileInput } from '../types';

interface Props {
  profile: Profile;
  onSave: (input: ProfileInput) => void;
}

const emptyCourse = (): CourseHistory => ({ id: newRowId(), name: '', org: '', start: '', end: '' });
const emptyEducation = (): Education => ({ id: newRowId(), school: '', major: '', degree: '', status: '', start: '', end: '' });

/** 수강 이력(수업명 - 기관 - 기간)과 학력. 여러 줄을 고친 뒤 한 번에 저장한다 */
export function HistoryForm({ profile, onSave }: Props) {
  const [courses, setCourses] = useState<CourseHistory[]>(profile.courses);
  const [education, setEducation] = useState<Education[]>(profile.education);
  const [status, setStatus] = useState('');

  const dirty = JSON.stringify(courses) !== JSON.stringify(profile.courses) || JSON.stringify(education) !== JSON.stringify(profile.education);

  const editCourse = (id: string, patch: Partial<CourseHistory>) => setCourses((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const editEdu = (id: string, patch: Partial<Education>) => setEducation((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const cs = courses.filter((c) => c.name.trim() || c.org.trim()).map((c) => ({ ...c, name: c.name.trim(), org: c.org.trim() }));
    const es = education.filter((e) => e.school.trim()).map((e) => ({ ...e, school: e.school.trim(), major: e.major.trim() }));
    if (cs.some((c) => !c.name)) return setStatus('수업명이 빈 줄이 있어요.');
    if (cs.some((c) => c.start && c.end && c.start > c.end) || es.some((e) => e.start && e.end && e.start > e.end))
      return setStatus('끝나는 날이 시작하는 날보다 빠른 줄이 있어요.');
    setStatus('');
    setCourses(cs);
    setEducation(es);
    onSave({ courses: cs, education: es });
  };

  const newestFirst = (a: { start: string }, b: { start: string }) => b.start.localeCompare(a.start);

  return (
    <form className="history" onSubmit={submit} noValidate>
      <section className="panel" aria-label="수강 이력">
        <div className="panel-head">
          <h2>수강 이력</h2>
          <span className="count">{courses.length}건</span>
        </div>
        {courses.length === 0 && <p className="note">들었던 수업을 추가해 보세요. 예) AWS와 AI를 활용한 MSA 기반 웹 서비스 개발 · SeSAC</p>}
        <ul className="hist-list">
          {courses.map((c, i) => (
            <li key={c.id} className="hist-row course-row">
              <input className="input" aria-label={`${i + 1}번째 수업명`} placeholder="수업명" maxLength={200} value={c.name} onChange={(ev) => editCourse(c.id, { name: ev.target.value })} />
              <input className="input" aria-label={`${i + 1}번째 기관`} placeholder="기관" maxLength={200} value={c.org} onChange={(ev) => editCourse(c.id, { org: ev.target.value })} />
              <span className="period">
                <input className="input" type="date" aria-label={`${i + 1}번째 시작일`} value={c.start} onChange={(ev) => editCourse(c.id, { start: ev.target.value })} />
                <span aria-hidden="true">–</span>
                <input className="input" type="date" aria-label={`${i + 1}번째 종료일`} value={c.end} onChange={(ev) => editCourse(c.id, { end: ev.target.value })} />
              </span>
              <button type="button" className="btn small ghost" aria-label={`${c.name || `${i + 1}번째 수업`} 지우기`} onClick={() => setCourses((l) => l.filter((x) => x.id !== c.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="row">
          <button type="button" className="btn small" onClick={() => setCourses((l) => [...l, emptyCourse()])}>
            + 수업 추가
          </button>
          {courses.length > 1 && (
            <button type="button" className="btn small" onClick={() => setCourses((l) => [...l].sort(newestFirst))}>
              최근 순으로 정렬
            </button>
          )}
        </div>
      </section>

      <section className="panel" aria-label="학력">
        <div className="panel-head">
          <h2>학력</h2>
          <span className="count">{education.length}건</span>
        </div>
        {education.length === 0 && <p className="note">최종 학력부터 추가해 보세요.</p>}
        <ul className="hist-list">
          {education.map((e, i) => (
            <li key={e.id} className="hist-row edu-row">
              <input className="input" aria-label={`${i + 1}번째 학교`} placeholder="학교" maxLength={200} value={e.school} onChange={(ev) => editEdu(e.id, { school: ev.target.value })} />
              <input className="input" aria-label={`${i + 1}번째 전공`} placeholder="전공 (선택)" maxLength={200} value={e.major} onChange={(ev) => editEdu(e.id, { major: ev.target.value })} />
              <select className="select" aria-label={`${i + 1}번째 학위`} value={e.degree} onChange={(ev) => editEdu(e.id, { degree: ev.target.value })}>
                <option value="">구분</option>
                {EDU_DEGREES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <select className="select" aria-label={`${i + 1}번째 상태`} value={e.status} onChange={(ev) => editEdu(e.id, { status: ev.target.value })}>
                <option value="">상태</option>
                {EDU_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <span className="period">
                <input className="input" type="month" aria-label={`${i + 1}번째 입학`} value={e.start} onChange={(ev) => editEdu(e.id, { start: ev.target.value })} />
                <span aria-hidden="true">–</span>
                <input className="input" type="month" aria-label={`${i + 1}번째 졸업`} value={e.end} onChange={(ev) => editEdu(e.id, { end: ev.target.value })} />
              </span>
              <button type="button" className="btn small ghost" aria-label={`${e.school || `${i + 1}번째 학력`} 지우기`} onClick={() => setEducation((l) => l.filter((x) => x.id !== e.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="row">
          <button type="button" className="btn small" onClick={() => setEducation((l) => [...l, emptyEducation()])}>
            + 학력 추가
          </button>
        </div>
      </section>

      <div className="formbar sticky-bar">
        <button type="submit" className="btn primary" disabled={!dirty}>
          수강 이력 · 학력 저장
        </button>
        {dirty && !status && <span className="note">저장하지 않은 변경이 있어요.</span>}
        {status && (
          <p className="status error" role="alert">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}
