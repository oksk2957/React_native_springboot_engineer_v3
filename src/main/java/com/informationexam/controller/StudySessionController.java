package com.informationexam.controller;

import com.informationexam.model.StudySession;
import com.informationexam.service.StudySessionService;
import java.util.List;

public class StudySessionController {
    private StudySessionService studySessionService;

    public void setStudySessionService(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    public List<StudySession> listSessions() {
        return studySessionService.getAllSessions();
    }

    public StudySession getSession(Long id) {
        return studySessionService.getSessionById(id);
    }

    public List<StudySession> getSessionsByUser(Long userId) {
        return studySessionService.getSessionsByUserId(userId);
    }

    public void addSession(StudySession session) {
        studySessionService.createSession(session);
    }

    public void editSession(StudySession session) {
        studySessionService.updateSession(session);
    }

    public void removeSession(Long id) {
        studySessionService.deleteSession(id);
    }
}
