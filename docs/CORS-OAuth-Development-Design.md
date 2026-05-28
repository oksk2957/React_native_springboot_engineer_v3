# CORS 및 Google OAuth 개발 설계 문서

> **작성일**: 2026-05-26
> **프로젝트**: InformationExamApp (React Native/Expo + Spring Boot)
> **목적**: CORS 정책 및 Google OAuth 인증 아키텍처 설계

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 환경                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   웹 브라우저   │  │  Android/iOS  │  │    Expo 개발 서버    │ │
│  │  localhost:9000│  │  localhost:8081│  │   exp://172.30.1.8   │ │
│  └───────┬───────┘  └───────┬───────┘  └──────────┬──────────┘ │
│          │                  │                      │             │
│          └──────────────────┼──────────────────────┘             │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │   Google OAuth   │                          │
│                    │  (ID Token 획득)  │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      백엔드 서버 (Spring Boot)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Port: 9001                                             │   │
│  │  Context: /api                                          │   │
│  │  CORS: SecurityConfig (allowedOriginPatterns)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              GoogleAuthController (/api/auth)            │   │
│  │  POST /google  ──→  Google ID Token 검증                 │   │
│  │  GET  /verify  ──→  JWT 토큰 검증                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      외부 서비스                                │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │  Google OAuth    │  │           Supabase                  │  │
│  │  (Token Verify)  │  │  https://gmhznnwecujoafdisscl.      │  │
│  │                  │  │  supabase.co                        │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CORS 설정 설계

### 2.1 문제 상황

- **증상**: 프론트엔드에서 `http://localhost:9001/api/auth/google`로 POST 요청 시 "No response received" 오류
- **원인**: 백엔드 서버 미실행 + CORS 설정 충돌 (SecurityConfig ↔ WebConfig)

### 2.2 해결 방안

#### SecurityConfig.java (주 CORS 설정)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // allowedOriginPatterns 사용 (withCredentials=true와 와일드카드 동시 지원)
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",      // 모든 localhost 포트
            "http://127.0.0.1:*",      // 모든 127.0.0.1 포트
            "http://localhost:8081",   // React Native/Android 에뮬레이터
            "http://localhost:3000",   // React Dev Server
            "http://localhost:19000",  // Expo
            "http://localhost:19006",  // Expo
            "http://172.30.1.*:*",     // 개발 LAN
            "http://192.168.*:*",      // 일반 사설망
            "exp://*"                // Expo 개발 서버
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);  // withCredentials=true와 일치
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

#### WebConfig.java (CORS 설정 비활성화)

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Spring Security 6.x에서 CORS는 SecurityFilterChain에서 처리
    // WebMvcConfigurer의 addCorsMappings는 사용하지 않음
}
```

### 2.3 CORS Origin 매핑표

| 클라이언트 환경 | Origin | 백엔드 허용 패턴 | 상태 |
|---|---|---|---|
| 웹 브라우저 | `http://localhost:9000` | `http://localhost:*` | ✅ 허용 |
| React Dev Server | `http://localhost:3000` | `http://localhost:*` | ✅ 허용 |
| Android 에뮬레이터 | `http://localhost:8081` | `http://localhost:*` | ✅ 허용 |
| Expo 개발 서버 | `exp://172.30.1.8:9100` | `exp://*` | ✅ 허용 |
| LAN 접속 | `http://172.30.1.x:xxxx` | `http://172.30.1.*:*` | ✅ 허용 |
| 사설망 | `http://192.168.x.x:xxxx` | `http://192.168.*:*` | ✅ 허용 |

---

## 3. Google OAuth 설정 설계

### 3.1 클라이언트 설정

#### 웹 클라이언트 (Web Client)
```
클라이언트 ID: 1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com
클라이언트 보안 비밀번호: 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
```

#### Android 클라이언트
```
클라이언트 ID: 1033672402385-anp8g135sgsbj3nd011j8pef0kas70c0.apps.googleusercontent.com
패키지명: com.oksky.myapp
SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

### 3.2 승인된 JavaScript 원본

```
http://localhost:8088
https://gmhznnwecujoafdisscl.supabase.co
http://localhost:8081
http://localhost:9001
http://localhost:9000
```

### 3.3 승인된 리디렉션 URI

```
https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
http://localhost:8081/auth-callback
http://localhost:9001/auth-callback
http://localhost:9001/oauth2-google
http://localhost:9001/login/oauth2/code/google
http://localhost:9001/oauth2-google.html
http://localhost:9000/auth-callback
http://localhost:9000
http://localhost:9000/
```

### 3.4 인증 흐름

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   클라이언트 │────▶│  Google OAuth   │────▶│   백엔드 서버   │
│  (React)   │     │  (ID Token)     │     │  (Spring Boot)  │
└─────────────┘     └─────────────────┘     └─────────────────┘
       │                                           │
       │  1. Google 로그인 버튼 클릭                │
       │  2. Google OAuth 팝업/리디렉션             │
       │  3. ID Token 수신 (JWT)                    │
       │──────────────────────────────────────────▶│
       │                                           │
       │  4. POST /api/auth/google                  │
       │     { idToken: "eyJhbGciOiJSUzI1Ni..." } │
       │──────────────────────────────────────────▶│
       │                                           │
       │  5. Google ID Token 검증                  │
       │  6. 사용자 조회/생성                      │
       │  7. 백엔드 JWT 발급                        │
       │◀──────────────────────────────────────────│
       │                                           │
       │  8. { success: true, data: { token, user } }│
       │                                           │
       │  9. JWT 저장 (AsyncStorage)               │
       │  10. API 요청 시 Authorization 헤더 포함   │
```

