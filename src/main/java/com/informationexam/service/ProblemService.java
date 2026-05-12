package com.informationexam.service;

import com.informationexam.dao.ProblemDAO;
import com.informationexam.model.Problem;
import java.util.List;

public class ProblemService {
    private ProblemDAO problemDAO;

    public void setProblemDAO(ProblemDAO problemDAO) {
        this.problemDAO = problemDAO;
    }

    public List<Problem> getAllProblems() {
        return problemDAO.findAll();
    }

    public Problem getProblemById(Long id) {
        return problemDAO.findById(id);
    }

    public List<Problem> getProblemsBySubjectId(Long subjectId) {
        return problemDAO.findBySubjectId(subjectId);
    }

    public void createProblem(Problem problem) {
        problemDAO.insert(problem);
    }

    public void updateProblem(Problem problem) {
        problemDAO.update(problem);
    }

    public void deleteProblem(Long id) {
        problemDAO.delete(id);
    }
}
