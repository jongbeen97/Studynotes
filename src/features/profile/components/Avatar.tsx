interface Props {
  photo: string;
  name: string;
  size?: 'sm' | 'lg';
}

/** 프로필 사진. 사진이 없으면 이름 첫 글자 */
export function Avatar({ photo, name, size = 'sm' }: Props) {
  const initial = (name.trim()[0] ?? '나').toUpperCase();
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : initial}
    </span>
  );
}
