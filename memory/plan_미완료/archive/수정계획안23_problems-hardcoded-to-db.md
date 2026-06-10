# 수정계획안23 v2: problems.ts 18개 → problem 테이블 INSERT + DB 연동

## 📅 날짜
2026-06-10 (v2 업데이트)

## 🎯 목표
1. `problems.ts` 하드코딩 18개 문제를 `problem` 테이블에 INSERT
2. HomeScreen의 `totalObjectiveCount`를 DB 조회로 변경
3. `problems.ts` import 제거 (파일 삭제 또는 미사용)
4. 코드탭은 이미 이론탭과 동일하게 구현됨 — 추가 작업 불필요

## 🔍 현재 상태 분석

### 데이터 현황
| 소스 | 위치 | 데이터 수 | 상태 |
|------|------|-----------|------|
| `problems.ts` | 프론트엔드 하드코딩 | 18개 | ✅ 사용 중 (HomeScreen) |
| `problem` 테이블 | DB | 0개 추정 | ❌ 비어 있음 |
| `learning_card` 테이블 | DB | 35개 (7과목×5) | ✅ 이론탭 사용 중 |
| `subjective_problems` 테이블 | DB | 과목별 4개 | ✅ 이론탭 사용 중 |
| `programming_language_problems` 테이블 | DB | 언어별 다수 | ✅ 코드탭 사용 중 |

### 코드 분석
**HomeScreen.tsx:12,28**
```typescript
import { SAMPLE_PROBLEMS as problemsData } from '../data/problems';
// ...
const totalObjectiveCount = problemsData.length; // 18
```

**HomeScreen.tsx:75**
```typescript
subtitle: `전체 과목 객관식 ${totalObjectiveCount}문제`,
```

**이론탭 (TheoryScreen.tsx)**
- ✅ 이미 DB에서 조회 중: `fetchTheoryCards(category)` → API → `learning_card` + `subjective_problems`
- ✅ `problem` 테이블은 UNION ALL에 없음 (추가 필요)

**코드탭 (ProgrammingScreen.tsx)**
- ✅ 이미 이론탭과 동일한 UI 구현 (플래시카드/주관식 탭)
- ✅ `fetchProgrammingCards(language)` → API → `programming_language_problems`
- ✅ 추가 작업 불필요

## 📋 수정 단계

### 🔴 Step 0: Supabase MCP 토큰 갱신 (블로커)
**현재 상태**: Supabase MCP 토큰 만료로 DDL 직접 실행 불가

**옵션**:
1. 토큰 갱신 후 MCP로 직접 INSERT 실행
2. SQL 스크립트 생성 후 사용자가 직접 실행
3. migration 007 파일 작성 후 백엔드 재시작 시 자동 적용

**선택**: 옵션 3 (migration 파일 작성)

### ✅ Step 1: migration 007 작성 — problem 테이블에 18개 INSERT
**파일**: `backend/src/main/resources/db/migration/007_insert_objective_problems.sql`

**작업**:
- `problems.ts` 18개 문제를 `problem` 테이블에 INSERT
- `subject_id` 매핑 필요 (subject 테이블에서 과목별 ID 확인)
- `type = 'OBJECTIVE'` 고정
- `option1~5` 컬럼에 보기 데이터 저장

**subject 테이블 매핑 추정** (코드 기반):
| 과목명 | categoryId | 예상 subject_id |
|--------|------------|-----------------|
| 소프트웨어공학 | 1 | 1 |
| 프로그래밍언어 | 2 | 2 |
| 데이터베이스 | 3 | 3 |
| 운영체제 | 4 | 4 |
| 컴퓨터구조 | 5 | 5 |
| 네트워크 | 6 | 6 |
| 정보보안 | 7 | 7 |

**INSERT 예시** (1개):
```sql
INSERT INTO problem (subject_id, question, answer, explanation, type, difficulty, option1, option2, option3, option4, option5, created_at, updated_at)
VALUES (
    1, -- 소프트웨어공학
    '소프트웨어 생명주기 모델 중 개발 단계와 무관하게 분석 단계와 디자인 단계가 병행되는 모델은?',
    '2', -- 정답: 나선형 모델
    '나선형 모델(Spiral Model)은 소프트웨어 개발의 위험 분석을 수행하면서 분석, 디자인, 개발, 테스트를 병행 수행하는 모델입니다.',
    'OBJECTIVE',
    1,
    '폭포수 모델',
    '나선형 모델',
    '애자일 모델',
    '프로토타이핑 모델',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

**주의**: `subject` 테이블의 실제 `id` 값 확인 필요 (MCP 토큰 갱신 후 `SELECT * FROM subject` 실행)

### ✅ Step 2: ProblemQueryMapper.xml 수정 — problem 테이블 UNION ALL 추가
**파일**: `backend/src/main/resources/mapper/ProblemQueryMapper.xml:166-225`

**현재 상태**: `selectTheoryCardsByCategory` 쿼리가 `learning_card` + `subjective_problems`만 UNION
**작업**: `problem` 테이블 UNION ALL 추가

```xml
<!-- 기존 UNION ALL 쿼리 마지막에 추가 -->
UNION ALL

