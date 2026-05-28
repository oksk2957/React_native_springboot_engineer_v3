# OCI 서버 배포 및 접속 가이드 (초보자용)

> **작성일**: 2026-05-26  
> **작성자**: Sisyphus (AI Agent)  
> **대상 사용자**: `oksky44`  
> **서버 IP**: `168.110.119.132`

---

## 1. 현재 상황 이해하기

당신의 프로젝트는 3개의 파트로 구성되어 있습니다:

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 (브라우저)                      │
│                                                         │
│   ┌─────────────┐         ┌─────────────────────┐     │
│   │  React 웹   │         │  React Native 앱    │     │
│   │  (포트 9000) │         │  (Android/iOS)      │     │
│   └──────┬──────┘         └──────────┬──────────┘     │
│          │                            │               │
│          └────────────┬────────────────┘               │
│                       ▼                                │
│   ┌─────────────────────────────────────────────────┐   │
│   │        Spring Boot 백엔드 (포트 9001)          │   │
│   │        서버: 168.110.119.132                   │   │
│   └─────────────────────────────────────────────────┘   │
│                       │                                  │
│                       ▼                                │
│   ┌─────────────────────────────────────────────────┐   │
│   │        Supabase 데이터베이스 (PostgreSQL)        │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 이미 완료된 설정 ✅

- **OCI 보안 규칙 (서버 방화벽)**
  - TCP 22: SSH 접속 ✅
  - TCP 9000: React 프론트엔드 ✅
  - TCP 9001: Spring Boot 백엔드 ✅

- **백엔드 CORS 설정** (`SecurityConfig.java`)
  - 이미 OCI 서버 IP(`168.110.119.132`)가 허용 목록에 포함됨 ✅

- **API 엔드포인트 설정**
  - 모바일 앱: 이미 OCI 서버 IP로 설정됨 ✅

---

## 2. 서버 켜기 (배포 단계)

### 단계 1: 서버 접속 준비

**필요한 것:**
- SSH 클라이언트 (Windows: PowerShell 또는 PuTTY, Mac/Linux: 터미널)
- 서버 로그인 정보 (사용자명, 비밀번호 또는 SSH 키)

**접속 명령어:**

```bash
ssh -i "your-ssh-key.pem" oksky44@168.110.119.132
```

> **참고**: `oksky44`는 OCI 기본 사용자명입니다. 실제 사용자명으로 변경하세요.

---

### 단계 2: 서버 환경 확인/설치

접속 후 다음 명령어로 확인:

```bash
# Java 설치 확인
java -version

# Node.js 설치 확인
node -v
npm -v

# Git 설치 확인
git --version
```

**만약 설치되어 있지 않다면:**

```bash
# Java 17 설치 (백엔드용)
sudo apt update
sudo apt install -y openjdk-17-jdk

# Node.js 18 설치 (프론트엔드용)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Git 설치
sudo apt install -y git
```

---

### 단계 3: 코드 다운로드

```bash
# 홈 디렉토리로 이동
cd ~

# GitHub에서 코드 클론 (또는 파일 업로드)
git clone https://github.com/your-username/InformationExamProject.git
cd InformationExamProject
```

---

### 단계 4: 백엔드 실행 (Spring Boot)

```bash
cd backend

# Maven 빌드 (실행 파일 생성)
./mvnw clean package -DskipTests

# 백엔드 실행
java -jar target/information-exam-1.0.0.jar
```

**백그라운드 실행 (터미널을 닫아도 유지):**

```bash
nohup java -jar target/information-exam-1.0.0.jar > app.log 2>&1 &
```

---

### 단계 5: 프론트엔드 실행 (React)

새로운 터미널 창에서:

```bash
cd ~/InformationExamProject/react-frontend

# 의존성 설치
npm install

# 빌드 (정적 파일 생성)
npm run build

# 정적 서버 실행 (serve 패키지 사용)
npm install -g serve
serve -s build -l 9000
```

---

## 3. 🌐 사이트 접속 방법 (중요!)

서버를 켜면 다음 주소로 접속할 수 있습니다:

### ✅ 프론트엔드 (React 웹사이트)

```
http://168.110.119.132:9000
```

**이 주소를 브라우저 주소창에 입력하면 됩니다!**

- **PC 브라우저**: Chrome, Edge, Firefox 등에서 위 주소 입력
- **모바일 브라우저**: 휴대폰에서도 같은 주소로 접속 가능

---

### ✅ 백엔드 API (직접 확인용)

