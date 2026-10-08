# 개발일지 — React + TypeScript + PWA

하루 한 장 수업 기록을 쓰고, D+1·D+7 복습과 "개념 지도 채우기"로 배운 내용을 다시 보게 해 주는 개인용 웹앱입니다.
**iPhone · iPad · MacBook** 세 기기에서 같은 Google 계정으로 로그인하면 기록이 자동으로 맞춰지고(동기화),
홈 화면/Dock에 추가하면 **앱처럼** 실행됩니다. 비용은 **0원**입니다.

---

## 0. 한눈에 보기

### 무엇으로 만들었나

| 역할 | 사용한 기술 | 한 줄 설명 |
| --- | --- | --- |
| 화면 | React 19 + TypeScript (Vite 7) | 화면을 컴포넌트 단위로 나눠 만든다 |
| 데이터 저장 | Firebase **Cloud Firestore** | 클라우드 DB. 인터넷이 끊겨도 기기에 먼저 저장했다가 나중에 올린다 |
| 로그인 | Firebase **Authentication** (Google) | "내 기록"을 구분하는 열쇠 |
| 배포(웹 주소) | Firebase **Hosting** | `npm run deploy` 한 번으로 인터넷에 올린다 |
| 앱 | **PWA** (Progressive Web App) | 앱스토어 없이 홈 화면에 설치. iPhone·iPad·Mac 모두 가능 |

### 왜 Firebase 무료(Spark) 요금제인가

- Spark 요금제는 **결제 수단(카드)을 등록하지 않습니다.** 그래서 무료 한도를 넘어도 요금이 나가지 않고, 그날 사용만 멈춥니다.
- AWS는 가입할 때 카드 등록이 필요하고, 설정을 잘못하면 요금이 나갈 수 있습니다. "절대 0원"이 목표인 개인용 앱에는 Spark가 더 안전합니다.
- 나중에 AWS로 옮기는 연습은 이 코드 구조 그대로 할 수 있게 만들어 두었습니다(아래 "다음 단계" 참고).

### Spring Boot로 비유하면

| Spring Boot에서 배운 것 | 이 프로젝트에서 같은 역할 |
| --- | --- |
| `interface EntryRepository extends JpaRepository` | `src/features/entries/repository/EntryRepository.ts` (인터페이스) |
| JPA 구현체 (Hibernate) | `FirestoreEntryRepository.ts` (클라우드), `LocalEntryRepository.ts` (이 기기만) |
| `@Service` / `@Controller` | `src/app/AppShell.tsx`, `src/**/use*.ts` |
| 화면(Thymeleaf/JSP) | `src/pages/*`, `src/features/*/` (React 컴포넌트) |
| `application.properties` | `.env.local` (Firebase 설정값) |
| Spring Security 권한 규칙 | `firestore.rules` (서버 쪽에서 "내 기록만 읽고 쓰기"를 강제) |
| DI로 구현체 바꿔 끼우기 | `App.tsx`가 설정 유무에 따라 Firestore/Local 저장소를 골라 끼운다 |

> 화면 코드는 "어디에 저장되는지" 모르고 `repo.create()`, `repo.update()`만 부릅니다.
> 그래서 저장소를 AWS DynamoDB로 바꿔도 화면 코드는 손대지 않아도 됩니다. Spring에서 인터페이스에 의존하는 이유와 같습니다.

### 폴더 구조

```
sesac-log/
├─ index.html                 # 앱의 첫 HTML (아이콘, 글꼴, iOS 앱 설정)
├─ vite.config.ts             # 빌드 설정 + PWA(앱 설치) 설정
├─ firebase.json              # Firebase Hosting 배포 설정
├─ firestore.rules            # DB 보안 규칙 (내 기록만 접근)
├─ .env.example               # Firebase 설정값 견본 → .env.local 로 복사해서 사용
├─ public/icons/              # 앱 아이콘
└─ src/
   ├─ main.tsx                # 시작점 (Spring의 main 메서드)
   ├─ App.tsx                 # 로그인 확인 → 저장소(Firestore/Local) 골라 끼우기
   ├─ app/                    # 앱 틀: 머리글·탭(AppShell), 해시 라우터(#/, #/board, #/post, #/notices …)
   ├─ pages/                  # 화면 단위: 대시보드 / 게시판 / 게시글 / 글쓰기 / 공지사항 / 내 정보
   ├─ features/
   │  ├─ board/               # 게시판 왼쪽 메뉴 (공지사항·전체글·분야)
   │  ├─ entries/             # 개발일지 글: 타입, 유틸, 백업, 저장소, 글 보기·쓰기 컴포넌트
   │  ├─ notices/             # 공지사항: 타입, 저장소, 공지 쓰기
   │  ├─ schedule/            # 일정 달력: 타입, 저장소, 달력 컴포넌트
   │  ├─ profile/             # 내 정보: 사진, 비밀번호, 수강 이력, 학력
   │  └─ dashboard/           # 대시보드 패널: 과정 자, 최근 글, 복습, 출석, 개념 지도
   ├─ shared/                 # 여러 기능이 같이 쓰는 것: 날짜·Firebase·상수, 로그인 훅, 공통 컴포넌트
   └─ styles/                 # base / layout / dashboard / calendar / journal / board / profile
```

