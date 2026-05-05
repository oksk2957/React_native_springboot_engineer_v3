package com.example.informationexam.controller;

import com.example.informationexam.dto.problem.ProblemResponseDto;
import com.example.informationexam.dto.problem.TheoryProblemMetaDto;
import com.example.informationexam.mapper.ProblemQueryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemApiController {
    // ★ Service 대신 Mapper 직접 주입 (MVC2 핵심)
    private final ProblemQueryMapper problemQueryMapper;

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
        List<Map<String, Object>> maps = problemQueryMapper.selectOneRandomProblemPerSubject("OBJECTIVE");
        return ResponseEntity.ok(ProblemResponseDto.fromList(maps));
    }

    @GetMapping("/theory")
    public ResponseEntity<List<ProblemResponseDto>> getTheoryProblems(@RequestParam String category) {
        log.info("[MVC2] 이론 문제 조회: category={}", category);
        List<Map<String, Object>> maps = problemQueryMapper.selectTheoryProblemsByCategory(category);
        return ResponseEntity.ok(ProblemResponseDto.fromList(maps));
    }

    @GetMapping("/theory/meta")
    public ResponseEntity<TheoryProblemMetaDto> getTheoryProblemMeta(@RequestParam String category) {
        log.info("[MVC2] 이론 메타 조회: category={}", category);
        List<Long> ids = problemQueryMapper.selectTheoryProblemIdsByCategory(category);
        return ResponseEntity.ok(new TheoryProblemMetaDto(ids.size(), ids));
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
            ids = problemQueryMapper.selectRandomProblemIdsByCategory(nextCategory, limit);
        } else if (category != null && !category.isBlank()) {
            ids = problemQueryMapper.selectStudyIdsByDifficultyCategory(difficulty, category, limit);
        } else if (type != null) {
            ids = problemQueryMapper.selectStudyIdsByType(type.name(), limit);
        } else {
            throw new IllegalArgumentException("randomSample 또는 category 또는 type 중 하나는 필수입니다.");
        }
        return ResponseEntity.ok(new TheoryProblemMetaDto(ids.size(), ids));
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
}