```
http://168.110.119.132:9001/api/health
```

**정상 작동 확인 방법:**
- 브라우저에서 위 주소 입력
- `{"status":"UP"}` 또는 비슷한 메시지가 나오면 성공!

---

### ✅ React Native 모바일 앱

모바일 앱은 이미 OCI 서버 IP로 설정되어 있습니다:

```typescript
const OCI_IP = '168.110.119.132';
const API_BASE_URL = `http://${OCI_IP}:9001/api`;
```

**앱 실행 후 자동으로 서버에 연결됩니다.**

---

## 4. 🖥️ 접속 예시 (상세 설명)

### PC에서 접속하는 방법

1. **Chrome 브라우저 열기**
2. **주소창에 입력**: `http://168.110.119.132:9000`
3. **Enter 키 누르기**
4. **웹사이트가 표시됨! 🎉**

```
┌─────────────────────────────────────────┐
│  🔍 주소창: http://168.110.119.132:9000 │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────────┐   │
│   │      Information Exam App       │   │
│   │                                 │   │
│   │   [로그인 화면이 표시됨]        │   │
│   │                                 │   │
│   │   ┌─────────┐  ┌─────────┐   │   │
│   │   │  Google │  │  로그인  │   │   │
│   │   │  로그인 │  │         │   │   │
│   │   └─────────┘  └─────────┘   │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

### 휴대폰에서 접속하는 방법

1. **휴대폰 브라우저 열기** (Chrome, Safari 등)
2. **주소창에 입력**: `http://168.110.119.132:9000`
3. **웹사이트 접속 완료!**

> **팁**: 모바일 브라우저에서도 접속 가능하며, React Native 앱을 실행하면 자동으로 서버에 연결됩니다.

---

## 5. 🔍 서버 상태 확인 방법

### 백엔드가 켜져 있는지 확인

```bash
# 서버에서 실행
curl http://168.110.119.132:9001/api/health
```

**정상 응답 예시:**
```json
{"status":"UP"}
```

### 프론트엔드가 켜져 있는지 확인

```bash
# 서버에서 실행
curl -I http://168.110.119.132:9000
```

**정상 응답 예시:**
```
HTTP/1.1 200 OK
```

---

## 6. ❗ 자주 발생하는 접속 문제

### 문제 1: "사이트에 연결할 수 없음"

**원인:**
- 서버가 꺼져 있음
- 방화벽 설정 문제
- 포트가 닫혀 있음

**해결 방법:**
```bash
# 1. 서버가 켜져 있는지 확인
ssh oksky44@168.110.119.132

# 2. 프로세스 확인
lsof -i :9000  # 프론트엔드
lsof -i :9001  # 백엔드

# 3. 서버 재시작
# 프론트엔드
cd ~/InformationExamProject/react-frontend && serve -s build -l 9000

# 백엔드
cd ~/InformationExamProject/backend && java -jar target/information-exam-1.0.0.jar
```

---

### 문제 2: "CORS 오류" 또는 "API 요청 실패"

**원인:**
- 백엔드 CORS 설정 문제
- 프론트엔드 API 주소 설정 오류

**해결 방법:**
```bash
# 백엔드 CORS 설정 확인
cat ~/InformationExamProject/backend/src/main/java/com/example/informationexam/config/SecurityConfig.java
```

**정상 설정 예시:**
```java
List<String> allowedOriginPatterns = Arrays.asList(
    "http://168.110.119.132:9000",  // 프론트엔드 주소
    "http://localhost:9000",        // 로컬 개발용
    // ... 기타 허용 주소
);
```

---

### 문제 3: "흰 화면만 나옴"

**원인:**
- 프론트엔드 빌드 실패
- API 요청 실패

**해결 방법:**
```bash
# 1. 프론트엔드 재빌드
cd ~/InformationExamProject/react-frontend
npm install
npm run build

# 2. 서버 재시작
serve -s build -l 9000
```

---

## 7. 📱 모바일 앱 접속 방법

### React Native 앱 (Expo)

1. **앱 실행**
   ```bash
   cd ~/InformationExamProject/InformationExamApp
   npm start
   ```

2. **Expo Go 앱에서 QR 코드 스캔**

3. **자동으로 서버 연결**
   - 개발 모드: `http://168.110.119.132:9001/api` 사용
   - 프로덕션 모드: `https://your-production-api.com/api` 사용

---

## 8. 🔄 서버 재시작 방법

### 전체 재시작 순서

