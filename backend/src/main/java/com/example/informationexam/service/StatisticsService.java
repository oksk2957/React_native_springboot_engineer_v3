package com.example.informationexam.service;

import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.problem.ProblemType;
import com.example.informationexam.domain.problem.Subject;
import com.example.informationexam.domain.problem.SubjectRepository;
import com.example.informationexam.domain.problem.ProgrammingLanguageProblemRepository;
import com.example.informationexam.domain.problem.SubjectiveProblemRepository;
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

    /**
     * 전체 통계 조회 (세 가지 문제 유형 포함)
     */
    public Map<String, Object> getOverallStatistics(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        // 각 유형별 문제 수
        long totalObjective = problemRepository.count();
        long totalSubjective = subjectiveProblemRepository.count();
        long totalProgramming = programmingLanguageProblemRepository.count();
        long totalProblems = totalObjective + totalSubjective + totalProgramming;
        
        // 사용자별 통계
        long solvedObjective = userAnswerRepository.countByUserIdAndProblemType(userId, "OBJECTIVE");
        long solvedSubjective = userAnswerRepository.countByUserIdAndProblemType(userId, "SUBJECTIVE");
        long solvedProgramming = userAnswerRepository.countByUserIdAndProblemType(userId, "PROGRAMMING_LANGUAGE");
        long solvedProblems = solvedObjective + solvedSubjective + solvedProgramming;
        
        // 정답 수
        long correctObjective = userAnswerRepository.countCorrectByUserIdAndProblemType(userId, "OBJECTIVE");
        long correctSubjective = userAnswerRepository.countCorrectByUserIdAndProblemType(userId, "SUBJECTIVE");
        long correctProgramming = userAnswerRepository.countCorrectByUserIdAndProblemType(userId, "PROGRAMMING_LANGUAGE");
        long correctCount = correctObjective + correctSubjective + correctProgramming;
        
        long wrongCount = solvedProblems - correctCount;
        
        stats.put("totalProblems", totalProblems);
        stats.put("solvedProblems", solvedProblems);
        stats.put("correctCount", correctCount);
        stats.put("wrongCount", wrongCount);
        
        // 문제 유형별 통계
        List<Map<String, Object>> branchStats = new ArrayList<>();
        
        // OBJECTIVE 통계
        Map<String, Object> objectiveStat = new HashMap<>();
        objectiveStat.put("problemType", "OBJECTIVE");
        objectiveStat.put("totalProblems", totalObjective);
        objectiveStat.put("solvedProblems", solvedObjective);
        objectiveStat.put("correctCount", correctObjective);
        objectiveStat.put("accuracyRate", solvedObjective > 0 ? 
                Math.round((double) correctObjective / solvedObjective * 100 * 10) / 10.0 : 0);
        branchStats.add(objectiveStat);
        
        // SUBJECTIVE 통계
        Map<String, Object> subjectiveStat = new HashMap<>();
        subjectiveStat.put("problemType", "SUBJECTIVE");
        subjectiveStat.put("totalProblems", totalSubjective);
        subjectiveStat.put("solvedProblems", solvedSubjective);
        subjectiveStat.put("correctCount", correctSubjective);
        subjectiveStat.put("accuracyRate", solvedSubjective > 0 ? 
                Math.round((double) correctSubjective / solvedSubjective * 100 * 10) / 10.0 : 0);
        branchStats.add(subjectiveStat);
        
        // PROGRAMMING_LANGUAGE 통계
        Map<String, Object> programmingStat = new HashMap<>();
        programmingStat.put("problemType", "PROGRAMMING_LANGUAGE");
        programmingStat.put("totalProblems", totalProgramming);
        programmingStat.put("solvedProblems", solvedProgramming);
        programmingStat.put("correctCount", correctProgramming);
        programmingStat.put("accuracyRate", solvedProgramming > 0 ? 
                Math.round((double) correctProgramming / solvedProgramming * 100 * 10) / 10.0 : 0);
        branchStats.add(programmingStat);
        
        stats.put("branchStats", branchStats);
        
        // 과목별 통계 (OBJECTIVE만 해당)
        List<Subject> subjects = subjectRepository.findAll();
        List<Map<String, Object>> categoryStats = new ArrayList<>();
        
        for (Subject subject : subjects) {
            Map<String, Object> categoryStat = new HashMap<>();
            long categoryTotal = userAnswerRepository.countTotalByCategory(userId);
            long categoryCorrect = userAnswerRepository.countCorrectByCategory(userId, subject.getName());
            
            categoryStat.put("category", subject.getName());
            categoryStat.put("total", categoryTotal);
            categoryStat.put("correct", categoryCorrect);
            categoryStat.put("accuracyRate", categoryTotal > 0 ? 
                    Math.round((double) categoryCorrect / categoryTotal * 100 * 10) / 10.0 : 0);
            categoryStats.add(categoryStat);
        }
        
        stats.put("categoryStats", categoryStats);
        return stats;
    }

    public long getSubjectiveRemainingCount(Long userId) {
        long totalSubjective = subjectiveProblemRepository.count();
        if (userId == null) return totalSubjective;
        
        // 사용자가 푼 주관식 문제 수를 가져옴
        long solvedSubjective = userAnswerRepository.countByUserIdAndProblemType(userId, "SUBJECTIVE");
        
        return Math.max(0, totalSubjective - solvedSubjective);
    }
    
    public long getSubjectiveTotalCount() {
        return subjectiveProblemRepository.count();
    }
}