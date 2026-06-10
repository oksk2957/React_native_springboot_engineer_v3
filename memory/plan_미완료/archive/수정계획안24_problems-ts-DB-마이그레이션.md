# 수정계획안24: problems.ts → DB 마이그레이션

## 📋 작업 개요
- **목표**: 이론탭 하드코딩 데이터를 DB로 마이그레이션
- **범위**: `InformationExamApp/src/data/problems.ts` → `problem` 테이블
- **우선순위**: P1 (데이터 일관성)

## 🎯 단계별 실행 계획

### Phase 1: 데이터 구조 분석 ✅
- [x] problems.ts 구조 확인 (파일 없음 - 이미 삭제됨)
- [x] problem 테이블 스키마 확인
- [x] subject 테이블 관계 확인

### Phase 2: AI 문제 생성 🔄
- [ ] 과목별 문제 생성 (7개 과목)
- [ ] 객관식 5지선다 형식
- [ ] difficulty, explanation 포함
- [ ] option1~5 컬럼 채우기

### Phase 3: DB INSERT ⏳
- [ ] Supabase MCP 연결 확인
- [ ] problem 테이블에 데이터 INSERT
- [ ] subject_id 매핑 확인
- [ ] 데이터 무결성 검증

### Phase 4: 프론트엔드 정리 ⏳
- [ ] problems.ts 파일 삭제 (이미 완료)
- [ ] import 경로 정리
- [ ] API 호출만 사용하도록 수정

### Phase 5: 검증 ⏳
- [ ] 백엔드 API 테스트
- [ ] 프론트엔드 UI 렌더링 확인
- [ ] 오답노트 연동 테스트

## 🗂️ DB 스키마

### problem 테이블
```sql
CREATE TABLE problem (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  type VARCHAR(20) DEFAULT 'OBJECTIVE',
  difficulty INTEGER DEFAULT 0,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  option4 TEXT,
  option5 TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### subject 테이블 (7개 과목)
```sql
SELECT id, name FROM subject ORDER BY id;
```

## 📝 생성할 문제 형식

```typescript
{
  subject_id: 1,  // 운영체제
  question: "프로세스와 스레드의 차이점은?",
  answer: "2",  // 객관식 정답 번호
  explanation: "프로세스는 독립적, 스레드는 자원 공유",
  type: "OBJECTIVE",
  difficulty: 2,
  option1: "프로세스는 메모리를 공유한다",
  option2: "스레드는 프로세스 내에서 독립적으로 실행된다",
  option3: "프로세스는 컨텍스트 스위칭이 빠르다",
  option4: "스레드는 별도의 주소 공간을 가진다",
  option5: "둘은 완전히 동일한 개념이다",
  is_ai_generated: true
}
```

## 🔍 현재 상태
- ✅ problems.ts 파일 없음 (이미 삭제됨)
- ✅ TheoryScreen.tsx는 API 호출만 사용
- ✅ theoryApi.ts는 `/problems/theory` 엔드포인트 호출
- ⏳ problem 테이블에 데이터 부족

## 📊 예상 문제 수
- 과목당 20-30문제 × 7개 과목 = 140-210문제
- difficulty 분포: 1(30%), 2(40%), 3(30%)

## ⚠️ 주의사항
- subject_id는 기존 subject 테이블과 일치해야 함
- answer는 option1~5 중 하나의 번호 (1-5)
- is_ai_generated = true로 설정
- option1~5는 모두 NOT NULL (5지선다)

## 🎯 완료 기준
- [ ] problem 테이블에 140개 이상 데이터
- [ ] 모든 과목에서 문제 조회 가능
- [ ] 이론탭 UI 정상 동작
- [ ] 오답노트 연동 정상
