# Plan: 오답 노트 401 에러 해결 + 자동 로그아웃 처리

**작성일**: 2026-06-07
**계획 이름**: wrong-answer-401-auto-logout
**상태**: 대기 중 (사용자 승인 필요)

---

## 🎯 목표

`GET /api/wrong-answers/{type}` 엔드포인트가 토큰 없이 호출될 때 발생하는 401 에러를 해결하고, 
토큰 만료 시 자동으로 로그아웃하여 AuthScreen으로 리다이렉트하는 견고한 인증 흐름을 구축한다.

---

## 🔍 사전 분석 (맥락 파악 완료)

### 현재 상태 진단

| 영역 | 파일 | 현재 동작 | 목표 동작 | 변경 필요 |
|------|------|-----------|-----------|-----------|
| **Backend API** | `UserAnswerApiController.java` | 토큰 없으면 401 반환 (강제 인증) | Statistics API처럼 Optional Auth + userId 쿼리 파라미터 | ✅ YES |
| **Backend Security** | `SecurityConfig.java` | `.anyRequest().permitAll()` - 인증 강제 없음 | 변경 불필요 | ❌ NO |
| **Backend JWT Filter** | `JwtAuthenticationFilter.java` | JWT 있으면 Context 세팅, 없으면 패스 | 변경 불필요 | ❌ NO |
| **Frontend Screen** | `WrongAnswerScreen.tsx` | `isAuthenticated` 체크 후 호출, 401 처리 없음 | 401 발생 시 자동 logout + AuthScreen 리다이렉트 | ✅ YES |
| **Frontend API Client** | `services/api.ts` | 요청에 토큰 첨부, 응답 401 처리 없음 | **글로벌 401 인터셉터** 추가 (최소 변경) | ✅ YES |
| **Frontend Auth Store** | `stores/authStore.ts` | `logout()` 메서드 존재 | 변경 불필요 | ❌ NO |
| **Frontend Navigation** | `AppNavigator` (App.tsx) | `isAuthenticated` 상태에 따라 자동 전환 | 변경 불필요 | ❌ NO |

### 참조 구현 (이미 프로젝트 내에 존재)

**StatisticsController.java** (40-58행) - Optional Auth 패턴:
```java
@GetMapping("/subjective-count")
public ResponseEntity<Map<String, Long>> getSubjectiveCount(
    @RequestHeader(value = "Authorization", required = false) String authHeader) {
    Long userId = null;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String username = jwtTokenProvider.getUsername(token);
            User user = userService.getUserByUsername(username);
            userId = user.getId();
        } catch (Exception e) {
            // 토큰이 유효하지 않아도 계속 진행
        }
    }
    // userId가 null이면 익명 사용자 처리
    ...
}
```

---

## 📋 Task 목록 (총 8개)

### Phase 1: 백엔드 Optional Auth 구현 (3개)

- [ ] **T1**: `UserAnswerApiController.getWrongAnswers()` 수정
  - 토큰 있으면: userId 추출 후 해당 사용자의 오답만 반환
  - 토큰 없으면: `userId` 쿼리 파라미터 사용 (Statistics API와 동일 패턴)
  - 토큰이 있는데 다른 userId 요청 시: 403 Forbidden 반환 (보안 검증)
  - **파일**: `backend/src/main/java/com/example/informationexam/controller/UserAnswerApiController.java`
  - **검증**: `curl`로 토큰 없이 호출 시 200 OK 확인

- [ ] **T2**: `UserAnswerApiController.getWrongAnswersByType()` 수정
  - T1과 동일한 Optional Auth 패턴 적용
  - 토큰이 있으면: userId 소유자 검증 (path variable `{problemType}` 사용)
  - 토큰이 없으면: `userId` 쿼리 파라미터 사용
  - **파일**: `UserAnswerApiController.java` (T1과 동일)
  - **검증**: `curl /wrong-answers/OBJECTIVE?userId={uuid}` 토큰 없이 200 OK 확인

