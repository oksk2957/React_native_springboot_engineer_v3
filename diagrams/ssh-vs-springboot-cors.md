# SSH vs Spring Boot 서버 vs CORS 개념 다이어그램

```mermaid
graph TB
    subgraph "🖥️ OCI 서버 (158.180.78.125)"
        subgraph "🔐 SSH 서비스 (포트 22)"
            SSH["SSH Daemon<br/>sshd"]
        end
        
        subgraph "☕ Spring Boot 서버 (포트 9001)"
            SB["Spring Boot App<br/>port: 9001"]
            CORS["CORS 설정<br/>WebConfig.java"]
        end
        
        subgraph "🌐 Nginx (선택사항)"
            NGINX["Nginx Reverse Proxy<br/>port: 80/443"]
        end
    end
    
    subgraph "💻 사용자 PC"
        TERM["터미널/SSH 클라이언트"]
        BROWSER["웹 브라우저/<br/>React Native App"]
    end
    
    TERM -->|"SSH 연결<br/>port: 22"| SSH
    BROWSER -->|"HTTP 요청<br/>port: 9001"| SB
    BROWSER -.->|"HTTP 요청<br/>port: 80/443"| NGINX
    NGINX -.->|"프록시<br/>port: 9001"| SB
    
    SB --> CORS
    
    style SSH fill:#e3f2fd,stroke:#1565c0
    style SB fill:#e8f5e9,stroke:#2e7d32
    style CORS fill:#fff3e0,stroke:#ef6c00
    style NGINX fill:#f3e5f5,stroke:#6a1b9a
```

```mermaid
graph LR
    subgraph "❌ 잘못된 이해"
        A["SSH 포트 22가 열려있으면<br/>Spring Boot도 자동으로<br/>CORS 인증됨"] 
    end
    
    subgraph "✅ 올바른 이해"
        B["SSH 포트 22와 Spring Boot 포트 9001은<br/>완전히 별개의 서비스"]
        C["CORS는 HTTP 요청에만 적용됨<br/>SSH와 무관함"]
        D["Spring Boot CORS 설정은<br/>WebConfig.java에서 별도 관리"]
    end
    
    A -.->|"오해"| B
    B --> C
    C --> D
    
    style A fill:#ffebee,stroke:#c62828
    style B fill:#e8f5e9,stroke:#2e7d32
    style C fill:#e8f5e9,stroke:#2e7d32
    style D fill:#e8f5e9,stroke:#2e7d32
```

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Server as OCI 서버
    participant SSH as SSH Daemon (22)
    participant SB as Spring Boot (9001)
    participant CORS as CORS 필터
    
    Note over User,Server: 1단계: 서버 접속 (관리 목적)
    User->>Server: ssh -i key ubuntu@158.180.78.125
    Server->>SSH: 포트 22 연결
    SSH-->>User: 인증 성공, 터미널 접속
    
    Note over User,SB: 2단계: Spring Boot 실행
    User->>Server: mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=9001"
    Server->>SB: 포트 9001에서 서버 시작
    
    Note over User,CORS: 3단계: API 호출 (React Native → Spring Boot)
    User->>Server: HTTP GET http://158.180.78.125:9001/api/problems
    Server->>SB: 포트 9001로 요청 전달
    SB->>CORS: CORS 검사
    CORS-->>SB: 허용된 Origin인지 확인
    SB-->>User: JSON 응답 (또는 CORS 에러)
```

## 핵심 포인트

| 구분 | SSH (포트 22) | Spring Boot (포트 9001) |
|------|---------------|------------------------|
| **프로토콜** | SSH | HTTP/HTTPS |
| **용도** | 서버 원격 접속/관리 | API 서비스 제공 |
| **CORS 관계** | ❌ 무관 | ✅ 직접 설정 필요 |
| **사용 예** | `ssh ubuntu@158.180.78.125` | `fetch('http://158.180.78.125:9001/api')` |

## CORS 설정 확인 방법

```java
// WebConfig.java - CORS 설정
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:3000",     // 로컬 React
                "http://158.180.78.125:9001" // OCI 서버
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true);
    }
}
```

## 결론

> **SSH 포트 22는 서버 관리용, Spring Boot 포트 9001은 API 서비스용**
> 
> 둘은 완전히 다른 서비스이며, SSH 연결 성공이 CORS 해결을 의미하지 않습니다.
> CORS 문제는 `WebConfig.java`에서 별도로 설정해야 합니다.
