package com.example.informationexam.service;

import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.problem.ProblemType;
import com.example.informationexam.domain.problem.Subject;
import com.example.informationexam.domain.problem.SubjectRepository;
import com.example.informationexam.domain.problem.ProgrammingLanguageProblemRepository;
import com.example.informationexam.domain.problem.SubjectiveProblemRepository;
import com.example.informationexam.mapper.MypageStatisticsMapper;
import com.example.informationexam.domain.useranswer.UserAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StatisticsService {

    private final ProblemRepository problemRepository;
    private final SubjectiveProblemRepository subjectiveProblemRepository;
    private final ProgrammingLanguageProblemRepository programmingLanguageProblemRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final SubjectRepository subjectRepository;
    private final MypageStatisticsMapper mypageStatisticsMapper;

    /**
     * 전체 통계 조회 (세 가지 문제 유형 포함)
     */
    public Map<String, Object> getOverallStatistics(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        Map<String, Object> overall = mypageStatisticsMapper.selectUserAnswerOverall(userId);

        long totalObjective = problemRepository.countByType(ProblemType.OBJECTIVE.name());
        long totalSubjective = subjectiveProblemRepository.count();
        long totalProgramming = programmingLanguageProblemRepository.count();
        long totalProblems = totalObjective + totalSubjective + totalProgramming;

        long solvedProblems = toLong(overall.get("attempted"));
        long correctCount = toLong(overall.get("correct"));
        long wrongCount = Math.max(0, solvedProblems - correctCount);

        stats.put("totalProblems", totalProblems);
        stats.put("solvedProblems", solvedProblems);
        stats.put("correctCount", correctCount);
        stats.put("wrongCount", wrongCount);

        List<Map<String, Object>> branchStats = new ArrayList<>();
        mypageStatisticsMapper.selectBranchStats(userId).forEach(row -> {
            Map<String, Object> branchStat = new HashMap<>();
            long attempted = row.getAttempted();
            long correct = row.getCorrect();
            branchStat.put("problemType", row.getProblemType());
            branchStat.put("totalProblems", resolveTotalByType(row.getProblemType(), totalObjective, totalSubjective, totalProgramming));
            branchStat.put("solvedProblems", attempted);
            branchStat.put("correctCount", correct);
            branchStat.put("accuracyRate", attempted > 0 ? Math.round((double) correct / attempted * 100 * 10) / 10.0 : 0);
            branchStats.add(branchStat);
        });
        stats.put("branchStats", branchStats);

        List<Map<String, Object>> categoryStats = new ArrayList<>();
        mypageStatisticsMapper.selectObjectiveCategoryStats(userId).forEach(row -> {
            Map<String, Object> categoryStat = new HashMap<>();
            long total = row.getTotal();
            long correct = row.getCorrect();
            categoryStat.put("category", row.getCategory());
            categoryStat.put("total", total);
            categoryStat.put("correct", correct);
            categoryStat.put("accuracyRate", total > 0 ? Math.round((double) correct / total * 100 * 10) / 10.0 : 0);
            categoryStats.add(categoryStat);
        });

        stats.put("categoryStats", categoryStats);
        return stats;
    }

    public long getSubjectiveRemainingCount(Long userId) {
        long totalSubjective = subjectiveProblemRepository.count();
        if (userId == null) return totalSubjective;

        // MyBatis 통계와 별도로 단일 수치만 반환하는 기존 호환 경로
        long solvedSubjective = userAnswerRepository.countByUserIdAndProblemType(userId, "SUBJECTIVE");

        return Math.max(0, totalSubjective - solvedSubjective);
    }

    public long getSubjectiveTotalCount() {
        return subjectiveProblemRepository.count();
    }

    private long resolveTotalByType(String problemType, long totalObjective, long totalSubjective, long totalProgramming) {
        if ("OBJECTIVE".equals(problemType)) {
            return totalObjective;
        }
        if ("SUBJECTIVE".equals(problemType)) {
            return totalSubjective;
        }
        if ("PROGRAMMING_LANGUAGE".equals(problemType)) {
            return totalProgramming;
        }
        return 0;
    }

    private long toLong(Object value) {
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return 0;
    }
}
