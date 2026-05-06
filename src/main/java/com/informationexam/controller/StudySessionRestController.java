package com.informationexam.controller;

import com.informationexam.model.StudySession;
import com.informationexam.service.StudySessionService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/study-sessions")
public class StudySessionRestController {
    private final StudySessionService studySessionService;

    public StudySessionRestController(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    @GetMapping
    public List<StudySession> getAllSessions() {
        return studySessionService.getAllSessions();
    }

    @GetMapping("/{id}")
    public StudySession getSession(@PathVariable Long id) {
        return studySessionService.getSessionById(id);
    }

    @GetMapping("/user/{userId}")
    public List<StudySession> getSessionsByUser(@PathVariable Long userId) {
        return studySessionService.getSessionsByUserId(userId);
    }

    @PostMapping
    public void createSession(@RequestBody StudySession session) {
        studySessionService.createSession(session);
    }

    @PutMapping("/{id}")
    public void updateSession(@PathVariable Long id, @RequestBody StudySession session) {
        session.setId(id);
        studySessionService.updateSession(session);
    }

    @DeleteMapping("/{id}")
    public void deleteSession(@PathVariable Long id) {
        studySessionService.deleteSession(id);
    }
}