---

## 4. Supabase 설정 설계

### 4.1 Supabase 프로젝트 정보

```
URL: https://gmhznnwecujoafdisscl.supabase.co
JWT Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: sbp_306e26c1454aa0609cd9dd235c5bd8fa5ef37f36
```

### 4.2 Site URL 및 Redirect URLs

```
Site URL: http://localhost:9000

Redirect URLs:
  - http://localhost:9000/auth-callback
  - http://localhost:9100/auth-callback
  - exp://172.30.1.8:9100/--/auth-callback
  - com.oksky.myapp://auth-callback
  - https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
  - http://172.30.1.8:9000/auth-callback.html
  - http://172.30.1.8:9100/auth-callback.html
  - http://localhost:9000/auth-callback.html
```

---

## 5. 프론트엔드 API 설정

### 5.1 API Base URL 설정

```typescript
// src/services/api.ts
const getApiBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:9001/api';
    }
    const PC_IP = '172.30.1.6';  // 개발 PC IP
    return `http://${PC_IP}:9001/api`;
  }
  return 'https://your-production-api.com/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // CORS 자격 증명 설정
});
```

### 5.2 Google 로그인 요청

```typescript
// Google 로그인 API 호출
const loginWithGoogle = async (idToken: string) => {
  const response = await api.post('/auth/google', { idToken });
  return response.data;
};
```

---

## 6. 환경별 설정

### 6.1 개발 환경 (Development)

```properties
# application.properties
server.port=9001
frontend.origin=http://localhost:9000

# CORS 설정
cors.dev.allow-lan-patterns=true
```

### 6.2 운영 환경 (Production)

```properties
# application.properties
server.port=9001
frontend.origin=https://your-production-domain.com

# CORS 설정 (명시적 origin 목록)
ALLOWED_ORIGINS=https://your-production-domain.com,https://www.your-domain.com
```

---

## 7. 보안 고려사항

### 7.1 CORS 보안

- **개발 환경**: 와일드카드 패턴 사용 (`http://localhost:*`, `exp://*`)
- **운영 환경**: 명시적 origin 목록 사용, 와일드카드 패턴 제거
- **withCredentials=true**: `Access-Control-Allow-Origin: *` 사용 불가, 반드시 명시적 origin 필요

### 7.2 Google OAuth 보안

- **클라이언트 보안 비밀번호**: 코드 저장소에 보관 금지, 환경변수로 관리
- **ID Token 검증**: 백엔드에서 Google 공개키로 서명 검증 필수
- **nonce 검증**: CSRF 공격 방지를 위한 nonce 값 검증

### 7.3 JWT 보안

- **토큰 저장**: AsyncStorage (모바일), httpOnly cookie (웹)
- **토큰 만료**: Access Token (30분), Refresh Token (12시간)
- **토큰 갱신**: 만료 시 Refresh Token으로 자동 갱신

---

## 8. 디버깅 가이드

### 8.1 CORS 오류 디버깅

```bash
# 1. 백엔드 서버 실행 확인
curl -I http://localhost:9001/api/auth/google

# 2. OPTIONS 프리플라이트 요청 테스트
curl -X OPTIONS -H "Origin: http://localhost:9000" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:9001/api/auth/google

# 3. CORS 헤더 확인
curl -X POST -H "Origin: http://localhost:9000" \
  -H "Content-Type: application/json" \
  http://localhost:9001/api/auth/google
```

### 8.2 로그 확인

```bash
# 백엔드 로그 (CORS 설정)
[CORS] Allowed Origin Patterns: [http://localhost:*, http://127.0.0.1:*, ...]
[CORS] Allow Credentials: true
[CORS] Allowed Methods: [GET, POST, PUT, DELETE, OPTIONS, PATCH]

# 백엔드 로그 (요청)
[Backend Request] POST /api/auth/google | Origin: http://localhost:9000 | Host: localhost:9001
```

---

## 9. 수정 이력

| 날짜 | 수정 내용 | 파일 |
|---|---|---|
| 2026-05-26 | CORS 설정 개선 (allowedOriginPatterns 사용) | SecurityConfig.java |
| 2026-05-26 | WebConfig CORS 설정 비활성화 | WebConfig.java |
| 2026-05-26 | Expo/LAN origin 패턴 추가 | SecurityConfig.java |
| 2026-05-26 | 디버깅 로그 추가 | SecurityConfig.java |

---

## 10. 참고 자료

- [Spring Security CORS Documentation](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)
- [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [MDN CORS](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)
