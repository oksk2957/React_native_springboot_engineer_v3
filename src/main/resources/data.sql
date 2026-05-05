-- 기존 데이터 삭제
DELETE FROM wrong_answer_bookmark WHERE user_id IS NOT NULL;
DELETE FROM user_statistics WHERE user_id IS NOT NULL;
DELETE FROM user_answer WHERE user_id IS NOT NULL;
DELETE FROM study_session WHERE user_id IS NOT NULL;
DELETE FROM problem WHERE subject_id IS NOT NULL;
DELETE FROM users WHERE id IS NOT NULL;
DELETE FROM subject WHERE id IS NOT NULL;

-- 샘플 과목 데이터 삽입
INSERT INTO subject (name, description) VALUES 
('운영체제', '운영체제 관련 문제들'),
('네트워크', '네트워크 관련 문제들'),
('데이터베이스', '데이터베이스 관련 문제들'),
('소프트웨어공학', '소프트웨어공학 관련 문제들'),
('정보보안', '정보보안 관련 문제들'),
('애플리케이션테스트', '애플리케이션테스트 관련 문제들'),
('프로그래밍언어', '프로그래밍언어 관련 문제들');

-- 샘플 문제 데이터 삽입
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5) VALUES 
(1, '운영체제의 주요 기능은 무엇인가요?', '1', '운영체제의 주요 기능은 프로세스 관리, 메모리 관리, 파일 시스템 관리 등입니다.', 'OBJECTIVE', 3, '프로세스 관리', '메모리 관리', '파일 시스템 관리', '네트워크 관리', '디바이스 드라이버 관리'),
(2, 'TCP/IP 프로토콜 스택의 4계층은 무엇인가요?', '2', 'TCP/IP 프로토콜 스택은 응용, 전송, 인터넷, 네트워크 인터페이스 계층으로 구성됩니다.', 'OBJECTIVE', 2, '응용계층', '전송계층', '인터넷계층', '네트워크 인터페이스 계층', '물리계층'),
(3, '데이터베이스 정규화의 목적은 무엇인가요?', '3', '데이터베이스 정규화는 데이터 중복을 최소화하고 데이터 무결성을 보장하기 위한 과정입니다.', 'OBJECTIVE', 3, '데이터 저장 공간 절약', '데이터 무결성 보장', '데이터 중복 제거', '성능 향상', '보안 강화'),
(4, '소프트웨어 생명주기 모델 중 가장 일반적인 모델은 무엇인가요?', '1', '폭포수 모델은 전통적인 소프트웨어 개발 모델로 요구사항 분석, 설계, 구현, 테스트, 유지보수 단계로 구성됩니다.', 'OBJECTIVE', 1, '폭포수 모델', '애자일 모델', '스프린트 모델', '스크럼 모델', '데브옵스 모델'),
(5, '정보보안의 3대 요소는 무엇인가요?', ' Confidentiality, Integrity, Availability', '정보보안의 3대 요소는 기밀성(Confidentiality), 무결성(Integrity), 가용성(Availability)입니다.', 'OBJECTIVE', 1, 'Confidentiality, Integrity, Availability', 'Firewall, Encryption, Authentication', 'Prevention, Detection, Response', 'Access Control, Monitoring, Recovery', 'Risk Assessment, Threat Modeling, Compliance'),
(6, '화이트박스 테스트의 정의는 무엇인가요?', '2', '화이트박스 테스트는 소스 코드를 기반으로 내부 구조를 검사하는 테스트 기법입니다.', 'OBJECTIVE', 2, '소스 코드 기반 테스트', '내부 구조 검사', '테스트 케이스 작성', '버그 탐지', '성능 분석'),
(7, 'Java의 주요 특징은 무엇인가요?', '3', 'Java는 플랫폼 독립성, 객체지향, 자동 메모리 관리 등의 특징을 가집니다.', 'OBJECTIVE', 3, '플랫폼 독립성', '객체지향', '자동 메모리 관리', '다중 상속 지원', '포인터 사용');

-- 샘플 사용자 데이터 삽입
INSERT INTO users (email, nickname, role) VALUES 
('test@example.com', '테스트 사용자', 'USER');
