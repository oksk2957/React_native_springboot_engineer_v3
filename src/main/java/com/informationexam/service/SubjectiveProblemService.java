package com.informationexam.service;

import com.informationexam.dao.SubjectiveProblemDAO;
import com.informationexam.model.SubjectiveProblem;
import java.util.List;

public class SubjectiveProblemService {
    private SubjectiveProblemDAO subjectiveProblemDAO;

    public void setSubjectiveProblemDAO(SubjectiveProblemDAO subjectiveProblemDAO) {
        this.subjectiveProblemDAO = subjectiveProblemDAO;
    }

    public List<SubjectiveProblem> getAllSubjectiveProblems() {
        return subjectiveProblemDAO.findAll();
    }

    public SubjectiveProblem getSubjectiveProblemById(Long id) {
        return subjectiveProblemDAO.findById(id);
    }

    public List<SubjectiveProblem> getSubjectiveProblemsBySubjectId(Long subjectId) {
        return subjectiveProblemDAO.findBySubjectId(subjectId);
    }

    public void createSubjectiveProblem(SubjectiveProblem subjectiveProblem) {
        subjectiveProblemDAO.insert(subjectiveProblem);
    }

    public void updateSubjectiveProblem(SubjectiveProblem subjectiveProblem) {
        subjectiveProblemDAO.update(subjectiveProblem);
    }

    public void deleteSubjectiveProblem(Long id) {
        subjectiveProblemDAO.delete(id);
    }
}