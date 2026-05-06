# Information Exam Project 지침 (GEMINI.md)

이 파일은 이 프로젝트를 담당하는 모든 AI 에이전트가 준수해야 할 **최우선 원칙**을 담고 있습니다.

## 1. 데이터베이스 관리 원칙 (중요)
- **DB 스키마 고정**: 프로젝트 내의 DB 구조(DDL)는 사용자가 직접 관리합니다.
- **자동 수정 금지**: AI는 어떠한 경우에도 `schema.sql`이나 유사한 초기화 파일을 생성하거나, 기존 테이블 구조를 변경하는 제안을 **사용자의 명시적 요청 없이** 수행하지 않습니다.
- **설정 유지**: `application.properties`의 `spring.jpa.hibernate.ddl-auto=none` 설정을 존중하며, 이를 `update`나 `create`로 변경하지 마십시오.

## 2. 현재 데이터베이스 구조 (참조용)
아래는 현재 Supabase PostgreSQL에 반영된 핵심 테이블 구조입니다. 쿼리 작성 시 이 구조를 참조하십시오.

### 주관식 문제 테이블 (`subjective_problems`)
```sql
CREATE TABLE "subjective_problems" (
    "id" BIGSERIAL PRIMARY KEY,
    "subject_id" BIGINT,
    "question" VARCHAR(1000) NOT NULL,
    "answer" VARCHAR(500) NOT NULL,
    "explanation" VARCHAR(2000),
    "difficulty" INT,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT "fk_subjective_problems_subject" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE
);
```

### 프로그래밍 문제 테이블 (`programming_language_problems`)
```sql
CREATE TABLE "programming_language_problems" (
    "id" BIGSERIAL PRIMARY KEY,
    "subject_id" BIGINT,
    "prog_language" VARCHAR(64) NOT NULL,
    "question" VARCHAR(1000) NOT NULL,
    "answer" VARCHAR(500) NOT NULL,
    "explanation" VARCHAR(2000),
    "difficulty" INT,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT "fk_prog_problems_subject" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE
);
```

## 3. 개발 가이드라인
- **백엔드**: Spring Boot + JPA + MyBatis 혼용 구조를 유지합니다.
- **보안**: API 키나 DB 비밀번호는 로그에 노출되지 않도록 주의하십시오.
- **일관성**: 기존의 패키지 구조와 네이밍 컨벤션을 엄격히 준수하십시오.
