# Google OAuth JWT ES256 검증 실패 문제 해결 계획서

## 🚨 현재 문제 현상

**에러 메시지:**
```
io.jsonwebtoken.security.InvalidKeyException: 
ES256 verification keys must be PublicKeys (implement java.security.PublicKey). 
Provided key type: javax.crypto.spec.SecretKeySpec.
```

**오류 발생 위치:**
- 파일: `backend/src/main/java/com/example/informationexam/controller/GoogleAuthController.java`
- 라인: 42-46
- 메서드: `googleAuth()`

## 🔍 근본 원인 분석

### 1. 기술적 원인

Google ID Token은 **서명 알고리즘(ES256 - Elliptic Curve Digital Signature Algorithm)**을 사용하여 서명됩니다. 이는 비대칭 암호화 방식으로:

- **서명(Signing):** Google의 **개인키(Private Key)**로 생성
- **검증(Verification):** Google의 **공개키(Public Key)**로 검증

하지만 현재 프로젝트의 `JwtTokenProvider` 클래스는 HMAC 기반의 대칭 키 알고리즘을 사용하고 있습니다:

```java
// 현재 구현 (HMAC 대칭 키 방식)
private SecretKey getSigningKey() {
    byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(keyBytes);  // HMAC SecretKey 반환 (❌ ES256 불가)
}
```

### 2. 아키텍처 문제

- **HMAC (HS256/HS512):** 서버와 클라이언트가 동일한 비밀키(Secret Key)를 가짐 (대칭 키)
- **ECDSA (ES256):** 서버가 공개키로 검증, 클라이언트가 개인키로 서명 (비대칭 키)

Google OAuth 토큰은 Google 서버의 개인키로 서명되었으므로, 해당 서명을 검증하려면 Google이 제공하는 **공개키(Public Key)**를 사용해야 합니다.

## 📋 상세 문제점

### 문제 1: JwtTokenProvider의 키 타입 불일치
```java
public SecretKey getSigningKeyForGoogle() {
    return getSigningKey();  // SecretKey 반환 (ES256 검증 불가)
}
```

### 문제 2: GoogleAuthController의 잘못된 검증 방식
```java
Claims claims = Jwts.parser()
    .verifyWith(jwtTokenProvider.getSigningKeyForGoogle())  // HMAC 키를 ES256에 사용
    .build()
    .parseSignedClaims(idToken)
    .getPayload();
```

### 문제 3: Google Client ID 검증 로직 미흡
```java
String audience = claims.getAudience().toString();
if (!audience.contains(googleClientId)) {  // contains()는 부정확한 검증
    ...
}
```
→ Audience는 정확히 비교해야 함 (서브스트링 매칭 ❌, 정확한 매칭 ✅)

## 💡 해결 방안

### 방안 1: Google API 클라이언트 라이브러리 사용 (추천)

Google에서 제공하는 공식 라이브러리를 사용하여 ID 토큰 검증

**장점:**
- Google의 인프라 변경에 자동 대응
- 토큰 검증 로직의 복잡성 감소
- 보안 취약점 자동 패치

**구현 방법:**

1. 의존성 추가 (pom.xml):
```xml
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>
```

2. GoogleIdTokenVerifier 사용:
```java
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

public GoogleIdToken.Payload verifyGoogleIdToken(String idToken) {
    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
            new NetHttpTransport(), new GsonFactory())
        .setAudience(Collections.singletonList(googleClientId))
        .build();
    
    GoogleIdToken token = verifier.verify(idToken);
    return token != null ? token.getPayload() : null;
}
```

### 방안 2: Google OAuth2 JWK 엔드포인트에서 공개키 조회

Google의 JWKS (JSON Web Key Set) 엔드포인트에서 공개키를 동적으로 조회하여 검증

**장점:**
- 외부 라이브러리 의존성 최소화
- 직접 검증 로직 구현으로 학습 효과

**구현 방법:**

