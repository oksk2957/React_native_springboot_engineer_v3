package com.informationexam.controller;

import com.informationexam.model.Problem;
import com.informationexam.service.ProblemService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/problems")
public class ProblemRestController {
    private final ProblemService problemService;

    public ProblemRestController(ProblemService problemService) {
        this.problemService = problemService;
    }

    @GetMapping
    public List<Problem> getAllProblems() {
        return problemService.getAllProblems();
    }

    @GetMapping("/{id}")
    public Problem getProblem(@PathVariable Long id) {
        return problemService.getProblemById(id);
    }

    @GetMapping("/subject/{subjectId}")
    public List<Problem> getProblemsBySubject(@PathVariable Long subjectId) {
        return problemService.getProblemsBySubjectId(subjectId);
    }

    @PostMapping
    public void createProblem(@RequestBody Problem problem) {
        problemService.createProblem(problem);
    }

    @PutMapping("/{id}")
    public void updateProblem(@PathVariable Long id, @RequestBody Problem problem) {
        problem.setId(id);
        problemService.updateProblem(problem);
    }

    @DeleteMapping("/{id}")
    public void deleteProblem(@PathVariable Long id) {
        problemService.deleteProblem(id);
    }
}
