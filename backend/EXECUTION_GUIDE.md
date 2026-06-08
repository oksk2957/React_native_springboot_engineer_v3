# 🚀 실행 가이드 (2026-06-08)

## 📋 사전 준비 완료 항목

✅ **코드 수정 완료**:
- JwtTokenProvider.java - claim 키 불일치 수정
- application.properties - JWT Secret 환경변수 참조 수정
- AnswerService.java - StudySessionItem 저장 추가
- 모든 컨트롤러 - 일관된 토큰 처리 방식

✅ **SQL 파일 준비 완료**:
- `backend/RUN_ALL_MIGRATIONS.sql` - 001~003 통합 파일

---

## 🎯 4단계 실행 계획

### STEP 1: Supabase DB 스키마 수정 (사용자 실행)

**실행 방법**:
1. Supabase Dashboard 로그인: https://supabase.com/dashboard/
2. 프로젝트 선택: `gmhznnwecujoafdisscl`
3. SQL Editor → New Query 클릭
4. `backend/RUN_ALL_MIGRATIONS.sql` 파일 내용 전체 복사
5. SQL Editor에 붙여넣기
6. Run 버튼 클릭
7. 완료 메시지 확인: "✅ DB 마이그레이션 완료!"

**예상 결과**:
```
✅ subjective_problems 테이블에 option1~5 컬럼 추가됨
✅ study_session 테이블에 created_at, updated_at 컬럼 추가됨
✅ 모든 엔티티의 타임스탬프 컬럼 검증 완료
```

---

### STEP 2: JWT Secret 확인 (선택, 권장)

**현재 상황**:
- `.env` 파일의 `SUPABASE_JWT_SECRET`이 anon key로 설정됨
- 기능은 작동하지만, 보안을 위해 실제 JWT Secret으로 교체 권장

**JWT Secret 확인 방법**:
1. Supabase Dashboard → Settings → API
2. JWT Settings 섹션에서 "JWT Secret" 확인
3. 값 복사 (예: `your-super-secret-jwt-key-with-at-least-32-characters-long`)

**`.env` 파일 수정**:
```bash
# backend/.env 파일 열기
SUPABASE_JWT_SECRET=<실제 JWT Secret 값으로 교체>
```

⚠️ **중요**: JWT Secret이 없어도 기능은 작동합니다. anon key는 임시로 작동하지만, 프로덕션 환경에서는 실제 JWT Secret을 사용해야 합니다.

---

### STEP 3: 백엔드 재시작

**실행 방법**:
```bash
# 터미널에서 실행
cd backend
./gradlew clean bootRun
```

**예상 로그**:
```
[SupabaseTokenVerifier] REST API 검증 방식 초기화 완료 - URL: https://gmhznnwecujoafdisscl.supabase.co
Started InformationExamBackendApplication in 5.234 seconds
```

**로그 확인 포인트**:
- ✅ "Started InformationExamBackendApplication" 메시지 확인
- ✅ 에러 로그 없음 확인
- ✅ JWT 토큰 생성 로그 (로그인 시)

---

### STEP 4: 통합 테스트

**테스트 시나리오**:

#### 1. 로그인 테스트
```
1. 앱 실행
2. Google 로그인 버튼 클릭
3. 로그인 성공 확인
4. 홈 화면 진입 확인
```

**예상 결과**:
- ✅ 로그인 성공
- ✅ JWT 토큰 발급
- ✅ 홈 화면 진입

#### 2. 답안 제출 테스트
```
1. 홈 → 문제 풀이 메뉴 클릭
2. 아무 문제나 선택
3. 답안 선택 후 제출
4. 결과 확인 (정답/오답)
```

**예상 결과**:
- ✅ 답안 제출 성공
- ✅ 정답/오답 판정 정상
- ✅ StudySessionItem 저장됨

#### 3. 통계 조회 테스트
```
1. 하단 탭 → 통계 클릭
2. 통계 데이터 확인
```

**예상 결과**:
```json
{
  "solvedProblems": 1,  // ← 0이 아닌 값
  "correctCount": 1,
  "accuracy": 100.0,
  ...
}
```

#### 4. 오답노트 테스트
```
1. 하단 탭 → 오답 클릭
2. 오답 목록 확인
```

**예상 결과**:
- ✅ 오답 목록 표시 (빈 배열 아님)
- ✅ 틀린 문제 정보 정상 표시

---

## 🔍 문제 발생 시 진단

### 증상 1: 로그인 실패
**확인 사항**:
1. 백엔드 로그 확인: `StudySession` 관련 에러 있는지
2. DB 스키마 확인:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'study_session'
AND column_name IN ('created_at', 'updated_at');
```
3. 컬럼이 없으면 STEP 1 다시 실행

### 증상 2: 통계가 여전히 0
**확인 사항**:
1. 로그인 성공 여부 확인
2. 답안 제출 성공 여부 확인
3. 백엔드 로그에서 `username` 값 확인 (null이 아닌지)

### 증상 3: 오답노트가 빈 배열
**확인 사항**:
1. 로그인 성공 여부 확인
2. 오답을 발생시켰는지 확인 (틀린 답안 제출)
3. 백엔드 로그에서 `username` 값 확인

---

## 📊 성공 기준 체크리스트

- [ ] Supabase SQL Editor에서 마이그레이션 실행 완료
- [ ] 백엔드 재시작 성공 (에러 로그 없음)
- [ ] 앱 로그인 성공
- [ ] 문제 풀이 가능
- [ ] 통계에 값 표시 (solvedProblems > 0)
- [ ] 오답노트에 목록 표시

---

## 🆘 긴급 연락처

문제 해결이 안 되는 경우:
1. 백엔드 로그 전체 캡처
2. Supabase SQL Editor 결과 캡처
3. 앱 화면 캡처
4. 네트워크 탭에서 API 응답 확인

---

**최종 업데이트**: 2026-06-08
**상태**: ✅ 코드 100% 완료, ⏳ DB 실행 대기
