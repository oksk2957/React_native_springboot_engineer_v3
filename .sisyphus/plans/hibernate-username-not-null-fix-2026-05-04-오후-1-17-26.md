# [Hibernate] Username 컬럼 NOT NULL 오류 해결 방안

## 📋 오류 분석 (MCP 검증 완료)

### 🔴 발생 오류 (로그 기록)
```
2026-05-04T13:17:22.991+09:00  WARN 25400 --- [information-exam-backend] [           main] o.h.t.s.i.ExceptionHandlerLoggedImpl     : GenerationTarget encountered exception accepting command : Error executing DDL "
    alter table if exists users 
       add column username varchar(255) not null" via JDBC [ERROR: column "username" of relation "users" contains null values]

Caused by: org.postgresql.util.PSQLException: ERROR: column "username" of relation "users" contains null values
```

### 📊 오류 발생 상황
- **시간**: 2026-05-04T13:17:22.991+09:00
- **위치**: `InformationExamBackendApplication` 시작 시 (Spring Boot 3.2.5)
- **원인**: Hibernate가 `users` 테이블에 `username` 컬럼을 NOT NULL로 추가하려 했으나, 기존 데이터에 NULL 값이 존재함
- **Hibernate ORM**: 6.4.4.Final
- **데이터베이스**: PostgreSQL (HikariPool-1 연결, org.postgresql.jdbc.PgConnection)

---

## 🔍 MCP (Context7) 검증 결과

### 검증 1: Hibernate ORM 공식 문서
- **Library ID**: /hibernate/hibernate-orm (High Reputation, Score: 80.85)
- **검증 내용**:
  1. `@Column(nullable=false)` 설정 시 Hibernate가 NOT NULL 제약조건 생성
  2. 기존 NULL 값이 있는 상태에서 NOT NULL 추가 시 PostgreSQL이 거부 (SQL 표준 동작)
  3. `@ColumnDefault("'unknown'")` 또는 `@ColumnDefault("0")`로 기본값 설정 가능
  4. `@ColumnDefault` 사용 시 ALTER TABLE 시 DEFAULT 먼저 적용 후 NOT NULL 적용

### 검증 2: Spring Boot 공식 문서
- **Library ID**: /spring-projects/spring-boot (Score: 74.01)
- **검증 내용**:
  1. `spring.jpa.hibernate.ddl-auto` 속성 설명
  2. 옵션: none, validate, update, create, create-drop
  3. **현재 문제**: ddl-auto가 "update"로 설정되어 스키마 자동 변경 시도
  4. 운영환경에서는 "validate" 또는 "none" 사용 권장

### 검증 3: 실제 오류 재현 조건
- Entity 클래스에 `@Column(nullable = false)` 설정됨
- `users` 테이블에 이미 데이터가 있음 (username이 NULL인 레코드 존재)
- Hibernate DDL-auto = "update" 모드로 실행됨
- PostgreSQL이 NOT NULL 제약조건 추가를 거부함

---

## 🛠️ 해결 방안 (3가지 옵션)

### [옵션 A] 데이터 수정 후 재시작 (권고 ⭐)

**단계**:

**Step 1**: PostgreSQL 접속 후 NULL 값 확인
```sql
SELECT COUNT(*) FROM users WHERE username IS NULL;
```

**Step 2**: NULL 값을 가진 레코드 수정
```sql
-- id를 활용한 고유 username 생성
UPDATE users SET username = 'user_' || id::text WHERE username IS NULL;
```

**Step 3**: 컬럼에 NOT NULL 제약조건 수동 적용 (Hibernate가 하지 못한 작업)
```sql
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
```

**Step 4**: 애플리케이션 재시작

**장점**: 데이터 보존, 가장 안전한 방법
**단점**: 수동 SQL 실행 필요

---

### [옵션 B] ddl-auto 변경 (임시 방편)

**수정 파일**: `backend/src/main/resources/application.yml` (또는 `application.properties`)

**변경 전** (추정):
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

**변경 후**:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # 또는 "none"
```

**장점**: 즉시 적용 가능, 오류 우회
**단점**: 스키마 변경 자동 반영 안 됨, 수동 마이그레이션 필요

---

### [옵션 C] Entity 클래스 수정 (근본 해결)

**수정 파일**: `backend/src/main/java/com/example/informationexam/entity/User.java` (추정)

**현재 상태** (추정):
```java
@Column(nullable = false)
private String username;
```

**수정 방안 1** - 기본값 추가 (권고):
```java
@ColumnDefault("'unknown'")
@Column(nullable = false)
private String username;
```

**수정 방안 2** - 일단 NULL 허용 후 데이터 수정:
```java
@Column(nullable = true)  // 일단 true로 변경
private String username;
```
→ 데이터 수정 후 다시 `false`로 변경

**장점**: 코드 레벨에서 해결
**단점**: Entity 수정 필요, @ColumnDefault는 Hibernate 전용 기능

---

## 🎯 최종 권고 방안 (MCP 근거)

### Step 1: 즉시 조치 (데이터 수정)
```sql
-- PostgreSQL 접속 후 실행
UPDATE users SET username = 'user_' || id::text WHERE username IS NULL;
```

### Step 2: PostgreSQL 컬럼 NOT NULL 적용 (데이터 수정 후)
```sql
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
```

### Step 3: Spring Boot 설정 검토
`backend/src/main/resources/application.yml` 확인:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # 운영환경에서는 "validate" 또는 "none" 권장
```

