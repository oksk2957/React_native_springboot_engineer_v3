# [계획서] 이론(Theory) 학습 데이터 로드 오류 해결 및 MyBatis 리팩토링 계획서

## 1. 문제 요약
이론 학습 탭에서 `GET /api/problems/theory?category=운영체제` API 호출 시 데이터가 반환되지 않음.

## 2. 근본 원인 분석

### 2.1. 현재 아키텍처 (Port 9000 Backend)
- **Frontend**: React Native (Expo) → `fetchTheoryCards()` → `GET /api/problems/theory`
- **Controller**: `ProblemApiController.getTheoryCards()` 
- **Mapper Interface**: `ProblemQueryMapper` (MyBatis)
- **Mapper XML**: `backend/src/main/resources/mapper/ProblemQueryMapper.xml`
- **DTO 변환**: `List<Map<String,Object>>` → `TheoryCardDto::fromMap` 로 수동 변환

### 2.2. 발견된 문제점

#### 문제 1: 불필요한 복잡한 수동 변환 로직
현재 `ProblemQueryMapper.xml`는 `resultType="map"`을 사용하여 스네이크케이스(snake_case) 컬럼을 반환하고, 
컨트롤러에서 `TheoryCardDto::fromMap`을 통해 수동으로 변환함.

**현재 코드 (ProblemQueryMapper.xml 일부):**
```xml
<select id="selectTheoryCardsByCategory" resultType="map">
    SELECT
        sp.id,
        sp.subject_id,        -- 스네이크케이스
        'SUBJECTIVE' AS card_type,
        sp.question AS front_text,
        ...
</select>
```

**컨트롤러 변환 로직:**
```java
List<Map<String, Object>> maps = problemQueryMapper.selectTheoryCardsByCategory(category);
List<TheoryCardDto> cardDtos = maps.stream()
    .map(TheoryCardDto::fromMap)  // 수동 변환
    .collect(Collectors.toList());
```

#### 문제 2: 잠재적 타입 변환 오류
수동 변환 로직(`fromMap`)에서 다음과 같은 런타임 오류 발생 가능성:
- PostgreSQL의 `boolean` → Java `Boolean` 캐스팅 오류
- `timestamp` → `java.sql.Timestamp` 캐스팅 실패
- null 값 처리 누락로 인한 NullPointerException

#### 문제 3: 사용되지 않는 우수한 설계 존재
`backend/src/main/resources/mappers/TheoryMapper.xml` 파일은 **최적의 구현**을 가지고 있으나:
- 폴더명이 `mappers/` (O) vs 설정의 `mapper/` (X) → **MyBatis 스캐닝 대상 아님**
- 대응하는 `TheoryMapper` Java 인터페이스가 없음 → 미사용 상태

**TheoryMapper.xml (우수 구현):**
```xml
<select id="selectTheoryCardsByCategory" resultType="TheoryCardDto">
    SELECT
        sp.id,
        s.id AS subjectId,      -- 카멜케이스 (DTO 필드명과 일치)
        'SUBJECTIVE' AS cardType,
        sp.question AS frontText,
        ...
</select>
```
- MyBatis가 컬럼명과 DTO 필드명 자동 매핑 (resultType 사용)
- 별도의 변환 로직 불필요
- 네이밍 일관적이고 가독성 우수

### 2.3. 기술적 부채
- **분리 불충분**: 문제 조회(ProblemQueryMapper)와 이론 카드 조회(Theory)가 하나의 Mapper에 섞여 있음
- **유지보수성 저하**: 동일한 도메인(TheoryCard)에 대한 쿼리가 2개(Mapper + ProblemQuery)의 파일에 분산
- **확장성 부족**: 새로운 이론 카드 타입 추가 시 기존 로직 변경 필요



### Phase 2: 컨트롤러 리팩토링 (30분)
**목표**: 서비스 계층에서 TheoryMapper 사용하도록 변경

2-1. `ProblemApiController.java` 수정
```java
// 기존
private final ProblemQueryMapper problemQueryMapper;

public ResponseEntity<List<TheoryCardDto>> getTheoryCards(@RequestParam String category) {
    List<Map<String, Object>> maps = problemQueryMapper.selectTheoryCardsByCategory(category);
    List<TheoryCardDto> cardDtos = maps.stream()
        .map(TheoryCardDto::fromMap)  // ← 제거
        .collect(Collectors.toList());
}

// 변경 후
private final TheoryMapper theoryMapper;  // ← 신규 주입

public ResponseEntity<List<TheoryCardDto>> getTheoryCards(@RequestParam String category) {
    List<TheoryCardDto> cardDtos = theoryMapper.selectTheoryCardsByCategory(category);
    return ResponseEntity.ok(cardDtos);
}
```

