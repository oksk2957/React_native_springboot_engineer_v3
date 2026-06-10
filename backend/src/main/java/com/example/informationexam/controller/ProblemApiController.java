package com.example.informationexam.controller;

import com.example.informationexam.dto.problem.ProblemResponseDto;
import com.example.informationexam.dto.problem.TheoryProblemMetaDto;
import com.example.informationexam.dto.theory.TheoryCardDto;
import com.example.informationexam.mapper.ProblemQueryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemApiController {
    private final ProblemQueryMapper problemQueryMapper;

    private static final java.util.Set<String> PROGRAMMING_LANGUAGES = java.util.Set.of(
        "C언어", "java", "python", "Java", "Python", "c언어", "C", "c"
    );

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponseDto> getProblem(@PathVariable Long id) {
        log.info("[MVC2] 단건 문제 조회: id={}", id);
        Map<String, Object> map = problemQueryMapper.selectById(id);
        ProblemResponseDto dto = ProblemResponseDto.from(map);
        if (dto == null) {
            throw new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + id);
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/random/objective")
    public ResponseEntity<List<ProblemResponseDto>> getOneRandomProblemPerSubject() {
        log.info("[MVC2] 객관식 랜덤 문제 조회");
        List<Map<String, Object>> maps = problemQueryMapper.selectRandomObjectiveProblems(true);
        return ResponseEntity.ok(ProblemResponseDto.fromList(maps));
    }

    @GetMapping("/theory")
    public ResponseEntity<List<TheoryCardDto>> getTheoryCards(@RequestParam String category) {
        // DEBUG: [이론 카드 API] 요청 파라미터 로깅
        log.info("[MVC2] 이론 카드 조회 요청 - category: {}", category);
        
        List<Map<String, Object>> maps = problemQueryMapper.selectTheoryCardsByCategory(category);
        
        // DEBUG: [이론 카드 API] 쿼리 결과 로깅
        log.info("[MVC2] 이론 카드 쿼리 결과 - category: {}, 결과 수: {}", category, maps.size());
        if (!maps.isEmpty()) {
            log.debug("[MVC2] 첫 번째 결과 샘플: {}", maps.get(0));
        }

        List<TheoryCardDto> cardDtos = maps.stream()
            .map(TheoryCardDto::fromMap)
            .collect(Collectors.toList());

        // DEBUG: [이론 카드 API] 최종 응답 로깅
        log.info("[MVC2] 이론 카드 응답 - category: {}, DTO 수: {}", category, cardDtos.size());
        
        return ResponseEntity.ok(cardDtos);
    }

    @GetMapping("/theory/meta")
    public ResponseEntity<TheoryProblemMetaDto> getTheoryProblemMeta(@RequestParam String category) {
        log.info("[MVC2] 이론 메타 조회: category={}", category);
        List<Long> ids = problemQueryMapper.selectTheoryProblemIdsByCategory(category, PROGRAMMING_LANGUAGES.contains(category));
        return ResponseEntity.ok(new TheoryProblemMetaDto((long) ids.size(), ids));
    }

    // DEBUG: [2026-06-09] 수정계획안14 - 프로그래밍 언어별 카드 조회 API
    @GetMapping("/programming-theory")
    public ResponseEntity<List<TheoryCardDto>> getProgrammingCards(@RequestParam String language) {
        log.info("[MVC2] 프로그래밍 카드 조회 요청 - language: {}", language);
        List<Map<String, Object>> maps = problemQueryMapper.selectProgrammingCardsByLanguage(language);
        log.info("[MVC2] 프로그래밍 카드 쿼리 결과 - language: {}, 결과 수: {}", language, maps.size());

        List<TheoryCardDto> cardDtos = maps.stream()
            .map(TheoryCardDto::fromMap)
            .collect(Collectors.toList());

        log.info("[MVC2] 프로그래밍 카드 응답 - language: {}, DTO 수: {}", language, cardDtos.size());
        return ResponseEntity.ok(cardDtos);
    }

    @GetMapping("/study/meta")
    public ResponseEntity<TheoryProblemMetaDto> getStudyProblemMeta(
            @RequestParam(defaultValue = "false") boolean randomSample,
            @RequestParam(required = false) com.example.informationexam.domain.problem.ProblemType type,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int difficulty,
            @RequestParam(required = false) String excludeCategories,
            @RequestParam(defaultValue = "100") int limit) {
        log.info("[MVC2] 학습 메타 조회: randomSample={}, type={}, category={}", randomSample, type, category);
        
        List<Long> ids;
        if (randomSample) {
            List<String> excluded = (excludeCategories == null || excludeCategories.isBlank())
                    ? List.of()
                    : Arrays.stream(excludeCategories.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isBlank())
                            .toList();
            String nextCategory = problemQueryMapper.selectRandomCategoryName(excluded);
            if (nextCategory == null || nextCategory.isBlank()) {
                return ResponseEntity.ok(new TheoryProblemMetaDto(0, List.of()));
            }
            ids = problemQueryMapper.selectRandomProblemIdsByCategory(nextCategory, limit, PROGRAMMING_LANGUAGES.contains(nextCategory));
        } else if (category != null && !category.isBlank()) {
            ids = problemQueryMapper.selectStudyIdsByDifficultyCategory(difficulty, category, limit, PROGRAMMING_LANGUAGES.contains(category));
        } else if (type != null) {
            ids = problemQueryMapper.selectStudyIdsByType(type.name(), limit);
        } else {
            throw new IllegalArgumentException("randomSample 또는 category 또는 type 중 하나는 필수입니다.");
        }
        return ResponseEntity.ok(new TheoryProblemMetaDto((long) ids.size(), ids));
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> result = new HashMap<>();
        try {
            result.put("status", "ok");
            result.put("problemCount", problemQueryMapper.countAll());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/debug/programming-languages")
    public ResponseEntity<List<Map<String, Object>>> getProgrammingLanguageDistribution() {
        log.info("[DEBUG] 프로그래밍 언어 분포 조회");
        List<Map<String, Object>> distribution = problemQueryMapper.selectProgrammingLanguageDistribution();
        return ResponseEntity.ok(distribution);
    }
}
