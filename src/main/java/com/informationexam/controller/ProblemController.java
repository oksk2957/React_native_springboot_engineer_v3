package com.informationexam.controller;

import com.informationexam.model.Problem;
import com.informationexam.service.ProblemService;
import java.util.List;

public class ProblemController {
    private ProblemService problemService;

    public void setProblemService(ProblemService problemService) {
        this.problemService = problemService;
    }

    public List<Problem> listProblems() {
        return problemService.getAllProblems();
    }

    public Problem getProblem(Long id) {
        return problemService.getProblemById(id);
    }

    public List<Problem> getProblemsBySubject(Long subjectId) {
        return problemService.getProblemsBySubjectId(subjectId);
    }

    public void addProblem(Problem problem) {
        problemService.createProblem(problem);
    }

    public void editProblem(Problem problem) {
        problemService.updateProblem(problem);
    }

    public void removeProblem(Long id) {
        problemService.deleteProblem(id);
    }
}
