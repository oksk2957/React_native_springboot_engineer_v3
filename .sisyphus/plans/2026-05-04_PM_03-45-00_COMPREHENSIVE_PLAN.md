# InformationExamProject 포괄적 수정 및 변경 계획서 (PostgreSQL 전환)

> **분석일시**: 2026-05-04 PM_03-45-00  
> **대상 프로젝트**: C:\Users\SEOL\InformationExamProject  
> **사용 모델**: opencode/big-pickle  
> **데이터베이스**: PostgreSQL 전환 (기존 SQLite → PostgreSQL)  
> **SQL 표준**: ANSI SQL (순수 SQL)

---

## 1. 프로젝트 현황 분석

### 1.1 현재 데이터베이스 설정
- **상태**: PostgreSQL 이미 구성됨
- **설정 파일**: `src/main/resources/application.yml`
- **연결 정보**:
  ```yaml
  spring:
    datasource:
      url: jdbc:postgresql://localhost:5432/information_exam
      username: postgres
      password: password
      driver-class-name: org.postgresql.Driver
  ```
- **의존성**: `pom.xml`에 PostgreSQL 드라이버 포함 (lines 36-40)

### 1.2 MyBatis XML 매퍼 현황
기존 XML 매퍼 파일 존재 (이미 MyBatis 사용 중):
- `src/main/resources/mybatis/mapper/ProblemMapper.xml`
- `src/main/resources/mybatis/mapper/UserStatisticsMapper.xml`
- `src/main/resources/mybatis/mapper/WrongAnswerBookmarkMapper.xml`
- `src/main/resources/mybatis/mapper/UserAnswerMapper.xml`
- `src/main/resources/mybatis/mapper/StudySessionItemMapper.xml`
- `src/main/resources/mybatis/mapper/StudySessionMapper.xml`
- `src/main/resources/mybatis/mapper/LearningCardMapper.xml`
- `src/main/resources/mybatis/mapper/ProgrammingLanguageProblemsMapper.xml`
- `src/main/resources/mybatis/mapper/UsersMapper.xml`
- `src/main/resources/mybatis/mapper/SubjectMapper.xml`
- `backend/src/main/resources/mapper/ProblemQueryMapper.xml`
- `backend/src/main/resources/mapper/MypageStatisticsMapper.xml`

### 1.3 @Query 어노테이션 사용 현황 (Java 리포지토리)

#### UserAnswerRepository.java (4개 @Query)
```java
@Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :problemType")
@Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :problemType AND ua.isCorrect = true")
@Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND (ua.itemType = 'OBJECTIVE' OR ua.itemType = 'SUBJECTIVE' OR ua.itemType = 'PROGRAMMING_LANGUAGE')")
@Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :category")
```

#### ProblemRepository.java (7개 @Query)
```java
@Query("SELECT p FROM Problem p JOIN p.subject s WHERE TRIM(s.name) = TRIM(:category)")
@Query("SELECT p.id FROM Problem p JOIN p.subject s WHERE TRIM(s.name) = TRIM(:category) ORDER BY p.id")
@Query("SELECT COUNT(p) FROM Problem p JOIN p.subject s WHERE s.name = :categoryName")
@Query(value = "SELECT * FROM problem p JOIN subject s ON p.subject_id = s.id WHERE p.difficulty = ?1 AND TRIM(s.name) = TRIM(?2) ORDER BY RAND() LIMIT ?3", nativeQuery = true)
@Query("SELECT p FROM Problem p WHERE (:difficulty = 0 OR p.difficulty = :difficulty) AND (:category IS NULL OR TRIM(p.subject.name) = TRIM(:category))")
@Query(value = "SELECT * FROM problem ORDER BY RAND() LIMIT ?1", nativeQuery = true)
@Query(value = "SELECT * FROM problem WHERE type = ?1 ORDER BY RAND() LIMIT ?2", nativeQuery = true)
```

