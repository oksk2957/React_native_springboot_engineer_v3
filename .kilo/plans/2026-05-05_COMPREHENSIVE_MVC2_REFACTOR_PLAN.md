# InformationExam 프로젝트 MVC2 패턴 리팩토링 종합 계획서

**작성일**: 2026-05-05  
**작성시간**: PM 01:56:00  
**상태**: FINAL PLAN  
**DB 환경**: PostgreSQL (Supabase)  
**플랫폼**: Windows 10  

---

## 1. 프로젝트 현황 분석

### 1.1 프로젝트 구조
```
InformationExamProject/
├── backend/                          # Spring Boot 백엔드
│   └── src/main/java/com/example/informationexam/
│       ├── config/                   # SecurityConfig, JwtTokenProvider
│       ├── controller/               # REST Controllers
│       ├── domain/                   # JPA Entities
│       ├── dto/                      # Data Transfer Objects
│       ├── mapper/                   # MyBatis Mappers (XML)
│       └── service/                  # Business Logic
├── InformationExamApp/               # React Native 프론트엔드
│   └── src/
│       ├── screens/                  # 화면 컴포넌트
│       ├── services/api.ts           # API 클라이언트
│       └── stores/authStore.ts       # 인증 스토어
└── schema.sql                        # PostgreSQL 스키마
```

### 1.2 현재 아키텍처 (기존)
```
Controller → Service → Repository/QueryMapper → DB
                    → DTO Assembler → Controller
```

**문제점**:
- Service 레이어에서 DTO 변환 로직 처리 (비즈니스 로직과 관련 없음)
- QueryMapper(XML)에서 SQL Row를 DTO로 직접 매핑
- JPA Entity와 별도 DTO 간 변환 로직 분산

---

## 2. MVC2 패턴 설계

### 2.1 MVC2 패턴 정의
**MVC2**는 기존 MVC 패턴을 확장한 아키텍처로, 모든 비즈니스 로직을 SQL/XML에 집중하고 Controller는 DTO만 반환합니다.

```
Controller → Mapper(XML) → SQL/DTO
```

### 2.2 패턴 특징
| 구분 | 기존 MVC | MVC2 |
|------|----------|------|
| Controller | Service 호출 | Mapper 직접 호출 |
| Service | 비즈니스 로직 + DTO 변환 | 제거 또는 조회만 담당 |
| Mapper | SQL Row → DTO 변환 | SQL + 비즈니스 로직 |
| DTO | 중간 변환 계층 | 최종 응답 모델 |

### 2.3 MVC2 아키텍처 다이어그램
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Controller  │────▶│   Mapper     │────▶│   PostgreSQL│
│  (REST API) │     │  (XML/SQL)   │     │   (Supabase)│
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                     │
       ▼                   ▼                     ▼
   DTO Response      Business Logic         Stored Procedures
                     (View Generation)      Functions
```

---

## 3. PostgreSQL 연동 계획

### 3.1 PostgreSQL 연결 설정
```properties
# application.properties
spring.datasource.url=jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?prepareThreshold=0&options=-c%20client_encoding%3Dutf8&sslmode=require
spring.datasource.username=postgres.gmhznnwecujoafdisscl
spring.datasource.password=wjdcjrlgkqrur
spring.datasource.driver-class-name=org.postgresql.Driver
```

### 3.2 PostgreSQL 연결 확인 쿼리
```sql
-- 데이터베이스 버전 확인
SELECT version();

-- 연결된 데이터베이스 목록
SELECT datname FROM pg_database WHERE datistemplate = false;

-- 현재 사용자
SELECT current_user;

-- 테이블 목록
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

### 3.3 주요 테이블 구조
```sql
-- 사용자 테이블
\d users
-- 문제 테이블
\d problem
-- 과목 테이블
\d subject
-- 사용자 답변 테이블
\d user_answer
-- 통계 테이블
\d user_statistics
-- 학습 세션 테이블
\d study_session
```

---

## 4. DTO 설계

### 4.1 문제 관련 DTO
```java
// 문제 조회 응답 DTO
@Getter @Setter @Builder
public class ProblemResponseDto {
    private Long id;
    private String question;
    @JsonProperty("correctAnswer")
    private String answer;
    private String explanation;
    private String category;
    private String type;
    private Integer difficulty;
    @JsonProperty("isAiGenerated")
    private Boolean isAiGenerated;
    private Map<String, String> options;
    private String programmingLanguage;
}

// 문제 메타데이터 DTO (학습용)
@Getter @Setter @Builder
public class TheoryProblemMetaDto {
    private int count;
    private List<Long> problemIds;
}

// 문제 SQL Row (Mapper 결과)
@Getter @Setter
public class ProblemSqlRow {
    private Long id;
    private String question;
    private String answer;
    private String explanation;
    private String type;
    private Integer difficulty;
    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String option5;
    private Boolean isAiGenerated;
    private String subjectName;
}
```

