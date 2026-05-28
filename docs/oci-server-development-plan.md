# 오라클 클라우드 서버 (158.180.78.125) 웹 개발 수정 계획서

## 1. 프로젝트 개요

- **서버 IP**: 158.180.78.125 (Oracle Cloud Infrastructure)
- **프론트엔드**: 포트 9000 (React)
- **백엔드**: 포트 9001 (Spring Boot)
- **데이터베이스**: Supabase PostgreSQL (클라우드)
- **현재 상태**: 로컬 개발 환경에서 원격 서버 접속으로 전환 필요

---

## 2. 현재 설정 분석

### 2.1 백엔드 설정 (`backend/src/main/resources/application.properties`)
```properties
# 현재 설정 (문제점 포함)
server.port=9001
server.address=0.0.0.0  # ✅ 외부 접속 허용
frontend.origin=http://158.180.78.125:9000  # ✅ CORS 설정됨
```

**문제점**: 
- `frontend.origin`이 하드코딩되어 있어 유연성 부족
- `react-frontend/.env`의 IP가 이전 IP(168.110.119.132)로 설정되어 있음 ❌

### 2.2 프론트엔드 설정 (`react-frontend/.env`)
```env
# ❌ 현재 잘못된 설정 (이전 IP)
REACT_APP_API_BASE_URL=http://168.110.119.132:9001/api
REACT_APP_FRONTEND_URL=http://168.110.119.132:9000
```

### 2.3 API 서비스 (`react-frontend/src/services/api.js`)
```javascript
// ✅ 현재 설정 (동적 환경변수 사용)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9001/api';
```

---

## 3. 수정 계획

### 3.1 프론트엔드 환경변수 수정

**파일**: `react-frontend/.env`

```env
# DEBUG: [OCI-2026-05-28] 오라클 클라우드 서버 IP 업데이트
# 원인: 서버 IP 변경 (168.110.119.132 → 158.180.78.125)
# 해결: 새로운 Public IP로 업데이트
REACT_APP_API_BASE_URL=http://158.180.78.125:9001/api
REACT_APP_FRONTEND_URL=http://158.180.78.125:9000
```

### 3.2 백엔드 CORS 설정 수정

**파일**: `backend/src/main/java/com/example/informationexam/config/SecurityConfig.java`

```java
// 현재 allowedOriginPatterns에 추가 필요:
"http://158.180.78.125:9000",   // ✅ 이미 추가됨
"http://158.180.78.125:3000",   // ✅ 이미 추가됨
"http://158.180.78.125:*",      // ✅ 이미 추가됨
```

**참고**: 현재 CORS 설정은 이미 새로운 IP를 포함하고 있으므로 추가 수정 불필요 ✅

### 3.3 백엔드 application.properties 수정

**파일**: `backend/src/main/resources/application.properties`

```properties
# DEBUG: [OCI-2026-05-28] Frontend Origin 환경변수화
# 원인: 하드코딩된 IP 제거, 유연한 설정을 위해 환경변수 사용
# 해결: 환경변수로 FRONTEND_ORIGIN 설정, 기본값은 OCI IP
frontend.origin=${FRONTEND_ORIGIN:http://158.180.78.125:9000}
```

---

## 4. 배포 및 실행 계획

### 4.1 프론트엔드 빌드 및 실행

```bash
# 1. 프론트엔드 디렉토리로 이동
cd react-frontend

# 2. 의존성 설치 (필요시)
npm install

# 3. 환경변수 확인
cat .env
# REACT_APP_API_BASE_URL=http://158.180.78.125:9001/api
# REACT_APP_FRONTEND_URL=http://158.180.78.125:9000

# 4. 빌드
npm run build

# 5. 서버 실행 (포트 9000)
npx serve -s build -l 9000
# 또는
PORT=9000 npm start
```

### 4.2 백엔드 빌드 및 실행

