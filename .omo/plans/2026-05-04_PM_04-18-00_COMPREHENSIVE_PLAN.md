# DB 리팩토링 종합 수정 계획서

**작성일**: 2026-05-04  
**작성시간**: PM 04:18:00  
**상태**: FINAL PLAN  
**결정사항**: 기존 테이블 삭제 후 신규 스키마 적용 (DB 비어있음)

---

## 1. 현재 상태 분석 결과

### 1.1 데이터베이스 상태
- **DB 파일**: `database.db` (SQLite)
- **현재 데이터**: **완전히 비어있음** (테이블 0개)
- **결론**: 마이그레이션 불필요, 신규 스키마 직접 적용 가능

### 1.2 백엔드 엔티티 상태
✅ **이미 업데이트 완료**:
- `Problem.java`: type 필드 사용 (OBJECTIVE 전용)
- `UserAnswer.java`: `problemType` + `referenceId` 구조로 이미 수정됨
- `StudySession.java`: `problemBranch` 필드 존재
- `SubjectiveProblem.java`: 별도 엔티티 존재
- `ProgrammingLanguageProblem.java`: 별도 엔티티 존재

### 1.3 설정 파일 확인 필요
⚠️ **확인 요망**: `application.yml`에서 SQLite 사용 중인지 PostgreSQL 사용 중인지 확인 필요

---

## 2. 결정: 테이블 삭제 후 재생성 (DROP & CREATE)

### 2.1 선택 근거
1. **데이터 없음**: 마이그레이션 스크립트 실행 불필요
2. **시간 효율**: 복잡한 ALTER 문 대신 깔끔한 CREATE
3. **일관성**: schema.sql (PostgreSQL) vs database.db (SQLite) 불일치 해결
4. **검증 완료**: 백엔드 엔티티가 신규 스키마와 일치

### 2.2 제외 항목 (불필요)
- ❌ `migration_db_refactor_problem_split.sql` (데이터 없음)
- ❌ `migration_programming_problems.sql` (샘플 데이터만 삽입용)
- ❌ 기존 데이터 백업 (데이터 없음)

---

## 3. 실행 계획

### 3.1 우선순위: HIGH (즉시 실행)

#### Step1: 데이터베이스 초기화
```bash
# SQLite DB 파일 삭제 후 재생성
rm database.db
touch database.db
```

#### Step2: 스키마 적용
**옵션 A**: SQLite 호환 스키마 작성 (권장)
- PostgreSQL 문법 → SQLite 문법 변환
- `bigserial` → `INTEGER PRIMARY KEY AUTOINCREMENT`
- `timestamptz` → `datetime`
- `text` → `TEXT`
- `bool` → `INTEGER` (0/1)
- `CHECK` 제약조건 수정

**옵션 B**: PostgreSQL 사용 (backend 설정 변경 필요)
- `application.yml`에서 PostgreSQL 연결 설정
- schema.sql 그대로 사용

#### Step3: 백엔드 설정 확인/수정
```yaml
# application.yml 확인 필요
spring:
  datasource:
    url: jdbc:sqlite:database.db  # 현재 SQLite 사용 중?
    # 또는 PostgreSQL
    # url: jdbc:postgresql://localhost:5432/dbname
```

#### Step4: 엔티티 검증
- JPA `ddl-auto: update` 또는 `create` 모드로 기동
- 테이블 자동 생성 확인
- 문제 테이블 3개 (problem, subjective_problems, programming_language_problems) 생성 확인

### 3.2 우선순위: MEDIUM (설정 후)

#### Step5: 사용자 통계 통합
- `user_unified_statistics` 테이블 생성 확인
- 줄기별(OBJECTIVE/SUBJECTIVE/PROGRAMMING) 통계 집계 로직 구현

#### Step6: 마이페이지 쿼리 업데이트
- 기존 `user_statistics` → `user_unified_statistics` 조회로 변경
- problem_type별 필터링 추가

### 3.3 우선순위: LOW (추가 기능)

#### Step7: 프로그래밍 문제 샘플 데이터
```sql
-- migration_programming_problems.sql 실행
-- Spring Boot 기동 후 데이터 삽입 또는 SQL 직접 실행
```

---

## 4. SQLite 스키마 예시 (참고)

