# React Native와 Spring Boot 독립성 아키텍처 다이어그램

## 핵심 개념: React Native ≠ 서버, Spring Boot = 서버

```mermaid
graph TB
    subgraph "🖥️ 개발 환경 (내 PC)"
        subgraph "📱 React Native 앱 (InformationExamApp/)"
            RN["React Native App<br/>📦 Metro 번들러 (개발용)<br/>🚀 실제 앱은 핸드폰/에뮬레이터에서 실행"]
            RN_API["API 호출 대상:<br/>• localhost:9001 (로컬 백엔드)<br/>• 158.180.78.125:9001 (OCI 서버)"]
        end

        subgraph "🔧 Spring Boot 백엔드 (backend/)"
            SB["Spring Boot Server<br/>🌐 localhost:9001<br/>📡 REST API 제공"]
            SB_DB[("데이터베이스<br/>PostgreSQL / SQLite")]
        end

        subgraph "☁️ 외부 서비스"
            SUP["Supabase<br/>🔐 OAuth / JWT 인증"]
            GOOGLE["Google OAuth<br/>🔑 로그인 인증"]
        end
    end

    subgraph "🌐 OCI 서버 (158.180.78.125)"
        OCI["Spring Boot Server<br/>🌐 :9001<br/>❌ 현재 꺼짐"]
    end

    %% 관계 정의
    RN -.->|"HTTP 요청"| RN_API
    RN_API -.->|"API 호출"| SB
    RN_API -.->|"API 호출"| OCI
    SB -->|"연동"| SB_DB
    RN -.->|"OAuth 인증"| SUP
    SUP -.->|"인증"| GOOGLE
    SB -.->|"JWT 검증"| SUP

    %% 스타일링
    style RN fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    style SB fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style OCI fill:#ffebee,stroke:#c62828,stroke-width:2px
    style SUP fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style GOOGLE fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

---

## 🎯 핵심 포인트: 둘은 독립적입니다!

| 구분 | React Native (Metro) | Spring Boot |
|------|---------------------|-------------|
| **역할** | 개발용 번들러 (핸드폰으로 코드 전달) | 백엔드 API 서버 |
| **포트** | 기본 8081 (Metro) | 9001 (설정값) |
| **실행 명령** | `npm start` / `npx expo start` | `./gradlew bootRun` |
| **Spring Boot 필요 여부** | ❌ 불필요 | - |
| **React Native 필요 여부** | - | ❌ 불필요 |
| **서버 종속성** | **Spring Boot 없이도 실행됨** | **React Native 없이도 실행됨** |

---

## 🔄 실행 흐름 비교

```mermaid
graph LR
    subgraph "React Native 실행 (독립적)"
        A1["📁 InformationExamApp/"] --> B1["⚡ npm start"]
        B1 --> C1["🚀 Metro 서버 시작<br/>(포트 8081)"]
        C1 --> D1["📱 핸드폰/에뮬레이터<br/>앱 실행"]
    end

    subgraph "Spring Boot 실행 (독립적)"
        A2["📁 backend/"] --> B2["⚡ ./gradlew bootRun"]
        B2 --> C2["🌐 Spring Boot 서버 시작<br/>(포트 9001)"]
        C2 --> D2["📡 API 엔드포인트<br/>사용 가능"]
    end

    style A1 fill:#e1f5fe,stroke:#0277bd
    style A2 fill:#e8f5e9,stroke:#2e7d32
    style C1 fill:#e1f5fe,stroke:#0277bd
    style C2 fill:#e8f5e9,stroke:#2e7d32
```

---

## ❌ 잘못된 이해 vs ✅ 올바른 이해

```mermaid
graph TB
    subgraph "❌ 잘못된 이해 (X)"
        WRONG1["React Native 서버를 켜려면<br/>Spring Boot 서버가 필요하다"] --> WRONG2["(둘이 서로 의존적)"]
    end

    subgraph "✅ 올바른 이해 (O)"
        RIGHT1["React Native 개발 서버(Metro)는<br/>Spring Boot와 무관하게 실행된다"] --> RIGHT2["(둘은 완전히 독립적)"]
        RIGHT2 --> RIGHT3["단, API 호출 시<br/>Spring Boot가 실행 중이어야<br/>응답을 받을 수 있음"]
    end

    style WRONG1 fill:#ffebee,stroke:#c62828
    style RIGHT1 fill:#e8f5e9,stroke:#2e7d32
```
