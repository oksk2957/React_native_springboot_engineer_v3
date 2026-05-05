# [PostgreSQL] problem 테이블 더미 데이터 INSERT (24개, 과목당 4개)

## 📋 DDL 제약조건 (MCP 검증 완료)

### Problem 테이블 제약조건 (제공해주신 DDL 기준)
- **id**: bigserial (자동 증가, INSERT 시 생략 또는 DEFAULT 사용)
- **subject_id**: int8 NOT NULL, FOREIGN KEY REFERENCES subject(id) (과목 ID 1~6 존재 가정)
- **type**: text NOT NULL, CHECK (type = 'SUBJECTIVE' OR 'OBJECTIVE')
- **difficulty**: int4 NULL, CHECK (difficulty BETWEEN 1 AND 5)
- **question**: text NOT NULL
- **answer**: text NOT NULL
- **explanation**: text NULL
- **option1~5**: text NULL (OBJECTIVE는 필수, SUBJECTIVE는 NULL 허용)
- **is_ai_generated**: bool DEFAULT false

### MCP 검증 결과
- **Library**: /websites/postgresql (Score: 77.8)
- **검증 1**: bigserial 컬럼은 INSERT 시 값을 생략하면 자동 증가
- **검증 2**: CHECK 제약조건 준수 필요 (type, difficulty)
- **검증 3**: FOREIGN KEY (subject_id) → subject 테이블에 ID 1~6 존재 가정
- **검증 4**: 문자열 리터럴은 작은따옴표 사용, 내부 작은따옴표는 두 번 연속 사용

---

## 📝 더미 데이터 INSERT 쿼리 (총 24개)

### 과목 1 (subject_id = 1) - 4개 문제
```sql
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, is_ai_generated)
VALUES
(1, 'TCP/IP 프로토콜 스택의 4계층은?', '응용 계층', 'OSI 7계층을 단순화한 4계층 모델', 'OBJECTIVE', 2, '물리 계층', '데이터 링크 계층', '네트워크 계층', '응용 계층', NULL, false),
(1, '다음 중 HTTP의 상태 코드 404의 의미는?', 'Not Found', '요청한 리소스를 찾을 수 없음', 'OBJECTIVE', 1, 'OK', 'Found', 'Not Found', 'Server Error', NULL, false),
(1, '나만의 웹 서버를 구축하기 위한 핵심 개념을 설명하시오.', '웹 서버는 HTTP 프로토콜을 통해 클라이언트 요청을 받아 응답하는 소프트웨어이다.', '아파치, Nginx 등이 대표적', 'SUBJECTIVE', 3, NULL, NULL, NULL, NULL, NULL, false),
(1, 'DNS(Domain Name System)의 주요 역할은?', '도메인 이름을 IP 주소로 변환', '사용자가 기억하기 쉬운 이름으로 서버에 접근', 'OBJECTIVE', 2, '이메일 전송', '도메인을 IP로 변환', '파일 전송', '보안 암호화', NULL, false);
```

---

### 과목 2 (subject_id = 2) - 4개 문제
```sql
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, is_ai_generated)
VALUES
(2, '다음 중 데이터베이스 정규화의 목적이 아닌 것은?', '데이터 중복을 증가시킨다', '정규화는 중복을 줄이고 무결성을 유지', 'OBJECTIVE', 3, '데이터 중복 최소화', '데이터 무결성 유지', '데이터 중복을 증가시킨다', '이상 현상 방지', NULL, false),
(2, 'SQL에서 GROUP BY의 역할은?', '특정 컬럼을 기준으로 그룹화하여 집계 함수 적용', '같은 값을 가진 행을 그룹화', 'OBJECTIVE', 2, '정렬', '그룹화', '조인', '필터링', NULL, false),
(2, '트랜잭션의 ACID 속성에 대해 설명하시오.', '원자성, 일관성, 격리성, 지속성을 보장하는 트랜잭션의 4가지 핵심 특성', 'ACID는 데이터베이스 신뢰성의 기초', 'SUBJECTIVE', 4, NULL, NULL, NULL, NULL, NULL, false),
(2, '다음 중 NoSQL 데이터베이스가 아닌 것은?', 'MySQL', 'NoSQL은 비관계형 데이터베이스', 'OBJECTIVE', 3, 'MongoDB', 'Cassandra', 'Redis', 'MySQL', NULL, false);
```

---

