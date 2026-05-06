package com.informationexam.service;

import com.informationexam.dao.ProgrammingLanguageProblemsDAO;
import com.informationexam.model.ProgrammingLanguageProblems;
import java.util.List;

public class ProgrammingLanguageProblemsService {
    private ProgrammingLanguageProblemsDAO programmingLanguageProblemsDAO;

    public void setProgrammingLanguageProblemsDAO(ProgrammingLanguageProblemsDAO programmingLanguageProblemsDAO) {
        this.programmingLanguageProblemsDAO = programmingLanguageProblemsDAO;
    }

    public List<ProgrammingLanguageProblems> getAllProblems() {
        return programmingLanguageProblemsDAO.findAll();
    }

    public ProgrammingLanguageProblems getProblemById(Long id) {
        return programmingLanguageProblemsDAO.findById(id);
    }

    public List<ProgrammingLanguageProblems> getProblemsBySubjectId(Long subjectId) {
        return programmingLanguageProblemsDAO.findBySubjectId(subjectId);
    }

    public void createProblem(ProgrammingLanguageProblems problem) {
        programmingLanguageProblemsDAO.insert(problem);
    }

    public void updateProblem(ProgrammingLanguageProblems problem) {
        programmingLanguageProblemsDAO.update(problem);
    }

    public void deleteProblem(Long id) {
        programmingLanguageProblemsDAO.delete(id);
    }
}