### Step 4: Entity 클래스 개선 (옵션)
```java
@ColumnDefault("'unknown'")
@Column(nullable = false)
private String username;
```

### Step 5: 운영환경 대비
- Flyway 또는 Liquibase 같은 마이그레이션 도구 도입 고려
- ddl-auto를 "validate"로 변경하고 마이그레이션 스크립트로 관리

---

## 📂 관련 파일 위치

| 파일 | 경로 | 설명 |
|------|------|------|
| Users Entity | `backend/src/main/java/com/example/informationexam/entity/User.java` | username 필드 정의 |
| Application Config | `backend/src/main/resources/application.yml` | ddl-auto 설정 |
| Hibernate DDL Log | 로그에서 확인 | ALTER TABLE 쿼리 확인 |
| User Repository | `backend/src/main/java/com/example/informationexam/repository/UserRepository.java` | (추정) JPA Repository |

---

## 🧪 검증 방법

### 검증 1: 데이터 NULL 값 확인
```sql
SELECT COUNT(*) FROM users WHERE username IS NULL;
-- 결과가 0이면 성공
```

### 검증 2: 컬럼 NOT NULL 확인
```sql
SELECT is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'username';
-- 결과가 "NO"이면 성공
```

### 검증 3: 애플리케이션 재시작
- 재시작 후 `column "username" contains null values` 오류 없음
- 로그에서 `Started InformationExamBackendApplication` 메시지 확인
- 로그에서 `alter table if exists users add column username varchar(255) not null` 메시지 없음

---

## 📋 실행 체크리스트

- [ ] PostgreSQL 접속하여 NULL 값 조회 (`SELECT COUNT(*) FROM users WHERE username IS NULL;`)
- [ ] NULL 값이 있으면 UPDATE로 수정 (`UPDATE users SET username = 'user_' || id::text WHERE username IS NULL;`)
- [ ] ALTER TABLE로 NOT NULL 적용 (`ALTER TABLE users ALTER COLUMN username SET NOT NULL;`)
- [ ] (선택) Entity 클래스에 @ColumnDefault 추가
- [ ] (선택) 운영환경 ddl-auto를 validate로 변경
- [ ] 애플리케이션 재시작하여 오류 해결 확인
- [ ] 로그에서 `Started InformationExamBackendApplication` 메시지 확인

---

## 🔗 참고 MCP 문서

1. **Hibernate ORM** (/hibernate/hibernate-orm)
   - @ColumnDefault 사용법
   - @Column(nullable) 동작 방식
   - DDL 자동 생성 정책

2. **Spring Boot** (/spring-projects/spring-boot)
   - spring.jpa.hibernate.ddl-auto 옵션 설명
   - 스키마 자동 생성 정책
   - 운영환경 권장 설정

3. **PostgreSQL** (외부 지식)
   - ALTER TABLE 문법
   - NOT NULL 제약조건 추가 시 기존 데이터 검증
   - 기본값(DEFAULT) 설정 방법

---

## ⚠️ 주의사항

1. **운영 환경**: ddl-auto="update" 사용 시 데이터 손실 위험 있음
2. **권장**: Flyway 또는 Liquibase 같은 마이그레이션 도구 도입
3. **백업**: 작업 전 데이터베이스 백업 필수
4. **테스트**: 개발/스테이징 환경에서 먼저 검증 후 운영 적용

---

## 🏁 결론

**MCP 검증 결과**: Hibernate가 `username` 컬럼을 NOT NULL로 추가하려 할 때 기존 NULL 데이터가 있어 PostgreSQL이 거부함.

**해결책**: 
1. 기존 NULL 값을 UPDATE로 수정 (`UPDATE users SET username = 'user_' || id::text WHERE username IS NULL;`)
2. 수동으로 NOT NULL 제약조건 적용 (`ALTER TABLE users ALTER COLUMN username SET NOT NULL;`)
3. 애플리케이션 재시작 (옵션 A 권고)

**예방책**: 
- ddl-auto를 "validate"로 변경
- 또는 마이그레이션 도구(Flyway, Liquibase) 도입
- Entity 설계 시 @ColumnDefault 활용
- 운영 환경에서는 절대 ddl-auto="update" 사용 금지

---

## 📝 요약

| 항목 | 내용 |
|------|------|
| 오류 발생 시각 | 2026-05-04T13:17:22.991+09:00 |
| 오류 메시지 | column "username" of relation "users" contains null values |
| 원인 | Hibernate DDL-auto=update 시 NOT NULL 추가, 기존 NULL 데이터 존재 |
| 해결 방법 | NULL 값 수정 후 NOT NULL 적용 (옵션 A) |
| MCP 검증 | Hibernate ORM, Spring Boot 문서로 검증 완료 |
| 권고 사항 | 마이그레이션 도구 도입, ddl-auto=validate 사용 |
