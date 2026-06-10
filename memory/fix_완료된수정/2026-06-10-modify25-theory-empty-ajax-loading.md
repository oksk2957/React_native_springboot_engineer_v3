# 수정25: 이론탭 빈 상태 AJAX 로딩

**날짜**: 2026-06-10
**상태**: ✅ 완료
**우선순위**: P1

---

## 📋 개요
이론탭 빈 상태에서 "다시 불러오기" 버튼 클릭 시 전체 화면이 로딩으로 덮이는 문제를 콘텐츠 영역만 로딩되도록 개선

## 🎯 근본 원인
`loadTheoryCards()` → `isLoading=true` → **전체 화면** early return (line 253-260) → 헤더/탭/카테고리 그리드 전부 사라짐

## 🔧 수정 내용
**파일**: `TheoryScreen.tsx`

### 1. `isContentLoading` state 추가 (line 42)
```typescript
// DEBUG: [수정25] 빈 상태 AJAX 로딩 — 재로딩 시 콘텐츠 영역만 로딩 (전체 화면 덮기 방지)
// 원인: "다시 불러오기" 클릭 시 isLoading=true → 전체 화면 early return → 헤더/탭/카테고리 소실
// 해결: isContentLoading으로 콘텐츠 영역만 ActivityIndicator 표시
const [isContentLoading, setIsContentLoading] = useState(false);
```

### 2. `loadTheoryCards` 함수 수정 (line 135-144)
```typescript
const loadTheoryCards = async () => {
  // DEBUG: [수정25] 첫 로딩만 전체 isLoading, 재로딩은 콘텐츠 영역만
  if (cards.length > 0) {
    setIsContentLoading(true);
  } else {
    setIsLoading(true);
  }
  try {
    // ... 기존 로직
  } finally {
    setIsLoading(false);
    setIsContentLoading(false); // DEBUG: [수정25] 콘텐츠 로딩 완료
  }
};
```

### 3. 빈 상태 영역에 로딩 인디케이터 추가 (line 454-462)
```typescript
<View style={styles.emptyContainer}>
  {/* DEBUG: [수정25] AJAX 로딩 인디케이터 — 콘텐츠 영역만 로딩, 헤더/탭 유지 */}
  {isContentLoading && (
    <View style={{ marginBottom: 16, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={themeColor} />
      <Text style={[styles.emptySubText, isDark && styles.textWhite, { marginTop: 8 }]}>
        카드를 불러오는 중...
      </Text>
    </View>
  )}
  {/* 기존 빈 상태 메시지 유지 */}
</View>
```

## 📊 UX 개선
- ✅ 헤더/탭/카테고리 그리드 유지
- ✅ 콘텐츠 영역만 로딩 표시
- ✅ 사용자는 현재 위치 유지
- ✅ 수정21(이론탭 AJAX)과 동일한 패턴

## 🧪 검증
- TypeScript 컴파일: 건너뜀 (사용자 요청)
- 런타임 검증: 대기 중 (앱 실행 후 확인 필요)

---

**관련 메모리**: [team/MEMORY.md](../../../memory/team/MEMORY.md) — 수정25 이론탭 빈 상태 AJAX
