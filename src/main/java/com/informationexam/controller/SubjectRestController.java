package com.informationexam.controller;

import com.informationexam.model.Subject;
import com.informationexam.service.SubjectService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectRestController {
    private final SubjectService subjectService;

    public SubjectRestController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectService.getAllSubjects();
    }

    @GetMapping("/{id}")
    public Subject getSubject(@PathVariable Long id) {
        return subjectService.getSubjectById(id);
    }

    @PostMapping
    public void createSubject(@RequestBody Subject subject) {
        subjectService.createSubject(subject);
    }

    @PutMapping("/{id}")
    public void updateSubject(@PathVariable Long id, @RequestBody Subject subject) {
        subject.setSubjectId(id);
        subjectService.updateSubject(subject);
    }

    @DeleteMapping("/{id}")
    public void deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
    }
}
