package com.example.informationexam.controller;

import com.example.informationexam.domain.problem.Problem;
import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.problem.ProblemType;
import com.example.informationexam.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@RequestMapping("/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemRepository problemRepository;
    private final ProblemService problemService;

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProblem(@PathVariable Long id) {
        return ResponseEntity.ok(problemService.getProblem(id));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listProblems(
            @RequestParam(value = "type", required = false) ProblemType type,
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        if (type != null) {
            return ResponseEntity.ok(problemService.getProblemsByType(type, limit));
        } else {
            return ResponseEntity.ok(problemService.getRandomProblems(limit));
        }
    }
}
