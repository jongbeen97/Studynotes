import type { User } from 'firebase/auth';
import { HistoryForm } from '../features/profile/components/HistoryForm';
import { PasswordSection } from '../features/profile/components/PasswordSection';
import { ProfileCard } from '../features/profile/components/ProfileCard';
import type { Profile, ProfileInput } from '../features/profile/types';
import { signInMethods } from '../shared/lib/account';

interface Props {
  user: User | null;
  profile: Profile;
  loaded: boolean;
  error: string | null;
  onSave: (input: ProfileInput, okMsg: string) => void;
}

/** 내 정보: 사진·아이디, 비밀번호, 수강 이력, 학력 */
export function ProfilePage({ user, profile, loaded, error, onSave }: Props) {
  if (error) return <div className="empty">내 정보를 불러오지 못했어요. ({error})</div>;
  if (!loaded) return <p className="note">내 정보를 불러오는 중…</p>;

  return (
    <div className="profile">
      <div className="profile-side">
        <ProfileCard
          key={profile.nickname}
          profile={profile}
          account={user?.email ?? null}
          methods={user ? signInMethods(user) : null}
          onPhoto={(photo) => onSave({ photo }, photo ? '프로필 사진을 바꿨어요.' : '프로필 사진을 지웠어요.')}
          onNickname={(nickname) => onSave({ nickname }, '표시 이름을 저장했어요.')}
        />
        <PasswordSection user={user} />
      </div>
      {/* 다른 기기에서 바뀌면 새 값으로 다시 그린다 */}
      <HistoryForm key={JSON.stringify([profile.courses, profile.education])} profile={profile} onSave={(input) => onSave(input, '수강 이력과 학력을 저장했어요.')} />
    </div>
  );
}
