# Oracle Page

당신은 예언가 입니까

커뮤니티가 예언을 만들고, 포인트를 걸고, 마감되면 결과를 확인하는 예측 커뮤니티입니다.
적중할수록 포인트가 쌓이고 등급이 진화합니다 (잉어킹 → 아르세우스).

---

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

설정 없이 바로 돌아갑니다. 이때는 **로컬 모드**로, 예언 기록이 그 브라우저의
localStorage 에만 저장됩니다. 계정도 없고 기기 간 공유도 되지 않습니다.

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm test` | 유닛 테스트 43종 (Node 내장 러너, 추가 의존성 없음) |
| `npm run lint` | ESLint |
| `npm run build` | 프로덕션 빌드 |

---

## Supabase 연결

환경변수를 넣는 순간 **서버 모드**로 바뀝니다. 계정으로 로그인하고, 기록이
Postgres 에 남고, 마감된 예언은 브라우저를 닫아도 서버가 정산합니다.

### 1. 프로젝트와 키

[supabase.com](https://supabase.com) 에서 프로젝트를 만들고,
Project Settings → API 에서 두 값을 복사합니다.

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 채우기
```

> `anon` 키는 공개되어도 되는 키입니다. 실제 권한은 RLS 정책이 정합니다.
> `service_role` 키는 브라우저로 나가므로 절대 넣지 마세요.

### 2. 스키마 적용

Supabase CLI 로:

```bash
npx supabase link --project-ref <프로젝트-ref>
npx supabase db push
```

CLI 없이 하려면 대시보드 SQL Editor 에 `supabase/migrations/` 의 파일을
**이름 순서대로** 붙여넣어 실행합니다.

| 파일 | 내용 |
| --- | --- |
| `20260826000100_schema.sql` | 테이블, 인덱스, 가입 시 프로필 생성 트리거 |
| `20260826000200_rls.sql` | RLS 정책, 포인트 직접 수정 차단 |
| `20260826000300_functions.sql` | 배팅·정산·보너스 등 포인트가 걸린 동작 |
| `20260826000400_cron.sql` | 마감 자동 정산 스케줄 (pg_cron) |

둘러볼 예언이 필요하면 `supabase/seed.sql` 도 실행합니다.
(로컬 개발에서는 `supabase db reset` 이 자동으로 실행합니다)

### 3. 마감 자동 정산 켜기

Database → Extensions 에서 **pg_cron** 을 켠 뒤
`20260826000400_cron.sql` 을 실행하면, 매분 마감된 예언을 서버가 정산합니다.

켜지 않아도 앱은 동작하지만, 관리자가 직접 예언을 종료해야 결과가 나옵니다.

### 4. 관리자 권한

`/admin` 은 프로필의 `role` 로만 열립니다. 가입한 뒤 SQL Editor 에서:

```sql
update profiles set role = 'admin' where id = '<내-user-id>';
```

`<내-user-id>` 는 `/admin` 접근 시 화면에 표시됩니다.

### 5. (선택) DB 타입 생성

```bash
npx supabase gen types typescript --linked > lib/supabase/generated.ts
```

지금은 `lib/supabase/types.ts` 의 Row 인터페이스로 매핑 지점의 모양만
고정하고 있습니다. 실제 타입을 생성해 붙이면 스키마와 코드가 어긋날 때 잡힙니다.

---

## 두 모드의 차이

|  | 로컬 모드 | 서버 모드 (Supabase) |
| --- | --- | --- |
| 저장 위치 | 브라우저 localStorage | Postgres |
| 로그인 | 없음 (고정 유저 1명) | 이메일 + 비밀번호 |
| 포인트 계산 | 클라이언트 | **서버 함수** — 클라이언트는 결과를 받아쓰기만 |
| 마감 정산 | 탭이 열려 있을 때만 | pg_cron 이 매분 |
| 다른 유저 활동 | 시뮬레이션 | 실제 배팅이 실시간으로 |
| 관리자 | 데모 비밀번호 | 프로필 `role` |

가장 큰 차이는 **신뢰 경계**입니다. 로컬 모드는 클라이언트가 곧 서버라 포인트
계산도 브라우저에서 하지만, 서버 모드에서는 포인트·전적·정산 결과를 클라이언트가
직접 쓸 수 없습니다. RLS 가 막고, `SECURITY DEFINER` 함수만 바꿀 수 있습니다.

---

## 구조

```
app/            화면 (전부 클라이언트 컴포넌트)
components/     UI 조각
lib/
  data/         저장소 — local(localStorage) / supabase 두 구현
  supabase/     클라이언트, 인증, DB 행 타입
  settlement.ts 정산 계산 (순수 함수, 테스트됨)
  betting.ts    선택률·배당 계산 (순수 함수, 테스트됨)
  grades.ts     등급 규칙 — 혜택 문구를 여기서 생성한다
  useNow.ts     시간 표시 (하이드레이션 안전)
supabase/
  migrations/   스키마·RLS·함수·크론
  seed.sql      초기 예언
```

값이 걸린 계산(`settlement`, `betting`, `grades`)은 순수 함수로 떼어 두고
유닛 테스트로 고정했습니다. 서버 함수도 같은 규칙을 구현하므로, 규칙을 바꿀 때는
**TypeScript 와 SQL 양쪽을 함께** 고쳐야 합니다.

---

## 알려진 한계

- 서버 모드에서 예언의 **정답이 무작위**입니다. `settle_due_oracles()` 가 선택률
  가중 랜덤으로 고릅니다. 실제 서비스라면 이 자리가 관리자 승인 큐가 되어야 합니다.
- 관리자 대시보드의 상단 통계(총 사용자, 유통 포인트 등)는 아직 목데이터입니다.
- 로컬 모드의 활동 티커는 다른 유저를 흉내 낸 시뮬레이션입니다.