#### SubjectiveProblemRepository.java (1개 @Query)
```java
@Query(value = "SELECT COUNT(DISTINCT ua.reference_id) FROM user_answer ua WHERE ua.user_id = :userId AND ua.problem_type = 'SUBJECTIVE'", nativeQuery = true)
```

#### StatisticsRepository.java (1개 @Query)
```java
@Query("SELECT COUNT(DISTINCT s.referenceId) FROM Statistics s WHERE s.user.id = :userId AND s.problemType = :problemType")
```

### 1.4 프론트엔드 API 호출 현황
- **API Base URL**: `http://localhost:8088/api` (포트 불일치: 백엔드는 8080)
- **사용 라이브러리**: fetch, axios
- **주요 파일**:
  - `InformationExamApp/src/screens/StatisticsScreen.tsx`
  - `InformationExamApp/src/screens/TheoryScreen.tsx`
  - `InformationExamApp/src/screens/HomeScreen.tsx`
  - `InformationExamApp/src/hooks/useGoogleAuth.tsx`

---

## 2. PostgreSQL 전환 및 구조 개선 계획

### 2.1 데이터베이스 포트 일치화 (P0)
**문제**: 프론트엔드 API URL 포트(8088) ≠ 백엔드 포트(8080)

**해결 방안**:
1. `useGoogleAuth.tsx` line 14 수정:
   ```typescript
   const API_BASE_URL = 'http://localhost:8080/api';
   ```

2. 또는 백엔드 `application.yml` 포트 변경:
   ```yaml
   server:
     port: 8088
   ```

### 2.2 @Query → XML 매퍼 이관 (P1)

#### 2.2.1 이관 대상 쿼리 분류

**JPQL 쿼리 (JPA 전용, XML 변환 필요)**:
1. `UserAnswerRepository`: 4개 JPQL 쿼리
2. `ProblemRepository`: 3개 JPQL 쿼리 (lines 11, 14, 19, 25)
3. `StatisticsRepository`: 1개 JPQL 쿼리

**Native SQL 쿼리 (이미 순수 SQL, XML 이관 필요)**:
1. `ProblemRepository`: 3개 native 쿼리 (lines 22, 28, 31)
2. `SubjectiveProblemRepository`: 1개 native 쿼리

#### 2.2.2 XML 매퍼 파일 생성/수정 계획

**신규 XML 매퍼 생성**:
1. `backend/src/main/resources/mapper/UserAnswerMapperCustom.xml`
2. `backend/src/main/resources/mapper/ProblemRepositoryMapper.xml`
3. `backend/src/main/resources/mapper/StatisticsRepositoryMapper.xml`
4. `backend/src/main/resources/mapper/SubjectiveProblemRepositoryMapper.xml`

#### 2.2.3 ANSI SQL 표준 쿼리 작성 가이드

**변환 예시**:

**JPQL → ANSI SQL**:
```xml
<!-- JPQL: SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :problemType -->
<!-- ANSI SQL -->
<select id="countByUserIdAndProblemType" parameterType="map" resultType="long">
    SELECT COUNT(*) 
    FROM user_answer ua 
    WHERE ua.user_id = #{userId} 
      AND ua.item_type = #{problemType}
</select>
```

**RAND() → PostgreSQL 호환性**:
```xml
<!-- 기존: ORDER BY RAND() LIMIT ? -->
<!-- PostgreSQL: ORDER BY RANDOM() LIMIT ? -->
<select id="findRandomProblems" parameterType="map" resultType="map">
    SELECT * 
    FROM problem 
    ORDER BY RANDOM() 
    LIMIT #{limit}
</select>
```

**TRIM 함수 (ANSI SQL 표준)**:
```xml
<!-- TRIM()은 ANSI SQL 표준이므로 유지 -->
<select id="findTheoryProblemsByCategory" parameterType="map" resultType="map">
    SELECT p.*, s.name AS category_name
    FROM problem p
    INNER JOIN subject s ON p.subject_id = s.id
    WHERE TRIM(s.name) = TRIM(#{category})
    ORDER BY p.id
</select>
```

### 2.3 Java 리포지토리 인터페이스 수정 (P1)

