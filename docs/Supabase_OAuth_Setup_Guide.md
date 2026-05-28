# Supabase OAuth 마이그레이션 설정 가이드

## 현재 문제
- Oracle Cloud IP(158.180.78.125)가 HTTP로 설정되어 Google OAuth 차단
- Google OAuth 2.0 정책: HTTPS만 허용, IP 주소 차단

## 해결책
Supabase OAuth를 사용하여 Google OAuth 문제 해결

---

## 1. Google OAuth 콘솔 설정

### 1.1 접속
- URL: https://console.cloud.google.com/apis/credentials

### 1.2 OAuth 2.0 클라이언트 ID 수정

**클라이언트 ID:** `1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com`

**[삭제] 기존 HTTP origin:**
```
승인된 JavaScript origin:
- ~~http://168.110.119.132:9000~~
- ~~http://158.180.78.125:9000~~
- ~~http://localhost:9000~~

승인된 리디렉션 URI:
- ~~http://168.110.119.132:9001/api/auth/google~~
- ~~http://158.180.78.125:9001/api/auth/google~~
```

**[추가] Supabase 도메인:**
```
승인된 JavaScript origin:
- https://gmhznnwecujoafdisscl.supabase.co

승인된 리디렉션 URI:
- https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
```

---

## 2. Supabase 콘솔 설정

### 2.1 접속
- URL: https://app.supabase.com/project/gmhznnwecujoafdisscl

### 2.2 Authentication > Providers > Google 설정

**URL:** https://app.supabase.com/project/gmhznnwecujoafdisscl/auth/providers

**설정값:**
```yaml
Client ID: 1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com
Client Secret: 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
Redirect URL: https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
상태: Enabled
```

### 2.3 Authentication > URL Configuration 설정

**URL:** https://app.supabase.com/project/gmhznnwecujoafdisscl/auth/url-configuration

**Site URL:**
```
http://158.180.78.125:9000
```

**Redirect URLs:**
```
http://158.180.78.125:9000/auth-callback
http://localhost:9000/auth-callback
http://localhost:3000/auth-callback
exp://172.30.1.8:9100/--/auth-callback
```

---

## 3. 프론트엔드 수정 (React Native/Expo)

### 3.1 AuthContext.js 수정

**파일:** `react-frontend/src/contexts/AuthContext.js`

**변경사항:**
```javascript
const signInWithGoogle = useCallback(async () => {
  setLoading(true)
  setError(null)

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Supabase 콜백 후 Oracle Cloud로 리디렉션
        redirectTo: 'http://158.180.78.125:9000/auth-callback',
        scopes: 'email profile openid',
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error) throw error

    return data
  } catch (err) {
    console.error('[AUTH] Google login failed', err)
    setError(err.message || 'Google 로그인 실패')
    throw err
  } finally {
    setLoading(false)
  }
}, [])
```

### 3.2 AuthScreen.tsx 수정 (Expo)

**파일:** `InformationExamApp/src/screens/Auth/AuthScreen.tsx`

**변경사항:**
```typescript
import { supabase } from '../../lib/supabase'

const handleLogin = async () => {
  setIsLoading(true)
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://158.180.78.125:9000/auth-callback',
        scopes: 'email profile openid',
      },
    })

    if (error) throw error

    // 세션 처리
    if (data.url) {
      // 웹 브라우저로 OAuth URL 열기
      // Expo WebBrowser 사용
    }
  } catch (err: any) {
    console.error('Auth handleLogin error:', err)
    Alert.alert('로그인 실패', err?.message || '로그인 처리 중 오류가 발생했습니다.')
  } finally {
    setIsLoading(false)
  }
}
```

---

## 4. 백엔드 수정 (Spring Boot)

### 4.1 SecurityConfig.java 수정

**파일:** `backend/src/main/java/com/example/informationexam/config/SecurityConfig.java`