1. 필요한 의존성:
```xml
<!-- 이미 jjwt-api 사용 중 -->
<dependency>
    <groupId>com.nimbusds</groupId>
    <artifactId>nimbus-jose-jwt</artifactId>
    <version>9.37.3</version>
</dependency>
```

2. Google 공개키 조회 및 검증:
```java
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

private static final String GOOGLE_JWKS_URL = 
    "https://www.googleapis.com/oauth2/v3/certs";

public JWTClaimsSet verifyGoogleIdTokenWithJWK(String idToken) throws Exception {
    JWKSource<SecurityContext> keySource = 
        new RemoteJWKSet<>(new URL(GOOGLE_JWKS_URL));
    
    ConfigurableJWTProcessor<SecurityContext> processor = 
        new DefaultJWTProcessor<>();
    processor.setJWSKeySelector(
        new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource)
    );
    
    JWTClaimsSet claims = processor.process(idToken, null);
    
    // 발급자 검증
    if (!"https://accounts.google.com".equals(claims.getIssuer()) &&
        !"accounts.google.com".equals(claims.getIssuer())) {
        throw new Exception("Invalid issuer");
    }
    
    // Audience 검증
    if (!claims.getAudience().contains(googleClientId)) {
        throw new Exception("Invalid audience");
    }
    
    return claims;
}
```

## 🔄 GoogleAuthController 수정안

### 단계 1: GoogleTokenVerifierService 생성

```java
@Service
@RequiredArgsConstructor
public class GoogleTokenVerifierService {
    
    private final String googleClientId;
    
    public GoogleIdToken.Payload verifyGoogleIdToken(String idToken) 
            throws GeneralSecurityException, IOException {
        
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(Collections.singletonList(googleClientId))
            .build();
        
        GoogleIdToken token = verifier.verify(idToken);
        
        if (token == null) {
            throw new IllegalArgumentException("Invalid Google ID token");
        }
        
        return token.getPayload();
    }
}
```