- [ ] **T3**: `getWrongAnswersByDate()` 엔드포인트 추가 (필요 시)
  - 현재 `WrongAnswerScreen.tsx`가 호출하지만 backend에 없는 경우 추가
  - `MypageStatisticsMapper.selectWrongAnswers()` 활용
  - 날짜 필터링 WHERE 절 추가
  - **파일**: `UserAnswerApiController.java` (T1과 동일), `MypageStatisticsMapper.xml` (필요 시)
  - **검증**: `curl /wrong-answers/by-date?date=2026-06-07&userId={uuid}` 200 OK 확인

**의존성**: T1, T2, T3는 **동일 파일** (`UserAnswerApiController.java`)을 수정하므로 **순차** 진행

### Phase 2: 프론트엔드 401 자동 로그아웃 (3개)

- [ ] **T4**: `services/api.ts` axios 응답 인터셉터에 401 감지 로직 추가
  - 응답 인터셉터 error 핸들러에서 `error.response?.status === 401` 감지
  - `authStore.logout()` 호출
  - **주의**: 재귀 호출 방지 (logout API 자체가 401 받으면 또 호출하는 것 방지)
  - **파일**: `InformationExamApp/src/services/api.ts`
  - **검증**: `lsp_diagnostics` clean

- [ ] **T5**: `authStore.logout()` 플로우 검증 (변경 없음)
  - 이미 `authToken`, `tokenExpiryTime` AsyncStorage에서 제거
  - `set({ user: null, isAuthenticated: false })` 상태 초기화
  - **파일**: `stores/authStore.ts` (검증만, 변경 없음)
  - **검증**: 코드 리뷰만

- [ ] **T6**: `WrongAnswerScreen.tsx`에서 401 발생 시 사용자 메시지 표시
  - catch 블록에서 401 상태 확인
  - "세션이 만료되었습니다. 다시 로그인해주세요." 토스트/알림 표시
  - 빈 결과로 화면 상태 초기화
  - **파일**: `InformationExamApp/src/screens/WrongAnswerScreen.tsx`
  - **검증**: `lsp_diagnostics` clean

**의존성**: T4, T5, T6는 **병렬** 진행 가능 (T4가 핵심, T5는 검증만, T6은 독립)

### Phase 3: 통합 테스트 및 검증 (2개)

- [ ] **T7**: 백엔드 통합 테스트
  - `GET /api/wrong-answers/OBJECTIVE?userId={uuid}` - 토큰 없이 200 OK
  - 유효한 토큰 + 본인 userId → 200 OK
  - 유효한 토큰 + 다른 사용자 userId → 403 Forbidden
  - 만료된 토큰 → 401 응답 (프론트에서 자동 로그아웃 처리)
  - **검증**: `curl` 명령어로 실제 호출

- [ ] **T8**: 프론트엔드 회귀 테스트
  - `/playwright` 또는 수동 테스트로 다음 확인:
  - 로그인 → 오답 노트 진입 → 필터 전환 → 401 에러 없음
  - 토큰 만료 후 오답 노트 진입 → 자동 로그아웃 + AuthScreen 이동
  - 네트워크 탭에서 401 에러가 발생하지 않는 것 확인
  - **검증**: 실제 브라우저에서 동작 확인

**의존성**: T7, T8은 Phase 1, 2 **모두 완료 후** 가능 (순차)

---

## 🔄 의존성 맵 (Dependency Graph)

```
Phase 1: [T1] → [T2] → [T3]  (순차, 동일 파일)
              ↓
Phase 2: [T4] (병렬)  [T5 검증] (병렬)  [T6] (병렬)
              ↓
Phase 3: [T7] → [T8]  (순차, 통합 검증)
```

### 병렬 가능 / 순차 구분

| Task | 병렬 가능? | 순차 이유 |
|------|-----------|-----------|
| T1 | ❌ | 첫 시작점 |
| T2 | ❌ | T1 완료 후 (동일 파일) |
| T3 | ❌ | T2 완료 후 (동일 파일) |
| T4 | ✅ | **T3 완료 후 즉시** (의존성 없음) |
| T5 | ✅ | T4와 병렬 (검증만) |
| T6 | ✅ | T4와 병렬 (독립 파일) |
| T7 | ❌ | T1-T6 모두 완료 후 |
| T8 | ❌ | T7 완료 후 |

