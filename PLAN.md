# Oracle Page — 개발 계획

## 현재 상태 (완료)

### 1단계
- [x] 커뮤니티 피드 (OracleCard, BettingButtons, QuickBetStrip)
- [x] 추천/인기 패널 (RecommendationPanel, TrendingBadge)
- [x] 포켓몬 7단계 등급 시스템 (잉어킹→아르세우스)
- [x] 관리자 페이지 (/admin): 대시보드, 사용자관리, 예언관리, 등급설정

### 2단계 (Phase 1~5)
- [x] Phase 1 — 예언 생성 플로우 (`CreateOracleModal`, FAB 연결)
- [x] Phase 2 — 예언 상세 페이지 (`app/oracle/[id]`, 배팅 차트, 댓글 섹션)
- [x] Phase 3 — 유저 프로필 페이지 (`app/profile/[id]`, 등급 카드, 배팅 내역)
- [x] Phase 4 — 알림 시스템 (`NotificationPanel`, 헤더 Bell)
- [x] Phase 5 — 예언 결과/정산 UI (`OracleResult`)

UI/화면 단위로는 전부 구현되어 있으나, **아래 감사에서 확인된 것처럼 일부는 실제 데이터·로직과 끝까지 연결되어 있지 않음.** 3단계는 이걸 메우는 게 목표.

---

## 3단계 개발 계획 — 기능 완성 & 안정화

2026-08-25 코드 감사(빌드 실행 포함) 결과 반영. `npm run build`가 현재 실패하는 상태이고, 배팅→정산→포인트로 이어지는 핵심 루프가 중간에 끊겨 있음을 확인함.

### Phase A — 긴급 버그 수정 (최우선, 소규모)

파일: `app/page.tsx`
- `HomeTab` prop 타입의 `typeof import("@/lib/types").Oracle[]`를 `import("@/lib/types").Oracle[]`(또는 상단에서 `Oracle` 타입을 직접 import)로 교체
- `npm run build` 그린 확인 (현재 `tsc` 에러 3건으로 빌드 실패 중)

파일: `lib/context.tsx`
- `placeBet`이 `me`/`myBets`만 갱신하고 `Oracle` 자체는 안 건드리는 문제 수정
- `updateOracle` 호출을 추가해 배팅 시 선택 옵션의 `totalBets` 증가, 전체 옵션 `percentage` 재계산, `totalPool` += amount, (신규 참여자인 경우만) `totalParticipants` +1 반영

### Phase B — 배팅 → 정산 → 포인트 루프 완성 (핵심)

파일: `lib/types.ts`
- `Oracle`에 `winningOptionId?: string` 필드 추가 (지금은 "정답"을 저장할 자리가 아예 없음)

파일: `lib/context.tsx`
- `closeOracle(id, winningOptionId)`가 실제로 `winningOptionId`를 오라클에 저장하도록 수정
- `MyBetRecord.payout`을 정산 시점에 실제 값(odds × amount)으로 채움 (지금은 필드만 있고 항상 빈 값)
- **정산 방식 결정**: 기본값은 **자동 지급**으로 진행 — `closeOracle` 시점에 승리 배팅자 포인트를 바로 반영. (현재처럼 유저가 수동으로 "수령하기"를 눌러야 하는 구조는 방문을 안 하면 영영 못 받는 구조라 위험함.) "포인트 획득" 연출은 상세 페이지 최초 진입 시 1회성 애니메이션으로 유지 가능. 이 기본값이 아니라 수동 클레임을 유지하고 싶다면 알려주시면 그쪽으로 변경.

파일: `app/oracle/[id]/page.tsx`
- `status === "closed"`일 때 지금처럼 "종료됨" 텍스트만 보여주지 않고, `oracle.winningOptionId`로 옵션을 찾아 `<OracleResult>`를 렌더 (원래 유저용으로 만든 컴포넌트인데 현재 관리자 화면에서만 쓰이고 있었음)

파일: `app/admin/page.tsx` (`OracleManagementTab`)
- 정답 선택 UI는 유지하되, 결과 프리뷰는 미리보기 용도로만 남기고 지급 로직 중복 실행되지 않게 정리

### Phase C — 관리자 ↔ 실데이터 연동

전제: 지금 구조는 세션당 유저가 "나" 한 명뿐이라 "여러 유저를 관리자가 관리한다"는 개념 자체가 구조적으로 mock (`MOCK_USERS`는 정적 데이터, 로그인된 유저가 아님). 진짜 다중 유저 관리는 Phase E(백엔드)가 있어야 의미가 생기므로, 이번 단계는 **"나"에 대한 관리자 조치가 실제로 반영되게 만드는 선**까지로 범위를 좁힘.