```bash
# 1. 서버 접속
ssh oksky44@168.110.119.132

# 2. 기존 프로세스 종료
kill $(lsof -t -i:9000)  # 프론트엔드 종료
kill $(lsof -t -i:9001)  # 백엔드 종료

# 3. 백엔드 재시작
cd ~/InformationExamProject/backend
nohup java -jar target/information-exam-1.0.0.jar > app.log 2>&1 &

# 4. 프론트엔드 재시작
cd ~/InformationExamProject/react-frontend
serve -s build -l 9000 &

# 5. 접속 확인
curl http://168.110.119.132:9001/api/health
curl -I http://168.110.119.132:9000
```

---

## 9. 📝 간단한 접속 체크리스트

- [ ] 서버 접속 완료 (`ssh oksky44@168.110.119.132`)
- [ ] 백엔드 실행 완료 (`java -jar target/information-exam-1.0.0.jar`)
- [ ] 프론트엔드 실행 완료 (`serve -s build -l 9000`)
- [ ] 브라우저에서 `http://168.110.119.132:9000` 접속
- [ ] 웹사이트 정상 표시 확인

---

## 10. 📞 접속이 안 될 때

### 즉시 확인할 것

1. **서버가 켜져 있나요?**
   ```bash
   ssh oksky44@168.110.119.132
   ```

2. **프로세스가 실행 중인가요?**
   ```bash
   ps aux | grep java
   ps aux | grep serve
   ```

3. **포트가 열려 있나요?**
   ```bash
   netstat -tlnp | grep 900
   ```

4. **방화벽 설정 확인**
   ```bash
   sudo ufw status
   ```

---

## 11. 주요 설정 파일 안내

### 백엔드 설정 (`backend/src/main/resources/application.properties`)

```properties
# 서버 포트
server.port=9001

# 프론트엔드 Origin (CORS 허용)
frontend.origin=http://168.110.119.132:9000
```

### CORS 설정 (`backend/src/main/java/com/example/informationexam/config/SecurityConfig.java`)

이미 OCI 서버 IP가 허용 목록에 포함되어 있습니다:

```java
List<String> allowedOriginPatterns = Arrays.asList(
    frontendOrigin,
    "http://168.110.119.132:9000",  // OCI Public IP (React frontend)
    "http://168.110.119.132:3000",  // OCI Public IP (React dev server)
    "http://168.110.119.132:19000", // OCI Public IP (Expo)
    "http://168.110.119.132:19006", // OCI Public IP (Expo web)
    // ... 기타 로컬 개발 환경
);
```

### React 프론트엔드 API 설정 (`react-frontend/src/services/api.js`)

```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://168.110.119.132:9001/api',
});
```

### React Native 모바일 앱 API 설정 (`InformationExamApp/src/services/api.ts`)

```typescript
const getApiBaseUrl = () => {
  if (__DEV__) {
    // OCI public IP 사용
    const OCI_IP = '168.110.119.132';
    return `http://${OCI_IP}:9001/api`;
  }
  return 'https://your-production-api.com/api';
};
```

---

## 12. 유용한 팁

### 프로세스 확인 및 종료

```bash
# 9001번 포트 사용 중인 프로세스 확인
lsof -i :9001

# 해당 프로세스 종료
kill -9 <PID>
```

### 로그 확인

```bash
# 백엔드 로그 실시간 확인
tail -f backend/app.log

# 프론트엔드 로그 확인
cat react-frontend/build.log
```

### 서비스 자동 시작 설정 (선택사항)

`systemd` 서비스로 등록하면 서버 재부팅 시 자동으로 시작됩니다:

```bash
# 백엔드 서비스 파일 생성
sudo tee /etc/systemd/system/information-exam-backend.service > /dev/null <<EOF
[Unit]
Description=Information Exam Backend
After=network.target

[Service]
User=oksky44
WorkingDirectory=/home/oksky44/InformationExamProject/backend
ExecStart=/usr/bin/java -jar target/information-exam-1.0.0.jar
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 서비스 등록 및 시작
sudo systemctl daemon-reload
sudo systemctl enable information-exam-backend
sudo systemctl start information-exam-backend
```

---

## 13. 참고 사항

- **사용자명**: `oksky44`로 설정되어 있습니다.
- **백엔드 포트**: 9001
- **프론트엔드 포트**: 9000
- **데이터베이스**: Supabase (PostgreSQL) - 별도 설정 필요 없음

---

**문의사항이나 문제가 발생하면 언제든지 문의해 주세요!**