SELECT
    'OBJECTIVE' AS card_type,
    p.id,
    p.subject_id,
    p.question AS front_text,
    p.answer AS back_text,
    p.explanation,
    p.difficulty,
    p.option1,
    p.option2,
    p.option3,
    p.option4,
    p.option5
FROM problem p
INNER JOIN subject s ON p.subject_id = s.id
WHERE s.name = #{category}
  AND p.type = 'OBJECTIVE'
```

**예상 결과**: 운영체제 기준 9개 → 11개 (FLASHCARD 5 + SUBJECTIVE 4 + OBJECTIVE 2)

### ✅ Step 3: HomeScreen.tsx 수정 — problems.ts import 제거 + API 호출
**파일**: `InformationExamApp/src/screens/HomeScreen.tsx:12,28`

**현재 코드**:
```typescript
import { SAMPLE_PROBLEMS as problemsData } from '../data/problems';
// ...
const totalObjectiveCount = problemsData.length; // 18
```

**수정 후**:
```typescript
import { fetchTheoryCards } from '../api/theoryApi';
// ...
const [totalObjectiveCount, setTotalObjectiveCount] = useState(0);

useEffect(() => {
  const fetchAllObjectiveCounts = async () => {
    try {
      const categories = ['운영체제', '네트워크', '데이터베이스', '소프트웨어공학', '정보보안', '애플리케이션테스트', '프로그래밍언어'];
      const results = await Promise.all(
        categories.map(cat => fetchTheoryCards(cat))
      );
      const count = results.reduce((sum, cards) => 
        sum + cards.filter(c => c.cardType === 'OBJECTIVE').length, 0
      );
      setTotalObjectiveCount(count);
    } catch (error) {
      console.error('[HomeScreen] 객관식 문제 수 조회 실패:', error);
    }
  };
  fetchAllObjectiveCounts();
}, []);
```

### ✅ Step 4: problems.ts 파일 처리
**옵션**:
1. 파일 삭제 (완전 제거)
2. 파일 유지하되 import 제거 (안전)

**선택**: 옵션 2 (안전) — 다른 곳에서 사용할 수 있으므로 import만 제거

### ✅ Step 5: 백엔드 재시작 + 검증
```bash
cd backend && ./gradlew clean build -x test
# 서버 재시작
curl "http://localhost:9001/api/problems/theory?category=운영체제"
# 예상: 11개 cards (FLASHCARD 5 + SUBJECTIVE 4 + OBJECTIVE 2)

curl "http://localhost:9001/api/problems/theory?category=소프트웨어공학"
# 예상: 8개 cards (FLASHCARD 5 + SUBJECTIVE 4 + OBJECTIVE 3)
```

## 🔴 블로커
**Supabase MCP 토큰 만료** — `subject` 테이블의 실제 `id` 값 확인 불가

**해결 방법**:
1. 사용자가 Supabase MCP 토큰 갱신
2. 또는 사용자가 `SELECT * FROM subject` 실행 결과 제공
3. 또는 migration 파일 적용 후 에러 발생 시 subject_id 조정

## ✅ 완료 기준
- [ ] `problem` 테이블에 18개 객관식 문제 INSERT 완료
- [ ] HomeScreen `totalObjectiveCount`가 DB에서 동적으로 조회됨
- [ ] `problems.ts` import 제거됨
- [ ] 이론탭에서 과목별 객관식 문제 풀이 가능 (OBJECTIVE 카드 표시)
- [ ] 백엔드 API 검증 통과 (`/api/problems/theory?category=운영체제` → 11개)

## 📝 수정 파일 목록
1. `backend/src/main/resources/db/migration/007_insert_objective_problems.sql` — 신규 작성
2. `backend/src/main/resources/mapper/ProblemQueryMapper.xml` — UNION ALL 추가
3. `InformationExamApp/src/screens/HomeScreen.tsx` — API 호출로 변경
4. `InformationExamApp/src/data/problems.ts` — import 제거 (파일 유지)

## ⚠️ 주의사항
- `subject` 테이블의 실제 `id` 값 확인 필요 (MCP 토큰 갱신 후)
- `problem` 테이블의 `type` 컬럼이 'OBJECTIVE'인지 확인
- `TheoryScreen`에서 `cardType === 'OBJECTIVE'` 렌더링 로직 확인 필요
- 코드탭은 이미 이론탭과 동일하게 구현되어 추가 작업 불필요

## 📊 진행 현황
- [ ] Step 0: Supabase MCP 토큰 갱신 (또는 subject ID 확인)
- [ ] Step 1: migration 007 작성
- [ ] Step 2: ProblemQueryMapper.xml 수정
- [ ] Step 3: HomeScreen.tsx 수정
- [ ] Step 4: problems.ts import 제거
- [ ] Step 5: 백엔드 재시작 + 검증