### 과목 3 (subject_id = 3) - 4개 문제
```sql
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, is_ai_generated)
VALUES
(3, 'Java에서 객체 지향의 4대 원칙은?', '캡슐화, 상속, 추상화, 다형성', 'OOP의 핵심 개념', 'OBJECTIVE', 2, '캡슐화, 상속, 추상화, 다형성', '입력, 처리, 출력, 저장', '변수, 함수, 클래스, 객체', '컴파일, 실행, 디버깅, 배포', NULL, false),
(3, '다음 중 Java의 접근 제어자로 올바르지 않은 것은?', 'friend', 'Java 접근 제어자는 private, protected, public, default', 'OBJECTIVE', 1, 'private', 'protected', 'public', 'friend', NULL, false),
(3, 'Spring Framework의 핵심 개념인 DI(의존성 주입)에 대해 설명하시오.', '객체 간의 의존 관계를 외부에서 설정해주는 디자인 패턴', '코드 결합도를 낮추고 유연성 향상', 'SUBJECTIVE', 4, NULL, NULL, NULL, NULL, NULL, false),
(3, '다음 중 Java 8에서 추가된 기능이 아닌 것은?', '제네릭(Generics)', '제네릭은 Java 5에서 추가됨', 'OBJECTIVE', 3, '람다 표현식', '스트림 API', '제네릭(Generics)', 'Optional 클래스', NULL, false);
```

---

### 과목 4 (subject_id = 4) - 4개 문제
```sql
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, is_ai_generated)
VALUES
(4, '다음 중 운영체제의 역할로 적절하지 않은 것은?', '프로그래밍 언어 컴파일', '컴파일러는 OS의 역할이 아닌 별도 도구', 'OBJECTIVE', 2, '프로세스 관리', '메모리 관리', '파일 시스템 관리', '프로그래밍 언어 컴파일', NULL, false),
(4, '페이지 교체 알고리즘 중 FIFO의 설명으로 맞는 것은?', '가장 먼저 들어온 페이지를 먼저 내보낸다', 'First-In First-Out 방식', 'OBJECTIVE', 3, '가장 오랫동안 사용되지 않은 페이지 교체', '가장 먼저 들어온 페이지 교체', '참조 횟수가 적은 페이지 교체', '임의의 페이지 교체', NULL, false),
(4, '프로세스와 스레드의 차이점을 설명하시오.', '프로세스는 독립된 메모리 공간을 가지며, 스레드는 프로세스 내에서 공유 메모리를 사용', '스레드는 가볍고 빠름', 'SUBJECTIVE', 4, NULL, NULL, NULL, NULL, NULL, false),
(4, '다음 중 데드락(Deadlock)의 4가지 필요 조건이 아닌 것은?', '우선순위', '4조건: 상호배제, 점유와 대기, 비선점, 순환 대기', 'OBJECTIVE', 3, '상호배제', '점유와 대기', '비선점', '우선순위', NULL, false);
```

---

### 과목 5 (subject_id = 5) - 4개 문제
```sql
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, is_ai_generated)
VALUES
(5, '다음 중 웹 보안 취약점이 아닌 것은?', '압축', 'SQL 인젝션, XSS, CSRF 등이 대표적', 'OBJECTIVE', 2, 'SQL 인젝션', '크로스 사이트 스크립팅(XSS)', '압축', 'CSRF', NULL, false),
(5, 'HTTPS에서 사용하는 기본 포트 번호는?', '443', 'HTTP는 80, HTTPS는 443', 'OBJECTIVE', 1, '80', '443', '8080', '22', NULL, false),
(5, 'JWT(JSON Web Token)의 구조와 작동 원리를 설명하시오.', 'Header, Payload, Signature 세 부분으로 구성된 토큰', '서명을 통해 위변조 방지', 'SUBJECTIVE', 4, NULL, NULL, NULL, NULL, NULL, false),
(5, '다음 중 대칭키 암호화 방식이 아닌 것은?', 'RSA', 'RSA는 비대칭키(공개키) 암호화', 'OBJECTIVE', 3, 'AES', 'DES', 'RSA', 'Blowfish', NULL, false);
```

---

### 과목 6 (subject_id = 6) - 4개 문제
```sql
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, is_ai_generated)
VALUES
(6, '다음 중 머신러닝의 지도 학습으로 보기 어려운 것은?', '강화 학습', '지도 학습: 분류, 회귀 / 비지도: 클러스터링 / 강화: Q-learning', 'OBJECTIVE', 3, '선형 회귀', '로지스틱 회귀', '강화 학습', '서포트 벡터 머신', NULL, false),
(6, '딥러닝에서 역전파(Backpropagation)의 주요 목적은?', '가중치 업데이트를 위한 그래디언트 계산', '연쇄 법칙으로 그래디언트 계산', 'OBJECTIVE', 4, '데이터 증강', '그래디언트 계산', '모델 저장', '가중치 초기화', NULL, false),
(6, '오버피팅(Overfitting) 현상과 이를 해결하는 방법을 설명하시오.', '모델이 훈련 데이터에 과도하게 맞춰져 일반화 성능이 떨어짐', '해결: 드롭아웃, 정규화, 조기 종료 등', 'SUBJECTIVE', 5, NULL, NULL, NULL, NULL, NULL, false),
(6, '다음 중 클러스터링 알고리즘이 아닌 것은?', '선형 회귀', 'K-means, DBSCAN 등이 클러스터링 알고리즘', 'OBJECTIVE', 3, 'K-means', 'DBSCAN', '선형 회귀', '계층적 클러스터링', NULL, false);
```

