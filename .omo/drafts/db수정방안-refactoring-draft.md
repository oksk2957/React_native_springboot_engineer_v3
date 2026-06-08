# Draft: DB 리팩토링 - 문제 테이블 분리 및 통계 통합

## Requirements (confirmed)
- 기존 객관식 랜덤학습 기능 유지 (problem 테이블)
- 프로그래밍언어 문제 → `programming_language_problems` 테이블 신설
- 주관식 문제 → `subjective_problems` 테이블 신설
- 기존 problem 테이블의 SUBJECTIVE 타입 데이터를 subjective_problems로 전체 마이그레이션
- 3개 줄기(객관식/주관식/프로그래밍) 통계를 통합 관리하는 statistics 테이블
- 마이페이지 UX 고려: 푼 문제 수, 정답률 간단 통계 + 각 줄기별 조회
- 통계 테이블에 problem_type, reference_id 필드로 전체 통계 관리
- 기존 study_session, user_answer 등에 problem_type 추가하여 통합

## Technical Decisions
- 테이블 분리: 별도 테이블 분리 (programming_language_problems, subjective_problems)
- 프로그래밍 언어 구분: 단일 테이블 + language 필드 (Java, Python, C 등)
- 통계 테이블: 통합 통계 테이블 (user_statistics 확장 또는 신규)
- 마이페이지 통계: 간단 통계 (푼 문제, 틀린 문제, 정답률) + 3개 줄기별 분리 조회
- 기존 데이터: 전체 마이그레이션 (SUBJECTIVE → subjective_problems)
- 기존 객관식 테이블: 일부 수정하여 통합 (problem_type 필드 추가)

## Research Findings
- schema.sql: problem 테이블에 option1~5 (객관식) + type 필드 (SUBJECTIVE/OBJECTIVE) 혼재
- migration_programming_problems.sql: 이전에 프로그래밍 문제를 problem에 넣으려 했으나 구조적 한계
- 현재 DB: database.db (빈 상태, 테이블 없음 - PostgreSQL 스키마이나 SQLite로 연결 시도됨)
- 백엔드: Spring Boot (Gradle 프로젝트, backend 폴더)

## Open Questions
- None (all key decisions made)

## Scope Boundaries
- INCLUDE: 테이블 분리, 마이그레이션 스크립트, 통계 테이블 설계, 마이페이지 쿼리
- EXCLUDE: 프론트엔드 UI 구현, 실제 데이터 삽입 (마이그레이션 제외)