```bash
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. Maven 빌드
./mvnw clean package -DskipTests

# 3. 환경변수 설정 (선택사항)
export FRONTEND_ORIGIN=http://158.180.78.125:9000

# 4. 서버 실행 (포트 9001)
java -jar target/information-exam-1.0.0.jar
```

### 4.3 Docker Compose 실행 (선택사항)

```bash
# Docker Compose로 실행
docker-compose up -d
```

---

## 5. 테스트 계획

### 5.1 연결 테스트

```bash
# 백엔드 API 테스트
curl http://158.180.78.125:9001/api/subjects

# 프론트엔드 접속 테스트
curl http://158.180.78.125:9000
```

### 5.2 CORS 테스트

```bash
# 프리플라이트 요청 테스트
curl -X OPTIONS -H "Origin: http://158.180.78.125:9000" \
  -H "Access-Control-Request-Method: GET" \
  http://158.180.78.125:9001/api/subjects
```

### 5.3 브라우저 테스트

1. 브라우저에서 `http://158.180.78.125:9000` 접속
2. 개발자 도구 (F12) → Network 탭 확인
3. API 요청이 `158.180.78.125:9001`로 가는지 확인
4. CORS 에러 여부 확인

---

## 6. 문제 해결 가이드

### 6.1 CORS 에러 발생 시

```java
// SecurityConfig.java에서 allowedOriginPatterns 확인
"http://158.180.78.125:9000",  // 프론트엔드 URL
"http://158.180.78.125:*",      // 모든 포트 허용 (개발용)
```

### 6.2 연결 거부 (Connection Refused) 시

```bash
# 서버 실행 여부 확인
curl http://158.180.78.125:9001/actuator/health

# 방화벽 설정 확인 (Oracle Cloud Console)
# Security List → Ingress Rules → 포트 9000, 9001 개방 확인
```

### 6.3 환경변수 미적용 시

```bash
# React 환경변수 재설정
cd react-frontend
rm -rf node_modules/.cache
npm start

# Spring Boot 환경변수 확인
java -jar -Dfrontend.origin=http://158.180.78.125:9000 target/information-exam-1.0.0.jar
```

---

## 7. 보안 고려사항

### 7.1 현재 보안 설정

- ✅ CORS: 특정 Origin만 허용 (와일드카드 `*`는 개발용으로만 사용)
- ✅ JWT: 토큰 기반 인증 구현
- ✅ Google OAuth: 클라이언트 Secret 환경변수 관리
- ✅ DB: Supabase Pooler 연결, SSL 필수

### 7.2 추가 권장사항

1. **HTTPS 적용**: 운영 환경에서는 HTTPS 적용 권장
2. **환경변수 분리**: `.env.production` 파일 생성
3. **IP 화이트리스트**: Oracle Cloud Security List에서 접근 IP 제한
4. **JWT Secret 강화**: 현재 기본값 사용 중, 복잡한 값으로 변경

---

## 8. 체크리스트

- [ ] `react-frontend/.env` IP 업데이트 (168.110.119.132 → 158.180.78.125)
- [ ] `backend/src/main/resources/application.properties` 환경변수화
- [ ] 프론트엔드 빌드 및 실행 (포트 9000)
- [ ] 백엔드 빌드 및 실행 (포트 9001)
- [ ] CORS 설정 확인
- [ ] API 연결 테스트
- [ ] 브라우저에서 접속 테스트
- [ ] 로그 확인 및 에러 처리

---

## 9. 참고사항

- **서버 IP**: 158.180.78.125
- **프론트엔드 URL**: http://158.180.78.125:9000
- **백엔드 API URL**: http://158.180.78.125:9001/api
- **데이터베이스**: Supabase PostgreSQL (Pooler)
- **개발 환경**: React + Spring Boot + Oracle Cloud

---

*작성일: 2026-05-28*
*작성자: Atlas (Master Orchestrator)*
