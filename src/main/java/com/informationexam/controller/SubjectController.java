package com.informationexam.controller;

import com.informationexam.model.Subject;
import com.informationexam.service.SubjectService;
import java.util.List;

public class SubjectController {
    private SubjectService subjectService;

    public void setSubjectService(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    public List<Subject> listSubjects() {
        return subjectService.getAllSubjects();
    }

    public Subject getSubject(Long id) {
        return subjectService.getSubjectById(id);
    }

    public void addSubject(Subject subject) {
        subjectService.createSubject(subject);
    }

    public void editSubject(Subject subject) {
        subjectService.updateSubject(subject);
    }

    public void removeSubject(Long id) {
        subjectService.deleteSubject(id);
    }
}