파일: `lib/context.tsx`
- `UserContextValue`에 관리자 액션(예: `banMe`, `setGradeOverride`, `setPoints`) 노출

파일: `app/admin/page.tsx`
- `UserManagementTab`: 대상이 `me`(id: "me")인 경우 로컬 `MOCK_USERS` state 대신 `useUser()`를 통해 실제 `UserContext`를 갱신하도록 분기 (지금은 "나"가 관리자용 유저 목록에 아예 없어서 밴/등급조정 대상이 될 수도 없음)
- `GradeSettingsTab`: 등급 임계값을 `lib/grades.ts`의 정적 배열이 아니라 상위 state(우선은 컴포넌트 트리, 이상적으로는 context)로 승격해서 "저장"이 실제로 `getGradeByPoints` 계산에 반영되게 함. 범위가 크면 이번 라운드는 "저장 시 실제로 기준이 바뀐다"까지만 목표로 축소 가능.

파일: `components/CreateOracleModal.tsx`
- 등급별 일일 생성 제한(피카츄 미만 3개 등)이 지금은 안내 문구뿐이므로, `oracles.filter(o => o.creatorName === me.name && isToday(o.createdAt)).length`로 오늘 생성 개수를 계산해 `maxPerDay` 초과 시 등록 버튼 비활성화 + 안내 처리

### Phase D — 마무리 기능 (가벼움)

파일: `components/FollowButton.tsx` (신규)
- PLAN 1차 때 계획만 되고 구현되지 않았던 팔로우 버튼. 내 프로필이 아닐 때만 노출, 백엔드가 없으므로 세션 내 상태(또는 Phase E-1의 localStorage)로만 유지
- `app/profile/[id]/page.tsx` 헤더에 배치

파일: `lib/context.tsx` (또는 신규 `CommentContext`)
- 댓글을 `oracleId` 기준으로 context에 승격. `lib/mockData.ts`의 `MOCK_COMMENTS`(현재 어디서도 쓰이지 않는 죽은 코드)를 초기값으로 활용
- `app/oracle/[id]/page.tsx`의 로컬 `SEED_COMMENTS`(모든 오라클에 동일한 댓글 3개가 뜨는 원인) 제거하고 context 기반으로 교체

파일: `components/LeaderBoard.tsx`
- `MOCK_USERS`에 현재 세션의 `me`를 포인트 기준으로 병합해서 랭킹에 노출 (지금은 내가 아무리 포인트를 쌓아도 리더보드에 절대 안 나타남)

### Phase E — 영속성 & 인프라 (규모가 크고, 방향 결정 필요)

- **E-1 (권장, 3단계에 포함 가능)**: `localStorage` 기반 저장. `AppProvider`의 각 state를 `localStorage`와 동기화해서 새로고침해도 배팅/생성한 예언/알림/포인트가 유지되게 함. 백엔드 없이 바로 적용 가능, 리스크 낮음.
- **E-2 (별도 기획 필요)**: 진짜 백엔드(DB + API)와 로그인/회원가입 인증 도입 여부. 이건 스택 선택(예: Next.js Route Handlers + Postgres/Supabase, Firebase 등)부터 별도로 논의하는 게 맞아서 이번 3단계 범위에는 포함하지 않음. 필요해지면 별도 라운드로 기획.
- Next.js `14.2.5` → 최신 패치 버전 업그레이드 (설치 시 알려진 보안 취약점 경고 확인됨)
- 최소 유닛 테스트 도입: 우선순위는 `lib/grades.ts`(등급 계산), `lib/context.tsx`(정산/포인트 계산) 등 로직이 있는 부분

---

## 우선순위 및 개발 순서

```
Phase A (버그 수정)  →  Phase B (배팅→정산 루프)
         ↓
Phase D (팔로우/댓글/랭킹, 가벼움)  →  Phase C (관리자 연동)
         ↓
Phase E-1 (localStorage 영속성)
         ↓
Phase E-2 (실 백엔드/인증 — 별도 기획 필요)
```

**즉시 착수 권장**: Phase A + Phase B (지금 빌드가 깨져 있고, 핵심 루프가 안 끝까지 연결돼 있는 게 가장 큰 리스크)

---

## 기술 사항

- **상태 관리**: 기존과 동일하게 React Context 유지, 이번 단계에서 관리자/댓글/팔로우 액션을 `OracleContext`/`UserContext`에 확장
- **외부 라이브러리 추가 없음** 원칙 유지 (Phase E-1의 localStorage 동기화도 순수 `useEffect`로 구현)
- **Phase E-2를 시작하기 전에는 별도로 스택/호스팅/인증 방식에 대한 결정이 먼저 필요함**
