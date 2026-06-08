# ProblemQueryMapper LEFT JOIN → INNER JOIN 마이그레이션 계획

## TL;DR
> **Summary**: ProblemQueryMapper.xml의 4개 SELECT 쿼리에서 LEFT JOIN을 INNER JOIN으로 변경하여 오직 INNER JOIN만 사용하도록 수정
> **Deliverables**: ProblemQueryMapper.xml SQL 쿼리 수정 (4개소)
> **Effort**: Quick
> **Parallel**: NO (단일 파일 수정)
> **Critical Path**: Task 1 → Task 2

## Context
### Original Request
1. 쿼리 작성 위치 식별
2. LEFT/RIGHT JOIN 사용하지 않고 오직 INNER JOIN만 사용하도록 변경
3. MCP를 활용한 면밀한 검토와 검증
4. 수정 방안을 단일 파일로 작성

### Interview Summary
- **대상 파일**: `backend/src/main/resources/mapper/ProblemQueryMapper.xml`
- **LEFT JOIN 사용 쿼리**: 4개 (selectById, selectRandomProblems, selectRandomProblemsByType, selectRandomProblemIds)
- **이미 INNER JOIN 사용**: 6개 쿼리 (JOIN 키워드만 사용하여 INNER JOIN과 동일)
- **RIGHT JOIN 사용**: 없음
- **MCP 검증**: Context7 MyBatis-3 공식 문서로 검증 완료 (벤치마크 88.54)

### Metis Review (gaps addressed)
- 데이터 무결성 검증 필요: subject_id가 NULL이거나 고아 레코드가 있는지 확인
- COALESCE 처리: INNER JOIN 후에도 방어적 코딩으로 유지 권장
- 변경 전 데이터 상태 확인 단계 추가

## Work Objectives
### Core Objective
ProblemQueryMapper.xml의 모든 LEFT JOIN을 INNER JOIN으로 변경하여 조인 일관성 확보

### Deliverables
1. ProblemQueryMapper.xml 수정 (4개소 LEFT JOIN → INNER JOIN)
2. 변경 사항 검증 로그 확인
3. API 정상 동작 확인

### Definition of Done (verifiable conditions with commands)
- [ ] `grep -n "LEFT JOIN" backend/src/main/resources/mapper/ProblemQueryMapper.xml` 결과: 0건
- [ ] `grep -n "RIGHT JOIN" backend/src/main/resources/mapper/ProblemQueryMapper.xml` 결과: 0건
- [ ] 백엔드 재시작 후 로그에서 `LEFT JOIN` 쿼리 발생 안 함 확인
- [ ] `/api/problems/{id}` API 정상 응답 (200 OK)

### Must Have
- 4개 LEFT JOIN 쿼리를 INNER JOIN으로 변경
- subject_id가 NULL인 레코드 확인 후 변경 (데이터 무결성)
- 변경 사항 커밋

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- RIGHT JOIN 도입 (금지)
- 다른 Mapper XML 파일 수정 (금지 - scope 제한)
- Java 인터페이스 파일 수정 (금지 - SQL은 XML에만 있음)
- 불필요한 리팩토링 (금지)

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: 기존 테스트 없음 - 수동 API 테스트로 대체
- QA policy: Every task has agent-executed scenarios
- Evidence: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.

