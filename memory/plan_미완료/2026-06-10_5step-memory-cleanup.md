# 수정계획안 — 정처기앱 Memory 신경망 정리 (2026-06-10)

## 📊 정리 결과

| 구분 | 개수 | 처리 |
|------|------|------|
| 전체 파일 | 4개 | - |
| 필수 (진주) | 1개 (#20) | MEMORY.md 유지 |
| 수정 필요 → archive | 1개 (#13) | 완료 처리 후 이동 |
| 불필요 (진흙) | 2개 (#23, #24) | archive/ 이동 |

## 🔴 P0 (블로커) — 1개

### 수정계획안20: 코드탭 전체 재설계
- **파일**: `memory/plan_미완료/수정계획안20_코드탭-전체-재설계.md`
- **예상 영향**: SQL 쿼리 수정 → 코드탭 UI/UX 전체 개선
- **선행 조건**: Supabase DDL 적용 (migration 005, 006)
- **블로커**: migration 005 미적용 → `option1~5` 컬럼 존재 여부 불확실

**해결해야 할 문제**:
1. `ProblemQueryMapper.xml:474-487` — `NULL AS option1~5` → 실제 컬럼 참조
2. `ProblemQueryMapper.xml:474-487` — `'FLASHCARD' AS card_type` → 동적 판별
3. `ProgrammingScreen.tsx:218` — 오답노트 탭 삭제 코드 제거
4. `ProgrammingScreen.tsx:38-58` — `LANGUAGE_KEYWORDS` 제거
5. `TheoryScreen.tsx` 전체 → `ProgrammingScreen.tsx`로 파일명 변경 (선택)

## 📝 Memory 갱신 내역

### archive 이동 (3개)
- `수정계획안13_코드탭-버그수정.md` — ✅ 완료 처리 (버그1 삭제됨, 버그2/3은 #20에 통합)
- `수정계획안23_problems-hardcoded-to-db.md` — ✅ 완료 처리 (이미 API 연동됨)
- `수정계획안24_problems-ts-DB-마이그레이션.md` — ✅ 완료 처리 (중복 파일)

### 유지 (1개)
- `수정계획안20_코드탭-전체-재설계.md` — 🟡 P0 블로커, Supabase DDL 대기

## ✅ 성공 기준

- [x] archive/ 폴더에 3개 파일 이동 완료
- [x] MEMORY.md 링크 1개로 축소
- [ ] 옵시디언 깨진 링크 0개 (검증 필요)
- [ ] 수정계획안20 실행 (Supabase DDL 적용 후)

## 🔄 수정계획안13 완료 처리 근거

### 버그1: 오답노트 탭 누락
- **상태**: ✅ 완료 (코드에서 이미 삭제됨)
- **근거**: `ProgrammingScreen.tsx:218` — `// DEBUG: [2026-06-09] 수정계획안13 - 오답노트 탭 삭제 (사용자 요청)`

### 버그2: 플래시카드 필터링 실패
- **상태**: 🔄 #20에 통합
- **근거**: #20 Step 1에서 `prog_language AS category`로 수정 시 자동 해결

### 버그3: 주관식 5지선다 미표시
- **상태**: 🔄 #20에 통합
- **근거**: #20 Step 1에서 `option1~5` 실제 컬럼 참조 시 자동 해결

## 🔄 수정계획안23+24 완료 처리 근거

### 문제1: `problem` 테이블 UNION ALL 누락
- **상태**: ✅ 완료 (이미 추가됨)
- **근거**: `ProblemQueryMapper.xml:226-242` — `problem` 테이블 UNION ALL 이미 존재

### 문제2: HomeScreen `totalObjectiveCount` 하드코딩
- **상태**: ✅ 완료 (이미 API 호출로 전환됨)
- **근거**: `HomeScreen.tsx:48-50` — `Promise.all`로 7개 과목 카운트 조회

### 문제3: `problems.ts` 파일残留
- **상태**: ✅ 완료 (이미 삭제됨)
- **근거**: 파일 시스템에서 `problems.ts` 존재하지 않음

## 📅 작성일
2026-06-10

<!-- DEBUG: AI-AUTHOR-20260610 -->