### Phase 3: Mapper XML 정리 (선택사항)
**목표**: ProblemQueryMapper에서 theory 관련 쿼리 제거 (단일 책임 원칙)

3-1. `ProblemQueryMapper.xml`에서 `selectTheoryCardsByCategory` 삭제
3-2. `ProblemQueryMapper.java`에서 해당 메서드 삭제
3-3. `TheoryCardDto`의 정적 `fromMap` 메서드 제거 (직렬화/역직렬화 시 제외)

### Phase 4: 테스트 및 검증 (1-2시간)
**목표**: API 정상 동작 확인 및 에러 핸들링 검증

4-1. 백엔드 로컬 구동 (포트 9000)
```bash
cd backend
./mvnw spring-boot:run
```

4-2. API 직접 호출 테스트
```bash
curl "http://localhost:9000/api/problems/theory?category=운영체제"
```

4-3. Frontend (Expo)에서 데이터 로드 확인
- TheoryScreen에서 카드 리스트 렌더링 확인
- Subjective/Flashcard 탭 전환 테스트

4-4. 로그 모니터링
- MyBatis 쿼리 로그 확인 (DEBUG 레벨)
- 응답 데이터 구조 확인

### Phase 5: 성능 최적화 (선택)
**목표**: 대규모 데이터 조회 시 성능 개선

5-1. 페이징 처리 추가
```java
List<TheoryCardDto> selectTheoryCardsByCategory(
    @Param("category") String category,
    @Param("offset") int offset,
    @Param("limit") int limit
);
```

5-2. Redis 캐싱 도입 (자주 조회되는 카테고리)
```java
@Cacheable(value = "theoryCards", key = "#category")
public List<TheoryCardDto> getTheoryCards(String category) { ... }
```

## 4. 예상 효과

| 구분 | 리팩토링 전 | 리팩토링 후 |
|------|-----------|------------|
| **코드 복잡도** | 높음 (수동 변환 로직) | 낮음 (MyBatis 자동 매핑) |
| **유지보수성** | 낮음 (2개 파일 분산) | 높음 (단일 책임) |
| **타입 안정성** | 런타임 오류 가능 | 컴파일 타임 검증 |
| **가독성** | 중간 | 우수 (의도 파악 용이) |
| **확장성** | 변경 시 영향도 큼 | 모듈화로 영향도 최소화 |

## 5. 리스크 및 대응 방안

| 리스크 | 발생 확률 | 영향도 | 대응 방안 |
|--------|----------|--------|----------|
| MyBatis 스캐싱 실패 | 낮 | 높 | 경로 확인, 재시작, 캐시 클리어 |
| 기존 API 호환성 | 없음 | 중 | URL 경로 동일, 응답 스키마 동일 |
| DB 쿼리 성능 저하 | 낮 | 중 | 인덱스 추가, 실행 계획 분석 |

## 6. 참고 자료

- 기존 계획서: `.plan/2026-05-06_Theory_Integration_Refactor_Plan.md`
- DTO 정의: `backend/src/main/java/com/example/informationexam/dto/theory/TheoryCardDto.java`
- Frontend 타입: `InformationExamApp/src/types/index.ts` (TheoryCardDto)

## 7. 결론

현재 발생한 "데이터 미반환" 오류의 직접적인 원인은 다음 중 하나:
1. DB 내 `subject` 테이블 미존재 또는 데이터 불일치
2. MyBatis 타입 변환 실패 (boolean/timestamp 캐스팅)
3. 수동 변환 로직 내 숨겨진 NPE

**근본 해결책**: 기능적으로 동작하던 `TheoryMapper.xml` 설계를 적극 활용하여,
MyBatis의 `resultType` 자동 매핑 기능을 사용하고, 수동 변환 로직을 제거함으로써
코드 품질을 향상시키고 잠재적 오류 가능성을 원천 차단함.

---
**작성일**: 2026-05-07
**작성자**: OpenCode AI Assistant
**상태**: 검토 대기