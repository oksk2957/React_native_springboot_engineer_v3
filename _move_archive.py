# -*- coding: utf-8 -*-
import os, shutil

base = r'C:\Users\SEOL\.openclaude\projects\C--project-React-native-springboot-engineer-v3\memory\plan_미완료'
archive = os.path.join(base, 'archive')
os.makedirs(archive, exist_ok=True)

# All files to archive
to_archive = [
    '미완료7-종합분석.md', '미완료9-DB마이그레이션-실행대기.md',
    '미완료10-백엔드서버-재시작필요.md', '미완료11-JWT-Secret-설정오류.md',
    '미완료12-AnswerService-null체크-모순.md', '미완료13-application-properties-JWT-하드코딩.md',
    '미완료14-api-ts-console-log-정리.md', '미완료15-SupabaseTokenVerifier-JWT-서명검증.md',
    '미완료16-team_공유메모리-구버전-정리.md', '미완료18-name-필드-오류-수정.md',
    '미완료22-subjectId-0-non-objective-types.md', '미완료23-IDOR-wrong-answers-endpoint.md',
    '미완료24-500-에러-3종-동시-발생-근본-원인-분석.md', '미완료25-SubjectApiController-신규추가.md',
    '미완료26-StatisticsScreen-과목별랭킹UI.md', '미완료27-api-401-자동로그아웃.md',
    '미완료28-MypageStatisticsMapper-오답쿼리추가.md', '미완료30-IDOR-취약점-지속.md',
    '미완료31-UserService-코드중복-삭제.md', '미완료32-supabase-jwt-secret-empty.md',
    '미완료33-application-properties-DB-비밀번호-노출.md', '미완료34-memory-루트-미분류파일-산재.md',
    '미완료35-anon-key-하드코딩.md', '미완료36-statistics-userId-불일치.md',
    '미완료37-problemService-console-log.md', '미완료38-memory-신경망-연결상태.md',
    '미완료39-SecurityConfig-permitAll-인증없음.md', '미완료40-CORS-와일드카드-전체허용.md',
    '미완료42-sbp-key-JWT-Secret-오사용.md', '미완료43-UserController-new-JwtTokenProvider-크래시.md',
    '미완료44-SUBJECTIVE-validation-누락.md', '미완료45-레거시-중복-파일-잔존.md',
    '미완료47-통계탭-오답랭킹-구현.md', '미완료48-Dual-Navigator-데드코드.md',
    '미완료49-AuthScreen-이중-OAuth-플로우.md', '미완료50-authToken-이중-저장.md',
    '미완료51-refresh-endpoint-부재.md', '미완료52-DB-마이그레이션-이중-체계.md',
    '미완료53-System-out-println-남용.md', '미완료53-프론트엔드-포트-불일치.md',
    '미완료54-TheoryMapper-중복-파일.md', '미완료55-SupabaseTokenVerifier-unsigned-decode.md',
    '미완료56-HomeScreen-중복-파일.md', '미완료56-System.out-println-남용.md',
    '미완료57-application-properties-anon-key-하드코딩.md', '미완료57-category-불일치.md',
    '미완료58-토큰-삼중-write.md', '미완료59-App-tsx-bare-console.md',
    '미완료60-theoryApi-중복-import.md', '미완료61-TheoryScreen-submitAnswer-로직.md',
    '미완료63-StatisticsScreen-문제상세이동-TODO.md', '미완료64-ServerScreen-네비게이션-고아.md',
    '미완료65-Shuffle-알고리즘-불일치.md', '미완료66-GoogleTokenVerifierService-데드코드.md',
    '미완료67-logger-ts-untracked.md', '미완료68-HomeScreen-orphan-파일.md',
    '미완료70-Auth-폴더-반만-정리.md', '미완료75-TheoryMapper-중복쿼리.md',
    '미완료76-git-삭제-5개-미커밋.md', '2026-06-07- 미완료.md',
    '수정계획안01_보안-취약점-수정.md', '수정실행계획서-2026-06-08.md',
]

moved = 0
not_found = []
for f in to_archive:
    src = os.path.join(base, f)
    dst = os.path.join(archive, f)
    if os.path.exists(src):
        shutil.move(src, dst)
        moved += 1
    else:
        not_found.append(f)

print(f'Moved: {moved}')
if not_found:
    print(f'Not found ({len(not_found)}):')
    for f in not_found:
        print(f'  {f}')
