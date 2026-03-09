# Oracle Page — 2단계 개발 계획

## 현재 상태 (완료)
- [x] 커뮤니티 피드 (OracleCard, BettingButtons, QuickBetStrip)
- [x] 추천/인기 패널 (RecommendationPanel, TrendingBadge)
- [x] 포켓몬 7단계 등급 시스템 (잉어킹→아르세우스)
- [x] 관리자 페이지 (/admin): 대시보드, 사용자관리, 예언관리, 등급설정

---

## 2단계 개발 범위

### Phase 1 — 예언 생성 플로우
**FAB(+) 버튼 활성화, 사용자가 직접 예언 생성**

파일:
- `components/CreateOracleModal.tsx`  — 모달 형태 예언 생성 폼
  - 제목 / 설명 / 카테고리 선택
  - 옵션 2~4개 동적 추가 (라벨 입력)
  - 마감일 설정 (날짜 피커)
  - 등급별 제한: 피카츄 미만 → 일 3개, 가디 이상 → 무제한
  - 미리보기 (OracleCard 실시간 렌더)
  - `app/page.tsx` FAB onClick 연결

### Phase 2 — 예언 상세 페이지
**각 카드 클릭 시 전용 상세 페이지 이동**

파일:
- `app/oracle/[id]/page.tsx`  — 예언 상세
  - 상단: 상세 정보 + 배팅 현황 차트 (막대 비율)
  - 배팅 섹션: BettingButtons 확장 버전 (금액 슬라이더)
  - 댓글 섹션: CommentList + CommentInput
  - 유사 예언 추천 (하단)
- `components/CommentSection.tsx`  — 댓글 입력 + 목록
  - 댓글 작성 (등급 아바타 표시)
  - 좋아요 / 대댓글
  - 정렬 (최신순 / 인기순)
- `components/BetChart.tsx`  — 실시간 배팅 비율 차트
  - 도넛/바 차트 (CSS 순수 구현, 외부 라이브러리 없이)
  - 시간대별 배팅 흐름 표시

### Phase 3 — 유저 프로필 페이지
**랭킹/리더보드 유저 클릭 시 이동**

파일:
- `app/profile/[id]/page.tsx`  — 유저 프로필
  - 등급 카드 (GradeCard 재사용)
  - 통계: 총 배팅, 적중률, 수익률, 연승 기록
  - 나의 예언 내역 탭: 참여중 / 완료 / 생성한 예언
  - 팔로우 버튼 (소셜 기능 복선)
- `app/profile/me/page.tsx`  — 내 프로필 (헤더 아이콘 연결)

### Phase 4 — 알림 시스템
**헤더 Bell 아이콘 활성화**

파일:
- `components/NotificationPanel.tsx`  — 드롭다운 알림 패널
  - 알림 유형: 예언 마감임박 / 배팅 결과 / 등급 승급 / 댓글 반응
  - 읽음/안읽음 구분
  - 전체 읽음 처리
- `lib/notifications.ts`  — 알림 목데이터 + 타입

### Phase 5 — 예언 결과/정산 시스템
**종료된 예언의 정답 처리 및 포인트 지급 시뮬레이션**

파일:
- `components/OracleResult.tsx`  — 결과 발표 카드
  - 정답 옵션 표시 + 승자 목록
  - 포인트 획득 애니메이션 (+N P)
  - 내 결과 하이라이트
- `lib/settlement.ts`  — 정산 로직
  - 배팅 결과 계산 (odds × amount)
  - 포인트 업데이트 시뮬레이션
- 관리자 페이지 연동: 예언 종료 → 정답 선택 UI 추가

---

## 우선순위 및 개발 순서

```
Phase 1 (예언 생성)  →  Phase 2 (상세 + 댓글)
         ↓
Phase 3 (프로필)     →  Phase 4 (알림)
         ↓
Phase 5 (정산 시스템)
```

**즉시 착수 권장**: Phase 1 + Phase 2 (핵심 UX 완성에 필수)

---

## 기술 사항

- **상태 관리**: React `useState` + `useContext` (전역 상태 Context 도입)
  - `OracleContext`: 예언 목록, 배팅 내역 관리
  - `UserContext`: 현재 유저 포인트, 등급 상태
- **라우팅**: Next.js App Router 동적 라우트 (`[id]`)
- **외부 라이브러리 추가 없음**: 차트도 CSS/SVG로 직접 구현
- **애니메이션**: Tailwind + CSS keyframes (기존 방식 유지)

