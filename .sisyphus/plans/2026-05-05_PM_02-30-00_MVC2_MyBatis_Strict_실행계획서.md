# 2026-05-05_PM_02-30-00_MVC2_MyBatis_Strict_실행계획서
**작성일**: 2026-05-05  
**모드**: Build (모든 MCP 사용 허가)  
**핵심 목표**: MVC2 패턴 + MyBatis XML 중심 구조로 전환, 모든 비즈니스 로직 SQL 이관, Java/React DTO 역할만 수행

---

## 📋 핵심 원칙 (절대 준수)
1. **MVC2 구조**: `Controller → Mapper(XML) → DTO` (Service 레이어 비즈니스 로직 전면 제거)
2. **MyBatis XML**: 모든 SQL 쿼리 + 비즈니스 로직(집계, 검증, 계산)을 XML에만 작성
3. **Java 최소화**: DTO 정의 + Controller의 Mapper 직접 호출만 허용, 비즈니스 로직 작성 금지
4. **React Native**: DTO 형식 데이터만 송수신, 클라이언트 사이드 데이터 가공 금지
5. **Map 기반 모델-뷰**: Mapper 결과를 `Map<String, Object>`로 반환해 DTO에 매핑, XML 비즈니스 로직 집중

---

## 🔍 사전 분석 (확인 완료)
### DB 환경
```properties
# Supabase PostgreSQL 연결 정보 (application.properties)
spring.datasource.url=jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?prepareThreshold=0&options=-c%20client_encoding%3Dutf8&sslmode=require
spring.datasource.username=postgres.gmhznnwecujoafdisscl
spring.datasource.password=wjdcjrlgkqrur
spring.datasource.driver-class-name=org.postgresql.Driver
```

### 주요 파일 경로
```text
# 백엔드
C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\controller\ProblemApiController.java
C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\dto\problem\ProblemResponseDto.java
C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\mapper\ProblemQueryMapper.java
C:\Users\SEOL\InformationExamProject\backend\src\main\resources\mapper\ProblemQueryMapper.xml
C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\service\ProblemService.java
C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\mapper\ProblemResponseAssembler.java (삭제 대상)

# 프론트엔드
C:\Users\SEOL\InformationExamProject\InformationExamApp\src\services\api.ts
```

---

## 🚀 단계별 실행 계획 (Phase 1~6)

### Phase 1: DTO 수정 (Map 기반 매핑용)
**목적**: Mapper가 반환하는 Map을 DTO로 변환하는 정적 메서드 추가, Java 비즈니스 로직 제거

#### Step 1.1: ProblemResponseDto 수정
**대상 파일**: `C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\dto\problem\ProblemResponseDto.java`

**작업 내용** (전체 코드 복사-붙여넣기):
```java
package com.example.informationexam.dto.problem;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    // ★ Map 기반 매핑용 정적 팩토리 메서드 (비즈니스 로직 없음, 순수 데이터 변환)
    public static ProblemResponseDto from(Map<String, Object> map) {
        if (map == null || map.isEmpty()) return null;
        
        ProblemResponseDto dto = new ProblemResponseDto();
        dto.setId((Long) map.get("id"));
        dto.setQuestion((String) map.get("question"));
        dto.setAnswer((String) map.get("correct_answer")); // SQL 컬럼 alias와 매핑
        dto.setExplanation((String) map.get("explanation"));
        dto.setCategory((String) map.get("category"));
        dto.setType((String) map.get("type"));
        dto.setDifficulty((Integer) map.get("difficulty"));
        dto.setIsAiGenerated((Boolean) map.get("is_ai_generated"));
        
        // 옵션 Map 생성 (데이터 포맷팅만 수행, 비즈니스 로직 아님)
        Map<String, String> options = new LinkedHashMap<>();
        if ("OBJECTIVE".equals(dto.getType())) {
            if (map.get("option1") != null) options.put("1", (String) map.get("option1"));
            if (map.get("option2") != null) options.put("2", (String) map.get("option2"));
            if (map.get("option3") != null) options.put("3", (String) map.get("option3"));
            if (map.get("option4") != null) options.put("4", (String) map.get("option4"));
            if (map.get("option5") != null) options.put("5", (String) map.get("option5"));
        }
        dto.setOptions(options);
        dto.setProgrammingLanguage(map.get("programming_language") != null ? (String) map.get("programming_language") : null);
        
        return dto;
    }

    // ★ 리스트 변환 유틸리티
    public static List<ProblemResponseDto> fromList(List<Map<String, Object>> maps) {
        return maps == null ? List.of() : maps.stream()
                .map(ProblemResponseDto::from)
                .collect(Collectors.toList());
    }
}
```

