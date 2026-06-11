import re
import sys

filepath = r'C:\project\React_native_springboot_engineer_v3\InformationExamApp\src\screens\StatisticsScreen.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content
print(f"File length: {len(content)} chars")

# EDIT 1: Replace states section
old_states = """  const [wrongAnswerRanking, setWrongAnswerRanking] = useState<WrongAnswerRankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true); // DEBUG: [수정44-2026-06-11] 달력 AJAX 로딩
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 30;"""

new_states = """  // DEBUG: [수정45-2026-06-11] 랭킹 top 50 한 번에 표시, 더보기 제거, 킹 섹션만 AJAX 로딩
  const [wrongAnswerRanking, setWrongAnswerRanking] = useState<WrongAnswerRankingItem[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [rankingError, setRankingError] = useState<string | null>(null);"""

if old_states in content:
    content = content.replace(old_states, new_states)
    print("EDIT 1 OK: States replaced")
else:
    print("EDIT 1 FAIL: States block not found", file=sys.stderr)

# EDIT 2: Replace fetchRanking function
old_fetch = """  const fetchRanking = useCallback(async (reset: boolean = true) => {
    if (!isAuthenticated || !user?.id) {
      setWrongAnswerRanking([]);
      setIsLoading(false);
      setErrorMessage('로그인이 필요합니다.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // DEBUG: [AI-AUTHOR-2026-06-09-수정계획안08] 오답 카운트 랭킹 조회 (페이징)
      const startOffset = reset ? 0 : offset;
      const data = await statisticsService.getWrongAnswerRanking(startOffset, PAGE_SIZE);
      if (reset) {
        setWrongAnswerRanking(data ?? []);
        setOffset(data.length);
      } else {
        setWrongAnswerRanking(prev => [...prev, ...(data ?? [])]);
        setOffset(prev => prev + data.length);
      }
      setHasMore(data.length >= PAGE_SIZE);
    } catch (error: any) {
      console.error('[WrongAnswerRanking] Failed to fetch:', error);
      setErrorMessage(error?.response?.data?.message ?? '랭킹을 불러오지 못했습니다.');
      setWrongAnswerRanking([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isAuthenticated, user?.id, offset]);"""

