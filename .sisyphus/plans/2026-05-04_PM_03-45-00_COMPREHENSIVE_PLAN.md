# 2026-05-04_PM_03-45-00_COMPREHENSIVE_PLAN.md

## 종합 버그 수정 및 시스템 안정화 실행 계획서

### 📋 작성 정보
- **작성일시**: 2026-05-06
- **대상 프로젝트**: InformationExamProject
- **분석 대상**: 애플리케이션 로그 (2026-05-06 11:58:05 ~ 11:58:29)
- **우선순위**: Critical (P0) → High (P1) → Medium (P2)

---

## 🔴 P0 - Critical Issues

### 1. MyBatis OGNL NumberFormatException (2건)

#### 오류 로그
```
Caused by: java.lang.NumberFormatException: For input string: "프로그래밍언어"
at org.apache.ibatis.ognl.OgnlOps.doubleValue(OgnlOps.java:253)
```

#### 발생 위치
- `ProblemQueryMapper.xml` 라인 104, 230, 248, 331
- `ProblemApiController.getTheoryProblems()` (라인 45)
- `ProblemApiController.getTheoryProblemMeta()` (라인 52)

#### 근본 원인
MyBatis OGNL 표현식에서 문자열 비교 시 `'프로그래밍언어' == category` 형태의 비교에서 OGNL이 문자열을 숫자로 변환 시도함.
복잡한 `or` 조건식에서 OGNL 타입 강제 변환이 발생.

#### 해결 방안
**A. Controller에서 카테고리 타입 판별 로직 구현 (권장)**
- `ProblemApiController`에서 프로그래밍 언어 카테고리 여부를 미리 판별
- Mapper에 `isProgrammingLanguage` boolean 파라미터 추가 전달
- XML의 복잡한 `choose/when` 조건식을 단순화

**B. OGNL 표현식 수정**
```xml
<!-- 기존 (문제 발생) -->
<when test="category == 'C언어' or category == 'java' or ...">

<!-- 수정안 -->
<when test="category.toString() == 'C언어' or category.toString() == 'java' or ...">
```

또는

```xml
<bind name="cat" value="category.toString()" />
<when test="cat == 'C언어' or cat == 'java' or ...">
```

#### 예상 작업량
- `ProblemApiController.java` 수정: 30분
- `ProblemQueryMapper.xml` 수정: 30분
- 테스트: 30분

---

### 2. JWT ES256 알고리즘 불일치 (2건)

#### 오류 로그
```
io.jsonwebtoken.UnsupportedJwtException: The parsed JWT indicates it was signed with the 'ES256' 
signature algorithm, but the provided javax.crypto.spec.SecretKeySpec key may not be used to verify ES256 signatures.
Caused by: io.jsonwebtoken.security.InvalidKeyException: ES256 verification keys must be PublicKeys
```

#### 발생 위치
- `JwtTokenProvider.getUsername()` (라인 47)
- `StatisticsController.getStatistics()` (라인 25)
- `UserAnswerApiController.getWrongAnswers()` (라인 41)

#### 근본 원인
1. 애플리케이션의 JWT 설정(`jwt.secret`)은 HMAC(HS256)용 SecretKey 사용
2. 들어오는 토큰이 ES256(Elliptic Curve) 알고리즘으로 서명됨
3. Supabase Key가 HS256으로 서명된 JWT이나, 인증 흐름에서 다른 JWT가 전달되고 있음

#### 확인 필요 사항
- 프론트엔드(InformationExamApp)에서 어떤 토큰을 `Authorization` 헤더에 실어 보내는지 확인
- Supabase 인증과 자체 JWT 인증의 구분 필요

#### 해결 방안

**A. 자체 JWT 발급/검증 사용 (권장)**
```java
// JwtTokenProvider.java - 현재는 HS256 사용 중 (올바름)
// 프론트엔드에서 로그인 성공 시 자체 JWT 토큰을 받아 사용해야 함
```

**B. Supabase 토큰 검증 로직 분리**
- Supabase JWT는 Supabase 라이브러리로 검증
- 자체 JWT는 JwtTokenProvider로 검증
- 두 토큰 타입을 구분하는 로직 필요

**C. 임시 방안: 토큰 검증 우회 (개발 환경만)**
```java
// StatisticsController.java
try {
    String username = jwtTokenProvider.getUsername(token);
    // ...
} catch (UnsupportedJwtException e) {
    // 개발 환경: 토큰 검증 우회
    log.warn("JWT verification skipped: {}", e.getMessage());
    // 임시 사용자 처리
}
```

#### 예상 작업량
- 프론트엔드 토큰 전달 로직 확인: 1시간
- JwtTokenProvider 수정: 1시간
- Controller 토큰 처리 수정: 1시간

---

## 🟠 P1 - High Priority Issues

### 3. subjective_problems 테이블 없음 (1건)