---

## ⚖️ 실행 전략 선택지

### 🅰️ 옵션 A: Statistics API 패턴 완전 동기화 (추천)
- **방식**: Statistics API와 동일한 Optional Auth 적용
- **코드**: 
  - 토큰 있으면: userId 추출 후 **소유자 검증** (다른 사용자 요청 시 403)
  - 토큰 없으면: `userId` 쿼리 파라미터 사용 (익명 허용)
- **장점**: 일관성, 보안 견고
- **단점**: 프론트엔드에서 항상 userId를 쿼리로 보내야 함
- **위험**: userId 쿼리 파라미터 기반 인증은 보안이 약함 (plan에 이미 명시됨)

### 🅱️ 옵션 B: 완전히 공개 API로 전환 (최소 노력)
- **방식**: Backend만 수정, Frontend 변경 없음
- **코드**:
  - 토큰 있으면: userId 추출
  - 토큰 없으면: **빈 배열** 반환 (익명 사용자는 오답 없음)
- **장점**: 프론트엔드 재컴파일 불필요 (Hot-Reload만으로 OK)
- **단점**: 익명 사용자는 오답을 전혀 볼 수 없음 (UX 저하 가능성)

### 🅲️ 옵션 C: 프론트엔드에서만 방어 (백엔드 변경 없음)
- **방식**: Backend는 그대로 두고, Frontend가 401을 우아하게 처리
- **코드**:
  - axios 응답 인터셉터에서 401 감지 → 자동 logout
  - 백엔드는 여전히 401 반환
- **장점**: 백엔드 변경 리스크 0
- **단점**: 로그아웃 후에도 다시 로그인하면 또 401 발생 가능성 (근본 해결 아님)

---

## 🏆 AI 추천: 옵션 A + 추가 보안 레이어

**이유**:
1. **일관성**: 이미 Statistics API가 동일한 패턴을 사용하고 있어 유지보수 용이
2. **보안**: userId 쿼리 파라미터 방식의 약점은 **추가 검증으로 보완**
   - 토큰이 있을 때: 소유자 검증 (다른 사용자 요청 시 403)
   - 토큰이 없을 때: **userId가 반드시 제공되어야 함** (400 Bad Request)
   - 유효하지 않은 userId 형식 시 400 반환
3. **견고성**: 
   - 만료된 토큰 → 프론트엔드가 자동 로그아웃 처리
   - 401 응답 → "세션이 만료되었습니다" 사용자 알림

### 옵션 A 상세 실행 전략

**Backend (`UserAnswerApiController.java`)**:
```java
@GetMapping("/{problemType}")
public ResponseEntity<List<Map<String, Object>>> getWrongAnswersByType(
    @PathVariable String problemType,
    @RequestHeader(value = "Authorization", required = false) String authHeader,
    @RequestParam(value = "userId", required = false) Long userId) {
    
    Long resolvedUserId = null;
    
    // 1. 토큰이 있으면 유효성 검증
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String username = jwtTokenProvider.getUsername(token);
            User user = userService.getUserByUsername(username);
            Long tokenUserId = user.getId();
            
            // 2. 토큰이 있는데 다른 userId 요청 시 403 Forbidden (보안 강화)
            if (userId != null && !userId.equals(tokenUserId)) {
                return ResponseEntity.status(403).build();
            }
            resolvedUserId = tokenUserId;
        } catch (Exception e) {
            // 유효하지 않은 토큰은 무효화하고 userId 쿼리 파라미터로 fallback
        }
    }
    
    // 3. 토큰이 없거나 유효하지 않으면 userId 쿼리 파라미터 사용 (익명 허용)
    if (resolvedUserId == null) {
        resolvedUserId = userId;
        
        // 4. userId도 없으면 400 Bad Request (명시적 실패)
        if (resolvedUserId == null) {
            return ResponseEntity.badRequest().body(List.of(
                Map.of("error", "userId query parameter is required when no valid token is provided")
            ));
        }
    }
    
    // ... 나머지 로직
}
```

