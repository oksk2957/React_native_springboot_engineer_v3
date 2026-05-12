package com.informationexam.service;

import com.informationexam.dao.StudySessionDAO;
import com.informationexam.model.StudySession;
import java.util.List;

public class StudySessionService {
    private StudySessionDAO studySessionDAO;

    public void setStudySessionDAO(StudySessionDAO studySessionDAO) {
        this.studySessionDAO = studySessionDAO;
    }

    public List<StudySession> getAllSessions() {
        return studySessionDAO.findAll();
    }

    public StudySession getSessionById(Long id) {
        return studySessionDAO.findById(id);
    }

    public List<StudySession> getSessionsByUserId(Long userId) {
        return studySessionDAO.findByUserId(userId);
    }

    public void createSession(StudySession session) {
        studySessionDAO.insert(session);
    }

    public void updateSession(StudySession session) {
        studySessionDAO.update(session);
    }

    public void deleteSession(Long id) {
        studySessionDAO.delete(id);
    }
}
