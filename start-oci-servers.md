# OCI 서버 실행 가이드

> **작성일**: 2026-05-26
> **서버 IP**: 168.110.119.132

## 문제 상황

브라우저에서 `http://168.110.119.132:9000/` 접속 시 `ERR_CONNECTION_TIMED_OUT` 오류 발생

**원인:**
- React 개발 서버가 기본적으로 `localhost`에 바인딩됨
- Spring Boot 서버가 기본적으로 `localhost`에 바인딩됨
- 외부 IP(168.110.119.132)에서 접속하려면 `0.0.0.0`으로 바인딩 필요

## 해결 방법

### 1. 백엔드 서버 실행 (Spring Boot)

```bash
# OCI 서버에 SSH 접속
ssh oksky44@168.110.119.132

# 백엔드 디렉토리로 이동
cd ~/InformationExamProject/backend

# 백엔드 빌드 및 실행
mvn clean package -DskipTests
java -jar target/information-exam-1.0.0.jar

# 또는 Spring Boot Maven Plugin 사용
mvn spring-boot:run
```

**백그라운드 실행:**
```bash
nohup java -jar target/information-exam-1.0.0.jar > app.log 2>&1 &
```

### 2. 프론트엔드 서버 실행 (React)

```bash
# OCI 서버에 SSH 접속
ssh oksky44@168.110.119.132

# 프론트엔드 디렉토리로 이동
cd ~/InformationExamProject/react-frontend

# 의존성 설치 (처음 실행 시)
npm install

# 빌드
npm run build

# 정적 파일 서빙 (0.0.0.0에 바인딩)
npx serve -s build -l 9000 --listen tcp://0.0.0.0:9000

# 또는 serve 패키지 설치 후
npm install -g serve
serve -s build -l 9000 --listen tcp://0.0.0.0:9000
```

**백그라운드 실행:**
```bash
nohup serve -s build -l 9000 --listen tcp://0.0.0.0:9000 > frontend.log 2>&1 &
```

### 3. 실행 확인

```bash
# 프로세스 확인
ps aux | grep java
ps aux | grep serve

# 포트 확인
lsof -i :9000
lsof -i :9001

# 로그 확인
tail -f backend/app.log
tail -f react-frontend/frontend.log
```

### 4. 브라우저 접속

- **프론트엔드**: http://168.110.119.132:9000
- **백엔드 API**: http://168.110.119.132:9001/api/health

## 수정된 설정

### backend/src/main/resources/application.properties
```properties
# 외부 IP에서 접속 가능하도록 모든 인터페이스에 바인딩
server.address=0.0.0.0
server.port=9001
```

### react-frontend/.env.production
```
HOST=0.0.0.0
PORT=9000
REACT_APP_API_BASE_URL=http://168.110.119.132:9001/api
REACT_APP_FRONTEND_URL=http://168.110.119.132:9000
```

## 주의사항

1. **보안**: `0.0.0.0`은 모든 IP에서 접속 가능하므로, 프로덕션 환경에서는 적절한 방화벽 설정 필요
2. **OCI 보안 목록**: 포트 9000, 9001이 허용되어 있는지 확인
3. **OS 방화벽**: Ubuntu의 `ufw` 또는 `firewalld`가 포트를 차단하지 않는지 확인

## 문제 해결

### "사이트에 연결할 수 없음" 오류

1. **서버 실행 확인**
   ```bash
   ps aux | grep java
   ps aux | grep serve
   ```

2. **포트 확인**
   ```bash
   lsof -i :9000
   lsof -i :9001
   ```

3. **OS 방화벽 확인**
   ```bash
   sudo ufw status
   sudo ufw allow 9000/tcp
   sudo ufw allow 9001/tcp
   ```

4. **OCI 보안 목록 확인**
   - OCI 콘솔 > 인스턴스 > 서브넷 > 보안 목록
   - 인바운드 규칙: 9000, 9001 TCP 허용

### CORS 오류

- 백엔드 `SecurityConfig.java`에서 OCI IP가 허용 목록에 포함되어 있는지 확인
- 프론트엔드 `.env` 파일에서 API Base URL이 올바르게 설정되어 있는지 확인