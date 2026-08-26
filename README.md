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
| `20260826000400_cron.sql` | 마감 처리 스케줄 (pg_cron) |
| `20260826000500_review_queue.sql` | 관리자 승인 큐, 무효 처리, 결재 기록 |

둘러볼 예언이 필요하면 `supabase/seed.sql` 도 실행합니다.
(로컬 개발에서는 `supabase db reset` 이 자동으로 실행합니다)

### 3. 마감 처리 스케줄 켜기

Database → Extensions 에서 **pg_cron** 을 켠 뒤 크론 마이그레이션을 실행하면,
매분 마감된 예언을 서버가 처리합니다.

켜지 않아도 앱은 동작하지만, 관리자가 직접 예언을 마감시켜야 합니다.

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
| 마감 처리 | 탭이 열려 있을 때만 | pg_cron 이 매분 |
| 기본 정산 방식 | 자동 (혼자 하는 데모라서) | 관리자 확정 |
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

---

## 정산 방식

마감된 예언의 결과를 어떻게 정할지는 관리자 패널 → **승인 대기** 탭에서 고릅니다.

**관리자 확정** (서버 기본값)

```
live → 마감 → awaiting(승인 큐) → 관리자 확정 → closed
                                 └ 무효 처리 → voided (전원 환불)
```

확정 전까지 **포인트는 전혀 움직이지 않습니다.** 관리자는 배팅 분포와 총 풀을 보고
정답을 고르거나, 판정이 불가능하면 무효 처리해 원금을 전원 환불합니다. 무효는
승부가 아니므로 연승과 적중률에 영향을 주지 않습니다.

모든 결정은 `settlement_reviews` 에 누가·언제·무엇을·왜 남습니다.

**자동 정산** (로컬 기본값)

마감되면 선택률 가중 랜덤으로 즉시 정산합니다. 결과가 무작위이므로 데모·테스트용입니다.
혼자 쓰는 로컬 모드에서 승인을 기다리면 결과를 영영 볼 수 없어 기본값으로 두었습니다.

---

## 알려진 한계

- 관리자 대시보드의 상단 통계(총 사용자, 유통 포인트 등)는 아직 목데이터입니다.
- 로컬 모드의 활동 티커는 다른 유저를 흉내 낸 시뮬레이션입니다.
- 승인 큐에 오래 방치된 예언을 알려주는 알림은 없습니다. 6시간 넘게 대기한 건은
  관리자 화면에서 강조만 됩니다.
