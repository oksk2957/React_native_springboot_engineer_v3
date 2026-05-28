# OCI 서버 네트워크 진단 및 해결 보고서

> **작성일**: 2026-05-26
> **프로젝트**: InformationExamApp (React Native/Expo + Spring Boot)
> **문제**: 프론트엔드에서 백엔드 API 요청 시 `Network Error` 발생

---

## 1. 문제 요약

| 항목 | 내용 |
|------|------|
| **증상** | 프론트엔드(168.110.119.132:9000)에서 백엔드(168.110.119.132:9001)로 POST /api/auth/google 요청 시 `Network Error` |
| **오류 메시지** | `No response received. Possible CORS or connection refused.` |
| **影響 범위** | Google 로그인 기능 전체 사용 불가 |

---

## 2. 원인 분석

### 2.1 코드 검토 결과

| 파일 | 상태 | 설명 |
|------|------|------|
| [`SecurityConfig.java`](backend/src/main/java/com/example/informationexam/config/SecurityConfig.java:62) | ✅ 정상 | `allowedOriginPatterns`에 OCI Public IP 포함됨 |
| [`WebConfig.java`](backend/src/main/java/com/example/informationexam/config/WebConfig.java:11) | ✅ 정상 | CORS 설정 비활성화 (SecurityConfig에서만 관리) |
| [`application.properties`](backend/src/main/resources/application.properties:5) | ✅ 정상 | `server.port=9001`로 설정됨 |
| [`api.ts`](InformationExamApp/src/services/api.ts:17) | ✅ 정상 | `http://168.110.119.132:9001/api`로 설정됨 |
| [`GoogleAuthController.java`](backend/src/main/java/com/example/informationexam/controller/GoogleAuthController.java:34) | ✅ 정상 | `/api/auth/google` 엔드포인트 정상 구현 |

### 2.2 핵심 원인

```
[프론트엔드] ──POST /api/auth/google──▶ [백엔드:9001]
     │
     │  요청은 전송됨 (status: 0)
     │  응답 없음 (No response received)
     │
     ▼
[문제] 서버가 응답하지 않음
```

**결론**: CORS 설정은 올바르게 되어 있으나, **백엔드 서버가 실행 중이지 않거나 네트워크 연결이 불가능한 상태**입니다.

---

## 3. 진단 체크리스트

### 3.1 OCI 서버 접속 및 백엔드 실행 상태 확인

```bash
# 1. OCI 서버 SSH 접속
ssh -i ~/.ssh/oci_key opc@168.110.119.132

# 2. 백엔드 서버 프로세스 확인
ps aux | grep java

# 3. 9001 포트 리스닝 확인
sudo netstat -tlnp | grep 9001
# 또는
sudo ss -tlnp | grep 9001

# 4. 백엔드 서버 로그 확인
tail -f /path/to/backend/logs/application.log
```

### 3.2 OCI 보안 목록 확인

```bash
# OCI 콘솔에서 확인
# 네비게이션: Networking > Virtual Cloud Networks > VCN 이름 > Security Lists

# 확인 사항:
# - 9001 포트가 0.0.0.0/0에서 허용되어야 함
# - TCP 프로토콜, Ingress 규칙
```

### 3.3 OCI 서버 내부 방화벽 확인

```bash
# 1. iptables 규칙 확인
sudo iptables -L -n | grep 9001

# 2. firewalld 상태 확인
sudo firewall-cmd --state
sudo firewall-cmd --list-ports
sudo firewall-cmd --list-all

# 3. SELinux 상태 확인 (CentOS/RHEL)
sudo getenforce
sudo semanage port -l | grep 9001
```

### 3.4 네트워크 연결 테스트

```bash
# OCI 서버 내부에서 백엔드 서버 직접 호출
curl -X POST http://localhost:9001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test"}'

# 외부에서 백엔드 서버 호출 (로컬 PC에서)
curl -X POST http://168.110.119.132:9001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test"}'
```

---

## 4. 해결 방안

### 4.1 백엔드 서버가 실행 중이지 않은 경우

```bash
# 1. 백엔드 디렉토리로 이동
cd ~/InformationExamProject/backend

# 2. Spring Boot 서버 실행 (개발 모드)
./gradlew bootRun

# 3. 백그라운드 실행 (배포 환경)
nohup java -jar build/libs/*.jar > app.log 2>&1 &
```

### 4.2 OCI 보안 목록에 9001 포트가 없는 경우

```bash
# OCI 콘솔에서 수동 추가:
# 1. Networking > Virtual Cloud Networks 선택
# 2. Default Security List 또는 커스텀 Security List 선택
# 3. Add Ingress Rules 클릭
# 4. 다음 정보 입력:
#    - Source CIDR: 0.0.0.0/0
#    - IP Protocol: TCP
#    - Destination Port Range: 9001
# 5. Add Ingress Rules 클릭
```

### 4.3 OCI 서버 내부 방화벽 문제인 경우

```bash
# firewalld 사용 시
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --reload

# iptables 사용 시
sudo iptables -A INPUT -p tcp --dport 9001 -j ACCEPT
sudo service iptables save
```

### 4.4 백엔드 서버가 localhost에 바인딩된 경우

```bash
# application.properties 확인
cat backend/src/main/resources/application.properties | grep server.address

# server.address가 localhost로 설정되어 있다면 주석 처리 또는 삭제
# Spring Boot 기본값은 0.0.0.0 (모든 인터페이스)
```

---

## 5. 예상 결과

### 5.1 정상 동작 시 로그

```
# 백엔드 로그
[Backend Request] POST /api/auth/google | Origin: http://168.110.119.132:9000 | Host: 168.110.119.132:9001
[CORS] Allowed Origin Patterns: [http://168.110.119.132:9000, ...]
[AUTH][xxxx][POST][START] google login request received
[AUTH][xxxx][POST][END] google login completed in xxx ms

# 프론트엔드 로그
[API Response] 200 /auth/google { success: true, data: { token, user } }
```

### 5.2 해결 후 확인 사항

- [ ] 백엔드 서버가 9001 포트에서 실행 중
- [ ] OCI 보안 목록에 9001 포트가 0.0.0.0/0에서 허용됨
- [ ] OCI 서버 내부 방화벽에서 9001 포트가 열려 있음
- [ ] 프론트엔드에서 `http://168.110.119.132:9001/api/auth/google`로 요청 시 200 응답 수신
- [ ] Google 로그인 후 JWT 토큰이 정상적으로 저장됨

---

## 6. 추가 고려사항

### 6.1 보안 강화 (운영 환경)

```java
// SecurityConfig.java - 운영 환경에서는 와일드카드 제거
List<String> allowedOriginPatterns = Arrays.asList(
    "https://your-production-domain.com",
    "https://www.your-production-domain.com"
);
```

### 6.2 모니터링 설정

```bash
# 백엔드 서버 모니터링 (systemd 서비스 등록)
sudo systemctl enable backend
sudo systemctl start backend
sudo systemctl status backend
```

---

## 7. 결론

**문제 원인**: 백엔드 서버(168.110.119.132:9001)가 실행 중이지 않거나 네트워크 연결이 불가능한 상태

**해결 우선순위**:
1. OCI 서버에서 백엔드 서버 실행 상태 확인
2. OCI 보안 목록에서 9001 포트 허용 확인
3. OCI 서버 내부 방화벽 확인
4. 백엔드 서버 재시작 및 로그 모니터링

**참고**: CORS 설정은 이미 올바르게 구성되어 있으므로, 서버 실행 상태와 네트워크 연결성을 확인하는 것이 우선입니다.
