package com.example.informationexam.service;

import com.example.informationexam.domain.problem.*;
import com.example.informationexam.dto.problem.ProblemResponseDto;
import com.example.informationexam.dto.problem.TheoryProblemMetaDto;
import com.example.informationexam.mapper.ProblemQueryMapper;
import com.example.informationexam.mapper.ProblemResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 문제 조회: MyBatis(XML) → SQL Row → DTO Assembler → API 레이어
 * 변경/연관 엔티티가 필요한 경로만 JPA {@link ProblemRepository} 사용 유지 서비스는 별도
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemQueryMapper problemQueryMapper;
    private final ProblemResponseAssembler problemResponseAssembler;

    /** 답변 제출 등 JPA 영속 계층 필요 시 사용하는 저장소(AnswerService 등에서 참조 가능하도록 레거시 제공) */
    private final ProblemRepository problemRepository;

    private static final java.util.Set<String> PROGRAMMING_LANGUAGES = java.util.Set.of(
        "C언어", "java", "python", "Java", "Python", "c언어", "C", "c"
    );

    public List<ProblemResponseDto> getProblemsByType(ProblemType type, int limit) {
        if (limit <= 0) {
            limit = Integer.MAX_VALUE;
        }
        List<ProblemResponseDto> list = problemResponseAssembler.toDtoList(
                problemQueryMapper.selectRandomProblemsByType(type.name(), limit));
        return list;
    }

    public List<ProblemResponseDto> getProblemsByCategory(String category, int limit) {
        if (limit <= 0) {
            limit = Integer.MAX_VALUE;
        }
        return problemResponseAssembler.toDtoList(
                problemQueryMapper.selectByDifficultyAndCategory(0, category, limit));
    }

    public TheoryProblemMetaDto getTheoryProblemMeta(String category) {
        List<Long> ids = problemQueryMapper.selectTheoryProblemIdsByCategory(category, PROGRAMMING_LANGUAGES.contains(category));
        return new TheoryProblemMetaDto(ids.size(), ids);
    }

    /**
     * 학습 화면(탭)·랜덤·주관식·객관식 풀: id 목록만 조회 후 프론트에서 GET /problems/{id}로 순차 조회.
     *
     * @param randomSample true면 전체 무작위 표본 id
     */
    public TheoryProblemMetaDto getStudyProblemMeta(
            boolean randomSample,
            ProblemType type,
            String category,
            int difficulty,
            String excludeCategories,
            int limit) {
        if (limit <= 0) {
            limit = Integer.MAX_VALUE;
        }
        List<Long> ids;
        if (randomSample) {
            List<String> excluded = (excludeCategories == null || excludeCategories.isBlank())
                    ? List.of()
                    : Arrays.stream(excludeCategories.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isBlank())
                            .collect(Collectors.toList());
            String nextCategory = problemQueryMapper.selectRandomCategoryName(excluded);
            if (nextCategory == null || nextCategory.isBlank()) {
                return new TheoryProblemMetaDto(0, List.of());
            }
            ids = problemQueryMapper.selectRandomProblemIdsByCategory(nextCategory, limit, PROGRAMMING_LANGUAGES.contains(nextCategory));
        } else if (category != null && !category.isBlank()) {
            String mapped = category.trim();
            ids = problemQueryMapper.selectStudyIdsByDifficultyCategory(difficulty, mapped, limit, PROGRAMMING_LANGUAGES.contains(mapped));
        } else if (type != null) {
            ids = problemQueryMapper.selectStudyIdsByType(type.name(), limit);
        } else {
            throw new IllegalArgumentException(
                    "randomSample 또는 category 또는 type 중 하나는 필수입니다.");
        }
        return new TheoryProblemMetaDto(ids.size(), ids);
    }

    public ProblemResponseDto getProblem(Long id) {
        ProblemResponseDto dto = problemResponseAssembler.toDto(problemQueryMapper.selectById(id));
        if (dto == null) {
            throw new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + id);
        }
        return dto;
    }

    public long getProblemCount() {
        return problemQueryMapper.countAll();
    }

    /**
     * 객관식 랜덤학습: 과목별 문제 + 옵션 1~5 포함
     */
    public List<ProblemResponseDto> getRandomObjectiveStudy(int limit) {
        // XML에서 isRandom 파라미터를 사용하여 랜덤 조회를 수행하므로 true 전달
        List<Map<String, Object>> problems = problemQueryMapper.selectRandomObjectiveProblems(true);
        return problemResponseAssembler.toDtoList(problems);
    }

    /**
     * 과목별 객관식 문제 개수 조회
     */
    public List<Map<String, Object>> getProblemCountsBySubject() {
        return problemQueryMapper.countProblemsBySubject();
    }

    /** 제출 채점: 엔티티 연관이 필요하므로 JPA 유지 */
    public boolean checkAnswer(Long problemId, String submittedAnswer) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + problemId));
        return problem.getAnswer().equalsIgnoreCase(submittedAnswer);
    }

    public Problem getProblemById(Long id) {
        return problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + id));
    }
}
