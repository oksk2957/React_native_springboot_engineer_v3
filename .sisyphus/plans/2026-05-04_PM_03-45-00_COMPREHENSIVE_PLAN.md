# 통계 탭 작동 안됨 - 수정 계획서

**작성일**: 2026-05-04  
**작성시간**: PM 03:45:00  
**상태**: FINAL PLAN  
**목적**: 통계 탭(StatisticsScreen) 작동 안 함 원인 분석 및 수정

---

## 1. 문제 현상

### 1.1 사용자 보고
- 프로젝트 통계 탭에서 데이터가 로드되지 않음
- `StatisticsScreen.tsx` 접근 시 로딩 상태에서 멈춤 또는 에러 발생

### 1.2 에러 추정 위치
- 백엔드: `/api/statistics` 엔드포인트 호출 시 500 에러 또는 빈 응답
- 프론트엔드: `statisticsService.getStatistics()` 호출 후 데이터 파싱 실패

---

## 2. 근본 원인 분석

### 2.1 ❌ 치명적 문제: SQL 문법 불일치 (PostgreSQL vs SQLite)

**위치**: `backend/src/main/resources/mapper/MypageStatisticsMapper.xml`

**문제**:
```xml
<!-- 현재 코드 (PostgreSQL 문법) -->
<select id="selectUserAnswerOverall" resultType="map">
    SELECT COUNT(*)::bigint AS attempted,           <!-- ❌ SQLite에서 지원 안함 -->
           COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::bigint AS correct  <!-- ❌ -->
    FROM user_answer
    WHERE user_id = #{userId}
</select>
```

**원인**:
- `::bigint`는 PostgreSQL 전용 타입 캐스팅 문법
- SQLite는 `CAST(COUNT(*) AS INTEGER)` 또는 `CAST(COUNT(*) AS BIGINT)` 사용해야 함
- 백엔드가 SQLite(`database.db`)를 사용 중이므로 SQL 문법 충돌 발생

**영향 받는 쿼리**:
1. `selectUserAnswerOverall` (line 8-9)
2. `selectBranchStats` (line 16-17)
3. `selectObjectiveCategoryStats` (line 25-26)
4. `selectContentTotals` (line 35-37) - 정상 작동 (PostgreSQL 문법 없음)

### 2.2 ❌ 데이터베이스 미초기화

**상태 확인**:
```bash
$ sqlite3 database.db ".tables"
(빈 결과 - 테이블 0개)
```

**문제**:
- `database.db`에 테이블이 전혀 없음
- 백엔드 기동 시 `ddl-auto=create` 또는 `update` 설정이 안 되어 있을 가능성
- 또는 `schema.sql`(PostgreSQL)이 SQLite에 적용되지 않음

**결과**:
- 모든 쿼리가 "no such table" 에러 반환
- 통계 API가 500 Internal Server Error 반환

### 2.3 ⚠️ 프론트엔드 기대 데이터 구조 불일치

**프론트엔드** (`StatisticsScreen.tsx:90`):
```tsx
{stats.categoryStats.map((stat: any, index: number) => (
  <View key={stat.category}>  <!-- category 필드 기대 -->
    {stat.correct}/{stat.total}  <!-- correct, total 필드 기대 -->
  </View>
))}
```

**백엔드 응답** (`StatisticsService.java:74-83`):
```java
List<ObjectiveCategoryStatRow> categoryRows = mypageStatisticsMapper.selectObjectiveCategoryStats(userId);
// ObjectiveCategoryStatRow: category, total, correct 필드
```

**상태**: 구조는 일치함 (문제 없음) ✅

---

## 3. 수정 우선순위

### 3.1 PRIORITY 1: HIGH (즉시 수정)

#### Task 1: SQL 문법 SQLite로 변환

**파일**: `backend/src/main/resources/mapper/MypageStatisticsMapper.xml`

**수정 전**:
```xml
<select id="selectUserAnswerOverall" resultType="map">
    SELECT COUNT(*)::bigint AS attempted,
           COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::bigint AS correct
    FROM user_answer
    WHERE user_id = #{userId}
</select>
```

**수정 후**:
```xml
<select id="selectUserAnswerOverall" resultType="map">
    SELECT CAST(COUNT(*) AS BIGINT) AS attempted,
           CAST(COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0) AS BIGINT) AS correct
    FROM user_answer
    WHERE user_id = #{userId}
</select>
```

