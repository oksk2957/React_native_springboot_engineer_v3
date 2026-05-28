# SSH 터널링과 CORS 관계 완벽 이해

## 1단계: 기본 개념 - SSH와 Spring Boot는 별개

```mermaid
graph TB
    subgraph "🖥️ OCI 서버 (158.180.78.125)"
        subgraph "🔐 SSH 서비스 (포트 22)"
            SSH["SSH Daemon<br/>sshd"]
        end
        
        subgraph "☕ Spring Boot 서버 (포트 9001)"
            SB["Spring Boot App<br/>port: 9001"]
            CORS["CORS 필터<br/>WebConfig.java"]
            OAUTH["OAuth 인증<br/>GoogleAuthController"]
        end
    end
    
    subgraph "💻 로컬 PC (Windows)"
        TERM["터미널/SSH 클라이언트"]
        BROWSER["웹 브라우저/<br/>React Native App"]
    end
    
    TERM -->|"SSH 연결<br/>port: 22"| SSH
    BROWSER -->|"HTTP 요청<br/>port: 9001"| SB
    SB --> CORS
    SB --> OAUTH
    
    style SSH fill:#e3f2fd,stroke:#1565c0
    style SB fill:#e8f5e9,stroke:#2e7d32
    style CORS fill:#fff3e0,stroke:#ef6c00
    style OAUTH fill:#f3e5f5,stroke:#6a1b9a
```

## 2단계: SSH 터널링이란?

```mermaid
graph LR
    subgraph "로컬 PC (Windows)"
        LOCAL["localhost:9001<br/>(로컬 포트)"]
        SSH_CLIENT["SSH 클라이언트"]
    end
    
    subgraph "OCI 서버 (Ubuntu)"
        SSH["SSH Daemon (22)"]
        SB["Spring Boot (9001)"]
    end
    
    LOCAL -->|"1. SSH 터널 연결<br/>ssh -L 9001:localhost:9001<br/>ubuntu@158.180.78.125"| SSH_CLIENT
    SSH_CLIENT -->|"2. 암호화된 터널"| SSH
    SSH -->|"3. 내부 전달"| SB
    
    style LOCAL fill:#e3f2fd,stroke:#1565c0
    style SSH_CLIENT fill:#e3f2fd,stroke:#1565c0
    style SSH fill:#e8f5e9,stroke:#2e7d32
    style SB fill:#e8f5e9,stroke:#2e7d32
```

## 3단계: SSH 터널링 vs 직접 접속 비교

```mermaid
graph TB
    subgraph "❌ SSH 터널링 없이 직접 접속"
        A1["React Native App"]
        A2["CORS 에러 발생!"]
        A3["Spring Boot (9001)"]
        
        A1 -->|"fetch('http://158.180.78.125:9001/api')<br/>Origin: null 또는 file://"| A3
        A3 -->|"CORS 검사 실패<br/>허용되지 않은 Origin"| A2
    end
    
    subgraph "✅ SSH 터널링 사용 시"
        B1["React Native App"]
        B2["CORS 통과!"]
        B3["Spring Boot (9001)"]
        
        B1 -->|"fetch('http://localhost:9001/api')<br/>Origin: localhost"| B3
        B3 -->|"CORS 검사 통과<br/>localhost 허용됨"| B2
    end
    
    style A2 fill:#ffebee,stroke:#c62828
    style B2 fill:#e8f5e9,stroke:#2e7d32
```

## 4단계: 완전한 흐름도

```mermaid
sequenceDiagram
    participant User as 사용자
    participant PC as 로컬 PC
    participant Tunnel as SSH 터널
    participant OCI as OCI 서버
    participant SSH as SSH (22)
    participant SB as Spring Boot (9001)
    participant Google as Google OAuth
    
    Note over User,Google: 1단계: SSH 터널 설정
    User->>PC: ssh -L 9001:localhost:9001<br/>ubuntu@158.180.78.125
    PC->>OCI: SSH 연결 (포트 22)
    OCI->>SSH: 인증 성공
    SSH-->>PC: 터널 연결됨
    
    Note over User,Google: 2단계: 로컬에서 Spring Boot 접속
    User->>PC: http://localhost:9001 접속
    PC->>Tunnel: 로컬 포트 9001
    Tunnel->>OCI: SSH 터널 통해 전달
    OCI->>SB: 포트 9001로 요청
    SB-->>User: 응답 (CORS 통과!)
    
    Note over User,Google: 3단계: Google OAuth 로그인
    User->>SB: /auth/google 로그인 요청
    SB->>Google: OAuth 인증 요청
    Google-->>User: 구글 로그인 페이지
    User->>Google: 로그인 완료
    Google-->>SB: 인증 코드 + Redirect URL
    SB-->>User: JWT 토큰 발급
    
    Note over User,Google: ⚠️ 중요: CORS는 여전히 적용됨!
    Note over User,Google: SSH 터널은 "통로"일 뿐<br/>CORS 설정은 Spring Boot에서 관리
```

## 핵심 포인트

```mermaid
graph TB
    subgraph "❌ 오해"
        WRONG["SSH 터널을 쓰면<br/>CORS가 자동으로 해결됨"]
    end
    
    subgraph "✅ 사실"
        RIGHT1["SSH 터널은 '통로'일 뿐"]
        RIGHT2["CORS는 Spring Boot에서<br/>별도로 설정해야 함"]
        RIGHT3["SSH 터널을 쓰면<br/>Origin이 localhost로 바뀌어서<br/>CORS 통과가 쉬워질 뿐"]
    end
    
    WRONG -.->|"오해"| RIGHT1
    RIGHT1 --> RIGHT2
    RIGHT2 --> RIGHT3
    
    style WRONG fill:#ffebee,stroke:#c62828
    style RIGHT1 fill:#e8f5e9,stroke:#2e7d32
    style RIGHT2 fill:#e8f5e9,stroke:#2e7d32
    style RIGHT3 fill:#e8f5e9,stroke:#2e7d32
```

## 결론

| 상황 | CORS 적용 여부 | 설명 |
|------|---------------|------|
| SSH 터널 사용 (localhost:9001) | ✅ 적용됨 | Origin이 localhost로 인식됨 |
| 직접 접속 (158.180.78.125:9001) | ✅ 적용됨 | Origin이 IP 주소로 인식됨 |
| SSH 터널 = CORS 해결책 | ❌ 아님 | SSH는 통로일 뿐, CORS는 별개 |

> **결론:** SSH 터널링을 사용하면 로컬 개발 환경에서 편리하게 접속할 수 있지만, **CORS 설정은 여전히 Spring Boot에서 별도로 관리해야 합니다.** SSH 터널이 CORS를 "자동으로 해결"해주는 것은 아닙니다.
