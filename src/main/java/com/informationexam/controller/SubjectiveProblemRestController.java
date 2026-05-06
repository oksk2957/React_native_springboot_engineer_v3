package com.informationexam.controller;

import com.informationexam.model.SubjectiveProblem;
import com.informationexam.service.SubjectiveProblemService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subjective-problems")
public class SubjectiveProblemRestController {
    private final SubjectiveProblemService subjectiveProblemService;

    public SubjectiveProblemRestController(SubjectiveProblemService subjectiveProblemService) {
        this.subjectiveProblemService = subjectiveProblemService;
    }

    @GetMapping
    public List<SubjectiveProblem> getAllSubjectiveProblems() {
        return subjectiveProblemService.getAllSubjectiveProblems();
    }

    @GetMapping("/{id}")
    public SubjectiveProblem getSubjectiveProblem(@PathVariable Long id) {
        return subjectiveProblemService.getSubjectiveProblemById(id);
    }

    @GetMapping("/subject/{subjectId}")
    public List<SubjectiveProblem> getSubjectiveProblemsBySubject(@PathVariable Long subjectId) {
        return subjectiveProblemService.getSubjectiveProblemsBySubjectId(subjectId);
    }

    @PostMapping
    public void createSubjectiveProblem(@RequestBody SubjectiveProblem subjectiveProblem) {
        subjectiveProblemService.createSubjectiveProblem(subjectiveProblem);
    }

    @PutMapping("/{id}")
    public void updateSubjectiveProblem(@PathVariable Long id, @RequestBody SubjectiveProblem subjectiveProblem) {
        subjectiveProblem.setId(id);
        subjectiveProblemService.updateSubjectiveProblem(subjectiveProblem);
    }

    @DeleteMapping("/{id}")
    public void deleteSubjectiveProblem(@PathVariable Long id) {
        subjectiveProblemService.deleteSubjectiveProblem(id);
    }
}