# 마이페이지 통계 표시 문제 해결 계획
**작성일**: 2026-05-04  
**작성자**: Kilo AI  
**상태**: 분석 완료

---

## 1. 문제 인식

**현상**: 마이페이지(StatisticsScreen)에서 통계가 표시되지 않음  
**영향**: 사용자가 자신의 학습 진행 상황을 확인할 수 없어 학습 동기 감소

---

## 2. 시스템 분석

### 2.1 아키텍처 개요

```
Frontend (React Native)
    ↓ API 호출 (/api/statistics)
Backend (Spring Boot)
    ↓ JPA Query
Database (Supabase PostgreSQL)
    ↓ user_answer 테이블
```

### 2.2 핵심 파일 분석

| 계층 | 파일 | 역할 |
|------|------|------|
| Controller | `StatisticsController.java:22-29` | `/api/statistics` 엔드포인트 |
| Service | `StatisticsService.java:34-127` | 통계 집계 로직 |
| Repository | `UserAnswerRepository.java:27-42` | user_answer 테이블 쿼리 |
| Frontend | `StatisticsScreen.tsx:38-44` | 통계 데이터 패칭 및 표시 |

### 2.3 데이터 흐름

1. **Frontend**: `statisticsService.getStatistics()` → `/api/statistics` 요청
2. **Backend**: `StatisticsController.getStatistics()` → JWT에서 userId 추출
3. **Service**: `StatisticsService.getOverallStatistics(userId)` 호출
4. **Repository**: `userAnswerRepository.countByUserIdAndProblemType()` 등의 메서드 실행
5. **Database**: `user_answer` 테이블에서 통계 조회

---

## 3. 가능한 원인 분석

### 3.1 우선순위가 높은 원인 (P0)

| 순서 | 원인 | 설명 | 검증 방법 |
|------|------|------|-----------|
| 1 | **사용자 답변 데이터 미저장** | `user_answer` 테이블이 비어있거나 해당 사용자의 데이터가 없음 | DB 직접 조회 또는 API 테스트 |
| 2 | **JWT 인증 실패** | 토큰이 유효하지 않아 userId가 null로 전달됨 | 콘솔 로그 확인 또는 토큰 디버깅 |
| 3 | **API 엔드포인트 오류** | `/api/statistics` 엔드포인트가 401/500 에러 반환 | 네트워크 탭에서 상태 코드 확인 |

### 3.2 우선순위가 낮은 원인 (P1)

| 순서 | 원인 | 설명 |
|------|------|------|
| 1 | **카운트 쿼리 로직 오류** | `countByUserIdAndProblemType` 등의 메서드가 0을 반환 |
| 2 | **프론트엔드 표시 로직 오류** | `categoryStats`가 비어서 차트가 렌더되지 않음 |
| 3 | **네트워크 연결 문제** | 프론트엔드가 백엔드에 연결되지 못함 (IP 주소 문제) |

---

## 4. 해결 계획

### 4.1 단계별 실행 계획

#### **Phase 1: 진단 (20분)**

1. **API 응답 확인**
   ```bash
   # 백엔드 실행 후 테스트
   curl -X GET "http://localhost:9000/api/statistics" \
     -H "Authorization: Bearer <토큰>"
   ```
   - **성공 시**: `{"totalProblems": X, "solvedProblems": Y, ...}` 반환
   - **실패 시**: 401/500 에러 확인

2. **데이터베이스 직접 확인**
   - Supabase 대시보드 또는 `psql`로 `user_answer` 테이블 조회
   ```sql
   SELECT user_id, COUNT(*) FROM user_answer 
   GROUP BY user_id;
   ```

3. **프론트엔드 로그 확인**
   - React Native 디버거 또는 콘솔에서 에러 메시지 확인
   - `Failed to fetch statistics` 에러 발생 시 API 통신 실패

#### **Phase 2: 수정 (30분)**

**Case A: `user_answer` 테이블에 데이터가 없는 경우**
- **원인**: `AnswerApiController`에서 답변 제출 시 `user_answer` 레코드가 생성되지 않음
- **수정**: `AnswerApiController.java`의 답변 저장 로직 검증
  - `user_id`, `problem_type`, `reference_id`, `is_correct` 필드가 제대로 설정되는지 확인

**Case B: JWT 토큰 문제인 경우**
- **원인**: `JwtTokenProvider.getUsername()`에서 예외 발생
- **수정**: `StatisticsController.java:25`에서 예외 처리 추가
  ```java
  // 기존
  String username = jwtTokenProvider.getUsername(token);
  
  // 수정안
  try {
      String username = jwtTokenProvider.getUsername(token);
  } catch (Exception e) {
      return ResponseEntity.status(401).body(null);
  }
  ```

**Case C: 카운트 쿼리가 0을 반환하는 경우**
- **원인**: `problem_type` 값이 대소문자 불일치 (`OBJECTIVE` vs `objective`)
- **수정**: `UserAnswerRepository.java`의 쿼리 파라미터 확인
  - 컬럼 값과 파라미터가 일치하는지 확인

#### **Phase 3: 검증 (10분)**

1. **통합 테스트**
   - 문제를 하나 이상 풀고 통계 화면으로 이동
   - `solvedProblems`, `correctCount`가 정상 증가하는지 확인

2. **에지 케이스 테스트**
   - 로그인하지 않은 상태에서 통계 접근 시도
   - 첫 문제를 풀고 바로 통계 확인

---

## 5. 긴급 백업 계획

### 5.1 임시 해결책 (1시간 이내)

**mock 데이터로 통계 표시 복구**
```typescript
// StatisticsScreen.tsx 일시적 수정
const MOCK_STATS = {
  totalProblems: 150,
  solvedProblems: 45,
  correctCount: 38,
  wrongCount: 7,
  branchStats: [...],
  categoryStats: [...]
};

// API 실패 시 mock 데이터 사용
if (!stats && !isLoading) {
  setStats(MOCK_STATS);
}
```

### 5.2 데이터 복구

- `user_answer` 테이블이 완전히 비어있다면, 최근 1주일간의 답변 로그에서 데이터 복구 스크립트 실행

---

## 6. 예상 영향

| 항목 | 영향 | 비고 |
|------|------|------|
| 사용자 경험 | ⭐⭐⭐⭐⭐ | 통계 확인 가능 시 학습 동기 ↑ |
| 시스템 안정성 | ⭐⭐ | read-only 쿼리이므로 위험 최소 |
| 개발 시간 | ~1시간 | 진단 20분 + 수정 30분 + 검증 10분 |

---

## 7. 다음 행동

- [ ] Phase 1: API 응답 및 DB 데이터 확인
- [ ] Phase 2: 필요시 코드 수정
- [ ] Phase 3: 검증 및 테스트

**준비 완료 시 `./gradlew bootRun`으로 서버 실행 후 통합 테스트 예정**