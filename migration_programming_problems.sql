-- 프로그래밍 언어 문제 마이그레이션 스크립트
-- 목표: quizzes 테이블 제거, problem 테이블에 프로그래밍 언어 데이터 통합

-- 1. quizzes 테이블이 존재하면 삭제 (Step 1-1)
-- DROP TABLE IF EXISTS quizzes;

-- 2. subject_id = 4 ('프로그래밍언어') 확인 및 생성
INSERT INTO subject (name, description) 
VALUES ('프로그래밍언어', 'C, Java, Python 등 언어 특성')
ON CONFLICT (name) DO NOTHING;

-- 3. 프로그래밍 언어 문제 데이터 삽입 (subject_id = 4)
-- Java 문제
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, is_ai_generated)
SELECT id, '[Java] Java의 상속에 대해 설명하세요.', '상위 클래스의 속성과 메서드를 하위 클래스가 물려받는 기능', '객체 지향 프로그래밍의 핵심 개념', 'SUBJECTIVE', 1, false
FROM subject WHERE name = '프로그래밍언어';

INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, is_ai_generated)
SELECT id, '[Java] Java에서 인터페이스와 추상클래스의 차이점은?', '인터페이스는 모든 메서드가 추상이고, 추상클래스는 일부만 추상일 수 있음', 'Java의 다형성 구현 방식', 'SUBJECTIVE', 2, false
FROM subject WHERE name = '프로그래밍언어';

-- C 언어 문제
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, is_ai_generated)
SELECT id, '[C] 포인터의 기본 개념은?', '메모리 주소를 저장하는 변수', 'C 언어 메모리 관리의 핵심 개념', 'SUBJECTIVE', 2, false
FROM subject WHERE name = '프로그래밍언어';

INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, is_ai_generated)
SELECT id, '[C] C에서 구조체를 정의하는 키워드는?', 'struct', 'C 언어에서 사용자 정의 자료형을 만들 때 사용', 'SUBJECTIVE', 1, false
FROM subject WHERE name = '프로그래밍언어';

-- Python 문제
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, is_ai_generated)
SELECT id, '[Python] Python의 리스트 컴프리헨션에 대한 설명은?', '간결하게 리스트를 생성하는 방법', '[x for x in iterable if condition]', 'SUBJECTIVE', 1, false
FROM subject WHERE name = '프로그래밍언어';

INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, is_ai_generated)
SELECT id, '[Python] Python에서 딕셔너리를 만드는 방법은?', '{key: value}', 'Python의 키-값 쌍 자료구조', 'SUBJECTIVE', 1, false
FROM subject WHERE name = '프로그래밍언어';

-- 공통 개념 문제
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, is_ai_generated)
SELECT id, '객체지향 프로그래밍의 4대 특징은?', '캡슐화, 상속, 다형성, 추상화', 'OOP의 핵심 원리', 'SUBJECTIVE', 3, false
FROM subject WHERE name = '프로그래밍언어';

-- 4. 데이터 검증: 삽입된 문제 수 확인
SELECT '프로그래밍언어 문제 수: ' || COUNT(*) FROM problem p JOIN subject s ON p.subject_id = s.id WHERE s.name = '프로그래밍언어';