**적용 범위**:
- Line 8-9: `selectUserAnswerOverall`
- Line 16-17: `selectBranchStats`
- Line 25-26: `selectObjectiveCategoryStats`

#### Task 2: 데이터베이스 스키마 적용

**옵션 A**: JPA 자동 생성 (권장)
```yaml
# backend/src/main/resources/application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: create  # 또는 update
```

**옵션 B**: SQLite 스키마 직접 실행
```bash
sqlite3 database.db < sqlite_schema.sql
```

**필요 작업**:
1. `application.yml` 확인 및 수정
2. 백엔드 재기동하여 테이블 자동 생성
3. 테이블 생성 확인: `sqlite3 database.db ".tables"`

### 3.2 PRIORITY 2: MEDIUM (검증)

#### Task 3: API 엔드포인트 테스트

**테스트 방법**:
```bash
# JWT 토큰 획득 후
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/statistics

# 예상 응답
{
  "totalProblems": 0,
  "totalContentProblems": 0,
  "contentTotals": {...},
  "solvedProblems": 0,
  "correctCount": 0,
  "wrongCount": 0,
  "attemptedFromUserAnswer": 0,
  "accuracyPct": null,
  "categoryStats": [],
  "branchStatistics": [...]
}
```

#### Task 4: 프론트엔드 로딩 상태 처리 강화

**파일**: `InformationExamApp/src/screens/StatisticsScreen.tsx`

**수정 제안** (line 40-44):
```tsx
catch (error) {
  console.error('Failed to fetch statistics:', error);
  Alert.alert('오류', '통계 데이터를 불러올 수 없습니다.');
}
```

---

## 4. 실행 체크리스트

### 4.1 사전 확인
- [ ] `application.yml`에서 DB 설정 확인 (SQLite 사용 중?)
- [ ] `ddl-auto` 설정이 `create` 또는 `update`인지 확인
- [ ] `MypageStatisticsMapper.xml`의 SQL 문법 확인

### 4.2 수정 단계
- [ ] **Step 1**: `MypageStatisticsMapper.xml`의 PostgreSQL 문법 → SQLite 문법 변환
- [ ] **Step 2**: 백엔드 재기동하여 테이블 자동 생성 확인
- [ ] **Step 3**: `sqlite3 database.db ".tables"`로 테이블 생성 확인
- [ ] **Step 4**: 통계 API 직접 호출 테스트 (curl/Postman)
- [ ] **Step 5**: 프론트엔드에서 통계 탭 접근 테스트

### 4.3 검증 항목
- [ ] SQL 쿼리 실행 시 문법 오류 없음
- [ ] `user_answer`, `problem`, `subjective_problems` 등 테이블 존재
- [ ] `/api/statistics` 호출 시 200 OK 응답
- [ ] 프론트엔드에서 통계 데이터 정상 표시

---

## 5. SQLite 스키마 예시 (참고)

```sql
-- database.db용 SQLite 스키마 (간소화 버전)

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
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
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
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
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
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE SET NULL
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
    FOREIGN KEY (session_id) REFERENCES study_session(id) ON DELETE CASCADE
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
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);
```

---

## 6. 예상 소요 시간

| 작업 | 예상 시간 | 비고 |
|------|----------|------|
| MypageStatisticsMapper.xml 수정 | 5분 | 3개 쿼리 문법 변경 |
| DB 스키마 적용 확인 | 5분 | JPA ddl-auto 또는 수동 실행 |
| 백엔드 재기동 및 테스트 | 3분 | 서버 기동 대기 |
| 프론트엔드 테스트 | 2분 | Expo 앱에서 확인 |
| **총계** | **15분** | |

---

## 7. 결론

### 7.1 핵심 수정 사항
1. **SQL 문법 변경**: `::bigint` → `CAST(... AS BIGINT)` (SQLite 호환)
2. **DB 초기화**: `ddl-auto=create` 설정 또는 SQLite 스키마 직접 실행
3. **테이블 생성 확인**: 빈 데이터베이스에 스키마 적용

### 7.2 수정 후 기대 효과
✅ 통계 API 200 OK 응답  
✅ 프론트엔드에서 통계 데이터 정상 로드  
✅ 통계 탭 작동 복구  

---

**계획 승인 후 즉시 수정 가능합니다.**
