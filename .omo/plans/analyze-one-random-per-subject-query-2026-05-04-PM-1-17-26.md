# [PostgreSQL] 과목별 랜덤 조회 쿼리 동작 분석 및 개선 계획

## 📋 요청 분석
- **대상 쿼리**: `selectOneRandomProblemPerSubject` (ProblemQueryMapper.xml)
- **현상**: "갯수는 계속 카운터되어 마지막에 끝에 각 과목마다 도달"
- **MCP 활용**: PostgreSQL 공식 문서로 검증

---

## 🔍 쿼리 동작 분석 (MCP 검증 완료)

### 📊 쿼리 구조
```sql
SELECT <include refid="problemJoinedColumns"/>
FROM (
    SELECT DISTINCT ON (p.subject_id) p.*
    FROM problem p
    INNER JOIN subject s ON p.subject_id = s.id
    WHERE CAST(p.type AS TEXT) = #{type}
    ORDER BY p.subject_id, random()
) p
INNER JOIN subject s ON p.subject_id = s.id
```

### 🔬 MCP 검증 결과
- **Library**: /websites/postgresql (Score: 77.8)
- **검증 1**: `DISTINCT ON (subject_id)` 동작
  - 각 subject_id 그룹에서 **첫 번째 행만 반환**
  - "첫 번째 행"은 `ORDER BY`에 의해 결정됨
  
- **검증 2**: `ORDER BY p.subject_id, random()` 동작
  - 먼저 subject_id로 1차 정렬 (같은 과목끼리 모음)
  - 같은 과목 내에서는 `random()`으로 무작위 정렬
  - 결과적으로 **각 과목당 1개의 무작위 문제** 선택

- **검증 3**: `random()` 함수 특성
  - 호출할 때마다 독립적으로 난수 생성
  - **복원 추출** (이미 선택된 문제가 다시 나올 수 있음)
  - 특정 문제가 영원히 선택되지 않을 확률 존재

---

## ❓ 사용자 관찰 현상 분석

### 🗣️ 사용자 질문
> "각 과목마다 랜덤으로 조회를 하되 갯수는 계속 카운터되어 마지막에 끝에 각 과목마다 도달하게 되는건 무엇인가?"

### 🔎 분석 결과

**1. "갯수 카운터" 현상?**
- ❌ 쿼리 자체에 카운터 로직 없음
- ✅ `DISTINCT ON` 때문에 **결과는 항상 과목 수(N개)만큼만 반환**
- 결과 셋 크기 고정 (과목 수 변하지 않음)

**2. "마지막에 각 과목마다 도달"의 의미?**
- **현재 쿼리**: 각 과목당 **정확히 1문제**만 반환
- **기대 동작 추정**:
  - 반복 호출 시 각 과목의 모든 문제가 골고루 선택되기를 기대?
  - 또는 페이징/누적 조회를 원함?

**3. 현재 쿼리의 한계**
| 한계점 | 설명 |
|--------|------|
| 복원 추출 | 이미 선택된 문제가 다시 나올 수 있음 |
| 누적 없음 | 각 호출이 독립적이라 이전 선택 기록 없음 |
| 전체 순회 보장 안 됨 | 어떤 문제는 영원히 선택되지 않을 수 있음 |
| 결과 수 고정 | 항상 과목 수만큼만 반환 (카운터 증가 없음) |

---

## 🛠️ 개선 방안 (3가지 옵션)

### [옵션 A] 현재 유지 (각 과목당 1문제 랜덤)
**쿼리 수정 불필요**
- 이미 올바르게 동작 중
- "카운터" 현상은 애플리케이션 레벨(Java 서비스)의 로직일 가능성 높음
- **확인 필요**: `ProblemService.java`의 호출부에 카운터 로직 있는지 확인

**장점**: 현재 쿼리 동작 정상  
**단점**: 사용자가 기대하는 "전체 순회" 안 됨

---

### [옵션 B] 각 과목별 N문제 랜덤 조회 (INNER JOIN + window function)
```sql
SELECT <include refid="problemJoinedColumns"/>
FROM (
    SELECT p.*, ROW_NUMBER() OVER (PARTITION BY p.subject_id ORDER BY random()) as rn
    FROM problem p
    INNER JOIN subject s ON p.subject_id = s.id
    WHERE CAST(p.type AS TEXT) = #{type}
) p
INNER JOIN subject s ON p.subject_id = s.id
WHERE p.rn <= #{limitPerSubject}  -- 각 과목당 N문제
ORDER BY p.subject_id, p.rn
```