**Frontend (`services/api.ts`)**:
```typescript
// 응답 인터셉터에 401 감지 로직 추가 (T4)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized - 자동 로그아웃 시도');
      
      // 재귀 호출 방지: /auth/logout, /auth/refresh는 제외
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (!isAuthEndpoint) {
        try {
          const { useAuthStore } = await import('../stores/authStore');
          const authStore = useAuthStore.getState();
          await authStore.logout();
        } catch (logoutError) {
          console.error('[API] 로그아웃 실패:', logoutError);
        }
      }
    }
    return Promise.reject(error);
  }
);
```

**Frontend (`WrongAnswerScreen.tsx`)**:
```typescript
// T6: 401 발생 시 사용자 메시지 표시
const fetchWrongAnswers = useCallback(async () => {
  if (!isAuthenticated || !user?.id) {
    setWrongProblems([]);
    setHeatmap([]);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  try {
    const stats = await statisticsService.getStatistics(user.id);
    setHeatmap(stats.studyHeatmap ?? []);

    const targetDate = bookmarkDate ?? selectedDate;
    let data: WrongAnswer[];
    if (targetDate) {
      data = await statisticsService.getWrongAnswersByDate(targetDate);
    } else if (selectedType === 'all') {
      data = await statisticsService.getWrongAnswers();
    } else {
      data = await statisticsService.getWrongAnswersByType(selectedType);
    }

    if (targetDate && selectedType !== 'all') {
      data = data.filter((w) => w.problemType === selectedType);
    }
    setWrongProblems(data);
  } catch (error: any) {
    // T6: 401 감지 시 사용자 알림
    if (error.response?.status === 401) {
      Alert.alert(
        '세션 만료',
        '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
        [{ text: '확인' }]
      );
    }
    console.error('Failed to fetch wrong answers:', error);
    setWrongProblems([]);
    setHeatmap([]);
  } finally {
    setIsLoading(false);
  }
}, [bookmarkDate, selectedDate, selectedType, isAuthenticated, user?.id]);
```

---

## 🔧 실행 시나리오

### 시나리오 1: 정상 플로우 (토큰 유효)
1. 프론트엔드가 `GET /api/wrong-answers/OBJECTIVE?userId=123` 호출 (Authorization 헤더 포함)
2. 백엔드가 토큰에서 userId 추출 → 요청된 userId와 일치 확인
3. 일치하면 200 OK + 오답 목록 반환
4. 프론트엔드가 오답 노트 화면에 표시

### 시나리오 2: 토큰 만료 시 자동 로그아웃
1. 프론트엔드가 만료된 토큰으로 API 호출
2. 백엔드가 JWT 검증 실패 → `userId` 쿼리 파라미터로 fallback하여 200 OK 반환
3. 또는 백엔드가 여전히 401 반환 (선택 사항)
4. 프론트엔드가 401 감지 → axios 인터셉터에서 `authStore.logout()` 호출
5. AuthStore가 `isAuthenticated=false`, `user=null` 설정
6. AppNavigator가 자동으로 AuthScreen으로 리다이렉트
7. 사용자에게 "세션이 만료되었습니다" 알림 표시

### 시나리오 3: 익명 사용자 (토큰 없음)
1. 프론트엔드가 `GET /api/wrong-answers/OBJECTIVE?userId=123` 호출 (Authorization 헤더 없음)
2. 백엔드가 `userId` 쿼리 파라미터 사용 → 오답 목록 반환
3. 프론트엔드가 오답 노트 화면에 표시
4. **단점**: 익명 사용자가 오답을 볼 수 있음 (보안 약함)

---

## 🎯 성공 기준

