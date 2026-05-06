package com.informationexam.controller;

import com.informationexam.model.SubjectiveProblem;
import com.informationexam.service.SubjectiveProblemService;
import java.util.List;

public class SubjectiveProblemController {
    private SubjectiveProblemService subjectiveProblemService;

    public void setSubjectiveProblemService(SubjectiveProblemService subjectiveProblemService) {
        this.subjectiveProblemService = subjectiveProblemService;
    }

    public List<SubjectiveProblem> listSubjectiveProblems() {
        return subjectiveProblemService.getAllSubjectiveProblems();
    }

    public SubjectiveProblem getSubjectiveProblem(Long id) {
        return subjectiveProblemService.getSubjectiveProblemById(id);
    }

    public List<SubjectiveProblem> getSubjectiveProblemsBySubject(Long subjectId) {
        return subjectiveProblemService.getSubjectiveProblemsBySubjectId(subjectId);
    }

    public void addSubjectiveProblem(SubjectiveProblem subjectiveProblem) {
        subjectiveProblemService.createSubjectiveProblem(subjectiveProblem);
    }

    public void editSubjectiveProblem(SubjectiveProblem subjectiveProblem) {
        subjectiveProblemService.updateSubjectiveProblem(subjectiveProblem);
    }

    public void removeSubjectiveProblem(Long id) {
        subjectiveProblemService.deleteSubjectiveProblem(id);
    }
}