Wave 1: [데이터 검증 및 쿼리 수정]

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
|------|------------|--------|
| T1   | -          | T2     |
| T2   | T1         | -      |

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1: 2 tasks → quick (단일 파일 SQL 수정)

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. 데이터 무결성 검증 (subject_id NULL 및 고아 레코드 확인)

  **What to do**: 
  1. problem 테이블에서 subject_id가 NULL인 레코드 수 확인
  2. subject 테이블에 매칭되지 않는 고아 레코드 수 확인
  3. 결과가 0건이면 안전하게 변경 진행, 0건 초과면 리포트

  **Must NOT do**: 
  - 실제 데이터 수정 (조회만 허용)
  - problem 테이블 구조 변경

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: 단순 SQL 쿼리 실행
  - Skills: [] - 쿼리 실행에 추가 스킬 불필요
  - Omitted: [`git-master`] - 데이터베이스 작업이므로 불필요

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [Task 2] | Blocked By: []

  **References** (executor has NO interview context - be exhaustive):
  - DB Config: `backend/src/main/resources/application.yml` - 데이터베이스 연결 정보
  - SQL 예시:
    ```sql
    SELECT COUNT(*) FROM problem WHERE subject_id IS NULL;
    SELECT COUNT(*) FROM problem p LEFT JOIN subject s ON p.subject_id = s.id WHERE s.id IS NULL;
    ```

  **Acceptance Criteria** (agent-executable only):
  - [ ] 데이터베이스에 접속하여 2개 쿼리 실행
  - [ ] 실행 결과를 `.sisyphus/evidence/task-1-data-check.txt`에 저장
  - [ ] 결과가 0건이면 "SAFE TO CHANGE" 출력, 0건 초과면 "ORPHAN RECORDS FOUND: {count}건" 출력

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: [Happy path - 데이터 정합성 확인]
    Tool: [interactive_bash]
    Steps: [SQLite/MySQL 클라이언트로 접속 후 2개 검증 쿼리 실행]
    Expected: [모든 결과가 0건이거나, 고아 레코드 수가 보고됨]
    Evidence: .sisyphus/evidence/task-1-data-check.txt

  Scenario: [Failure/edge case - DB 연결 실패]
    Tool: [interactive_bash]
    Steps: [잘못된 연결 정보로 접속 시도]
    Expected: [연결 오류 메시지 출력 후 graceful exit]
    Evidence: .sisyphus/evidence/task-1-db-error.txt
  ```

  **Commit**: NO | Message: N/A | Files: N/A

- [ ] 2. ProblemQueryMapper.xml LEFT JOIN → INNER JOIN 변경

  **What to do**: 
  1. `backend/src/main/resources/mapper/ProblemQueryMapper.xml` 파일 수정
  2. 다음 4개소에서 `LEFT JOIN`을 `INNER JOIN`으로 변경:
     - line 26: `LEFT JOIN subject s` → `INNER JOIN subject s`
     - line 33: `LEFT JOIN subject s` → `INNER JOIN subject s`
     - line 41: `LEFT JOIN subject s` → `INNER JOIN subject s`
     - line 96: `LEFT JOIN subject s` → `INNER JOIN subject s`
  3. (선택) `JOIN`만 써도 INNER JOIN과 동일하므로 `JOIN`으로 변경 가능

  **Must NOT do**: 
  - 다른 Mapper XML 파일 수정
  - Java 인터페이스 파일 수정
  - problemJoinedColumns 정의 수정 (COALESCE 유지)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: 단일 XML 파일 텍스트 치환
  - Skills: [] - 추가 스킬 불필요
  - Omitted: [`git-master`] - 간단한 수정이므로 불필요

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [] | Blocked By: [Task 1]

  **References** (executor has NO interview context - be exhaustive):
  - Target File: `backend/src/main/resources/mapper/ProblemQueryMapper.xml`
  - Pattern: XML 라인 26, 33, 41, 96의 `LEFT JOIN subject s`를 `INNER JOIN subject s`로 변경
  - MyBatis Docs: Context7 /mybatis/mybatis-3 - JOIN 문법 검증 완료
  - MCP 검증 결과: INNER JOIN 변경 시 문법적 문제 없음

  **Acceptance Criteria** (agent-executable only):
  - [ ] 파일에서 `LEFT JOIN` 문자열이 0개인지 확인 (grep)
  - [ ] 파일에서 `INNER JOIN subject s`가 4개 있는지 확인
  - [ ] XML 문법 유효성 확인 (파일 읽기 성공)

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: [Happy path - LEFT JOIN 모두 제거 확인]
    Tool: [interactive_bash]
    Steps: [grep -n "LEFT JOIN" backend/src/main/resources/mapper/ProblemQueryMapper.xml]
    Expected: [결과 없음 (0건)]
    Evidence: .sisyphus/evidence/task-2-no-left-join.txt

  Scenario: [Happy path - INNER JOIN 4개 확인]
    Tool: [interactive_bash]
    Steps: [grep -n "INNER JOIN subject" backend/src/main/resources/mapper/ProblemQueryMapper.xml]
    Expected: [4개 결과 (라인 26, 33, 41, 96)]
    Evidence: .sisyphus/evidence/task-2-inner-join-count.txt

  Scenario: [Failure/edge case - XML 파싱 오류]
    Tool: [read]
    Steps: [수정된 XML 파일 읽기 시도]
    Expected: [파일 내용 정상 로드됨]
    Evidence: .sisyphus/evidence/task-2-xml-valid.txt
  ```

  **Commit**: YES | Message: `refactor(mapper): change LEFT JOIN to INNER JOIN in ProblemQueryMapper` | Files: [backend/src/main/resources/mapper/ProblemQueryMapper.xml]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
1. 데이터 검증은 커밋하지 않음 (evidence 파일만 생성)
2. XML 수정은 단일 커밋으로 반영
3. 커밋 메시지: `refactor(mapper): change LEFT JOIN to INNER JOIN in ProblemQueryMapper`

## Success Criteria
- [ ] ProblemQueryMapper.xml에 LEFT JOIN이 0개
- [ ] ProblemQueryMapper.xml에 INNER JOIN (또는 JOIN)만 사용
- [ ] 백엔드 재시작 후 LEFT JOIN 쿼리 로그 발생 안 함
- [ ] API 정상 동작 (문제 조회 성공)
- [ ] 커밋 완료

## MCP 검증 요약
- **Context7 Library**: /mybatis/mybatis-3 (High Reputation, Score 88.54)
- **검증 내용**:
  1. LEFT JOIN과 INNER JOIN의 차이점 확인 (외부 vs 내부 조인)
  2. MyBatis XML에서 JOIN 문법 검증 (JOIN만 써도 INNER JOIN 동작)
  3. 현재 problemJoinedColumns의 COALESCE 처리는 INNER JOIN 후에도 유지 권장
- **결론**: LEFT JOIN → INNER JOIN 변경은 안전하며 문법상 완전히 호환됨