```sql
-- SQLite 버전 스키마 (database.db용)

CREATE TABLE IF NOT EXISTS subject (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER,
    option1 TEXT NOT NULL,
    option2 TEXT NOT NULL,
    option3 TEXT,
    option4 TEXT,
    option5 TEXT,
    is_ai_generated INTEGER DEFAULT 0,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
    CHECK (difficulty >= 1 AND difficulty <= 5)
);

CREATE TABLE IF NOT EXISTS subjective_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER,
    is_ai_generated INTEGER DEFAULT 0,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
    CHECK (difficulty >= 1 AND difficulty <= 5)
);

CREATE TABLE IF NOT EXISTS programming_language_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER,
    prog_language TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER,
    is_ai_generated INTEGER DEFAULT 0,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE SET NULL,
    CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);

CREATE TABLE IF NOT EXISTS user_answer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    problem_type TEXT NOT NULL,
    reference_id INTEGER NOT NULL,
    session_id INTEGER,
    submitted_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    submitted_at datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES study_session(id) ON DELETE CASCADE,
    UNIQUE(user_id, problem_type, reference_id),
    CHECK (problem_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'))
);

CREATE TABLE IF NOT EXISTS study_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    session_type TEXT NOT NULL,
    problem_branch TEXT,
    status TEXT DEFAULT 'IN_PROGRESS',
    total_questions INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    started_at datetime DEFAULT CURRENT_TIMESTAMP,
    completed_at datetime,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
    CHECK (session_type IN ('OBJECTIVE_RANDOM', 'SUBJECTIVE_RANDOM', 'PROGRAMMING_RANDOM', 'WRONG_ANSWER')),
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
    CHECK (problem_branch IS NULL OR problem_branch IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'))
);

CREATE TABLE IF NOT EXISTS user_unified_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    problem_type TEXT NOT NULL,
    reference_id INTEGER,
    total_attempted INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    last_studied_at datetime,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (problem_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_unified_statistics_branch 
    ON user_unified_statistics (user_id, problem_type) WHERE reference_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_unified_statistics_item 
    ON user_unified_statistics (user_id, problem_type, reference_id) WHERE reference_id IS NOT NULL;
```

---

## 5. 실행 체크리스트

### 5.1 사전 확인
- [ ] `application.yml`에서 사용 중인 DB 확인 (SQLite vs PostgreSQL)
- [ ] 백엔드 엔티티 컴파일 확인 (오류 없는지)
- [ ] schema.sql과 엔티티 매핑 일치 확인

### 5.2 실행 단계
- [ ] **Step1**: database.db 백업 (혹시 모를 경우)
- [ ] **Step2**: DB 초기화 (테이블 삭제)
- [ ] **Step3**: SQLite용 스키마 작성 및 적용 (또는 PostgreSQL 전환)
- [ ] **Step4**: 백엔드 기동하여 테이블 자동 생성 확인
- [ ] **Step5**: 테이블 구조 검증 (3개 문제 테이블 존재 여부)
- [ ] **Step6**: 샘플 데이터 삽입 테스트

### 5.3 검증 항목
- [ ] `problem` 테이블: type 필드 없음 (객관식 전용)
- [ ] `subjective_problems` 테이블: 별도 존재
- [ ] `programming_language_problems` 테이블: prog_language 필드 포함
- [ ] `user_answer` 테이블: problem_type + reference_id 구조
- [ ] `user_unified_statistics` 테이블: 통합 통계 관리
- [ ] 외래키 제약조건 정상 동작

---

## 6. 예상 소요 시간

| 작업 | 예상 시간 | 비고 |
|------|----------|------|
| DB 초기화 및 스키마 적용 | 10분 | SQLite 스키마 작성 포함 |
| 백엔드 설정 확인/수정 | 5분 | DB 연결 설정 |
| 테이블 생성 검증 | 5분 | JPA ddl-auto 활용 |
| 샘플 데이터 삽입 | 5분 | migration_programming_problems.sql |
| **총계** | **25분** | |

---

## 7. 결론 및 권고사항

### 7.1 최종 권고
**"기존 테이블 삭제 후 신규 스키마 적용"** 방식을 강력 권장

**이유**:
1. 데이터가 없으므로 마이그레이션 낭비임
2. 이미 백엔드 엔티티가 신규 구조로 업데이트됨
3. PostgreSQL 스키마(schema.sql)와 SQLite(database.db) 간 불일치 해결 필요

### 7.2 주의사항
⚠️ **중요**: 백엔드가 SQLite를 사용 중이라면, `schema.sql`(PostgreSQL)을 그대로 쓸 수 없음. SQLite 호환 스키마로 재작성 필요.

⚠️ **권장**: JPA의 `spring.jpa.hibernate.ddl-auto=create` (개발 단계) 또는 `update` 모드로 기동하여 엔티티 기반 테이블 자동 생성하는 것이 가장 안전함.

---

**계획 승인 후 실행 가능합니다.**
