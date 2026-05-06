package com.informationexam.service;

import com.informationexam.dao.UserAnswerDAO;
import com.informationexam.model.UserAnswer;
import java.util.List;

public class UserAnswerService {
    private UserAnswerDAO userAnswerDAO;

    public void setUserAnswerDAO(UserAnswerDAO userAnswerDAO) {
        this.userAnswerDAO = userAnswerDAO;
    }

    public List<UserAnswer> getAllAnswers() {
        return userAnswerDAO.findAll();
    }

    public UserAnswer getAnswerById(Long id) {
        return userAnswerDAO.findById(id);
    }

    public List<UserAnswer> getAnswersBySessionId(Long sessionId) {
        return userAnswerDAO.findBySessionId(sessionId);
    }

    public void createAnswer(UserAnswer answer) {
        userAnswerDAO.insert(answer);
    }

    public void updateAnswer(UserAnswer answer) {
        userAnswerDAO.update(answer);
    }

    public void deleteAnswer(Long id) {
        userAnswerDAO.delete(id);
    }
}
