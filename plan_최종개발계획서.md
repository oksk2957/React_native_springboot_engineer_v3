# 최종 개발 계획서: 인증 통합 및 기능 정상화

**작성일**: 2026-06-07  
**작성자**: AI Assistant  
**목표**: 토큰 검증 방식 단일화 + 통계/랭킹/오답 기능 정상화

---

## 1. 문제 분석 (Problem Analysis)

### 1.1 핵심 문제

| 문제 | 증상 | 근본 원인 |
|------|------|-----------|
| 로그인 400 에러 | Google Login API Error | `App.tsx`와 `AuthScreen`의 중복 인증 경로 충돌 |
| 통계 탭 빈 화면 | 랭킹/통계 미표시 | JWT 토큰 없음 → userId = null → 빈 결과 |
| 오답 노트 미표시 | 오답 목록 없음 | 위와 동일 |

### 1.2 서버 로그 분석

**추적 ID 기반 분석**:
- `e14f3d32`: 200 OK (7265ms) - `AuthScreen.handleLogin()` 경로
- `f4d20c6a`: 400 Bad Request - `App.tsx._initialize()` 경로

**동일 시간 중복 요청 발생**:
```
2026-06-07 23:08:25 - [AUTH][e14f3d32] Supabase JWT 검증 시작
2026-06-07 23:08:25 - [AUTH][f4d20c6a] Supabase JWT 검증 시작
```

### 1.3 인증 플로우 충돌 구조

```
앱 시작
  ├─ App.tsx _initialize()
  │   └─ onAuthStateChange → loginWithGoogle() ❌ (구 방식, 400 에러)
  │
  └─ AuthScreen (사용자 클릭)
      └─ handleLogin() → loginWithSupabase() ✅ (신 방식, 200 OK)
```

**문제**: `App.tsx`의 `_initialize()`가 Supabase 세션 변경을 감지하여 **중복 로그인 시도**

---

## 2. 수정 계획 (Modification Plan)

### 2.1 수정 우선순위

| 순위 | 작업 | 예상 영향 | 난이도 |
|------|------|-----------|--------|
| **P0** | 인증 플로우 단일화 | 전체 기능 정상화 | 중 |
| **P1** | Supabase JWT Secret 설정 수정 | 토큰 검증 안정화 | 하 |
| **P2** | 통계/랭킹/오답 동작 확인 | 기능 검증 | 하 |

### 2.2 상세 수정 내용

#### **STEP 1: 인증 플로우 단일화 (P0)**

**수정 파일**: `InformationExamApp/App.tsx`

**현재 문제 코드** (260-280행):
```typescript
// App.tsx _initialize() 내
const { data: session } = await supabase.auth.getSession();
if (session?.session?.access_token) {
  // 중복 로그인 시도!
  const response = await authService.loginWithGoogle(session.session.access_token);
  // ...
}
```

**수정 방향**:
1. `_initialize()`에서 **자동 로그인 제거**
2. `onAuthStateChange` 리스너는 **세션 상태만 관리** (로그인 시도 X)
3. 인증은 **AuthScreen.handleLogin()** 통해서만 수행

**수정 후 코드**:
```typescript
const _initialize = async () => {
  try {
    setLoading(true);
    
    // 1. 로컬 JWT 토큰 복원 시도
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      const isValid = await validateToken(token);
      if (isValid) {
        setLoggedIn(true);
        return;
      }
    }
    
    // 2. Supabase 세션은 상태만 확인 (로그인 시도 X)
    const { data: session } = await supabase.auth.getSession();
    if (session?.session) {
      console.log('[App] Supabase 세션 존재, AuthScreen에서 로그인 필요');
      // 로그인 시도 제거!
    }
    
    // 3. 인증 상태 변경 리스너는 세션 정보만 업데이트
    supabase.auth.onAuthStateChange((event, sess) => {
      console.log('[App] Auth state changed:', event);
      // 로그인 호출 제거 - 상태만 저장
    });
    
  } catch (error) {
    console.error('[App] Initialization error:', error);
  } finally {
    setLoading(false);
  }
};
```

**참고 파일**:
- `authStore.ts:146-200` - `loginWithSupabase()` 함수
- `AuthScreen.tsx:28-55` - `handleLogin()` 함수

---

#### **STEP 2: Supabase JWT Secret 설정 수정 (P1)**

**수정 파일**: `backend/src/main/resources/application.properties`

**현재 문제 코드** (57행):
```properties
supabase.jwt-secret=${SUPABASE_JWT_SECRET:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...}
```

**문제**: 기본값이 **anon key**로 설정됨 → JWT 서명 검증 실패

**수정 방향**:
1. 기본값 제거 (환경변수 필수)
2. Supabase Dashboard에서 JWT Secret 복사 안내

**수정 후 코드**:
```properties
# Supabase JWT Secret (필수 - Dashboard에서 복사)
# Dashboard URL: https://supabase.com/dashboard/project/gmhznnwecujoafdisscl/settings/api
supabase.jwt-secret=${SUPABASE_JWT_SECRET}
```

**환경변수 설정 가이드**:
```bash
# Windows (PowerShell)
$env:SUPABASE_JWT_SECRET="your-jwt-secret-from-dashboard"

# Linux/Mac
export SUPABASE_JWT_SECRET="your-jwt-secret-from-dashboard"
```

---

#### **STEP 3: 통계/랭킹/오답 동작 확인 (P2)**

**확인 항목**:

| 기능 | API 엔드포인트 | 확인 방법 |
|------|----------------|-----------|
| 통계 | `GET /api/statistics` | 브라우저 콘솔에서 응답 확인 |
| 랭킹 | `GET /api/statistics/subject-ranking` | 통계 탭에서 랭킹 표시 확인 |
| 오답 | `GET /api/wrong-answers` | 오답 탭에서 목록 표시 확인 |

**테스트 시나리오**:
1. 로그인 후 통계 탭 이동 → 데이터 표시 확인
2. 문제 풀이 후 오답 탭 이동 → 오답 목록 표시 확인
3. 랭킹 탭 (통계 탭 내부) → 과목별 순위 표시 확인

**디버깅 로그**:
```typescript
// StatisticsScreen.tsx
useEffect(() => {
  console.log('[Stats] JWT Token:', AsyncStorage.getItem('jwt_token'));
  loadStatistics();
}, []);

const loadStatistics = async () => {
  const response = await statisticsService.getStatistics();
  console.log('[Stats] API Response:', response);
  // userId가 null이면 빈 결과 반환됨
};
```

---

## 3. 수정 순서 (Execution Order)

```
[STEP 1] App.tsx 인증 플로우 단일화
   ↓
[STEP 2] application.properties JWT Secret 수정
   ↓
[STEP 3] 환경변수 설정 (SUPABASE_JWT_SECRET)
   ↓
[STEP 4] 백엔드 재시작
   ↓
[STEP 5] 프론트엔드 재시작
   ↓
[STEP 6] 로그인 테스트
   ↓
[STEP 7] 통계/랭킹/오답 기능 확인
```

---

## 4. 예상 결과 (Expected Outcome)

### 4.1 수정 전 vs 수정 후

| 기능 | 수정 전 | 수정 후 |
|------|---------|---------|
| 로그인 | ❌ 400 에러 (간헐적) | ✅ 200 OK (항상) |
| 통계 탭 | ❌ 빈 화면 | ✅ 통계 데이터 표시 |
| 랭킹 | ❌ 미표시 | ✅ 과목별 순위 표시 |
| 오답 노트 | ❌ 미표시 | ✅ 오답 목록 표시 |

### 4.2 서버 로그 (수정 후 예상)

```
[AUTH][abc12345][POST][SUCCESS] Supabase OAuth login completed in 120ms
[AUTH][abc12345] User logged in: okskycar1@gmail.com
[STATS] User statistics loaded: userId=1
[WRONG] Wrong answers loaded: 15 items
```

**중복 요청 제거**: 1개의 요청만 발생 (기존 2개 → 1개)

---

## 5. 리스크 및 대응 (Risks & Mitigation)

| 리스크 | 발생 가능성 | 영향 | 대응 방안 |
|--------|-------------|------|-----------|
| 환경변수 누락 | 중간 | JWT 검증 실패 | `.env` 파일 템플릿 제공 |
| 기존 사용자 세션 무효화 | 낮음 | 재로그인 필요 | 점진적 마이그레이션 고려 |
| Supabase 세션 만료 | 중간 | 자동 로그아웃 | 토큰 갱신 로직 유지 |

---

## 6. 검증 계획 (Verification Plan)

### 6.1 단위 테스트

- [ ] `App.tsx`에서 `loginWithGoogle()` 호출 제거 확인
- [ ] `AuthScreen.handleLogin()`에서만 로그인 수행 확인
- [ ] `application.properties`에서 JWT Secret 기본값 제거 확인

### 6.2 통합 테스트

- [ ] 로그인 후 JWT 토큰 저장 확인
- [ ] 통계 탭에서 데이터 표시 확인
- [ ] 오답 탭에서 목록 표시 확인
- [ ] 서버 로그에서 중복 요청 제거 확인

### 6.3 수동 테스트 시나리오

1. **앱 재시작 후 로그인**
   - Google OAuth 버튼 클릭
   - 서버 로그에서 1개의 요청만 발생 확인
   - JWT 토큰이 AsyncStorage에 저장되었는지 확인

2. **통계 탭 이동**
   - 과목별 랭킹 표시 확인
   - 시도 횟수, 정답률 표시 확인

3. **문제 풀이 후 오답 탭**
   - 오답 목록 표시 확인
   - 문제 유형별 필터링 작동 확인

---

## 7. 관련 파일 목록 (Related Files)

### 7.1 수정 대상 파일

| 파일 | 수정 내용 |
|------|-----------|
| `InformationExamApp/App.tsx` | `_initialize()`에서 자동 로그인 제거 |
| `backend/src/main/resources/application.properties` | JWT Secret 기본값 제거 |

### 7.2 참고 파일

| 파일 | 역할 |
|------|------|
| `InformationExamApp/src/stores/authStore.ts` | Zustand 인증 상태 관리 |
| `InformationExamApp/src/screens/Auth/AuthScreen.tsx` | 로그인 UI 및 `handleLogin()` |
| `InformationExamApp/src/services/api.ts` | API 호출 서비스 |
| `backend/src/main/java/.../GoogleAuthController.java` | 백엔드 인증 엔드포인트 |
| `backend/src/main/java/.../SupabaseTokenVerifierService.java` | JWT 검증 서비스 |

---

## 8. 메모리 기록 (Memory Update)

**team/MEMORY.md 업데이트**:
- [인증 플로우 충돌 해결](project-auth-flow-fix.md) — App.tsx 중복 로그인 제거

**새 파일 생성**:
- `memory/team/project-auth-flow-fix.md` — 인증 플로우 단일화 기록

---

**작성 완료**: 2026-06-07  
**다음 단계**: 사용자 승인 후 STEP 1 실행