### 4.2 통계 관련 DTO
```java
@Getter @Setter @Builder
public class StatisticsResponseDto {
    private long totalProblems;
    private long solvedProblems;
    private long correctCount;
    private long wrongCount;
    private List<BranchStat> branchStats;
    private List<CategoryStat> categoryStats;
}

@Getter @Setter
public class BranchStat {
    private String problemType;
    private long totalProblems;
    private long solvedProblems;
    private long correctCount;
    private Double accuracyRate;
}

@Getter @Setter
public class CategoryStat {
    private String category;
    private long total;
    private long correct;
    private Double accuracyRate;
}
```

---

## 5. SQL 비즈니스 로직 마이그레이션

### 5.1 MyBatis XML에 비즈니스 로직 이동

#### 5.1.1 문제 조회 쿼리 (MVC2 버전)
```xml
<!-- ProblemQueryMapper.xml -->
<mapper namespace="com.example.informationexam.mapper.ProblemQueryMapper">

    <!-- 공통 컬럼 정의 -->
    <sql id="problemColumns">
        p.id AS id,
        p.question AS question,
        p.answer AS answer,
        p.explanation AS explanation,
        p.type AS type,
        p.difficulty AS difficulty,
        p.option1 AS option1,
        p.option2 AS option2,
        p.option3 AS option3,
        p.option4 AS option4,
        p.option5 AS option5,
        p.is_ai_generated AS isAiGenerated,
        COALESCE(s.name, '') AS subjectName
    </sql>

    <!-- 단건 문제 조회 -->
    <select id="selectById" resultType="com.example.informationexam.dto.problem.ProblemSqlRow">
        SELECT <include refid="problemColumns"/>
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE p.id = #{id}
    </select>

    <!-- 랜덤 문제 조회 (최적화된 버전) -->
    <select id="selectRandomProblems" resultType="com.example.informationexam.dto.problem.ProblemSqlRow">
        SELECT <include refid="problemColumns"/>
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        ORDER BY RANDOM()
        LIMIT #{limit}
    </select>

    <!-- 과목별 랜덤 문제 (WITH 절 사용) -->
    <select id="selectOneRandomProblemPerSubject" resultType="com.example.informationexam.dto.problem.ProblemSqlRow">
        WITH subject_random AS (
            SELECT DISTINCT ON (p.subject_id)
                p.id,
                RANDOM() as rnd
            FROM problem p
            WHERE p.type = #{type}
            ORDER BY p.subject_id, RANDOM()
        )
        SELECT 
            p.id AS id,
            p.question AS question,
            p.answer AS answer,
            p.explanation AS explanation,
            p.type AS type,
            p.difficulty AS difficulty,
            p.option1 AS option1,
            p.option2 AS option2,
            p.option3 AS option3,
            p.option4 AS option4,
            p.option5 AS option5,
            p.is_ai_generated AS isAiGenerated,
            COALESCE(s.name, '') AS subjectName
        FROM problem p
        INNER JOIN subject_random sr ON p.id = sr.id
        INNER JOIN subject s ON p.subject_id = s.id
        ORDER BY sr.rnd, RANDOM()
    </select>
</mapper>
```

### 5.2 PostgreSQL Stored Procedures 활용

#### 5.2.1 통계 집계 함수
```sql
-- 사용자 통계 조회 함수
CREATE OR REPLACE FUNCTION get_user_statistics(user_id BIGINT)
RETURNS TABLE(
    total_problems BIGINT,
    solved_problems BIGINT,
    correct_count BIGINT,
    wrong_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM problem) as total_problems,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = get_user_statistics.user_id) as solved_problems,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = get_user_statistics.user_id AND is_correct = true) as correct_count,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = get_user_statistics.user_id AND is_correct = false) as wrong_count;
END;
$$ LANGUAGE plpgsql;
```

