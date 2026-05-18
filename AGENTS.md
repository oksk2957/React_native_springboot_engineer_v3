# AGENTS.md

## 1. 프로젝트 개요 (Project Overview)
본 프로젝트는 **InformationExamApp** (React Native/Expo)과 **Backend** (Java/Spring Boot)로 구성된 정보처리기사 시험 대비 애플리케이션입니다. 
- **Frontend**: `InformationExamApp/` (Zustand 상태 관리, Expo SQLite 및 Supabase 연동)
- **Backend**: `backend/` (Spring Boot, JPA, PostgreSQL/Supabase, MyBatis 혼용 가능성)
- **Database**: 로컬 `database.db` (SQLite) 및 클라우드 Supabase (PostgreSQL) 사용

## 2. 작업 원칙 (Core Principles)
- **30년 경력의 마인드셋**: 단순히 코드를 고치는 것이 아니라, 시스템의 안정성과 확장성을 고려한다.
- **최소 변경 원칙**: 불필요한 리팩터링을 지양하고 문제의 근본 원인을 타격하는 '외과수술적 수정'을 지향한다.
- **맥락 파악**: 수정 전 반드시 완전한 맥락 파악을 완료한후에 구체적 (개발 또는 계획) 작성에 임한다.

## 3. 실행 및 테스트 방법 (Run & Test)
- **전체 실행**: 루트의 `npm run dev` (백엔드와 프론트 동시 실행)
- **백엔드**: `cd backend && ./gradlew bootRun`
- **프론트엔드**: `cd InformationExamApp && npm start`
- **검증**: 수정 후에는 관련 API 엔드포인트 호출 및 앱 화면 이동을 통해 동작을 확정한다.

## 4. 코드 스타일 및 수정 절차 (Style & Workflow)
- **언어**: TypeScript(App), Java(Backend) 우선 준수.
- **로깅**: 모든 수정 사항에는 `// DEBUG: [작업내용]` 형태의 주석과 적절한 로그를 남겨 후속 개발자가 맥락을 파악하기 쉽게 한다.
- **절차**: 
  1. `grep` 및 `ls -R`을 통한 파일 위치 및 의존성 파악.
  2. 현상 재현을 위한 로그 추가 및 분석.
  3. 수정 계획 수립 및 사용자 승인.
  4. 수정 후 `diff` 검토 및 통합 테스트.

## 5. 주의 사항 (Cautions)
- **DB 스키마**:  PostgreSQL에서 DDL만 전체 읽고 (개발 또는 계획) 작성에 임한다.
- **환경 변수**: `.env` 및 `application.properties`의 중요 설정값이 덮어씌워지지 않도록 주의하라.
- **비ASCII**: 주석 외의 코드 영역에서는 가급적 ASCII 문자를 사용하되, 사용자 메시지는 한글을 원칙으로 한다.

## 6. 완료 기준 (Definition of Done)
- 버그가 해결되고 의도한 기능이 정상 작동함.
- 수정된 코드에 디버깅 로그 및 주석이 포함됨.
- 관련 테스트(존재 시)를 통과함.
- 수정 결과에 대한 가독성 있는 요약 보고서 제출.