#### 수정 패턴: @Query 제거 + Map 파라미터

**수정 전**:
```java
@Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :problemType")
long countByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);
```

**수정 후**:
```java
import org.apache.ibatis.annotations.*;
import java.util.Map;

public interface UserAnswerRepository {
    @Select("countByUserIdAndProblemType")
    long countByUserIdAndProblemType(@Param("params") Map<String, Object> params);
    // XML에서: #{params.userId}, #{params.problemType}
}
```

**또는 더 간단한 방식**:
```java
public interface UserAnswerRepository {
    // MyBatis Mapper XML 참조
    long countByUserIdAndProblemType(Map<String, Object> params);
}
```

### 2.4 프론트엔드 파라미터 Map 형태 전송 (P2)

**수정 예시** (`TheoryScreen.tsx`):
```typescript
// 기존
const meta = await problemService.getTheoryProblemMeta(currentCategory);

// 수정 후 (Map 형태로 전송)
const params = {
  category: currentCategory,
  type: 'THEORY'
};
const meta = await problemService.getTheoryProblemMeta(params);
```

**API 서비스 수정** (`services/api.ts`):
```typescript
// Map 형태로 파라미터 전송
getTheoryProblemMeta: (params: Map<string, any>) => 
  axios.get('/api/problems/theory/meta', { params }),
```

---

## 3. 수정 우선순위 및 실행 단계

### P0 (즉시 수정 필요)
1. **포트 불일치 해결**
   - `InformationExamApp/src/hooks/useGoogleAuth.tsx` line 14: `8088` → `8080`
   - 또는 `application.yml` server.port: `8080` → `8088`

2. **PostgreSQL 연결 테스트**
   - MySQL MCP로 테스트했으나 PostgreSQL 전용 테스트 필요
   - 연결 실패 시: PostgreSQL 서비스 시작, 데이터베이스 생성 확인

### P1 (주요 구조 변경)
1. **@Query → XML 이관**
   - 13개 @Query 메서드 XML 매퍼로 이관
   - 모든 쿼리 ANSI SQL 표준으로 재작성
   - `RAND()` → `RANDOM()` (PostgreSQL)
   - 테이블/컬럼명 소문자 표준화 (snake_case)

2. **Java 리포지토리 인터페이스 수정**
   - `@Query` 어노테이션 제거
   - 메서드 파라미터를 `Map<String, Object>` 형태로 변경
   - MyBatis `@Select`, `@Insert` 등 어노테이션 또는 XML 매퍼 참조

3. **ANSI SQL 표준화**
   - 모든 SQL을 순수 SQL + ANSI 표준 준수
   - 데이터베이스 고유 함수 최소화
   - PostgreSQL 전용 문법: `RANDOM()`, `SERIAL`, `GENERATED ALWAYS AS IDENTITY` 등만 사용

### P2 (프론트엔드 구조 개선)
1. **API 호출 파라미터 Map 형태로 통일**
   - 모든 API 호출 시 Map/Object 형태로 파라미터 전송
   - 일관된 데이터 구조 유지

2. **에러 처리 표준화**
   - API 호출 실패 시 일관된 에러 핸들링
   - 토큰 만료 처리

---

## 4. XML 매퍼 파일 상세 설계

### 4.1 UserAnswerMapperCustom.xml
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.informationexam.repository.UserAnswerRepository">
    
    <!-- COUNT by userId and problemType -->
    <select id="countByUserIdAndProblemType" parameterType="map" resultType="long">
        SELECT COUNT(*) 
        FROM user_answer 
        WHERE user_id = #{userId} 
          AND item_type = #{problemType}
    </select>
    
    <!-- COUNT correct by userId and problemType -->
    <select id="countCorrectByUserIdAndProblemType" parameterType="map" resultType="long">
        SELECT COUNT(*) 
        FROM user_answer 
        WHERE user_id = #{userId} 
          AND item_type = #{problemType}
          AND is_correct = TRUE
    </select>
    
    <!-- COUNT total by category -->
    <select id="countTotalByCategory" parameterType="map" resultType="long">
        SELECT COUNT(*) 
        FROM user_answer 
        WHERE user_id = #{userId} 
          AND item_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE')
    </select>
    
    <!-- COUNT correct by category -->
    <select id="countCorrectByCategory" parameterType="map" resultType="long">
        SELECT COUNT(*) 
        FROM user_answer 
        WHERE user_id = #{userId} 
          AND item_type = #{category}
          AND is_correct = TRUE
    </select>