#### 오류 로그
```
Caused by: org.postgresql.util.PSQLException: ERROR: relation "subjective_problems" does not exist
Position: 22
```

#### 발생 위치
- `StatisticsService.getSubjectiveRemainingCount()` (라인 118)
- `StatisticsController.getSubjectiveCount()` (라인 47)
- `SubjectiveProblemRepository.count()` 호출 시

#### 근본 원인
1. `SubjectiveProblem.java` 엔티티가 `@Table(name = "subjective_problems")`로 매핑됨
2. `schema.sql`에는 `subjective_problems` 테이블 정의가 없음
3. `spring.jpa.hibernate.ddl-auto=none`으로 설정되어 Hibernate가 테이블을 자동 생성하지 않음

#### 스키마 분석 결과
`schema.sql`에 정의된 테이블:
- `subject` ✓
- `users` ✓
- `problem` ✓ (type 컬럼에 'SUBJECTIVE' 값 허용)
- `programming_language_problems` ✓
- `learning_card` ✓
- `study_session` ✓
- `study_session_item` ✓
- `user_answer` ✓
- `wrong_answer_bookmark` ✓
- `user_statistics` ✓
- **`subjective_problems` ❌ (누락)**

#### 해결 방안

**A. subjective_problems 테이블 생성 (권장)**
```sql
CREATE TABLE subjective_problems (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL,
  question VARCHAR(2000) NOT NULL,
  answer VARCHAR(2000) NOT NULL,
  explanation VARCHAR(4000),
  difficulty INTEGER,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subjective_problems_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
  CONSTRAINT subjective_problems_difficulty_check CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);
```

**B. problem 테이블 활용 방안**
- `SubjectiveProblem` 엔티티를 `problem` 테이블로 리매핑
- `@Where(clause = "type = 'SUBJECTIVE'")` 사용
- 기존 `problem` 테이블의 `type` 컬럼 활용

**C. JPA DDL 자동 생성 활성화 (임시)**
```properties
spring.jpa.hibernate.ddl-auto=update
```
⚠️ 운영 환경에서는 권장하지 않음

#### 예상 작업량
- 스키마 SQL 작성: 30분
- 데이터베이스 적용: 30분
- 검증: 30분

---

## 📊 작업 우선순위 및 일정

| 순위 | 이슈 | 우선순위 | 예상 소요 시간 | 비고 |
|------|------|----------|---------------|------|
| 1 | subjective_problems 테이블 생성 | P1 | 1.5시간 | 스키마 누락 |
| 2 | MyBatis OGNL 수정 | P0 | 1.5시간 | 즉시 수정 필요 |
| 3 | JWT 알고리즘 불일치 | P0 | 3시간 | 프론트엔드 확인 필요 |

---

## 🛠️ step-by-step 실행 계획

### Step 1: 데이터베이스 스키마 수정 (30분)
```bash
# 1. Supabase SQL Editor 또는 psql 접속
# 2. 아래 SQL 실행

CREATE TABLE IF NOT EXISTS subjective_problems (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL,
  question VARCHAR(2000) NOT NULL,
  answer VARCHAR(2000) NOT NULL,
  explanation VARCHAR(4000),
  difficulty INTEGER,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subjective_problems_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
  CONSTRAINT subjective_problems_difficulty_check CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);

-- 인덱스 추가 (선택)
CREATE INDEX IF NOT EXISTS idx_subjective_problems_subject_id ON subjective_problems(subject_id);
```

### Step 2: MyBatis OGNL 수정 (1시간)

**2.1 ProblemApiController.java 수정**
```java
// category 파라미터를 받을 때 프로그래밍 언어 여부 판별
private static final Set<String> PROGRAMMING_LANGUAGES = 
    Set.of("C언어", "java", "python", "Java", "Python", "c언어", "C", "c");

@GetMapping("/theory")
public ResponseEntity<List<ProblemResponseDto>> getTheoryProblems(@RequestParam String category) {
    log.info("[MVC2] 이론 문제 조회: category={}", category);
    boolean isProgramming = PROGRAMMING_LANGUAGES.contains(category);
    List<Map<String, Object>> maps = problemQueryMapper.selectTheoryProblemsByCategory(category, isProgramming);
    return ResponseEntity.ok(ProblemResponseDto.fromList(maps));
}
```

