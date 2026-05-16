package com.example.informationexam.service;

import com.example.informationexam.domain.problem.ProblemType;
import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.problem.ProgrammingLanguageProblemRepository;
import com.example.informationexam.domain.problem.SubjectiveProblemRepository;
import com.example.informationexam.domain.statistics.UserStatistics;
import com.example.informationexam.domain.statistics.UserStatisticsRepository;
import com.example.informationexam.domain.useranswer.UserAnswerRepository;
import com.example.informationexam.dto.statistics.HeatmapDayRow;
import com.example.informationexam.mapper.MypageStatisticsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StatisticsService {

    private final ProblemRepository problemRepository;
    private final SubjectiveProblemRepository subjectiveProblemRepository;
    private final ProgrammingLanguageProblemRepository programmingLanguageProblemRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final MypageStatisticsMapper mypageStatisticsMapper;
    private final UserStatisticsRepository userStatisticsRepository;

    /**
     * 전체 통계 조회 (get_user_statistics, user_statistics 기반 영역 성취도, 100일 잔디)
     */
    public Map<String, Object> getOverallStatistics(Long userId) {
        Map<String, Object> stats = new HashMap<>();

        applyDbFunctionSummary(userId, stats);

        long totalObjective = problemRepository.countByType(ProblemType.OBJECTIVE.name());
        long totalSubjective = subjectiveProblemRepository.count();
        long totalProgramming = programmingLanguageProblemRepository.count();
        long totalProblemsLegacy = totalObjective + totalSubjective + totalProgramming;

        long solvedObjective = userAnswerRepository.countByUserIdAndProblemType(userId, "OBJECTIVE");
        long solvedSubjective = userAnswerRepository.countByUserIdAndProblemType(userId, "SUBJECTIVE");
        long solvedProgramming = userAnswerRepository.countByUserIdAndProblemType(userId, "PROGRAMMING_LANGUAGE");
        long solvedProblemsLegacy = solvedObjective + solvedSubjective + solvedProgramming;

        long correctObjective = userAnswerRepository.countCorrectByUserIdAndProblemType(userId, "OBJECTIVE");
        long correctSubjective = userAnswerRepository.countCorrectByUserIdAndProblemType(userId, "SUBJECTIVE");
        long correctProgramming = userAnswerRepository.countCorrectByUserIdAndProblemType(userId, "PROGRAMMING_LANGUAGE");
        long correctCountLegacy = correctObjective + correctSubjective + correctProgramming;

        long wrongCountLegacy = solvedProblemsLegacy - correctCountLegacy;

        stats.putIfAbsent("totalProblems", totalProblemsLegacy);
        stats.putIfAbsent("solvedProblems", solvedProblemsLegacy);
        stats.putIfAbsent("correctCount", correctCountLegacy);
        stats.putIfAbsent("wrongCount", wrongCountLegacy);

        long correctCount = toLong(stats.get("correctCount"));
        long wrongCount = toLong(stats.get("wrongCount"));
        long attemptRows = correctCount + wrongCount;
        double accuracyRate = attemptRows > 0
                ? Math.round((double) correctCount / attemptRows * 1000) / 10.0
                : 0.0;
        stats.put("accuracyRate", accuracyRate);

        List<Map<String, Object>> branchStats = new ArrayList<>();
        branchStats.add(branchStat("OBJECTIVE", totalObjective, solvedObjective, correctObjective));
        branchStats.add(branchStat("SUBJECTIVE", totalSubjective, solvedSubjective, correctSubjective));
        branchStats.add(branchStat("PROGRAMMING_LANGUAGE", totalProgramming, solvedProgramming, correctProgramming));
        stats.put("branchStats", branchStats);

        stats.put("branchPerformance", buildBranchPerformanceFromUserStatistics(
                userId, totalObjective, totalSubjective, totalProgramming));

        List<Map<String, Object>> categoryStats = new ArrayList<>();
        categoryStats.add(categoryStat("OBJECTIVE", solvedObjective, correctObjective));
        categoryStats.add(categoryStat("SUBJECTIVE", solvedSubjective, correctSubjective));
        categoryStats.add(categoryStat("PROGRAMMING_LANGUAGE", solvedProgramming, correctProgramming));
        stats.put("categoryStats", categoryStats);

        stats.put("studyHeatmap", buildStudyHeatmap(userId));

        stats.put("userId", userId);
        return stats;
    }

    private void applyDbFunctionSummary(Long userId, Map<String, Object> stats) {
        try {
            Map<String, Object> row = mypageStatisticsMapper.selectUserStatisticsFromFunction(userId);
            if (row == null || row.isEmpty()) {
                return;
            }
            stats.put("totalProblems", toLong(row.get("total_problems")));
            stats.put("solvedProblems", toLong(row.get("solved_problems")));
            stats.put("correctCount", toLong(row.get("correct_count")));
            stats.put("wrongCount", toLong(row.get("wrong_count")));
        } catch (Exception ignored) {
            // DB 함수 미배포 등 — 레거시 JPA 집계로 대체
        }
    }

    private List<Map<String, Object>> buildBranchPerformanceFromUserStatistics(
            Long userId,
            long totalObjectivePool,
            long totalSubjectivePool,
            long totalProgrammingPool) {

        List<UserStatistics> rows = userStatisticsRepository.findByUserId(userId);
        long objAttempted = 0;
        long objWrong = 0;
        long subAttempted = 0;
        long subWrong = 0;
        long progAttempted = 0;
        long progWrong = 0;

        for (UserStatistics us : rows) {
            String b = us.getBranch();
            int ta = us.getTotalAttempted() != null ? us.getTotalAttempted() : 0;
            int ic = us.getIncorrectCount() != null ? us.getIncorrectCount() : 0;
            switch (b) {
                case "OBJECTIVE" -> {
                    objAttempted += ta;
                    objWrong += ic;
                }
                case "SUBJECTIVE" -> {
                    subAttempted += ta;
                    subWrong += ic;
                }
                case "PROGRAMMING_LANGUAGE" -> {
                    progAttempted += ta;
                    progWrong += ic;
                }
                default -> {
                }
            }
        }

        List<Map<String, Object>> list = new ArrayList<>();
        list.add(branchPerformanceRow("OBJECTIVE", objAttempted, objWrong, totalObjectivePool));
        list.add(branchPerformanceRow("SUBJECTIVE", subAttempted, subWrong, totalSubjectivePool));
        list.add(branchPerformanceRow("PROGRAMMING_LANGUAGE", progAttempted, progWrong, totalProgrammingPool));
        return list;
    }

    private Map<String, Object> branchPerformanceRow(String branch, long attempted, long wrong, long poolTotal) {
        long numerator = Math.max(0, attempted - wrong);
        double achievement = poolTotal > 0
                ? Math.round((double) numerator / poolTotal * 1000) / 10.0
                : 0.0;
        Map<String, Object> m = new HashMap<>();
        m.put("branch", branch);
        m.put("attempted", attempted);
        m.put("wrong", wrong);
        m.put("numerator", numerator);
        m.put("poolTotal", poolTotal);
        m.put("achievementRate", achievement);
        return m;
    }

    private List<Map<String, Object>> buildStudyHeatmap(Long userId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(99);
        List<HeatmapDayRow> rows = mypageStatisticsMapper.selectDailyAnswerCountsSince(userId, start);
        Map<String, Long> byDay = rows.stream().collect(Collectors.toMap(
                HeatmapDayRow::getStudyDate,
                r -> r.getAnswerCount() != null ? r.getAnswerCount() : 0L,
                Long::sum));

        List<Map<String, Object>> heatmap = new ArrayList<>(100);
        for (int i = 0; i < 100; i++) {
            LocalDate d = start.plusDays(i);
            String key = d.toString();
            long cnt = byDay.getOrDefault(key, 0L);
            Map<String, Object> cell = new HashMap<>();
            cell.put("date", key);
            cell.put("count", cnt);
            cell.put("level", heatmapLevel(cnt));
            heatmap.add(cell);
        }
        return heatmap;
    }

    private int heatmapLevel(long count) {
        if (count <= 0) {
            return 0;
        }
        if (count <= 5) {
            return 1;
        }
        if (count <= 10) {
            return 2;
        }
        if (count <= 15) {
            return 3;
        }
        if (count <= 20) {
            return 4;
        }
        if (count <= 25) {
            return 5;
        }
        if (count <= 30) {
            return 6;
        }
        return 7;
    }

    private static Map<String, Object> branchStat(
            String problemType,
            long totalProblems,
            long solved,
            long correct) {
        Map<String, Object> m = new HashMap<>();
        m.put("problemType", problemType);
        m.put("totalProblems", totalProblems);
        m.put("solvedProblems", solved);
        m.put("correctCount", correct);
        m.put("accuracyRate", solved > 0 ? Math.round((double) correct / solved * 1000) / 10.0 : 0);
        return m;
    }

    private static Map<String, Object> categoryStat(String category, long total, long correct) {
        Map<String, Object> m = new HashMap<>();
        m.put("category", category);
        m.put("total", total);
        m.put("correct", correct);
        m.put("accuracyRate", total > 0 ? Math.round((double) correct / total * 1000) / 10.0 : 0);
        return m;
    }

    private static long toLong(Object v) {
        if (v == null) {
            return 0L;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        if (v instanceof BigDecimal bd) {
            return bd.longValue();
        }
        return Long.parseLong(v.toString());
    }

    public long getSubjectiveRemainingCount(Long userId) {
        long totalSubjective = subjectiveProblemRepository.count();
        if (userId == null) {
            return totalSubjective;
        }
        long solvedSubjective = userAnswerRepository.countByUserIdAndProblemType(userId, "SUBJECTIVE");
        return Math.max(0, totalSubjective - solvedSubjective);
    }

    public long getSubjectiveTotalCount() {
        return subjectiveProblemRepository.count();
    }
}
