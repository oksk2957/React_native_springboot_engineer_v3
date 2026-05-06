package com.informationexam.controller;

import com.informationexam.model.UserAnswer;
import com.informationexam.service.UserAnswerService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/user-answers")
public class UserAnswerRestController {
    private final UserAnswerService userAnswerService;

    public UserAnswerRestController(UserAnswerService userAnswerService) {
        this.userAnswerService = userAnswerService;
    }

    @GetMapping
    public List<UserAnswer> getAllAnswers() {
        return userAnswerService.getAllAnswers();
    }

    @GetMapping("/{id}")
    public UserAnswer getAnswer(@PathVariable Long id) {
        return userAnswerService.getAnswerById(id);
    }

    @GetMapping("/session/{sessionId}")
    public List<UserAnswer> getAnswersBySession(@PathVariable Long sessionId) {
        return userAnswerService.getAnswersBySessionId(sessionId);
    }

    @PostMapping
    public void createAnswer(@RequestBody UserAnswer answer) {
        userAnswerService.createAnswer(answer);
    }

    @PutMapping("/{id}")
    public void updateAnswer(@PathVariable Long id, @RequestBody UserAnswer answer) {
        answer.setId(id);
        userAnswerService.updateAnswer(answer);
    }

    @DeleteMapping("/{id}")
    public void deleteAnswer(@PathVariable Long id) {
        userAnswerService.deleteAnswer(id);
    }
}