**2.2 ProblemQueryMapper.xml 수정**
```xml
<select id="selectTheoryProblemsByCategory" resultType="map">
    <choose>
        <when test="isProgramming == true">
            SELECT 
                id, question, answer AS correct_answer, explanation,
                prog_language AS category, 'PROGRAMMING_LANGUAGE' AS type,
                difficulty, NULL AS option1, NULL AS option2, NULL AS option3,
                NULL AS option4, NULL AS option5, is_ai_generated, prog_language AS programming_language
            FROM programming_language_problems
            WHERE LOWER(prog_language) = LOWER(#{category})
            ORDER BY id ASC
        </when>
        <otherwise>
            SELECT 
                p.id, p.question, p.answer AS correct_answer, p.explanation,
                s.name AS category, p.type, p.difficulty,
                p.option1, p.option2, p.option3, p.option4, p.option5,
                p.is_ai_generated, NULL AS programming_language
            FROM problem p
            INNER JOIN subject s ON p.subject_id = s.id
            WHERE TRIM(s.name) = TRIM(#{category})
            ORDER BY p.id ASC
        </otherwise>
    </choose>
</select>
```

**2.3 Mapper 인터페이스 수정**
```java
@Mapper
public interface ProblemQueryMapper {
    List<Map<String, Object>> selectTheoryProblemsByCategory(
        @Param("category") String category, 
        @Param("isProgramming") boolean isProgramming
    );
    // 다른 메서드들도 동일하게 수정...
}
```

### Step 3: JWT 문제 해결 (2시간)

**3.1 프론트엔드 확인**
- InformationExamApp에서 로그인 후 저장되는 토큰 확인
- Supabase 세션 토큰 vs 자체 JWT 토큰 구분

**3.2 JwtTokenProvider 수정 (임시 우회)**
```java
public String getUsername(String token) {
    try {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    } catch (UnsupportedJwtException e) {
        // ES256 토큰인 경우 처리 (Supabase 토큰 등)
        log.warn("Unsupported JWT algorithm: {}", e.getMessage());
        throw e; // 또는 적절한 예외 처리
    }
}
```

**3.3 StatisticsController 수정**
```java
@GetMapping("/subjective-count")
public ResponseEntity<Map<String, Long>> getSubjectiveCount(
        @RequestHeader(value = "Authorization", required = false) String authHeader) {
    Map<String, Long> response = new HashMap<>();
    Long userId = null;
    
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String username = jwtTokenProvider.getUsername(token);
            User user = userService.getUserByUsername(username);
            userId = user.getId();
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            // 토큰이 유효하지 않아도 전체 개수는 반환
        }
    }
    
    response.put("count", statisticsService.getSubjectiveRemainingCount(userId));
    return ResponseEntity.ok(response);
}
```

---

## ✅ 검증 체크리스트

### 데이터베이스
- [ ] `subjective_problems` 테이블 생성 확인
- [ ] 외래키 제약조건 정상 작동 확인
- [ ] `problem` 테이블과 데이터 중복 없음 확인

### MyBatis
- [ ] `category=프로그래밍언어` 파라미터로 이론 문제 조회 정상 작동
- [ ] `category=운영체제` 파라미터로 이론 문제 조회 정상 작동
- [ ] NumberFormatException 재발생하지 않음

### JWT
- [ ] Statistics API 호출 시 401 오류 없음
- [ ] Wrong Answers API 호출 시 401 오류 없음
- [ ] 올바른 사용자 ID로 조회됨

### 통합 테스트
- [ ] `/api/problems/theory?category=프로그래밍언어` 200 OK
- [ ] `/api/problems/theory/meta?category=운영체제` 200 OK
- [ ] `/api/statistics` 200 OK (토큰 유효 시)
- [ ] `/api/statistics/subjective-count` 200 OK
- [ ] `/api/wrong-answers` 200 OK (토큰 유효 시)

---

## 📝 참고 사항

1. **MyBatis OGNL 주의사항**
   - OGNL은 `'문자열' == 변수` 비교 시 타입 강제 변환 시도
   - 복잡한 `or` 조건보다는 Java 코드에서 판별 후 boolean 전달 권장

2. **JWT 알고리즘**
   - ES256: Elliptic Curve (비대칭키, PublicKey/ PrivateKey)
   - HS256: HMAC (대칭키, SecretKey)
   - 두 알고리즘은 호환되지 않음

3. **JPA DDL 설정**
   - `none`: 스키마 검증만 수행 (운영 권장)
   - `validate`: 스키마 검증 (운영 권장)
   - `update`: 스키마 자동 갱신 (개발 환경)
   - `create`: 세션 종료 시 삭제 후 생성 (테스트만)

---

## 🚀 실행 명령어

```bash
# 1. 백엔드 빌드
cd C:\Users\SEOL\InformationExamProject\backend
./mvnw clean package -DskipTests

# 2. 애플리케이션 재시작
# IDE에서 Spring Boot 재시작 또는
java -jar target/information-exam-backend-*.jar

# 3. API 테스트
curl "http://localhost:8088/api/problems/theory?category=운영체제"
curl "http://localhost:8088/api/problems/theory/meta?category=프로그래밍언어"
```

---

**작성자**: AI Assistant (Kilo)
**버전**: 1.0
**최종 수정**: 2026-05-06
