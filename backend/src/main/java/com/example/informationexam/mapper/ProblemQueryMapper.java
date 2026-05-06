package com.example.informationexam.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface ProblemQueryMapper {
    // ★ Map 반환으로 변경 (XML에서 alias로 DTO 필드와 매핑)
    Map<String, Object> selectById(@Param("id") Long id);
    List<Map<String, Object>> selectRandomProblems(@Param("limit") int limit);
    List<Map<String, Object>> selectRandomProblemsByType(@Param("type") String type, @Param("limit") int limit);
    List<Map<String, Object>> selectTheoryProblemsByCategory(@Param("category") String category, @Param("isProgramming") boolean isProgramming);
    List<Long> selectTheoryProblemIdsByCategory(@Param("category") String category, @Param("isProgramming") boolean isProgramming);
    List<Long> selectStudyIdsByDifficultyCategory(@Param("difficulty") int difficulty, @Param("category") String category, @Param("limit") int limit, @Param("isProgramming") boolean isProgramming);
    List<Long> selectStudyIdsByType(@Param("type") String type, @Param("limit") int limit);
    List<Long> selectRandomProblemIds(@Param("limit") int limit, @Param("excludeCategories") List<String> excludeCategories);
    String selectRandomCategoryName(@Param("excludeCategories") List<String> excludeCategories);
    List<Long> selectRandomProblemIdsByCategory(@Param("category") String category, @Param("limit") int limit, @Param("isProgramming") boolean isProgramming);
    List<Map<String, Object>> selectOneRandomProblemPerSubject(@Param("type") String type);
    List<Map<String, Object>> selectByDifficultyAndCategory(@Param("difficulty") int difficulty, @Param("category") String category, @Param("limit") int limit);
    long countAll();

    Map<String, Object> validateAnswerProc(
        @Param("p_problem_id") Long pProblemId,
        @Param("p_submitted_answer") String pSubmittedAnswer
    );

    // 객관식 랜덤학습용 메서드
    List<Map<String, Object>> selectRandomObjectiveProblems(@Param("limit") int limit);

    // 과목별 문제 개수 조회
    List<Map<String, Object>> countProblemsBySubject();
}