- [ ] `GET /api/wrong-answers/{type}`이 토큰 없이 userId 쿼리로 200 응답 반환
- [ ] `GET /api/wrong-answers/{type}?userId=...`에 유효한 토큰이 있으면 userId 소유자 검증 후 반환
- [ ] 유효한 토큰 + 다른 userId 요청 시 403 Forbidden 반환
- [ ] 유효하지 않은 토큰 + userId 쿼리 없이 요청 시 400 Bad Request 반환
- [ ] 프론트엔드에서 401 응답 시 자동 로그아웃 및 로그인 화면 이동
- [ ] WrongAnswerScreen에서 객관식/주관식/프로그래밍 필터 전환 시 401 에러 발생하지 않음
- [ ] 기존 인증 흐름(로그인/로그아웃/토큰 갱신)에 영향 없음
- [ ] `lsp_diagnostics` ZERO errors
- [ ] `bun run build` 또는 `./gradlew build` 통과 (실행 가능한 모든 빌드)

---

## 📝 리스크 및 대응

| 리스크 | 발생 확률 | 영향도 | 대응 전략 |
|--------|-----------|--------|-----------|
| userId 쿼리 파라미터 기반 인증은 보안이 약함 | 높음 | 높음 | 토큰이 있으면 userId 소유자 검증 (403 반환), 없으면 userId만 신뢰 (Statistics API와 동일 정책) |
| 401 자동 로그아웃이 의도치 않은 상황에서 발생할 수 있음 | 낮음 | 중간 | 401 에러는 명시적 인증 실패이므로 자동 로그아웃이 정답. 네트워크 에러(5xx, timeout)와 구분하여 처리 |
| 재귀 호출 (logout API가 401 받으면 또 logout 호출) | 중간 | 높음 | `/auth/`, `/auth/refresh` 엔드포인트는 인터셉터에서 제외 |
| 기존 기능 회귀 (문제 풀이, 통계 조회 영향) | 낮음 | 높음 | 최종 검증 단계(T8)에서 회귀 테스트 강제 |
| `getWrongAnswersByDate()` 엔드포인트 미구현 | 중간 | 중간 | T3에서 추가 구현 (MypageStatisticsMapper 활용) |

---

## 🚀 실행 타임라인 (예상)

| 단계 | 소요 시간 (추정) | 병렬 가능? |
|------|-----------------|------------|
| **T1**: Backend `getWrongAnswers()` 수정 | 15분 | ❌ |
| **T2**: Backend `getWrongAnswersByType()` 수정 | 10분 | ❌ (T1 완료 후) |
| **T3**: Backend `getWrongAnswersByDate()` 추가 | 20분 | ❌ (T2 완료 후) |
| **T4**: Frontend 401 인터셉터 | 20분 | ✅ (T3 완료 후 즉시) |
| **T5**: authStore 검증 | 5분 | ✅ (T4와 병렬) |
| **T6**: WrongAnswerScreen 401 처리 | 15분 | ✅ (T4와 병렬) |
| **T7**: 백엔드 통합 테스트 | 15분 | ❌ (T1-T6 완료 후) |
| **T8**: 프론트엔드 회귀 테스트 | 20분 | ❌ (T7 완료 후) |
| **합계** | **~2시간** | |

---

## 🔗 관련 파일

### Backend (수정 필요)
- `backend/src/main/java/com/example/informationexam/controller/UserAnswerApiController.java` (T1, T2, T3)
- `backend/src/main/resources/mapper/MypageStatisticsMapper.xml` (T3, 선택적)

### Frontend (수정 필요)
- `InformationExamApp/src/services/api.ts` (T4)
- `InformationExamApp/src/screens/WrongAnswerScreen.tsx` (T6)

### 검증 대상 (수정 없음)
- `InformationExamApp/src/stores/authStore.ts` (T5, 코드 리뷰만)
- `InformationExamApp/App.tsx` (AppNavigator, 동작 확인만)

---

## 📌 다음 단계

**사용자 확인 후 진행할 작업**:

1. ✅ **옵션 A** 실행 승인
2. ✅ `/ulw-loop start` 실행 (Ultrawork Loop 시작)
3. ✅ Phase 1 → Phase 2 → Phase 3 순차 진행
4. ✅ 각 Task 완료 후 자동 검증
5. ✅ 최종 계획서 완료 시 사용자 보고

---

**Atlas 분석 완료** ✅
**다음 단계**: 사용자 승인 대기 중