#### 5.2.2 문제 검증 함수
```sql
-- 문제 답변 검증 함수
CREATE OR REPLACE FUNCTION validate_answer(problem_id BIGINT, submitted_answer TEXT)
RETURNS TABLE(is_correct BOOLEAN, explanation TEXT, correct_answer TEXT) AS $$
DECLARE
    problem_record RECORD;
BEGIN
    SELECT answer, explanation INTO problem_record
    FROM problem WHERE id = validate_answer.problem_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '문제가 존재하지 않습니다. id=%', problem_id;
    END IF;
    
    RETURN QUERY
    SELECT 
        UPPER(TRIM(problem_record.answer)) = UPPER(TRIM(submitted_answer)) as is_correct,
        problem_record.explanation as explanation,
        problem_record.answer as correct_answer;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. 마이그레이션 단계

### 6.1 Phase 1: 준비 단계 (1일)

#### 6.1.1 파일 구조 변경
```
backend/src/main/java/com/example/informationexam/
├── controller/           # 컨트롤러 (DTO 반환)
├── mapper/               # MyBatis Mapper (SQL + 비즈니스 로직)
├── dto/                  # DTO (응답 모델만 정의)
└── domain/               # JPA Entities (변경/삭제 예정)
```

#### 6.1.2 Mapper Interface 수정
```java
// ProblemQueryMapper.java
@Mapper
public interface ProblemQueryMapper {
    ProblemSqlRow selectById(@Param("id") Long id);
    List<ProblemSqlRow> selectRandomProblems(@Param("limit") int limit);
    List<ProblemSqlRow> selectRandomProblemsByType(@Param("type") String type, @Param("limit") int limit);
    List<ProblemSqlRow> selectByDifficultyAndCategory(@Param("difficulty") int difficulty, @Param("category") String category, @Param("limit") int limit);
    List<ProblemSqlRow> selectTheoryProblemsByCategory(@Param("category") String category);
    List<Long> selectTheoryProblemIdsByCategory(@Param("category") String category);
    List<Long> selectStudyIdsByDifficultyCategory(@Param("difficulty") int difficulty, @Param("category") String category, @Param("limit") int limit);
    List<Long> selectStudyIdsByType(@Param("type") String type, @Param("limit") int limit);
    List<Long> selectRandomProblemIds(@Param("limit") int limit, @Param("excludeCategories") List<String> excludeCategories);
    String selectRandomCategoryName(@Param("excludeCategories") List<String> excludeCategories);
    List<Long> selectRandomProblemIdsByCategory(@Param("category") String category, @Param("limit") int limit);
    List<ProblemSqlRow> selectOneRandomProblemPerSubject(@Param("type") String type);
    long countAll();
}
```

### 6.2 Phase 2: 컨트롤러 리팩토링 (2일)

#### 6.2.1 문제 컨트롤러 (MVC2 적용)
```java
@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemApiController {

    private final ProblemQueryMapper problemQueryMapper;

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponseDto> getProblem(@PathVariable Long id) {
        log.info("[학습] 단건 문제 조회 요청: id={}", id);
        ProblemSqlRow row = problemQueryMapper.selectById(id);
        ProblemResponseDto dto = ProblemResponseDto.from(row);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/random/objective")
    public ResponseEntity<List<ProblemResponseDto>> getOneRandomProblemPerSubject() {
        List<ProblemSqlRow> rows = problemQueryMapper.selectOneRandomProblemPerSubject("OBJECTIVE");
        List<ProblemResponseDto> dtos = rows.stream()
                .map(ProblemResponseDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/theory")
    public ResponseEntity<List<ProblemResponseDto>> getTheoryProblems(@RequestParam String category) {
        List<ProblemSqlRow> rows = problemQueryMapper.selectTheoryProblemsByCategory(category);
        List<ProblemResponseDto> dtos = rows.stream()
                .map(ProblemResponseDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
```

### 6.3 Phase 3: Service 레이어 정리 (1일)

#### 6.3.1 Service 분류
- **유지**: AnswerService (답변 채점), UserService (사용자 관리)
- **이관**: ProblemService → Mapper로 이동
- **제거**: DTO 변환 로직만 담당했던 Service 메서드

#### 6.3.2 ProblemService 리팩토링
```java
// ProblemService.java - 비즈니스 로직만 유지
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemQueryMapper problemQueryMapper;
    private final ProblemRepository problemRepository;

    // JPA가 필요한 변경/검증 작업만 Service에서 처리
    public boolean checkAnswer(Long problemId, String submittedAnswer) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + problemId));
        return problem.getAnswer().equalsIgnoreCase(submittedAnswer);
    }
}
```

### 6.4 Phase 4: PostgreSQL Stored Procedure 적용 (2일)

#### 6.4.1 마이그레이션 SQL 파일
```sql
-- migration_stored_procedures.sql
BEGIN;

-- 문제 검증 함수
CREATE OR REPLACE FUNCTION validate_answer(problem_id BIGINT, submitted_answer TEXT)
RETURNS TABLE(is_correct BOOLEAN, explanation TEXT, correct_answer TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        UPPER(TRIM(answer)) = UPPER(TRIM(submitted_answer)),
        explanation,
        answer
    FROM problem WHERE id = problem_id;
END;
$$ LANGUAGE plpgsql;

-- 사용자 통계 함수
CREATE OR REPLACE FUNCTION get_user_statistics(user_id BIGINT)
RETURNS TABLE(total_problems BIGINT, solved_problems BIGINT, correct_count BIGINT, wrong_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM problem),
        (SELECT COUNT(*) FROM user_answer WHERE user_id = get_user_statistics.user_id),
        (SELECT COUNT(*) FROM user_answer WHERE user_id = get_user_statistics.user_id AND is_correct = true),
        (SELECT COUNT(*) FROM user_answer WHERE user_id = get_user_statistics.user_id AND is_correct = false);
END;
$$ LANGUAGE plpgsql;

COMMIT;
```

---

## 7. 위험 평가

### 7.1 위험 요인

| 위험 요인 | 심각도 | 완화 방안 |
|-----------|--------|-----------|
| 기존 기능 breakage | HIGH | 단계별 테스트, 백업 |
| SQL 성능 저하 | MEDIUM | EXPLAIN ANALYZE, 인덱스 최적화 |
| 트랜잭션 문제 | MEDIUM | @Transactional 유지 |
| 프론트엔드 호환 | LOW | 기존 API 응답 형식 유지 |

### 7.2 완화 전략
1. **백업**: 마이그레이션 전 전체 코드 백업
2. **테스트**: 각 단계 후 API 테스트 수행
3. **점진적 적용**: 문제/통계 기능부터 시작, 사용자 기능은 유지

---

## 8. 일정

| 단계 | 작업 내용 | 예상 시간 | 비고 |
|------|-----------|-----------|------|
| 1 | 프로젝트 분석 및 계획 수립 | 2시간 | 현재 진행 중 |
| 2 | DTO 및 Mapper 인터페이스 정의 | 1시간 | |
| 3 | MyBatis XML 리팩토링 | 4시간 | SQL 최적화 포함 |
| 4 | Controller 리팩토링 | 3시간 | MVC2 적용 |
| 5 | Service 레이어 정리 | 2시간 | 비즈니스 로직 분리 |
| 6 | PostgreSQL Stored Procedure 작성 | 2시간 | |
| 7 | 테스트 및 검증 | 2시간 | API 테스트 |
| **총계** | | **16시간** | |

---

## 9. 검증 항목

### 9.1 API 테스트 케이스
```bash
# 문제 조회 테스트
curl http://localhost:8088/api/problems/1

# 랜덤 문제 테스트
curl http://localhost:8088/api/problems/random/objective

# theory 문제 테스트
curl "http://localhost:8088/api/problems/theory?category=운영체제"

# 연결 테스트
curl http://localhost:8088/api/problems/test
```

### 9.2 검증 체크리스트
- [ ] 모든 API 정상 응답 (200 OK)
- [ ] DTO 필드명 기존 호환
- [ ] SQL 실행 계획 최적화 확인
- [ ] PostgreSQL 연결 유지

---

## 10. 코드 변경 사항 요약

### 10.1 추가될 파일
```
backend/src/main/resources/mapper/ProblemQueryMapper_MVC2.xml
backend/src/main/resources/procedures/stored_procedures.sql
backend/src/main/java/com/example/informationexam/dto/problem/ProblemSqlRow.java
```

### 10.2 수정될 파일
```
backend/src/main/java/com/example/informationexam/controller/ProblemApiController.java
backend/src/main/java/com/example/informationexam/service/ProblemService.java
backend/src/main/resources/application.properties
```

### 10.3 삭제/복작될 파일
```
backend/src/main/java/com/example/informationexam/mapper/ProblemResponseAssembler.java (복사하여 DTO에 정적 메서드 추가)
```

---

**결론**: 이 계획은 InformationExam 프로젝트를 MVC2 패턴으로 리팩토링하기 위한 종합 계획입니다. 모든 비즈니스 로직을 SQL/XML에 집중시키고 Controller가 DTO만 반환하도록 구조를 개선하여 유지보수성과 성능을 향상시킵니다.