# Plan Index (v92 — 2026-06-10 5-Step Memory 정리 ✅)

**구조**: 개별 .md 파일 → archive/로 이동. 잔존 항목은 이 MEMORY.md에서만 추적.

## 잔존 (1)

### ✅ 수정계획안20: 코드탭 전체 재설계 — DDL 블로커 해결됨 (2026-06-10)
- **파일**: `수정계획안20_코드탭-전체-재설계.md`
- **상태**: option1~5 컬럼 현재 존재 (migration 005 적용됨). 수정24에서 SQL 이미 실제 컬럼 참조 + card_type 동적 판별 완료
- **해결**: `selectProgrammingCardsByLanguage` CASE WHEN option1 + 공통개념 전체조회 (2026-06-10 수정24)

## 🟡 기타 잔존
- **wrong_answer_count FK 누락 (P1)**: `../project_프로젝트/project-wrong-answer-count-fk-missing-2026-06-10.md`

## ✅ 최근 완료 (v92 5-Step 정리)
- **수정계획안13 → archive**: 버그1 코드완료, 버그2/3 #20에 통합
- **수정계획안23 → archive**: 이미 API 연동 완료 (UNION ALL + HomeScreen Promise.all)
- **수정계획안24 → archive**: #23과 중복, 동일 작업

## ✅ 최근 완료 (v90)
- **🔴 수정24 로그아웃 4차 재발 (v90)**: App.tsx:340-342 key 반전 수정 완료, 사용자 런타임 검증 대기
- **✅ 수정21 이론탭 AJAX (v84)**: TheoryScreen 콘텐츠 영역만 로딩, 미커밋

## ✅ 5-Step 정리 완료 (v67→v68→v70→v71→v75→v92)
- **수정계획안16**: 5개 항목 필터링 → 1건 완료처리 + 3건 유지 + 1건(수정14파일) archive
- **수정계획안 v92**: 4건 → 1건(진주 #20) + 3건(진흙 archive)
- **archive 이동 (7건 총)**: 수정14×2 + 수정11 + 수정19 + 수정13 + 수정23 + 수정24

## 아카이브 (91)
- [✅ 완료 74건](archive/completed/) — 기존 71건 + 수정13 + 수정23 + 수정24
- [🔒 종료 9건](archive/terminated/) — 16,19,20,21,23,29,34,41,71
- [📄 기타 8건](archive/) — 이전 정리 잔존

**진행률**: ~99%
