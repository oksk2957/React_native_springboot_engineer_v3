# 종합 수정 계획서 (COMPREHENSIVE PLAN)
**생성 일시**: 2026-05-04 PM_03-45-00
**대상 프로젝트**: C:\Users\SEOL\InformationExamProject
**적용 AI 모델**: big-pickle
**사용 허가 MCP**: sqlite, mysql, filesystem, sequential-thinking, playwright, dbhub, docker-server (비활성 MCP 제외: docker-compose-server, mongodb)

---

## 1. 프로젝트 구조 스캔 (1회차 단일 실행)
### 스캔 대상 디렉토리
`backend/`, `src/`, `InformationExamApp/`, `.sisyphus/`
### 수행 작업 및 도구
1. **Filesystem MCP**: `directory_tree` 도구로 전체 프로젝트 구조 스캔, MVC2 패턴(Model/View/Controller) 분리 여부 확인
2. **Sequential-Thinking MCP**: 구조 분석
   - React 파일 내 비즈니스 로직(연산/조건문/API 호출) 존재 여부 확인
   - MyBatis SQL XML 파일 존재 및 위치 확인
   - 제공된 DDL(10개 테이블)과 현재 DB 스키마 예비 일치 여부 체크
3. **DBHub MCP**: 프로젝트 메타데이터 조회로 구조 스캔 보조

---

## 2. 오류 분석 (MCP 전량 동원, 1회차)
### 2.1 DB 스키마 검증
| 사용 MCP | 작업 내용 |
|---------|----------|
| SQLite MCP | `informationexam.db` 연결 → 제공된 DDL과 스키마 대조 (컬럼명/타입/제약조건/외래키 일치 여부) |
| MySQL MCP | `MYSQL_*` 환경변수로 연결 테스트 → 스키마 일치 여부 확인 |
| DBHub MCP | DB 메타데이터 조회 → 스키마 불일치 항목 추출 |

### 2.2 코드/설정 검증
| 사용 MCP | 작업 내용 |
|---------|----------|
| Filesystem MCP | 주요 파일 읽기: `kilocode.json`(MCP 설정), `pom.xml`(의존성), MyBatis 설정 XML, React 컴포넌트 파일 |
| Playwright MCP | 프론트엔드 렌더링 테스트 → 콘솔 오류/화면 깨짐 캡처 |
| Docker-Server MCP | DB 컨테이너 실행 상태 확인 (필요 시 컨테이너 재시작) |

### 2.3 종합 오류 목록 생성
- **Sequential-Thinking MCP**: 모든 분석 결과 통합 → 우선순위별 오류 목록 생성
  - 우선순위 1: DDL 불일치 (누락 테이블/컬럼, 잘못된 제약조건)
  - 우선순위 2: MVC2 패턴 위반 (React 내 비즈니스 로직, Controller 내 로직 포함)
  - 우선순위 3: SQL 규칙 위반 (LEFT/RIGHT 조인 사용, ANSI SQL 미준수, XML 외 SQL 작성)
  - 우선순위 4: 프론트엔드 렌더링 오류

---

## 3. 수정 실행 계획 (오류 해결 시까지 무한 루프)
### 3.1 DDL 구조 강제 일치
- SQLite/MySQL DB를 제공된 DDL과 완전히 일치하도록 수정:
  - 누락된 테이블(`programming_language_problems`, `learning_card` 등) 생성
  - `CHECK` 제약조건(`role IN (...)`, `difficulty 1~5` 등) 전부 적용
  - 외래키 `ON DELETE CASCADE` 설정 확인 및 수정
  - 불필요한 테이블/컬럼/제약조건 삭제

### 3.2 MVC2 + XML SQL 수정
- **Controller**: 요청 수신/응답 반환만 수행 (비즈니스 로직 전부 제거)
- **Service**: 비즈니스 로직 전부 MyBatis XML SQL로 이관
- **SQL XML 규칙 준수**:
  - 모든 SQL은 순수 ANSI SQL 작성
  - 모든 조인은 `INNER JOIN`만 사용 (LEFT/RIGHT 조인 전면 삭제)
  - 파라미터 매핑, `resultType` 올바르게 설정
- **Model**: DDL에 맞는 DTO/VO 클래스 생성 (Lombok 사용)

### 3.3 React 수정
- 모든 비즈니스 로직(연산/조건문/API 호출) 제거
- 데이터는 부모 컴포넌트에서 받아 `map()` 메서드로만 렌더링
- API 호출은 Service 계층에서만 처리, React는 결과값만 전달받음

### 3.4 오류 검증 루프
1. 수정 후 SQLite/MySQL MCP로 스키마 재검증
2. Filesystem MCP로 수정 파일 읽어 오류 재체크
3. Playwright MCP로 프론트엔드 오류 재확인
4. 오류 남아있으면 1단계부터 재실행 (무한 루프)
5. 오류 없으면 서버 재가동 여부 질문 출력 후 종료

---

## 4. 최종 검증 (1회 수행, 추가 반복 금지)
- 모든 MCP로 수정 완료 상태 검증
- 검증 결과를 본 계획서에 추가 기록
- **1회 생성 후 중단 (추가 반복/심층 루프 금지)**

---

## 5. 환경 설정 및 권한
- 모든 변경사항 자동 `allow` (권한 확인 생략)
- 날짜 형식: `YYYY-MM-DD` (숫자만 사용)
- 시간 형식: `AM/PM_HH-MM-SS` 적용
- 대상 파일 경로: `C:\Users\SEOL\InformationExamProject\.kilo\2026-05-04_PM_03-45-00_COMPREHENSIVE_PLAN.md`
- 본 계획서는 1회만 생성되며 추가 반복을 수행하지 않음