new_fetch = """  // DEBUG: [수정45-2026-06-11] 랭킹 top 50 한 번에 fetch (페이징 제거)
  const fetchRanking = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setWrongAnswerRanking([]);
      setIsRankingLoading(false);
      setRankingError('로그인이 필요합니다.');
      return;
    }
    setIsRankingLoading(true);
    setRankingError(null);
    try {
      const data = await statisticsService.getWrongAnswerRanking(0, 50);
      setWrongAnswerRanking(data ?? []);
    } catch (error: any) {
      console.error('[WrongAnswerRanking] Failed to fetch:', error);
      setRankingError(error?.response?.data?.message ?? '랭킹을 불러오지 못했습니다.');
      setWrongAnswerRanking([]);
    } finally {
      setIsRankingLoading(false);
    }
  }, [isAuthenticated, user?.id]);"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    print("EDIT 2 OK: fetchRanking replaced")
else:
    print("EDIT 2 FAIL: fetchRanking block not found", file=sys.stderr)

# EDIT 3: Remove handleLoadMore
old_loadmore = """  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      fetchRanking(false);
    }
  };"""

if old_loadmore in content:
    content = content.replace(old_loadmore, "")
    print("EDIT 3 OK: handleLoadMore removed")
else:
    print("EDIT 3 FAIL: handleLoadMore not found", file=sys.stderr)

# EDIT 4: Remove full-screen loading + error returns
old_fullscreen = """  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.chartLabelDark]}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRanking()}>
          <Text style={styles.retryBtnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }"""

if old_fullscreen in content:
    content = content.replace(old_fullscreen, "")
    print("EDIT 4 OK: Full-screen loading/error removed")
else:
    print("EDIT 4 FAIL: Full-screen block not found", file=sys.stderr)

# EDIT 5: Update hint text
old_hint = "문제별 오답 수 (메달 TOP3, 4~30위 번호, 31위+ 게시판)"
new_hint = "문제별 오답 수 (메달 TOP3, 4~50위 번호)"

if old_hint in content:
    content = content.replace(old_hint, new_hint)
    print("EDIT 5 OK: Hint text updated")
else:
    print("EDIT 5 FAIL: Hint text not found", file=sys.stderr)

# EDIT 6: Add AJAX loading inline in ranking section
old_ranking_block = """          {wrongAnswerRanking.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDark && styles.chartLabelDark]}>
                오답 데이터가 없습니다
              </Text>
            </View>
          ) : (
            <>
              {wrongAnswerRanking.map((item, index) => {"""

new_ranking_block = """          {/* DEBUG: [수정45-2026-06-11] 랭킹 섹션만 AJAX 로딩 */}
          {isRankingLoading ? (
            <View style={styles.ajaxLoadingContainer}>
              <ActivityIndicator size="small" color="#4a90e2" />
              <Text style={[styles.ajaxLoadingText, isDark && styles.chartLabelDark]}>
                랭킹 불러오는 중...
              </Text>
            </View>
          ) : rankingError ? (
            <View style={styles.ajaxErrorContainer}>
              <Text style={[styles.ajaxErrorText, isDark && styles.chartLabelDark]}>
                {rankingError}
              </Text>
              <TouchableOpacity style={styles.ajaxRetryBtn} onPress={fetchRanking}>
                <Text style={styles.ajaxRetryBtnText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : wrongAnswerRanking.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDark && styles.chartLabelDark]}>
                오답 데이터가 없습니다
              </Text>
            </View>
          ) : (
            <>
              {wrongAnswerRanking.map((item, index) => {"""

if old_ranking_block in content:
    content = content.replace(old_ranking_block, new_ranking_block)
    print("EDIT 6 OK: AJAX loading inline added")
else:
    print("EDIT 6 FAIL: Ranking block not found", file=sys.stderr)

# EDIT 7: Remove "더보기" button
old_more_button = """              {hasMore && (
                <TouchableOpacity
                  style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonDisabled]}
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.loadMoreText}>더보기 (다음 30건)</Text>
                  )}
                </TouchableOpacity>
              )}"""

if old_more_button in content:
    content = content.replace(old_more_button, "")
    print("EDIT 7 OK: 더보기 button removed")
else:
    print("EDIT 7 FAIL: 더보기 button not found", file=sys.stderr)

# EDIT 8: Remove loadMoreButton-related styles
old_loadmore_styles = """  loadMoreButton: {
    margin: 16,
    padding: 14,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },"""

if old_loadmore_styles in content:
    content = content.replace(old_loadmore_styles, "")
    print("EDIT 8 OK: loadMore styles removed")
else:
    print("EDIT 8 FAIL: loadMore styles not found", file=sys.stderr)

# EDIT 9: Add AJAX loading styles after sectionDark
old_section_dark = """  sectionDark: {
    backgroundColor: '#2d2d2d',
  },"""

new_section_dark = """  sectionDark: {
    backgroundColor: '#2d2d2d',
  },
  // DEBUG: [수정45-2026-06-11] 랭킹 섹션 AJAX 로딩/에러 스타일
  ajaxLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  ajaxLoadingText: {
    fontSize: 13,
    color: '#718096',
    marginTop: 8,
  },
  ajaxErrorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  ajaxErrorText: {
    fontSize: 13,
    color: '#e53e3e',
    marginBottom: 8,
  },
  ajaxRetryBtn: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  ajaxRetryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },"""

if old_section_dark in content:
    content = content.replace(old_section_dark, new_section_dark)
    print("EDIT 9 OK: AJAX styles added")
else:
    print("EDIT 9 FAIL: sectionDark styles not found", file=sys.stderr)

# Write the result
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nDone! File changed: {original != content}")
print(f"Original: {len(original)} chars, New: {len(content)} chars")
