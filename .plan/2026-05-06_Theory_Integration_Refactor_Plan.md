# [계획서] 이론(Theory) 탭 통합 및 MyBatis 오류 해결 정밀 계획서

## 1. 개요
현재 이론 학습(Theory Screen) 탭에서 발생하는 MyBatis OGNL 오류를 해결하고, 주관식 문제와 플래시 카드를 하나의 쿼리로 통합하여 성능과 코드 유지보수성을 향상시키는 것을 목표로 합니다.

## 2. 현재 문제점 분석
- **MyBatis 오류**: XML 매퍼 내에서 `isProgrammingLanguage(category)` 메서드를 호출하려 하나, OGNL 컨텍스트에서 해당 메서드를 찾지 못해 `NoSuchMethodException` 발생.
- **비효율적 데이터 로딩**: 리액트 프런트엔드에서 메타 정보(ID 목록)를 먼저 가져온 후, 각 ID에 대해 개별적으로 API를 호출하여 데이터를 로드함 (N+1 문제와 유사한 오버헤드).
- **데이터 불일치**: 주관식 문제와 플래시 카드가 서로 다른 경로로 관리되어 화면 구성 시 복잡도가 높음.

## 3. 설계 검토 및 개선 방향 (MVC2 Strict 적용)
- **Mapper 중심 설계**: 복잡한 로직을 자바 서비스 레이어가 아닌 SQL(MyBatis) 레벨에서 처리 (Union All 활용).
- **데이터 구조 통일**: `selectTheoryCardsByCategory` 쿼리를 통해 `SUBJECTIVE`와 `FLASHCARD`를 동일한 맵(Map) 구조로 반환.
- **프런트엔드 단순화**: 한 번의 API 호출로 해당 카테고리의 모든 학습 카드(이론+주관식)를 로드하도록 변경.

## 4. 상세 실행 단계

### Phase 1: 백엔드 수정 (MyBatis & Java)
1.  **MyBatis XML (`ProblemQueryMapper.xml`) 수정**
    - `isProgrammingLanguage(category)` 호출부 제거 및 자바에서 넘겨준 `isProgramming` 불리언 변수 사용으로 변경.
    - `selectTheoryCardsByCategory` 통합 쿼리 구현 (주관식 + 플래시 카드 UNION).
2.  **Mapper 인터페이스 (`ProblemQueryMapper.java`) 수정**
    - `selectTheoryCardsByCategory` 메서드 정의 추가.
3.  **Controller (`ProblemApiController.java`) 수정**
    - `/api/problems/theory/cards` 신규 엔드포인트 추가.
    - 기존 `getTheoryProblems` 및 `getTheoryProblemMeta`를 신규 통합 API로 점진적 대체 준비.

### Phase 2: 프런트엔드 수정 (React Native)
1.  **API 서비스 (`api.ts`) 수정**
    - 신규 통합 API 호출 메서드 추가.
2.  **화면 (`TheoryScreen.tsx`) 수정**
    - `loadTheoryData` 함수를 수정하여 개별 fetch 로직 제거.
    - 통합된 `cards` 배열을 상태로 관리하고, `card_type`에 따라 동적 렌더링.

### Phase 3: 검증 및 환경 최적화
1.  **서버 재가동 및 로그 모니터터링**: `bootRun`을 통한 백엔드 정상 기동 확인.
2.  **포트 확인**: 8081(Expo), 8088(Backend) 점유 상태 확인 및 충돌 방지.

## 5. 결론 및 기대 효과
- MyBatis의 고질적인 OGNL 호출 오류 완벽 해결.
- API 호출 횟수를 획기적으로 줄여 네트워크 지연 감소.
- SQL 기반의 데이터 통합으로 백엔드 자바 코드가 간결해짐 (MVC2 철학 준수).

---
**작성일**: 2026-05-06
**작성자**: Gemini CLI Agent