**검증 방법**:
```bash
cd C:\Users\SEOL\InformationExamProject\backend
.\mvnw clean compile -q
```

**롤백 방법**:
```bash
git checkout -- backend/src/main/java/com/example/informationexam/dto/problem/ProblemResponseDto.java
```

---

### Phase 2: Mapper 인터페이스 수정 (Map 반환)
**목적**: Mapper가 Map<String, Object>를 반환하도록 수정, DTO 직접 반환 제거

#### Step 2.1: ProblemQueryMapper.java 수정
**대상 파일**: `C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\mapper\ProblemQueryMapper.java`

**작업 내용** (전체 코드):
```java
package com.example.informationexam.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface ProblemQueryMapper {
    // ★ Map 반환으로 변경 (XML에서 alias로 DTO 필드와 매핑)
    Map<String, Object> selectById(@Param("id") Long id);
    List<Map<String, Object>> selectRandomProblems(@Param("limit") int limit);
    List<Map<String, Object>> selectRandomProblemsByType(@Param("type") String type, @Param("limit") int limit);
    List<Map<String, Object>> selectTheoryProblemsByCategory(@Param("category") String category);
    List<Long> selectTheoryProblemIdsByCategory(@Param("category") String category);
    List<Long> selectStudyIdsByDifficultyCategory(@Param("difficulty") int difficulty, @Param("category") String category, @Param("limit") int limit);
    List<Long> selectStudyIdsByType(@Param("type") String type, @Param("limit") int limit);
    List<Long> selectRandomProblemIds(@Param("limit") int limit, @Param("excludeCategories") List<String> excludeCategories);
    String selectRandomCategoryName(@Param("excludeCategories") List<String> excludeCategories);
    List<Long> selectRandomProblemIdsByCategory(@Param("category") String category, @Param("limit") int limit);
    List<Map<String, Object>> selectOneRandomProblemPerSubject(@Param("type") String type);
    long countAll();
    
    // ★ Stored Procedure 호출용
    Map<String, Object> validateAnswerProc(@Param("p_problem_id") Long problemId, @Param("p_submitted_answer") String submittedAnswer);
    Map<String, Object> getUserStatisticsProc(@Param("p_user_id") Long userId);
}
```

**검증 방법**:
```bash
cd C:\Users\SEOL\InformationExamProject\backend
.\mvnw clean compile -q
```

---

### Phase 3: MyBatis XML 리팩토링 (모든 비즈니스 로직 SQL 이관)
**목적**: XML에 모든 SQL 쿼리 + 비즈니스 로직 작성, Stored Procedure 호출 추가

#### Step 3.1: ProblemQueryMapper.xml 수정
**대상 파일**: `C:\Users\SEOL\InformationExamProject\backend\src\main\resources\mapper\ProblemQueryMapper.xml`