**장점**: 각 과목에서 여러 문제 조회 가능  
**단점**: limitPerSubject 파라미터 추가 필요

---

### [옵션 C] 각 과목별 모든 문제 조회 (순서 섞어서)
```sql
SELECT <include refid="problemJoinedColumns"/>
FROM problem p
INNER JOIN subject s ON p.subject_id = s.id
WHERE CAST(p.type AS TEXT) = #{type}
ORDER BY p.subject_id, random()
```

**장점**: 각 과목의 모든 문제 조회, 순서만 랜덤  
**단점**: 과목별 문제 수가 다르면 결과 불균형

---

## 📂 관련 파일 위치

| 파일 | 경로 | 설명 |
|------|------|------|
| Mapper XML | `backend/src/main/resources/mapper/ProblemQueryMapper.xml` | 쿼리 정의 (line 109-119) |
| Service | `backend/src/main/java/com/example/informationexam/service/ProblemService.java` | getOneRandomProblemPerSubject() (line 49-52) |
| DTO | `backend/src/main/java/com/example/informationexam/dto/problem/ProblemSqlRow.java` | 결과 매핑 객체 |

---

## 🧪 검증 방법

### 검증 1: 현재 쿼리 동작 확인
```sql
-- PostgreSQL 직접 실행
SELECT DISTINCT ON (p.subject_id) p.id, p.subject_id, p.question
FROM problem p
INNER JOIN subject s ON p.subject_id = s.id
WHERE CAST(p.type AS TEXT) = 'multiple'
ORDER BY p.subject_id, random();
-- 결과: 각 subject_id당 정확히 1행만 반환되는지 확인
```

### 검증 2: 결과 수 = 과목 수인지 확인
```sql
-- 과목 수 확인
SELECT COUNT(DISTINCT subject_id) FROM problem WHERE CAST(type AS TEXT) = 'multiple';

-- 쿼리 결과 수 확인 (위 쿼리 실행 후 행 수)
-- 두 값이 같아야 함
```

### 검증 3: 애플리케이션 레벨 카운터 확인
`ProblemService.java`에서 `getOneRandomProblemPerSubject` 호출 시:
- 어떤 상태(State)를 유지하는지
- "카운터"가 있다면 어디에 있는지

---

## 📋 실행 체크리스트

**현상 규명**:
- [ ] `ProblemService.java` 확인: 카운터 로직 있는지
- [ ] 쿼리 여러 번 실행: 결과 수가 항상 과목 수인지
- [ ] 로그 확인: "카운터" 메시지 출처 찾기

**개선 필요 시**:
- [ ] 옵션 B 또는 C 선택
- [ ] Mapper XML 수정
- [ ] Service 레벨 수정 (파라미터 추가 등)
- [ ] 테스트 실행

---

## 🔗 참고 MCP 문서

1. **PostgreSQL** (/websites/postgresql)
   - DISTINCT ON 동작 원리
   - ORDER BY random() 동작
   - Window function (ROW_NUMBER) 사용법

2. **PostgreSQL** (/websites/postgresql_18)
   - Advanced SQL patterns
   - Random sampling techniques

---

## 🏁 결론

**MCP 검증 결과**:
- 현재 쿼리는 **각 과목당 정확히 1개의 무작위 문제**를 올바르게 반환함
- "갯수 카운터" 현상은 **쿼리 자체가 아닌 애플리케이션 레벨**에서 발생 중일 가능성 높음
- "마지막에 각 과목마다 도달"하려면 **옵션 B나 C로 쿼리 변경** 필요

**권고 사항**:
1. 먼저 `ProblemService.java`의 호출부를 확인하여 "카운터" 로직 찾기
2. 사용자가 원하는 동작이 무엇인지 명확히 확인
3. 필요 시 옵션 B(각 과목 N문제) 또는 C(전체 조회)로 변경

---

## 📝 요약

| 항목 | 내용 |
|------|------|
| 쿼리 ID | selectOneRandomProblemPerSubject |
| 현재 동작 | 각 과목당 1문제 랜덤 반환 (과목 수만큼 결과) |
| 카운터 현상 | 쿼리에 없음 → Java 서비스 레벨 확인 필요 |
| MCP 검증 | PostgreSQL 공식 문서로 동작 검증 완료 |
| 개선 방안 | 옵션 B(과목별 N문제) 또는 C(전체 조회) |
| 다음 단계 | 서비스 코드 확인 후 사용자 요구사항 명확히 하기 |