**변경사항:**
```java
List<String> allowedOriginPatterns = Arrays.asList(
    // 개발 환경
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:9000",
    "http://localhost:19000",
    "http://localhost:19006",
    "http://172.30.1.*:*",
    "http://192.168.*:*",
    "exp://*",
    
    // Oracle Cloud
    "http://158.180.78.125:*",
    
    // Supabase
    "https://gmhznnwecujoafdisscl.supabase.co"
);
```

### 4.2 GoogleAuthController.java 수정

**파일:** `backend/src/main/java/com/example/informationexam/controller/GoogleAuthController.java`

**변경사항:**
```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {

    private final UserService userService;
    private final SupabaseTokenVerifierService supabaseTokenVerifierService;

    /**
     * POST /api/auth/verify
     * Supabase JWT 검증 엔드포인트
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestHeader("Authorization") String authHeader) {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        long start = System.currentTimeMillis();

        log.info("[AUTH][{}][VERIFY][START] token verification request received", traceId);

        try {
            String token = supabaseTokenVerifierService.extractBearerToken(authHeader);
            String email = supabaseTokenVerifierService.getEmail(token);
            
            // 사용자 조회/생성
            var user = userService.getUserByEmail(email);
            
            long duration = System.currentTimeMillis() - start;
            log.info("[AUTH][{}][VERIFY][END] token valid, user loaded in {} ms", traceId, duration);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "valid", true,
                    "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "nickname", user.getNickname(),
                        "role", user.getRole()
                    )
                )
            ));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][VERIFY][FAIL] Token verification failed after {} ms", traceId, duration, e);
            return ResponseEntity.ok(Map.of("success", true, "data", Map.of("valid", false)));
        }
    }
}
```

---

## 5. 환경변수 설정

### 5.1 Oracle Cloud 환경변수

```bash
# Google OAuth (Supabase에서 관리하므로 백엔드에서는 불필요)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...

# Supabase
SUPABASE_URL=https://gmhznnwecujoafdisscl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend
FRONTEND_ORIGIN=http://158.180.78.125:9000
```

### 5.2 프론트엔드 환경변수

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://gmhznnwecujoafdisscl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_API_URL=http://158.180.78.125:9001/api
```

---

## 6. 최종 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     클라이언트 (Expo/Web)                     │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   Google 로그인   │  │  Supabase OAuth │                   │
│  │   버튼 클릭      │──▶│  signInWithOAuth│                   │
│  └─────────────────┘  └────────┬────────┘                   │
│                                │                             │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (OAuth Server)                    │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Google OAuth   │  │  Session/JWT    │                   │
│  │  인증 처리      │──▶│  발급           │                   │
│  └─────────────────┘  └────────┬────────┘                   │
│                                │                             │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Oracle Cloud (Spring Boot)                  │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Supabase JWT   │  │  API 서비스    │                   │
│  │  검증           │──▶│  제공           │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 검증 체크리스트

- [ ] Google Cloud Console > OAuth 2.0 클라이언트 ID 설정 완료
- [ ] Supabase Console > Providers > Google 설정 완료
- [ ] Supabase Console > URL Configuration 설정 완료
- [ ] 프론트엔드 redirectTo 변경 완료
- [ ] 백엔드 CORS 설정 변경 완료
- [ ] 백엔드 SupabaseTokenVerifierService 사용 확인
- [ ] 환경변수 설정 완료
- [ ] 로그인 테스트 완료

---

## 8. 디버깅 가이드

### 8.1 Google OAuth 오류
```
오류: "invalid_request"
원인: HTTP origin 사용
해결: Google 콘솔에서 HTTPS origin만 등록
```

### 8.2 CORS 오류
```
오류: "CORS policy blocked"
원인: CORS 설정 누락
해결: SecurityConfig.java에서 Supabase 도메인 추가
```

### 8.3 JWT 검증 오류
```
오류: "Invalid token"
원인: Supabase JWT Secret 불일치
해결: application.properties에서 SUPABASE_JWT_SECRET 확인
```