### 단계 2: GoogleAuthController 수정

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {
    
    private final UserService userService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final String googleClientId;
    
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuth(
            @RequestBody Map<String, String> request) {
        
        String idToken = request.get("idToken");
        
        if (idToken == null || idToken.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "ID token is required"));
        }
        
        try {
            // Google ID Token 검증 (공식 라이브러리 사용)
            GoogleIdToken.Payload payload = 
                googleTokenVerifierService.verifyGoogleIdToken(idToken);
            
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            
            log.info("Google login attempt - email: {}, name: {}", email, name);
            
            // 사용자 로그인/회원가입 처리
            Map<String, Object> authResult = 
                userService.loginWithGoogle(googleId, email, name);
            
            // 응답 구성
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("token", authResult.get("token"));
            response.put("requiresNickname", authResult.get("requiresNickname"));
            response.put("user", Map.of(
                "id", ((User) authResult.get("user")).getId(),
                "email", email,
                "username", ((User) authResult.get("user")).getUsername(),
                "nickname", ((User) authResult.get("user")).getNickname(),
                "role", ((User) authResult.get("user")).getRole(),
                "pictureUrl", pictureUrl
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid Google ID token: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid ID token"));
        } catch (GeneralSecurityException | IOException e) {
            log.error("Google token verification failed", e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Token verification failed"));
        } catch (Exception e) {
            log.error("Unexpected error during Google authentication", e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Authentication failed"));
        }
    }
    
    // verifyToken 메서드는 기존 유지 (내부 JWT 검증)
}
```

## 📦 의존성 변경사항

### 추가할 의존성 (pom.xml)

```xml
<!-- Google OAuth2 라이브러리 -->
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>

<!-- Google HTTP Client (전송 라이브러리) -->
<dependency>
    <groupId>com.google.http-client</groupId>
    <artifactId>google-http-client</artifactId>
    <version>1.43.3</version>
</dependency>

<!-- Google OAuth2 라이브러리 -->
<dependency>
    <groupId>com.google.oauth-client</groupId>
    <artifactId>google-oauth-client</artifactId>
    <version>1.34.1</version>
</dependency>
```

## ✅ 검증 항목

### 1단계: 개발 환경 검증
- [ ] 구글 OAuth2 라이브러리 의존성 추가 및 빌드 성공
- [ ] GoogleTokenVerifierService 생성 및 단위 테스트 통과
- [ ] GoogleAuthController 수정 및 컴파일 성공
- [ ] 로컬 환경에서 구글 로그인 정상 동작 확인
- [ ] 잘못된 토큰에 대한 적절한 에러 처리 확인

### 2단계: 보안 검증
- [ ] 무효한 서명이 포함된 토큰 거절 확인
- [ ] 만료된 토큰 거절 확인
- [ ] 잘못된 Audience(클라이언트 ID)가 포함된 토큰 거절 확인
- [ ] 잘못된 Issuer(발급자)가 포함된 토큰 거절 확인
- [ ] XSS 및 CSRF 공격에 대한 방어 로직 확인

### 3단계: 통합 테스트
- [ ] 프론트엔드(React Native/Expo)와의 연동 테스트
- [ ] 실제 구글 로그인 플로우 종단 간(end-to-end) 테스트
- [ ] JWT 토큰 발급 및 검증 전체 플로우 테스트
- [ ] 사용자 세션 관리 테스트

### 4단계: 성능 및 안정성
- [ ] 구글 공개키 조회 캐싱 로직 확인 (프레임워크 자동 처리)
- [ ] 네트워크 지연 상황에서의 타임아웃 처리
- [ ] 높은 트래픽 상황에서의 성능 테스트
- [ ] 장애 조치(fallback) 로직 확인

## 🔐 보안 고려사항

1. **토큰 유효성 검증:**
   - 서명 검증 필수
   - 발급자(iss) 검증: `https://accounts.google.com` 또는 `accounts.google.com`
   - Audience(aud) 검증: 정확히 클라이언트 ID와 일치해야 함
   - 만료 시간(exp) 검증: 현재 시간보다 이후여야 함
   - 발급 시간(iat) 검증: 현재 시간보다 이전이어야 함

2. **에러 메시지 처리:**
   - 상세한 에러 메시지는 로그에만 기록
   - 클라이언트에는 일반화된 에러 메시지 반환
   - 스택 트레이스 노출 금지

3. **로깅:**
   - 민감한 정보(이메일, 토큰 등)는 마스킹 처리 후 로깅
   - 성공/실패 로그는 적절한 로그 레벨로 구분

4. **타임아웃 설정:**
   - Google 서버 통신 타임아웃 명시적 설정
   - 기본값: 5초 (연결/읽기 시간)

## 📝 참고 자료

- [Google ID Token 검증 가이드](https://developers.google.com/identity/sign-in/android/backend-auth)
- [JJWT 공식 문서](https://github.com/jwtk/jjwt)
- [RFC 7519 (JWT 표준)](https://tools.ietf.org/html/rfc7519)
- [RFC 7515 (JWS 표준)](https://tools.ietf.org/html/rfc7515)

## 🎯 변경 요약

| 구분 | 기존 | 변경 후 |
|------|------|---------|
| 검증 방식 | HMAC (대칭 키) | ECDSA (비대칭 키) |
| 키 타입 | SecretKey | PublicKey (Google 제공) |
| 검증 라이브러리 | jjwt (직접 검증) | google-auth-library (공식) |
| Audience 검증 | contains() | equals() |
| Issuer 검증 | 없음 | 명시적 검증 추가 |
| 에러 처리 | 단순 예외 발생 | 세분화된 예외 처리 |

## 💼 책임자

- **개발 담당:** 백엔드 개발팀
- **검증 담당:** QA 팀
- **배포 예정일:** [수정 예정]
- **완료 예정일:** [수정 예정]

---

**작성일:** 2026-05-07  
**작성자:** OpenCode Assistant  
**문서 버전:** 1.0.0
