// 대과목 분류 (정보처리기사 실기)
export const CATEGORIES = [
  { id: 1, name: '화면설계', icon: '📐', color: '#007AFF' },
  { id: 2, name: '프로그래밍 언어', icon: '💻', color: '#34C759' },
  { id: 3, name: '데이터베이스', icon: '🗄️', color: '#FF9500' },
  { id: 4, name: '정보보안', icon: '🔒', color: '#FF3B30' },
  { id: 5, name: '애플리케이션 테스트', icon: '🧪', color: '#AF52DE' },
  { id: 6, name: '응용SW기초', icon: '📱', color: '#5AC8FA' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export interface Problem {
  id: number;
  categoryId: CategoryId;
  question: string;
  // 백엔드의 option1~5 구조와 호환성을 위해 변경
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5?: string; 
  correctAnswer: string; // '1', '2', '3', '4', '5' (옵션 번호)로 관리하는 것이 백엔드 매핑에 유리함
  explanation: string;
}

export const SAMPLE_PROBLEMS: Problem[] = [
  // 화면설계
  {
    id: 1,
    categoryId: 1,
    question: '소프트웨어 생명주기 모델 중 개발 단계와 무관하게 분석 단계와 디자인 단계가 병행되는 모델은?',
    option1: '폭포수 모델',
    option2: '나선형 모델',
    option3: '애자일 모델',
    option4: '프로토타이핑 모델',
    correctAnswer: '2',
    explanation: '나선형 모델(Spiral Model)은 소프트웨어 개발의 위험 분석을 수행하면서 분석, 디자인, 개발, 테스트를 병행 수행하는 모델입니다.',
  },
  {
    id: 2,
    categoryId: 1,
    question: 'UI 설계에서 사용자와 시스템 사이를 중개하는 것을 무엇이라고 하는가?',
    option1: 'Protocol',
    option2: 'Interface',
    option3: 'Module',
    option4: 'Class',
    correctAnswer: '2',
    explanation: 'Interface는 사용자와 시스템 사이를 중개하는 역할을 합니다.',
  },
  {
    id: 3,
    categoryId: 1,
    question: '소프트웨어 설계에서 모듈 간의 의존성을 최소화하는 것은 무엇인가?',
    option1: '높은 응집도',
    option2: '높은 결합도',
    option3: '낮은 결합도',
    option4: '느슨한 응집도',
    correctAnswer: '3',
    explanation: '낮은 결합도(Low Coupling)는 모듈 간의 의존성을 최소화하여 좋은 설계입니다.',
  },
  // 프로그래밍 언어
  {
    id: 4,
    categoryId: 2,
    question: 'Java에서 다형성(Polymorphism)을 구현하는 방법이 아닌 것은?',
    option1: '메서드 오버로딩',
    option2: '메서드 오버라이딩',
    option3: '추상 클래스',
    option4: '정적 변수 선언',
    correctAnswer: '4',
    explanation: '정적 변수 선언은 다형성과 무관합니다. 다형성은 오버로딩, 오버라이딩, 인터페이스로 구현됩니다.',
  },
  {
    id: 5,
    categoryId: 2,
    question: 'Python에서 리스트의 마지막 요소를 제거하는 메서드는?',
    option1: 'pop()',
    option2: 'push()',
    option3: 'shift()',
    option4: 'unshift()',
    correctAnswer: '1',
    explanation: 'pop() 메서드는 리스트의 마지막 요소를 제거하고 반환합니다.',
  },
  {
    id: 6,
    categoryId: 2,
    question: '객체지향 프로그래밍의 4대 특성으로 올바른 것은?',
    option1: '캡슐화, 상속, 다형성, 추상화',
    option2: '캡슐화, 상속, 다형성, 모듈화',
    option3: '캡슐화, 은닉화, 다형성, 추상화',
    option4: '캡슐화, 상속, 다중상속, 추상화',
    correctAnswer: '1',
    explanation: '객체지향의 4대 특성: 캡슐화, 상속, 다형성, 추상화',
  },
  // 데이터베이스
  {
    id: 7,
    categoryId: 3,
    question: '데이터베이스 트랜잭션의 특성이 아닌 것은?',
    option1: '원자성(Atomicity)',
    option2: '일관성(Consistency)',
    option3: '고립성(Isolation)',
    option4: '확장성(Scalability)',
    correctAnswer: '4',
    explanation: 'ACID 특성은 원자성, 일관성, 고립성, 지속성(Durability)입니다. 확장성은 트랜잭션 특성이 아닙니다.',
  },
  {
    id: 8,
    categoryId: 3,
    question: '정규화의 목적에 대해 올바르게 설명한 것은?',
    option1: '테이블 합치기',
    option2: '데이터 중복 최소화',
    option3: '쿼리 속도 향상',
    option4: '보안 강화',
    correctAnswer: '2',
    explanation: '정규화는 데이터 중복을 최소화하고 이상 현상을 제거하기 위한 과정입니다.',
  },
  {
    id: 9,
    categoryId: 3,
    question: 'SQL에서 테이블 구조를 변경하는 명령어는?',
    option1: 'MODIFY TABLE',
    option2: 'ALTER TABLE',
    option3: 'UPDATE TABLE',
    option4: 'CHANGE TABLE',
    correctAnswer: '2',
    explanation: 'ALTER TABLE은 테이블의 구조를 변경하는 SQL 명령어입니다.',
  },
  // 정보보안
  {
    id: 10,
    categoryId: 4,
    question: 'IP 주소를 물리적 주소(MAC 주소)로 변환하는 프로토콜은?',
    option1: 'TCP',
    option2: 'UDP',
    option3: 'ARP',
    option4: 'ICMP',
    correctAnswer: '3',
    explanation: 'ARP(Address Resolution Protocol)는 IP 주소를 MAC 주소로 변환하는 프로토콜입니다.',
  },
  {
    id: 11,
    categoryId: 4,
    question: '비대칭키 암호화 방식이 아닌 것은?',
    option1: 'RSA',
    option2: 'DES',
    option3: 'ECC',
    option4: 'Diffie-Hellman',
    correctAnswer: '2',
    explanation: 'DES는 대칭키 암호화 방식입니다. RSA, ECC, Diffie-Hellman은 비대칭키 방식입니다.',
  },
  {
    id: 12,
    categoryId: 4,
    question: '침입 탐지 시스템(IDS)과 침입 방지 시스템(IPS)의 차이점은?',
    option1: 'IDS는 감시만, IPS는 차단도 가능',
    option2: 'IDS만 존재',
    option3: '둘 다 동일한 기능',
    option4: 'IPS만 존재',
    correctAnswer: '1',
    explanation: 'IDS는 탐지만, IPS는 탐지 후 자동으로 차단도 수행합니다.',
  },
  // 애플리케이션 테스트
  {
    id: 13,
    categoryId: 5,
    question: '화이트박스 테스트 기법에 해당하지 않는 것은?',
    option1: '경로 커버리지',
    option2: '조건 커버리지',
    option3: '동치 분할',
    option4: '순환 복잡도',
    correctAnswer: '3',
    explanation: '동치 분할은 블랙박스 테스트 기법입니다. 경로/조건 커버리지는 화이트박스 기법입니다.',
  },
  {
    id: 14,
    categoryId: 5,
    question: '소프트웨어 테스트의 V&V에서 V는 무엇을 의미하는가?',
    option1: 'Verification',
    option2: 'Validation',
    option3: 'Verification & Validation',
    option4: 'Value',
    correctAnswer: '3',
    explanation: 'V&V는 Verification(정의한대로 구현했는가)과 Validation(수요를 충족했는가)입니다.',
  },
  {
    id: 15,
    categoryId: 5,
    question: '결함 검출 후 수정되었는지를 확인하는 테스트는?',
    option1: '회귀 테스트',
    option2: ' Smoke 테스트',
    option3: '성능 테스트',
    option4: '통합 테스트',
    correctAnswer: '1',
    explanation: '회귀 테스트(Regression Test)는 수정된 결함이 다른 부분에 영향을 미치지 않았는지 확인합니다.',
  },
  // 응용SW기초
  {
    id: 16,
    categoryId: 6,
    question: '운영체제에서 프로세스 간 통신(IPC)에 해당하지 않는 것은?',
    option1: 'Pipes',
    option2: 'Shared Memory',
    option3: 'Remote Procedure Call',
    option4: 'Database Query',
    correctAnswer: '4',
    explanation: 'Database Query는 IPC가 아닙니다. Pipes, Shared Memory, RPC는 IPC 방식입니다.',
  },
  {
    id: 17,
    categoryId: 6,
    question: '소프트웨어 개발에서 요구사항 명세서(SRS)를 검증하는 것은?',
    option1: '검증(Verification)',
    option2: '확인(Validation)',
    option3: '테스트(Test)',
    option4: '디버깅(Debug)',
    correctAnswer: '1',
    explanation: '검증(Verification)은 "정의한 대로 구현했는가"를 확인하는 것입니다.',
  },
  {
    id: 18,
    categoryId: 6,
    question: 'CPU 스케줄링에서 기아 상태(Starvation)가 발생하는 알고리즘은?',
    option1: 'FCFS',
    option2: 'SJF',
    option3: 'RR',
    option4: 'FIFO',
    correctAnswer: '2',
    explanation: 'SJF(Shortest Job First)에서 짧은 작업이 계속 도착하면 긴 작업은 기아 상태가 될 수 있습니다.',
  },
];