</mapper>
```

### 4.2 ProblemRepositoryMapper.xml
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.informationexam.repository.ProblemRepository">
    
    <!-- Find theory problems by category -->
    <select id="findTheoryProblemsByCategory" parameterType="map" resultType="map">
        SELECT p.*, s.name AS category_name
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE TRIM(s.name) = TRIM(#{category})
        ORDER BY p.id
    </select>
    
    <!-- Find theory problem IDs by category -->
    <select id="findTheoryProblemIdsByCategory" parameterType="map" resultType="Long">
        SELECT p.id
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE TRIM(s.name) = TRIM(#{category})
        ORDER BY p.id
    </select>
    
    <!-- COUNT by subject name -->
    <select id="countBySubjectName" parameterType="map" resultType="long">
        SELECT COUNT(*)
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE s.name = #{categoryName}
    </select>
    
    <!-- Find problems by difficulty and category (ANSI SQL) -->
    <select id="findProblemsByDifficultyAndCategory" parameterType="map" resultType="map">
        SELECT p.*, s.name AS category_name
        FROM problem p
        INNER JOIN subject s ON p.subject_id = s.id
        WHERE p.difficulty = #{difficulty}
          AND TRIM(s.name) = TRIM(#{category})
        ORDER BY RANDOM()
        LIMIT #{limit}
    </select>
    
    <!-- Find problems by difficulty and category (JPQL to SQL) -->
    <select id="findProblemsByDifficultyAndCategoryJPQL" parameterType="map" resultType="map">
        SELECT p.*
        FROM problem p
        WHERE (#{difficulty} = 0 OR p.difficulty = #{difficulty})
          AND (#{category} IS NULL OR TRIM(p.subject.name) = TRIM(#{category}))
    </select>
    
    <!-- Find random problems -->
    <select id="findRandomProblems" parameterType="map" resultType="map">
        SELECT * 
        FROM problem 
        ORDER BY RANDOM()
        LIMIT #{limit}
    </select>
    
    <!-- Find random problems by type -->
    <select id="findRandomProblemsByType" parameterType="map" resultType="map">
        SELECT * 
        FROM problem 
        WHERE type = #{type}
        ORDER BY RANDOM()
        LIMIT #{limit}
    </select>
</mapper>
```

### 4.3 SubjectiveProblemRepositoryMapper.xml
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.informationexam.repository.SubjectiveProblemRepository">
    
    <!-- COUNT distinct solved by userId -->
    <select id="countDistinctSolvedByUserId" parameterType="map" resultType="long">
        SELECT COUNT(DISTINCT ua.reference_id) 
        FROM user_answer ua 
        WHERE ua.user_id = #{userId} 
          AND ua.problem_type = 'SUBJECTIVE'
    </select>
</mapper>
```

### 4.4 StatisticsRepositoryMapper.xml
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.informationexam.repository.StatisticsRepository">
    
    <!-- COUNT distinct reference IDs by userId and problemType -->
    <select id="countDistinctReferenceIdsByUserIdAndProblemType" parameterType="map" resultType="long">
        SELECT COUNT(DISTINCT s.reference_id) 
        FROM statistics s
        WHERE s.user_id = #{userId} 
          AND s.problem_type = #{problemType}
    </select>
</mapper>
```

---

## 5. ANSI SQL 표준 준수 체크리스트