---

## 🔍 실행 전 확인 사항

### 1. subject 테이블에 ID 1~6 존재 확인
```sql
SELECT id, name FROM subject WHERE id BETWEEN 1 AND 6;
-- 결과가 6개여야 함 (없으면 먼저 INSERT 필요)
```

### 2. subject 테이블 더미 데이터 (필요 시)
```sql
INSERT INTO subject (name, description) VALUES
('네트워크/웹', 'TCP/IP, HTTP, DNS 등'),
('데이터베이스', 'SQL, NoSQL, 정규화 등'),
('Java/Spring', 'OOP, Spring, Java 문법'),
('운영체제', '프로세스, 메모리, 스케줄링'),
('웹 보안', '암호화, 취약점, 보안 프로토콜'),
('머신러닝', '지도학습, 클러스터링, 딥러닝')
ON CONFLICT (name) DO NOTHING;
```

---

## 🧪 검증 방법 (MCP 기반)

### 검증 1: 정상 INSERT 확인
```sql
SELECT COUNT(*) FROM problem;
-- 결과: 24 (기존 데이터 없을 시)
```

### 검증 2: 과목별 문제 수 확인
```sql
SELECT subject_id, COUNT(*) as problem_count 
FROM problem 
WHERE subject_id BETWEEN 1 AND 6 
GROUP BY subject_id 
ORDER BY subject_id;
-- 결과: 각 subject_id당 4개씩
```

### 검증 3: 제약조건 위반 테스트
```sql
-- type 위반 (실패해야 함)
INSERT INTO problem (subject_id, question, answer, type, difficulty) 
VALUES (1, 'test', 'test', 'MULTIPLE_CHOICE', 1);
-- ERROR: violates check constraint "problem_type_check"

-- difficulty 위반 (실패해야 함)
INSERT INTO problem (subject_id, question, answer, type, difficulty) 
VALUES (1, 'test', 'test', 'OBJECTIVE', 6);
-- ERROR: violates check constraint "problem_difficulty_check"

-- subject_id 외래키 위반 (실패해야 함)
INSERT INTO problem (subject_id, question, answer, type, difficulty) 
VALUES (999, 'test', 'test', 'OBJECTIVE', 1);
-- ERROR: violates foreign key constraint "problem_subject_id_fkey"
```

---

## 📊 데이터 요약

| 과목 ID | 과목명(추정) | 문제 수 | 객관식 | 주관식 | 난이도 범위 |
|----------|---------------|--------|--------|--------|------------|
| 1 | 네트워크/웹 | 4 | 3 | 1 | 1~3 |
| 2 | 데이터베이스 | 4 | 3 | 1 | 2~4 |
| 3 | Java/Spring | 4 | 3 | 1 | 1~4 |
| 4 | 운영체제 | 4 | 3 | 1 | 2~4 |
| 5 | 웹 보안 | 4 | 3 | 1 | 1~4 |
| 6 | 머신러닝 | 4 | 3 | 1 | 3~5 |
| **총계** | **6개 과목** | **24** | **18** | **6** | **1~5** |

---

## 🔗 참고 MCP 문서

1. **PostgreSQL** (/websites/postgresql)
   - INSERT multi-row syntax
   - bigserial auto-increment behavior
   - CHECK constraint enforcement

2. **PostgreSQL** (/websites/postgresql_18)
   - Advanced DDL patterns
   - Foreign key handling

---

## ✅ 결론

**MCP 검증 완료**:
- bigserial은 INSERT 시 값 생략 가능 (자동 증가)
- type은 'SUBJECTIVE' 또는 'OBJECTIVE'만 허용 (DDL 기준)
- difficulty는 1~5 사이여야 함
- subject_id는 1~6이 subject 테이블에 존재해야 함

**생성된 INSERT 쿼리**:
- 총 24개 (각 과목 4개씩)
- 객관식 18개, 주관식 6개
- 난이도 1~5 고르게 분포
- 모든 CHECK 제약조건 준수

**실행 방법**:
1. 먼저 subject 테이블에 ID 1~6 확인/삽입
2. 위의 6개 INSERT 쿼리 순차 실행
3. 검증 쿼리로 데이터 확인