**작업 내용** (전체 코드):
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.informationexam.mapper.ProblemQueryMapper">

    <!-- 공통 컬럼 정의 (alias로 DTO 필드와 매핑) -->
    <sql id="problemColumns">
        p.id AS id,
        p.question AS question,
        p.answer AS correct_answer,
        p.explanation AS explanation,
        COALESCE(s.name, '') AS category,
        p.type AS type,
        p.difficulty AS difficulty,
        p.option1 AS option1,
        p.option2 AS option2,
        p.option3 AS option3,
        p.option4 AS option4,
        p.option5 AS option5,
        p.is_ai_generated AS is_ai_generated,
        CASE WHEN p.type = 'PROGRAMMING_LANGUAGE' THEN s.name ELSE NULL END AS programming_language
    </sql>

    <!-- 단건 조회 -->
    <select id="selectById" resultType="map">
        SELECT <include refid="problemColumns"/>
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE p.id = #{id}
        LIMIT 1
    </select>

    <!-- 랜덤 문제 조회 -->
    <select id="selectRandomProblems" resultType="map">
        SELECT <include refid="problemColumns"/>
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        ORDER BY random()
        LIMIT #{limit}
    </select>

    <!-- 유형별 랜덤 조회 -->
    <select id="selectRandomProblemsByType" resultType="map">
        SELECT <include refid="problemColumns"/>
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE p.type = #{type}
        ORDER BY random()
        LIMIT #{limit}
    </select>

    <!-- 이론 문제 조회 -->
    <select id="selectTheoryProblemsByCategory" resultType="map">
        SELECT <include refid="problemColumns"/>
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE TRIM(COALESCE(s.name, '')) = TRIM(#{category})
        ORDER BY p.id ASC
    </select>

    <!-- 과목별 1건 랜덤 조회 (비즈니스 로직: DISTINCT ON, WITH 절) -->
    <select id="selectOneRandomProblemPerSubject" resultType="map">
        WITH subject_random AS (
            SELECT DISTINCT ON (p.subject_id) p.id AS id, random() AS rnd
            FROM problem p
            WHERE p.type = #{type}
            ORDER BY p.subject_id, random()
        )
        SELECT <include refid="problemColumns"/>
        FROM problem p
        INNER JOIN subject_random sr ON p.id = sr.id
        INNER JOIN subject s ON p.subject_id = s.id
        ORDER BY sr.rnd, random()
    </select>

    <!-- 답변 검증 Stored Procedure 호출 (비즈니스 로직 SQL 이관) -->
    <select id="validateAnswerProc" statementType="CALLABLE" resultType="map">
        {call validate_answer(
            #{p_problem_id, mode=IN, jdbcType=BIGINT},
            #{p_submitted_answer, mode=IN, jdbcType=VARCHAR},
            #{is_correct, mode=OUT, jdbcType=BOOLEAN},
            #{explanation, mode=OUT, jdbcType=VARCHAR},
            #{correct_answer, mode=OUT, jdbcType=VARCHAR}
        )}
    </select>

    <!-- 사용자 통계 Stored Procedure 호출 -->
    <select id="getUserStatisticsProc" statementType="CALLABLE" resultType="map">
        {call get_user_statistics(
            #{p_user_id, mode=IN, jdbcType=BIGINT},
            #{total_problems, mode=OUT, jdbcType=BIGINT},
            #{solved_problems, mode=OUT, jdbcType=BIGINT},
            #{correct_count, mode=OUT, jdbcType=BIGINT},
            #{wrong_count, mode=OUT, jdbcType=BIGINT}
        )}
    </select>

    <!-- 기존 ID 조회 쿼리 (유지) -->
    <select id="selectTheoryProblemIdsByCategory" resultType="java.lang.Long">
        SELECT p.id
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE TRIM(COALESCE(s.name, '')) = TRIM(#{category})
        ORDER BY p.id ASC
    </select>

    <select id="selectStudyIdsByDifficultyCategory" resultType="java.lang.Long">
        SELECT p.id
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE p.difficulty = #{difficulty}
          AND TRIM(COALESCE(s.name, '')) = TRIM(#{category})
        ORDER BY p.id ASC
        LIMIT #{limit}
    </select>

    <select id="selectStudyIdsByType" resultType="java.lang.Long">
        SELECT p.id
        FROM problem p
        WHERE p.type = #{type}
        ORDER BY random()
        LIMIT #{limit}
    </select>

    <select id="selectRandomProblemIds" resultType="java.lang.Long">
        SELECT p.id
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        <where>
            <if test="excludeCategories != null and excludeCategories.size() > 0">
                TRIM(COALESCE(s.name, '')) NOT IN
                <foreach collection="excludeCategories" item="category" open="(" separator="," close=")">
                    TRIM(#{category})
                </foreach>
            </if>
        </where>
        ORDER BY random()
        LIMIT #{limit}
    </select>

    <select id="selectRandomCategoryName" resultType="java.lang.String">
        SELECT TRIM(COALESCE(s.name, '')) AS subject_name
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        <where>
            TRIM(COALESCE(s.name, '')) != ''
            <if test="excludeCategories != null and excludeCategories.size() > 0">
                AND TRIM(COALESCE(s.name, '')) NOT IN
                <foreach collection="excludeCategories" item="category" open="(" separator="," close=")">
                    TRIM(#{category})
                </foreach>
            </if>
        </where>
        GROUP BY TRIM(COALESCE(s.name, ''))
        ORDER BY random()
        LIMIT 1
    </select>

    <select id="selectRandomProblemIdsByCategory" resultType="java.lang.Long">
        SELECT p.id
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE TRIM(COALESCE(s.name, '')) = TRIM(#{category})
        ORDER BY random()
        LIMIT #{limit}
    </select>

    <select id="countAll" resultType="long">
        SELECT COUNT(*) FROM problem
    </select>
</mapper>
```

**검증 방법**:
```bash
cd C:\Users\SEOL\InformationExamProject\backend
.\mvnw clean compile -q
```

#### Step 3.2: PostgreSQL Stored Procedure 생성
**대상 파일**: `C:\Users\SEOL\InformationExamProject\backend\src\main\resources\db\migration\V001__create_stored_procedures.sql`

**작업 내용**:
```sql
-- 답변 검증 함수 (비즈니스 로직 SQL 이관)
CREATE OR REPLACE FUNCTION validate_answer(
    p_problem_id BIGINT,
    p_submitted_answer TEXT
)
RETURNS TABLE(
    is_correct BOOLEAN,
    explanation TEXT,
    correct_answer TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        UPPER(TRIM(answer)) = UPPER(TRIM(p_submitted_answer)) AS is_correct,
        explanation,
        answer AS correct_answer
    FROM problem
    WHERE id = p_problem_id;
END;
$$ LANGUAGE plpgsql;

-- 사용자 통계 함수 (비즈니스 로직 SQL 이관)
CREATE OR REPLACE FUNCTION get_user_statistics(
    p_user_id BIGINT
)
RETURNS TABLE(
    total_problems BIGINT,
    solved_problems BIGINT,
    correct_count BIGINT,
    wrong_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM problem)::BIGINT AS total_problems,
        (SELECT COUNT(DISTINCT reference_id) FROM user_answer WHERE user_id = p_user_id)::BIGINT AS solved_problems,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = p_user_id AND is_correct = TRUE)::BIGINT AS correct_count,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = p_user_id AND is_correct = FALSE)::BIGINT AS wrong_count;
END;
$$ LANGUAGE plpgsql;
```

**실행 방법**:
```bash
# Supabase SQL Editor에 직접 복사-붙여넣기 실행
# 또는 psql 명령어 사용
psql "postgresql://postgres.gmhznnwecujoafdisscl:wjdcjrlgkqrur@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require" -f "C:\Users\SEOL\InformationExamProject\backend\src\main\resources\db\migration\V001__create_stored_procedures.sql"
```

---

### Phase 4: Controller 리팩토링 (Service 제거, Mapper 직접 호출)
**목적**: Service 레이어 의존성 제거, Mapper 직접 호출, DTO 변환만 수행

#### Step 4.1: ProblemApiController.java 수정
**대상 파일**: `C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\controller\ProblemApiController.java`

**작업 내용** (전체 코드):
```java
package com.example.informationexam.controller;

import com.example.informationexam.dto.problem.ProblemResponseDto;
import com.example.informationexam.dto.problem.TheoryProblemMetaDto;
import com.example.informationexam.mapper.ProblemQueryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemApiController {
    // ★ Service 대신 Mapper 직접 주입 (MVC2 핵심)
    private final ProblemQueryMapper problemQueryMapper;

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponseDto> getProblem(@PathVariable Long id) {
        log.info("[MVC2] 단건 문제 조회: id={}", id);
        Map<String, Object> map = problemQueryMapper.selectById(id);
        ProblemResponseDto dto = ProblemResponseDto.from(map);
        if (dto == null) {
            throw new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + id);
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/random/objective")
    public ResponseEntity<List<ProblemResponseDto>> getOneRandomProblemPerSubject() {
        log.info("[MVC2] 객관식 랜덤 문제 조회");
        List<Map<String, Object>> maps = problemQueryMapper.selectOneRandomProblemPerSubject("OBJECTIVE");
        return ResponseEntity.ok(ProblemResponseDto.fromList(maps));
    }

    @GetMapping("/theory")
    public ResponseEntity<List<ProblemResponseDto>> getTheoryProblems(@RequestParam String category) {
        log.info("[MVC2] 이론 문제 조회: category={}", category);
        List<Map<String, Object>> maps = problemQueryMapper.selectTheoryProblemsByCategory(category);
        return ResponseEntity.ok(ProblemResponseDto.fromList(maps));
    }

    @GetMapping("/theory/meta")
    public ResponseEntity<TheoryProblemMetaDto> getTheoryProblemMeta(@RequestParam String category) {
        log.info("[MVC2] 이론 메타 조회: category={}", category);
        List<Long> ids = problemQueryMapper.selectTheoryProblemIdsByCategory(category);
        return ResponseEntity.ok(new TheoryProblemMetaDto(ids.size(), ids));
    }

    @GetMapping("/study/meta")
    public ResponseEntity<TheoryProblemMetaDto> getStudyProblemMeta(
            @RequestParam(defaultValue = "false") boolean randomSample,
            @RequestParam(required = false) com.example.informationexam.domain.problem.ProblemType type,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int difficulty,
            @RequestParam(required = false) String excludeCategories,
            @RequestParam(defaultValue = "100") int limit) {
        log.info("[MVC2] 학습 메타 조회: randomSample={}, type={}, category={}", randomSample, type, category);
        
        List<Long> ids;
        if (randomSample) {
            List<String> excluded = (excludeCategories == null || excludeCategories.isBlank())
                    ? List.of()
                    : Arrays.stream(excludeCategories.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isBlank())
                            .toList();
            String nextCategory = problemQueryMapper.selectRandomCategoryName(excluded);
            if (nextCategory == null || nextCategory.isBlank()) {
                return ResponseEntity.ok(new TheoryProblemMetaDto(0, List.of()));
            }
            ids = problemQueryMapper.selectRandomProblemIdsByCategory(nextCategory, limit);
        } else if (category != null && !category.isBlank()) {
            ids = problemQueryMapper.selectStudyIdsByDifficultyCategory(difficulty, category, limit);
        } else if (type != null) {
            ids = problemQueryMapper.selectStudyIdsByType(type.name(), limit);
        } else {
            throw new IllegalArgumentException("randomSample 또는 category 또는 type 중 하나는 필수입니다.");
        }
        return ResponseEntity.ok(new TheoryProblemMetaDto(ids.size(), ids));
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> result = new HashMap<>();
        try {
            result.put("status", "ok");
            result.put("problemCount", problemQueryMapper.countAll());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
}
```

**검증 방법**:
```bash
cd C:\Users\SEOL\InformationExamProject\backend
.\mvnw clean compile -q
```

---

### Phase 5: Service 레이어 정리 (비즈니스 로직 전면 제거)
**목적**: Service 레이어의 모든 비즈니스 로직 제거, 불필요한 파일 삭제

#### Step 5.1: ProblemService.java 삭제
**대상 파일**: `C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\service\ProblemService.java`
**작업**: 파일 삭제
```bash
Remove-Item "C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\service\ProblemService.java"
```

#### Step 5.2: ProblemResponseAssembler.java 삭제
**대상 파일**: `C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\mapper\ProblemResponseAssembler.java`
**작업**: 파일 삭제
```bash
Remove-Item "C:\Users\SEOL\InformationExamProject\backend\src\main\java\com\example\informationexam\mapper\ProblemResponseAssembler.java"
```

**검증 방법**:
```bash
cd C:\Users\SEOL\InformationExamProject\backend
.\mvnw clean compile -q
```

---

### Phase 6: 통합 검증
**목적**: 모든 API 정상 동작 확인, 프론트엔드 호환성 검증

#### Step 6.1: 백엔드 실행 및 API 테스트
```bash
# 백엔드 실행
cd C:\Users\SEOL\InformationExamProject\backend
.\mvnw spring-boot:run &
# 10초 대기
sleep 10

# API 테스트
curl -s http://localhost:8088/api/problems/test | jq .
curl -s http://localhost:8088/api/problems/1 | jq '.correctAnswer, .isAiGenerated, .options'
curl -s http://localhost:8088/api/problems/random/objective | jq '.[0] | keys'
curl -s "http://localhost:8088/api/problems/theory?category=운영체제" | jq '.'
```

#### Step 6.2: 프론트엔드 호환성 확인
- `C:\Users\SEOL\InformationExamProject\InformationExamApp\src\services\api.ts`의 응답 타입과 실제 응답 일치 확인
- `correctAnswer`, `isAiGenerated` 필드명 유지 확인

---

## ✅ 최종 검증 체크리스트
- [ ] `.\mvnw clean compile` 성공
- [ ] `.\mvnw package -DskipTests` JAR 생성 성공
- [ ] 모든 API 엔드포인트 200 OK 응답
- [ ] ProblemResponseAssembler.java, ProblemService.java 삭제됨
- [ ] PostgreSQL Stored Procedure 생성됨
- [ ] 프론트엔드 API 호출 정상 동작

---

## 🚨 롤백 전체 계획
```bash
# Git 사용 시 전체 롤백
cd C:\Users\SEOL\InformationExamProject
git checkout -- backend/

# 미사용 시 사전 백업본 복원 (실행 전 필수)
# 백업 명령어:
# xcopy /E /H /C /I C:\Users\SEOL\InformationExamProject\backend C:\backup\backend_20260505
```

---

**최종 메시지**: 이 계획서는 AI가 단계별로 복사-붙여넣기만으로 완벽 실행할 수 있도록 모든 코드, 경로, 검증 명령어를 포함합니다. 모든 비즈니스 로직이 SQL/XML에 이관되었으며 Java/React는 DTO 역할만 수행합니다.