### 5.1 사용 가능 (ANSI SQL 표준)
- `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- `WHERE`, `FROM`, `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`
- `COUNT()`, `SUM()`, `AVG()`, `MAX()`, `MIN()`
- `TRIM()`, `UPPER()`, `LOWER()`
- `ORDER BY`, `GROUP BY`, `HAVING`
- `DISTINCT`, `AS` (alias)
- `AND`, `OR`, `NOT`, `IN`, `BETWEEN`, `LIKE`
- `IS NULL`, `IS NOT NULL`
- `LIMIT` (일부 DB 지원, PostgreSQL은 지원)

### 5.2 PostgreSQL 전용 (필요 시만 사용)
- `RANDOM()` (대신 `ORDER BY RANDOM()`)
- `SERIAL`, `BIGSERIAL` (자동 증가)
- `GENERATED ALWAYS AS IDENTITY` (ANSI 표준 권장)
- `ILIKE` (대소문자 무시 검색, 필요 시 `LOWER()` 사용)
- `UUID` 데이터 타입

### 5.3 금지 (데이터베이스 고유 문법)
- MySQL: `RAND()`, `NOW()`, `CURDATE()`
- SQLite: `datetime('now')`, `last_insert_rowid()`
- PostgreSQL: `::` 캐스팅 (대신 `CAST()` 사용)
- Oracle: `ROWNUM`, `SYSDATE`

---

## 6. 실행 단계 요약

### Step 1: 환경 설정 수정 (1시간)
1. 프론트엔드 API 포트 수정 (8088 → 8080)
2. PostgreSQL 서비스 상태 확인
3. 데이터베이스 `information_exam` 생성 확인

### Step 2: XML 매퍼 생성 (2시간)
1. `UserAnswerMapperCustom.xml` 생성
2. `ProblemRepositoryMapper.xml` 생성
3. `SubjectiveProblemRepositoryMapper.xml` 생성
4. `StatisticsRepositoryMapper.xml` 생성
5. `mybatis.mapper-locations` 설정에 경로 추가

### Step 3: Java 리포지토리 수정 (2시간)
1. `@Query` 어노테이션 제거
2. 메서드 시그니처를 Map 파라미터로 변경
3. MyBatis 어노테이션 또는 XML 매퍼 참조 추가

### Step 4: 프론트엔드 파라미터 수정 (1시간)
1. API 호출 시 Map 형태로 파라미터 전송
2. 타입 정의 및 인터페이스 수정

### Step 5: 테스트 및 검증 (1시간)
1. PostgreSQL 연결 테스트
2. 각 API 엔드포인트 테스트
3. XML 매퍼 쿼리 실행 확인

---

## 7. 참고 사항

### 7.1 기존 ProblemQueryMapper.xml 분석
- 이미 복잡한 쿼리들이 XML로 구현됨
- `RAND()` 사용 → `RANDOM()`으로 수정 필요
- `LIMIT`은 PostgreSQL에서 지원되므로 유지 가능
- `LOWER()` 함수는 ANSI SQL 표준이므로 유지

### 7.2 MyBatis 설정
```yaml
mybatis:
  mapper-locations: classpath:mybatis/mapper/*.xml,classpath:mapper/*.xml
  type-aliases-package: com.example.informationexam.model
  configuration:
    map-underscore-to-camel-case: true
```

### 7.3 PostgreSQL 데이터베이스 스키마 검증
- 기존 SQLite 스키마와 호환성 확인
- 테이블 생성 SQL이 ANSI SQL 표준 준수하는지 확인
- 자동 증가 컬럼: `SERIAL` → `GENERATED ALWAYS AS IDENTITY` (권장)

---

## 8. 결론

본 프로젝트는 **이미 PostgreSQL으로 전환 준비가 완료**된 상태입니다. 주요 작업은:
1. **포트 불일치 수정** (P0)
2. **@Query → XML 이관** (P1, 13개 메서드)
3. **ANSI SQL 표준화** (RAND() → RANDOM())
4. **Map 파라미터 통일**

예상 소요 시간: **7시간**  
우선순위: **P0 → P1 → P2**

---

**작성자**: opencode/big-pickle  
**생성일시**: 2026-05-04 PM_03-45-00  
**버전**: v1.0
