# 오답탭 필터 sticky 수정 (2026-06-10)

**상태**: ✅ 완료
**우선순위**: 🟡 P1
**파일**: `InformationExamApp/src/screens/WrongAnswerScreen.tsx:391`
**해시**: `073600b72dbe53ba3dd05593497d0e92` → `8e8c07d7e05f3f94e14c6f83cf6b8e1a`

## 문제 현상
- 오답 노트 탭에서 필터 버튼(전체/객관식/주관식)과 문제 리스트가 함께 스크롤됨
- 필터 버튼이 상단에 고정되지 않아 매번 스크롤해야 하는 UX 저하

## 해결 방법
`<FlatList>`에 `style={{ flex: 1 }}` 추가 → 남은 공간을 FlatList가 차지하여 필터는 상단 고정, 리스트만 스크롤

## 변경 코드
```tsx
// Before
<FlatList
  data={wrongProblems}
  keyExtractor={(item) => item.id.toString()}

// After
<FlatList
  style={{ flex: 1 }}  // ✅ 추가
  data={wrongProblems}
  keyExtractor={(item) => item.id.toString()}
```

## 원리
- React Native에서 `<FlatList>`가 부모 View 안에서 flex를 차지하지 않으면 콘텐츠 크기만큼만 렌더링
- `flex: 1` 추가로 부모 View의 남은 공간을 모두 차지 → 필터 View는 상단 고정, FlatList 영역만 스크롤
- 무한스크롤 이미 구현되어 있으므로 추가 최적화 불필요

## 검증
- ✅ TypeScript 컴파일 통과
- ✅ diff 확인: 1줄 추가
- ⏳ 런타임 검증 대기 (앱 재시작 필요)

## 교훈
- Memory는 "완료" 기록했으나 코드에는 미적용 상태 → Memory-코드 불일치 재발
- React Native에서 sticky 헤더/필터 구현 시 스크롤 컴포넌트에 `flex: 1` 필수

---

**AI-AUTHOR**: 2026-06-10T15:30
**DEBUG**: [오답탭 필터 sticky — FlatList flex:1 추가]
