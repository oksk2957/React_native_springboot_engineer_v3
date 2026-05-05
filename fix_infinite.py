import psycopg2
import time
import traceback

conn_str = "host=aws-1-ap-south-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.gmhznnwecujoafdisscl password=wjdcjrlgkqrur sslmode=require options='-c client_encoding=utf8'"

def get_connection():
    return psycopg2.connect(conn_str)

max_attempts = 100
for attempt in range(max_attempts):
    print(f"\\n=== Attempt {attempt+1}/{max_attempts} ===")
    
    try:
        conn = get_connection()
        conn.autocommit = False
        cur = conn.cursor()
        
        # 1. 현재 상태 확인
        print("1. Checking current state...")
        cur.execute("SELECT id, name FROM subject ORDER BY id;")
        subjects = {id: name for id, name in cur.fetchall()}
        print(f"   Current subjects: {subjects}")
        
        # 2. 기존에 삽입된 24문제 삭제 (question 텍스트로 식별)
        print("2. Deleting previously inserted problems...")
        target_questions = [
            'TCP/IP 프로토콜 스택의 4계층은?',
            '다음 중 HTTP의 상태 코드 404의 의미는?',
            '나만의 웹 서버를 구축하기 위한 핵심 개념을 설명하시오.',
            'DNS(Domain Name System)의 주요 역할은?',
            '다음 중 데이터베이스 정규화의 목적이 아닌 것은?',
            'SQL에서 GROUP BY의 역할은?',
            '트랜잭션의 ACID 속성에 대해 설명하시오.',
            '다음 중 NoSQL 데이터베이스가 아닌 것은?',
            'Java에서 객체 지향의 4대 원칙은?',
            '다음 중 Java의 접근 제어자로 올바르지 않은 것은?',
            'Spring Framework의 핵심 개념인 DI(의존성 주입)에 대해 설명하시오.',
            '다음 중 Java 8에서 추가된 기능이 아닌 것은?',
            '다음 중 운영체제의 역할로 적절하지 않은 것은?',
            '페이지 교체 알고리즘 중 FIFO의 설명으로 맞는 것은?',
            '프로세스와 스레드의 차이점을 설명하시오.',
            '다음 중 데드락(Deadlock)의 4가지 필요 조건이 아닌 것은?',
            '다음 중 웹 보안 취약점이 아닌 것은?',
            'HTTPS에서 사용하는 기본 포트 번호는?',
            'JWT(JSON Web Token)의 구조와 작동 원리를 설명하시오.',
            '다음 중 대칭키 암호화 방식이 아닌 것은?',
            '다음 중 머신러닝의 지도 학습으로 보기 어려운 것은?',
            '딥러닝에서 역전파(Backpropagation)의 주요 목적은?',
            '오버피팅(Overfitting) 현상과 이를 해결하는 방법을 설명하시오.',
            '다음 중 클러스터링 알고리즘이 아닌 것은?'
        ]
        
        total_deleted = 0
        for q in target_questions:
            cur.execute("DELETE FROM problem WHERE question = %s;", (q,))
            total_deleted += cur.rowcount
        
        print(f"   Total deleted: {total_deleted} problems")
        conn.commit()
        
        # 3. 계획대로 subject ID 1~6 확보 (이름 변경 또는 새로 생성)
        print("3. Ensuring subjects with ID 1-6 exist with correct names...")
        
        # 계획에서 요구하는 subject 매핑
        plan_subjects = {
            1: ('네트워크/웹', 'TCP/IP, HTTP, DNS 등'),
            2: ('데이터베이스', 'SQL, NoSQL, 정규화 등'),
            3: ('Java/Spring', 'OOP, Spring, Java 문법'),
            4: ('운영체제', '프로세스, 메모리, 스케줄링'),
            5: ('웹 보안', '암호화, 취약점, 보안 프로토콜'),
            6: ('머신러닝', '지도학습, 클러스터링, 딥러닝')
        }
        
        for subj_id, (name, desc) in plan_subjects.items():
            # 해당 ID가 이미 존재하는지 확인
            cur.execute("SELECT id, name FROM subject WHERE id = %s;", (subj_id,))
            row = cur.fetchone()
            
            if row:
                # 존재하면 이름 업데이트
                cur.execute("UPDATE subject SET name = %s, description = %s WHERE id = %s;", (name, desc, subj_id))
                print(f"   Updated subject ID {subj_id}: {name}")
            else:
                # 존재하지 않으면 새로 삽입 (ID 지정)
                # ID가 serial이 아니므로 직접 삽입 가능
                try:
                    cur.execute("INSERT INTO subject (id, name, description) VALUES (%s, %s, %s);", (subj_id, name, desc))
                    print(f"   Inserted subject ID {subj_id}: {name}")
                except Exception as e:
                    print(f"   Error inserting subject ID {subj_id}: {e}")
                    # 이미 존재할 수 있으니 UPDATE 시도
                    cur.execute("UPDATE subject SET name = %s, description = %s WHERE id = %s;", (name, desc, subj_id))
                    print(f"   Updated subject ID {subj_id} after insert error: {name}")
        
        conn.commit()
        
        # 4. 확인
        print("4. Verifying subjects...")
        cur.execute("SELECT id, name FROM subject WHERE id BETWEEN 1 AND 6 ORDER BY id;")
        rows = cur.fetchall()
        for r in rows:
            print(f"   ID {r[0]}: {r[1]}")
        
        # 5. 24문제 삽입 (계획대로 subject_id 1~6 사용)
        print("5. Inserting 24 problems...")
        
        problems = [
            # Subject 1: 네트워크/웹 (4 problems)
            (1, 'TCP/IP 프로토콜 스택의 4계층은?', '응용 계층', 'OSI 7계층을 단순화한 4계층 모델', 'OBJECTIVE', 2, '물리 계층', '데이터 링크 계층', '네트워크 계층', '응용 계층', None, False),
            (1, '다음 중 HTTP의 상태 코드 404의 의미는?', 'Not Found', '요청한 리소스를 찾을 수 없음', 'OBJECTIVE', 1, 'OK', 'Found', 'Not Found', 'Server Error', None, False),
            (1, '나만의 웹 서버를 구축하기 위한 핵심 개념을 설명하시오.', '웹 서버는 HTTP 프로토콜을 통해 클라이언트 요청을 받아 응답하는 소프트웨어이다.', '아파치, Nginx 등이 대표적', 'SUBJECTIVE', 3, None, None, None, None, None, False),
            (1, 'DNS(Domain Name System)의 주요 역할은?', '도메인 이름을 IP 주소로 변환', '사용자가 기억하기 쉬운 이름으로 서버에 접근', 'OBJECTIVE', 2, '이메일 전송', '도메인을 IP로 변환', '파일 전송', '보안 암호화', None, False),
            
            # Subject 2: 데이터베이스 (4 problems)
            (2, '다음 중 데이터베이스 정규화의 목적이 아닌 것은?', '데이터 중복을 증가시킨다', '정규화는 중복을 줄이고 무결성을 유지', 'OBJECTIVE', 3, '데이터 중복 최소화', '데이터 무결성 유지', '데이터 중복을 증가시킨다', '이상 현상 방지', None, False),
            (2, 'SQL에서 GROUP BY의 역할은?', '특정 컬럼을 기준으로 그룹화하여 집계 함수 적용', '같은 값을 가진 행을 그룹화', 'OBJECTIVE', 2, '정렬', '그룹화', '조인', '필터링', None, False),
            (2, '트랜잭션의 ACID 속성에 대해 설명하시오.', '원자성, 일관성, 격리성, 지속성을 보장하는 트랜잭션의 4가지 핵심 특성', 'ACID는 데이터베이스 신뢰성의 기초', 'SUBJECTIVE', 4, None, None, None, None, None, False),
            (2, '다음 중 NoSQL 데이터베이스가 아닌 것은?', 'MySQL', 'NoSQL은 비관계형 데이터베이스', 'OBJECTIVE', 3, 'MongoDB', 'Cassandra', 'Redis', 'MySQL', None, False),
            
            # Subject 3: Java/Spring (4 problems)
            (3, 'Java에서 객체 지향의 4대 원칙은?', '캡슐화, 상속, 추상화, 다형성', 'OOP의 핵심 개념', 'OBJECTIVE', 2, '캡슐화, 상속, 추상화, 다형성', '입력, 처리, 출력, 저장', '변수, 함수, 클래스, 객체', '컴파일, 실행, 디버깅, 배포', None, False),
            (3, '다음 중 Java의 접근 제어자로 올바르지 않은 것은?', 'friend', 'Java 접근 제어자는 private, protected, public, default', 'OBJECTIVE', 1, 'private', 'protected', 'public', 'friend', None, False),
            (3, 'Spring Framework의 핵심 개념인 DI(의존성 주입)에 대해 설명하시오.', '객체 간의 의존 관계를 외부에서 설정해주는 디자인 패턴', '코드 결합도를 낮추고 유연성 향상', 'SUBJECTIVE', 4, None, None, None, None, None, False),
            (3, '다음 중 Java 8에서 추가된 기능이 아닌 것은?', '제네릭(Generics)', '제네릭은 Java 5에서 추가됨', 'OBJECTIVE', 3, '람다 표현식', '스트림 API', '제네릭(Generics)', 'Optional 클래스', None, False),
            
            # Subject 4: 운영체제 (4 problems)
            (4, '다음 중 운영체제의 역할로 적절하지 않은 것은?', '프로그래밍 언어 컴파일', '컴파일러는 OS의 역할이 아닌 별도 도구', 'OBJECTIVE', 2, '프로세스 관리', '메모리 관리', '파일 시스템 관리', '프로그래밍 언어 컴파일', None, False),
            (4, '페이지 교체 알고리즘 중 FIFO의 설명으로 맞는 것은?', '가장 먼저 들어온 페이지를 먼저 내보낸다', 'First-In First-Out 방식', 'OBJECTIVE', 3, '가장 오랫동안 사용되지 않은 페이지 교체', '가장 먼저 들어온 페이지 교체', '참조 횟수가 적은 페이지 교체', '임의의 페이지 교체', None, False),
            (4, '프로세스와 스레드의 차이점을 설명하시오.', '프로세스는 독립된 메모리 공간을 가지며, 스레드는 프로세스 내에서 공유 메모리를 사용', '스레드는 가볍고 빠름', 'SUBJECTIVE', 4, None, None, None, None, None, False),
            (4, '다음 중 데드락(Deadlock)의 4가지 필요 조건이 아닌 것은?', '우선순위', '4조건: 상호배제, 점유와 대기, 비선점, 순환 대기', 'OBJECTIVE', 3, '상호배제', '점유와 대기', '비선점', '우선순위', None, False),
            
            # Subject 5: 웹 보안 (4 problems)
            (5, '다음 중 웹 보안 취약점이 아닌 것은?', '압축', 'SQL 인젝션, XSS, CSRF 등이 대표적', 'OBJECTIVE', 2, 'SQL 인젝션', '크로스 사이트 스크립팅(XSS)', '압축', 'CSRF', None, False),
            (5, 'HTTPS에서 사용하는 기본 포트 번호는?', '443', 'HTTP는 80, HTTPS는 443', 'OBJECTIVE', 1, '80', '443', '8080', '22', None, False),
            (5, 'JWT(JSON Web Token)의 구조와 작동 원리를 설명하시오.', 'Header, Payload, Signature 세 부분으로 구성된 토큰', '서명을 통해 위변조 방지', 'SUBJECTIVE', 4, None, None, None, None, None, False),
            (5, '다음 중 대칭키 암호화 방식이 아닌 것은?', 'RSA', 'RSA는 비대칭키(공개키) 암호화', 'OBJECTIVE', 3, 'AES', 'DES', 'RSA', 'Blowfish', None, False),
            
            # Subject 6: 머신러닝 (4 problems)
            (6, '다음 중 머신러닝의 지도 학습으로 보기 어려운 것은?', '강화 학습', '지도 학습: 분류, 회귀 / 비지도: 클러스터링 / 강화: Q-learning', 'OBJECTIVE', 3, '선형 회귀', '로지스틱 회귀', '강화 학습', '서포트 벡터 머신', None, False),
            (6, '딥러닝에서 역전파(Backpropagation)의 주요 목적은?', '가중치 업데이트를 위한 그래디언트 계산', '연쇄 법칙으로 그래디언트 계산', 'OBJECTIVE', 4, '데이터 증강', '그래디언트 계산', '모델 저장', '가중치 초기화', None, False),
            (6, '오버피팅(Overfitting) 현상과 이를 해결하는 방법을 설명하시오.', '모델이 훈련 데이터에 과도하게 맞춰져 일반화 성능이 떨어짐', '해결: 드롭아웃, 정규화, 조기 종료 등', 'SUBJECTIVE', 5, None, None, None, None, None, False),
            (6, '다음 중 클러스터링 알고리즘이 아닌 것은?', '선형 회귀', 'K-means, DBSCAN 등이 클러스터링 알고리즘', 'OBJECTIVE', 3, 'K-means', 'DBSCAN', '선형 회귀', '계층적 클러스터링', None, False)
        ]
        
        insert_sql = '''
        INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, is_ai_generated)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        
        for p in problems:
            cur.execute(insert_sql, p)
        
        print(f"   Inserted {len(problems)} problems")
        conn.commit()
        
        # 6. 검증
        print("6. Verification...")
        cur.execute("SELECT COUNT(*) FROM problem;")
        total = cur.fetchone()[0]
        print(f"   Total problems: {total}")
        
        cur.execute("SELECT subject_id, COUNT(*) FROM problem WHERE subject_id BETWEEN 1 AND 6 GROUP BY subject_id ORDER BY subject_id;")
        rows = cur.fetchall()
        print("   Problem counts by subject_id 1-6:")
        for row in rows:
            print(f"     Subject {row[0]}: {row[1]} problems")
        
        # 7. 각 과목별 문제 수가 정확히 4개인지 확인
        all_correct = True
        for row in rows:
            if row[1] != 4:
                all_correct = False
                print(f"   ERROR: Subject {row[0]} has {row[1]} problems, expected 4")
        
        if all_correct and len(rows) == 6:
            print("\\n=== SUCCESS: All 24 problems inserted correctly with subject_id 1-6 ===")
            cur.close()
            conn.close()
            break
        else:
            print(f"\\n=== PARTIAL SUCCESS: Need to fix ===")
            if len(rows) != 6:
                print(f"   Only {len(rows)} subjects have problems, expected 6")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR on attempt {attempt+1}: {e}")
        traceback.print_exc()
        if 'conn' in locals():
            try:
                conn.rollback()
                conn.close()
            except:
                pass
        if attempt < max_attempts - 1:
            print(f"Retrying in 5 seconds...")
            time.sleep(5)
        else:
            print("Max attempts reached. Giving up.")
            break
