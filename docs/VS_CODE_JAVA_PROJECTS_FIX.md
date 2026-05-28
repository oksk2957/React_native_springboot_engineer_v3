# VS Code Java Projects 오류 수정 가이드

## 1. 문제 개요

| 항목 | 내용 |
|------|------|
| 오류 메시지 | "Oops, something went wrong when opening Java projects" |
| 발생 위치 | VS Code → Explorer → JAVA PROJECTS 뷰 |
| 영향 | Java 코드 탐색, 디버깅, 빌드 기능 제한 |

## 2. 원인 분석

현재 작업공간 루트(`c:/Users/SEOL/InformationExamProject`)는 React Native/Expo + Spring Boot 백엔드가 혼합된 구조입니다. VS Code Java Extension은 루트에서 Maven 프로젝트를 찾으려 하지만, `backend/pom.xml`이 하위 디렉토리에 있어 인식하지 못할 수 있습니다.

```
InformationExamProject/          <-- VS Code Workspace Root (여기에 pom.xml 없음)
├── .vscode/settings.json        <-- 수정 완료
├── backend/
│   ├── pom.xml                  <-- 실제 Maven 프로젝트
│   └── src/main/java/...
├── InformationExamApp/          <-- React Native/Expo
└── ...
```

## 3. 수정 계획

### 3.1 단계 1: VS Code 설정 파일 수정 (완료)

파일: `.vscode/settings.json`

```json
{
    "java.configuration.updateBuildConfiguration": "automatic",
    "java.import.exclusions": [
        "**/node_modules/**",
        "**/.git/**",
        "**/build/**",
        "**/target/**"
    ],
    "java.import.gradle.enabled": false,
    "java.import.gradle.wrapper.enabled": false,
    "java.compile.nullAnalysis.mode": "automatic",
    "java.dependency.packagePresentation": "hierarchical",
    "java.import.maven.enabled": true,
    "java.project.importOnFirstTimeStartup": "automatic"
}
```

**변경 사항:**
- `java.import.maven.enabled`: `true` (Maven 프로젝트 자동 인식)
- `java.project.importOnFirstTimeStartup`: `automatic` (시작 시 자동 임포트)

### 3.2 단계 2: Workspace에 backend 폴더 추가 (권장)

VS Code에서 `backend/` 폴더를 Workspace에 직접 추가하여 Java Extension이 프로젝트를 인식하도록 합니다.

**방법:**
1. VS Code에서 `File` → `Add Folder to Workspace...` 클릭
2. `backend/` 폴더 선택
3. Workspace 저장

**또는** `backend` 폴더를 별도 VS Code 창으로 열기:
```bash
cd backend
code .
```

### 3.3 단계 3: Java Extension Pack 재설치

VS Code 명령 팔레트 (`Ctrl+Shift+P`)에서 다음 실행:

```
Java: Clean the Java Language Server Workspace
Java: Reload Projects
```

**또는** Extension Pack 재설치:
1. Extensions 뷰 (`Ctrl+Shift+X`) 열기
2. "Java Extension Pack" 검색
3. "Uninstall" 후 "Install"

### 3.4 단계 4: Workspace Trust 확인

1. `Ctrl+Shift+P` → `Workspace: Manage Workspace Trust`
2. 현재 Workspace가 "Trusted"로 설정되어 있는지 확인

## 4. 대안: 루트 pom.xml 생성 (멀티모듈)

프로젝트 루트에 `pom.xml`을 생성하여 멀티모듈 프로젝트로 구성할 수 있습니다.

파일: `pom.xml` (루트)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.informationexam</groupId>
    <artifactId>information-exam-root</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    
    <modules>
        <module>backend</module>
    </modules>
</project>
```

## 5. 검증 방법

| 단계 | 작업 | 예상 결과 |
|------|------|----------|
| 1 | VS Code 재시작 | Java Extension 초기화 |
| 2 | JAVA PROJECTS 뷰 확인 | 프로젝트 트리 정상 표시 |
| 3 | `backend/src/main/java` 파일 열기 | 문법 하이라이팅, 자동완성 작동 |
| 4 | `Ctrl+Shift+P` → `Java: Build Workspace` | 빌드 성공 |

## 6. 결론

- **즉시 적용 권장**: 단계 1 (`.vscode/settings.json` 수정) + 단계 2 (Workspace 폴더 추가)
- **근본 해결**: 단계 4 (루트 `pom.xml` 생성) - 멀티모듈 프로젝트 구조 확장 시 유리
