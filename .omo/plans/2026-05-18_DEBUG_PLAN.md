# 🛠️ 디버그 및 개발 계획서 (Comprehensive Fix & Debug Plan)

**일시**: 2026-05-18
**작성자**: 대한민국 1등 AI 개발 모델 (30년 경력 시니어 아키텍트)
**상태**: 분석 완료 및 승인 대기

---

## 1. 현황 및 맥락 분석 (Context Analysis)
프로젝트 구조와 과거 `.sisyphus/plans`를 분석한 결과, 현재 시스템은 **백엔드와 DB 간의 동기화 및 테이블 정의 누락**으로 인한 런타임 오류가 주요 리스크입니다. 특히 `subjective_problems` 테이블 관련 이슈가 반복적으로 기록되어 있어, 이에 대한 근본적인 해결과 견고한 디버깅 체계 구축이 시급합니다.

---

## 2. 구체적 수정 계획 (Detailed Fix Plan)

### [Phase 1] 백엔드 안정화 및 DB 동기화
- **파일 위치**: `backend/src/main/resources/application.properties`, `backend/src/main/resources/db/schema.sql`
- **수정 내용**: 
  - 누락된 `subjective_problems`, `programming_language_problems` 테이블 생성 스크립트 확정 및 적용.
  - JPA `ddl-auto` 설정을 검토하여 실제 DB 스키마와 엔티티 간 정합성 강제.
- **디버깅 로그**: SQL 실행 시점과 결과(성공/실패/영향받은 행 수)를 기록하는 로그 추가.

### [Phase 2] 프론트엔드 API 연동 최적화
- **파일 위치**: `InformationExamApp/src/api/problems.ts`, `InformationExamApp/src/screens/LearningScreen.tsx`
- **수정 내용**:
  - API 호출 실패 시 사용자에게 명확한 에러 메시지를 노출하는 Exception Handling 강화.
  - `axios` 인터셉터를 통한 전역 에러 로깅 (`console.error`에 API 경로 및 파라미터 포함).
- **디버깅 로그**: `[API_DEBUG] Request: URL, Response: StatusCode` 형태의 로그 삽입.

---

## 3. 수정 예정 코드 예시 (Draft Example)

### 백엔드 Entity 수정 (예시: SubjectiveProblem.java)
```java
// DEBUG: 2026-05-18 - 테이블 누락 대응을 위한 명시적 스키마 선언 추가
@Entity
@Table(name = "subjective_problems")
public class SubjectiveProblem {
    // ... 필드 정의 ...
    
    @PostLoad
    protected void logLoad() {
        // 로드 성공 시 디버깅 로그
        log.info("[DEBUG] SubjectiveProblem loaded: ID={}", this.id);
    }
}
```

---

## 4. 최종 선택지 (Final Options for User)

사용자님, 위 분석을 바탕으로 다음 중 어떤 방향으로 즉시 수정을 진행할까요?

1.  **[안정성 우선]**: 백엔드 DB 스키마 완벽 복구 및 테이블 생성 스크립트 적용 (500 에러 근본 해결)
2.  **[가시성 우선]**: 프론트/백엔드 전역 디버깅 로그 시스템 구축 (문제 파악을 위한 인프라 강화)
3.  **[기능 확장]**: 누락된 주관식/프로그래밍 문제 데이터 삽입 및 조회 기능 완성

**선택해 주시면 즉시 30년 차 개발자의 실력으로 완벽하게 구현하겠습니다.**
