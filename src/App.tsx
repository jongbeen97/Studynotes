import { useMemo } from 'react';
import { AppShell, type Repos } from './app/AppShell';
import { FirestoreEntryRepository } from './features/entries/repository/FirestoreEntryRepository';
import { LocalEntryRepository } from './features/entries/repository/LocalEntryRepository';
import { FirestoreNoticeRepository } from './features/notices/repository/FirestoreNoticeRepository';
import { LocalNoticeRepository } from './features/notices/repository/LocalNoticeRepository';
import { FirestoreProfileRepository } from './features/profile/repository/FirestoreProfileRepository';
import { LocalProfileRepository } from './features/profile/repository/LocalProfileRepository';
import { FirestoreScheduleRepository } from './features/schedule/repository/FirestoreScheduleRepository';
import { LocalScheduleRepository } from './features/schedule/repository/LocalScheduleRepository';
import { LoginScreen, Splash } from './shared/components/Screens';
import { useAuth } from './shared/hooks/useAuth';
import { db, firebaseEnabled } from './shared/lib/firebase';

export default function App() {
  const { user, ready, error: authError, signIn, signOut } = useAuth();

  // 로그인 상태에 맞는 저장소를 고른다. (Firebase 설정 전이면 이 기기 저장)
  const repos = useMemo<Repos | null>(() => {
    if (!firebaseEnabled) {
      const entries = new LocalEntryRepository();
      return {
        label: entries.label,
        entries,
        schedules: new LocalScheduleRepository(),
        notices: new LocalNoticeRepository(),
        profile: new LocalProfileRepository(),
      };
    }
    if (!user || !db) return null;
    const entries = new FirestoreEntryRepository(db, user.uid);
    return {
      label: entries.label,
      entries,
      schedules: new FirestoreScheduleRepository(db, user.uid),
      notices: new FirestoreNoticeRepository(db, user.uid),
      profile: new FirestoreProfileRepository(db, user.uid),
    };
  }, [user]);

  if (!ready) return <Splash />;
  if (firebaseEnabled && !user) return <LoginScreen onSignIn={signIn} error={authError} />;
  if (!repos) return <Splash />;

  return <AppShell repos={repos} user={user} onSignOut={firebaseEnabled ? signOut : null} />;
}