---

## 1단계 — 내 MacBook에서 실행해 보기 (Firebase 없이)

**준비물: Node.js 22 LTS (또는 24)**
터미널에서 `node -v`를 쳐서 `v22.x` 이상이 나오면 됩니다. 없으면 [nodejs.org](https://nodejs.org)에서 LTS를 설치하거나 `brew install node@22`.

```bash
cd sesac-log          # 압축을 푼 폴더로 이동
npm install           # 라이브러리 내려받기 (Maven의 dependency 다운로드와 같은 단계)
npm run dev           # 개발 서버 실행
```

브라우저에서 `http://localhost:5173` 을 엽니다.
아직 Firebase 설정이 없으므로 위쪽에 노란 띠 **"Firebase 설정 전: 지금은 이 브라우저에만 저장돼요"** 가 보이면 정상입니다.
"예시 기록 넣어 보기"를 눌러 화면을 둘러보세요.

---

## 2단계 — Firebase 프로젝트 만들기 (무료)

1. **프로젝트 만들기**
   [Firebase 콘솔](https://console.firebase.google.com) → **프로젝트 추가** → 이름 입력 (예: `sesac-log-내이름`).
   아래에 표시되는 **프로젝트 ID** 를 메모해 두세요. (전 세계에서 하나뿐이어야 해서 뒤에 숫자가 붙기도 합니다)
   Google 애널리틱스는 필요 없으니 꺼도 됩니다.

2. **요금제 확인**
   콘솔 왼쪽 아래 요금제가 **Spark(무료)** 인지 확인합니다. **"업그레이드" 버튼은 누르지 마세요.** (Blaze로 바뀌면 카드 등록이 필요해집니다)

3. **웹 앱 등록 → 설정값 받기**
   프로젝트 개요 화면 → **앱 추가** → 웹 아이콘 `</>` → 앱 닉네임 입력 → 등록.
   ("Firebase 호스팅도 설정" 체크는 하지 않아도 됩니다. 3단계에서 명령어로 합니다.)
   화면에 `firebaseConfig = { apiKey: ..., authDomain: ..., ... }` 가 나옵니다. 이 값을 다음 단계에서 씁니다.

4. **설정값을 `.env.local` 에 옮기기**

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` 을 열어 아래처럼 채웁니다.

   | firebaseConfig 항목 | `.env.local` 변수 |
   | --- | --- |
   | `apiKey` | `VITE_FIREBASE_API_KEY` |
   | `authDomain` (예: `sesac-log-xxxx.firebaseapp.com`) | `VITE_FIREBASE_AUTH_DOMAIN` |
   | `projectId` | `VITE_FIREBASE_PROJECT_ID` |
   | `appId` | `VITE_FIREBASE_APP_ID` |
   | `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |

   > 이 값들은 비밀번호가 아니라 "어느 Firebase 프로젝트인지" 알려 주는 주소 같은 값이라 웹에 공개돼도 됩니다.
   > 실제로 데이터를 지키는 것은 `firestore.rules` 입니다. 그래도 `.env.local` 은 `.gitignore` 에 들어 있어 GitHub에 올라가지 않습니다.

5. **Google 로그인 켜기**
   왼쪽 메뉴 **Authentication** → 시작하기 → **로그인 방법(Sign-in method)** → **Google** → 사용 설정 → 프로젝트 지원 이메일 선택 → 저장.

6. **Firestore 데이터베이스 만들기**
   왼쪽 메뉴에서 **Firestore Database** (메뉴 묶음 이름이 "빌드" 또는 "Databases & Storage"일 수 있습니다) → **데이터베이스 만들기**.
   - 버전(Edition)을 고르는 화면이 나오면 **Standard** 를 고릅니다.
   - 위치(Location): **asia-northeast3 (서울)** 추천. ⚠️ **위치는 나중에 바꿀 수 없습니다.**
   - 보안 규칙 시작 모드: **프로덕션 모드** (처음엔 모두 막힘 → 3단계에서 우리 규칙 파일을 올리면 열립니다)

> ⚠️ 3단계에서 규칙을 올리기 전에는 기록을 저장하면 **"저장 권한이 없어요"** 가 뜹니다. 정상이니 3단계까지 진행하세요.

---

## 3단계 — 인터넷에 배포하기

```bash
npm install -g firebase-tools   # Firebase CLI 설치 (한 번만)
firebase login                  # 브라우저가 열리면 Firebase 프로젝트를 만든 Google 계정으로 로그인
firebase use --add              # 2단계에서 만든 프로젝트 선택 → 별칭(alias)은 default 입력
npm run deploy                  # 빌드 + 웹 배포 + DB 보안 규칙 업로드를 한 번에
```

- `firebase: command not found` 가 나오면 `npx firebase-tools login` 처럼 앞에 `npx firebase-tools` 를 붙여 실행해도 됩니다.
- `firebase use --add` 는 `.firebaserc` 파일을 만들어 "이 폴더 = 이 Firebase 프로젝트"를 기억시킵니다.
- `npm run deploy` 가 실제로 하는 일 (`package.json` 의 scripts):
  1. `tsc --noEmit` — TypeScript 타입 검사 (Java의 컴파일 오류 검사와 같은 단계)
  2. `vite build` — `dist/` 폴더에 배포용 파일 생성 (Maven의 `package` → jar 와 비슷)
  3. `firebase deploy --only hosting,firestore:rules` — `dist/` 를 웹에 올리고, `firestore.rules` 를 DB에 적용

배포가 끝나면 터미널에 `Hosting URL: https://<프로젝트ID>.web.app` 이 나옵니다.

### 접속 주소는 `https://<프로젝트ID>.firebaseapp.com` 으로 쓰세요

Firebase는 같은 앱을 `.web.app` 과 `.firebaseapp.com` 두 주소로 보여 줍니다.
Safari(iPhone·iPad·Mac)는 개인정보 보호 때문에 **로그인 처리 주소(authDomain)와 앱 주소가 다르면** Google 로그인이 막힐 수 있습니다.
그래서 이 앱은 `.web.app` 으로 들어오면 자동으로 `.firebaseapp.com` 으로 옮겨 줍니다. 즐겨찾기·홈 화면 추가는 처음부터 `.firebaseapp.com` 주소로 하세요.

### 확인

1. `https://<프로젝트ID>.firebaseapp.com` 접속 → **Google 계정으로 시작하기**
2. 노란 띠가 사라지고, 화면 아래에 **"클라우드 동기화 · 내 이메일"** 이 보이면 성공
3. 기록 하나를 저장한 뒤, Firebase 콘솔 → Firestore → `users / (내 uid) / entries` 에 문서가 생겼는지 확인

> 이제 내 MacBook에서 `npm run dev` 로 개발할 때도 같은 클라우드 DB를 씁니다. (`localhost` 는 기본으로 로그인 허용 주소에 들어 있습니다)
> `.env.local` 을 고친 뒤에는 `npm run dev` 를 껐다 켜야 반영됩니다.

---

## 4단계 — iPhone · iPad · Mac에 앱으로 설치하기

### iPhone / iPad
1. **Safari** 로 `https://<프로젝트ID>.firebaseapp.com` 열기
2. 아래(아이패드는 위) **공유 버튼** (네모에서 화살표가 나오는 아이콘) → **홈 화면에 추가**
3. iOS/iPadOS 26 이상에서는 **"웹 앱으로 열기"** 가 켜져 있는지 확인 → 추가
4. 홈 화면의 **"개발일지"** 아이콘으로 실행 → Google 로그인 (홈 화면 앱은 Safari와 로그인 정보를 따로 보관하므로 한 번 더 로그인합니다)

### MacBook
- **Safari (macOS Sonoma 이상)**: 주소 열기 → 메뉴 막대 **파일 → Dock에 추가**
- **Chrome**: 주소창 오른쪽의 **설치 아이콘** 또는 ⋮ 메뉴의 앱 설치 항목

### 이렇게 동작합니다
- 세 기기 모두 **같은 Google 계정** 으로 로그인하면 기록이 자동으로 맞춰집니다.
- 지하철처럼 인터넷이 끊겨도 저장할 수 있습니다. 기기에 먼저 저장해 두고("인터넷이 연결되면 클라우드에 올라갑니다" 알림), 연결되면 자동으로 올라갑니다.
- 코드를 고쳐 다시 `npm run deploy` 하면, 앱을 **완전히 닫았다가 다시 열 때** 새 버전으로 바뀝니다.

---

## 5단계 (선택, 권장) — 나만 쓰도록 잠그기

지금 규칙은 **"Google 로그인한 사람은 자기 칸(`users/{자기 uid}`)만 읽고 쓰기"** 입니다.
다른 사람이 내 기록을 볼 수는 없지만, 주소를 아는 사람이 로그인해서 **자기 기록을 만드는 것** 은 가능합니다(내 무료 사용량을 씁니다).
나만 쓰려면 `firestore.rules` 의 `match /users/{uid}/entries/{entryId} { ... }` 부분을 아래로 바꾸고, `내이메일@gmail.com` 을 **내 Google 이메일** 로 고칩니다.

```
    function isMe(uid) {
      return request.auth != null
          && request.auth.uid == uid
          && request.auth.token.email == '내이메일@gmail.com'
          && request.auth.token.email_verified == true;
    }

    match /users/{uid}/entries/{entryId} {
      allow read, delete: if isMe(uid);
      allow create, update: if isMe(uid)
                            && request.resource.data.title is string
                            && request.resource.data.title.size() <= 200
                            && request.resource.data.date is string;
    }
```

그다음 `npm run deploy` (규칙만 올리려면 `firebase deploy --only firestore:rules`).
Firebase 콘솔 → Firestore → **규칙** 탭의 **규칙 플레이그라운드** 에서 테스트해 볼 수 있습니다.

---

## 아이디 · 비밀번호 로그인 켜기

1. Firebase 콘솔 → **Authentication → 로그인 방법(Sign-in method)** → **이메일/비밀번호** 사용 설정 (`이메일 링크`는 끄기)
2. 앱에 Google로 한 번 로그인 → 오른쪽 위 사진(또는 ‘내 정보’ 탭) → **비밀번호 정하기**
3. 다음부터 로그인 화면에서 **아이디(로그인 이메일) + 비밀번호**로 들어올 수 있습니다.

> 비밀번호는 Firestore에 저장하지 않고 Firebase Authentication이 따로 암호화해서 보관합니다.
> 프로필 사진은 256px로 줄여 `users/{uid}/meta/profile` 문서에 함께 저장합니다(Cloud Storage는 유료 요금제가 필요해서 쓰지 않음).
> `firestore.rules`가 바뀌었으니 `npm run deploy`로 규칙도 다시 올려 주세요.

---

## 백업

- 화면 맨 아래 **백업 내보내기** → `dev-log-backup-날짜.json` 파일이 내려받아집니다. **한 달에 한 번** 정도 권장합니다.
- **백업 가져오기** 로 다시 넣을 수 있습니다. 같은 기록(같은 id)은 덮어쓰고, 없는 기록은 새로 추가됩니다.
- Firebase 설정 전(이 기기에만 저장)에 쓴 기록도 이 방법으로 클라우드로 옮길 수 있습니다: 로컬 모드에서 내보내기 → 로그인 후 가져오기.

---

## Claude로 기록 채우기 (API 키 없이)

기록 쓰기 화면의 **"수업 필기를 Claude로 정리해서 칸 채우기"** 를 열면:
1. 수업 필기를 붙여 넣고 **프롬프트 복사**
2. Claude 대화창에 붙여 넣어 보내기
3. Claude가 준 **답 전체(중괄호 `{ }` 포함)를 그대로 복사** 해서 두 번째 칸에 붙여 넣고 **칸 채우기** → 제목·요약·개념·명령어 칸이 채워집니다
4. 내용을 한 번 읽어 보고 고친 뒤 저장 (AI 답이 틀릴 수 있으니 꼭 확인!)

> 왜 앱이 Claude를 직접 부르지 않나요?
> 웹 화면 코드에 API 키를 넣으면 누구나 볼 수 있어서 위험합니다. 키를 숨기려면 서버(Cloud Functions)가 필요한데, 이건 무료 요금제에서 쓸 수 없습니다.
> 그래서 "복사 → 붙여 넣기" 방식으로 **0원 + 키 노출 없음** 을 지켰습니다.

---

## 무료 한도 (Spark 요금제)

| 항목 | 무료 한도 | 이 앱에서는 |
| --- | --- | --- |
| Firestore 저장 용량 | 1 GiB | 기록 1건이 몇 KB라 수십만 건까지 여유 |
| Firestore 읽기 | 하루 50,000회 | 하루 종일 써도 수백 회 수준 |
| Firestore 쓰기 / 삭제 | 하루 각 20,000회 | 하루 수십 회 수준 |
| Firestore 내려받기(네트워크) | 월 10 GiB | 충분 |
| Hosting 저장 용량 | 10 GB | 앱 파일 약 1 MB |
| Hosting 전송량 | 하루 360 MB | 개인 사용엔 충분 |

하루 한도를 넘으면 **그날은 저장·조회가 멈추고 다음 날(미국 태평양 시간 자정 = 한국 시간 오후 4~5시) 풀립니다.** 카드가 없으니 요금은 나가지 않습니다.
최신 한도는 [Firebase 요금 페이지](https://firebase.google.com/pricing)에서 확인하세요.

---

## 문제 해결

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| 로그인 시 "이 주소는 로그인 허용 목록에 없어요" (`auth/unauthorized-domain`) | Firebase가 모르는 주소에서 접속 | Authentication → **설정** → **승인된 도메인** 에 그 주소 추가 |
| 저장하면 "저장 권한이 없어요" | 보안 규칙을 아직 안 올렸거나, 5단계 이메일이 다름 | `npm run deploy` 다시 실행 / 규칙의 이메일 확인 |
| `npm run dev` 인데 계속 "이 기기에만 저장" | `.env.local` 이름·위치가 틀렸거나 서버 재시작 안 함 | 파일이 `package.json` 과 같은 폴더에 있는지 확인 → 개발 서버 재시작 |
| 컴퓨터에서 로그인 팝업이 안 뜸 | 브라우저가 팝업 차단 | 앱이 자동으로 "페이지 이동 방식" 로그인으로 바꿉니다. 그래도 안 되면 팝업 허용 |
| 새로 배포했는데 화면이 그대로 | 이전 버전이 기기에 저장(캐시)돼 있음 | 홈 화면 앱은 완전히 종료 후 재실행, 브라우저는 새로고침 |
| `npm install` 에서 Node 버전 오류 | Node가 오래됨 | Node 22 LTS 이상 설치 (`node -v` 확인) |
| iPhone 홈 화면 앱에서 로그인 후에도 로그인 화면으로 돌아옴 | iOS 버전·설정에 따라 홈 화면 앱의 로그인 이동이 막히는 경우 | Safari 탭에서 `.firebaseapp.com` 주소로 사용 (기록은 클라우드라 똑같이 보입니다) |

---

## 다음 단계 — 수업 내용과 연결해서 키우기

1. **GitHub + 자동 배포 (CI/CD)**
   GitHub에 올린 뒤 `firebase init hosting:github` 를 실행하면, `main` 에 push할 때마다 GitHub Actions가 자동으로 빌드·배포합니다.
   MSA 수업의 **CI/CD Automation** 을 내 프로젝트로 직접 해 보는 연습이 됩니다.
2. **저장소를 AWS 서버리스로 바꿔 보기**
   `EntryRepository` 인터페이스를 구현하는 `AwsEntryRepository` 를 만들고 API Gateway + Lambda + DynamoDB를 연결합니다.
   화면 코드는 그대로 두고 구현체만 바꾸는 연습 = Spring의 DI와 같은 생각입니다. (AWS는 카드 등록과 요금 알림(Budgets) 설정부터!)
3. **App Store 앱으로 만들기 (나중에)**
   [Capacitor](https://capacitorjs.com)로 이 웹앱을 iOS 앱으로 감쌀 수 있습니다. Mac의 Xcode가 필요합니다.
   - 무료 Apple 계정: 내 기기에 설치해 테스트 가능 (7일마다 다시 설치)
   - App Store 배포: **Apple Developer Program 연 99달러** (유료)
   개인용이라면 지금의 PWA로 충분합니다.
