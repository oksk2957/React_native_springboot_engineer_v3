package com.informationexam.controller;

import com.informationexam.model.UserAnswer;
import com.informationexam.service.UserAnswerService;
import java.util.List;

public class UserAnswerController {
    private UserAnswerService userAnswerService;

    public void setUserAnswerService(UserAnswerService userAnswerService) {
        this.userAnswerService = userAnswerService;
    }

    public List<UserAnswer> listAnswers() {
        return userAnswerService.getAllAnswers();
    }

    public UserAnswer getAnswer(Long id) {
        return userAnswerService.getAnswerById(id);
    }

    public List<UserAnswer> getAnswersBySession(Long sessionId) {
        return userAnswerService.getAnswersBySessionId(sessionId);
    }

    public void addAnswer(UserAnswer answer) {
        userAnswerService.createAnswer(answer);
    }

    public void editAnswer(UserAnswer answer) {
        userAnswerService.updateAnswer(answer);
    }

    public void removeAnswer(Long id) {
        userAnswerService.deleteAnswer(id);
    }
}
