package com.informationexam.controller;

import com.informationexam.model.WrongAnswerBookmark;
import com.informationexam.service.WrongAnswerBookmarkService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/wrong-answer-bookmarks")
public class WrongAnswerBookmarkRestController {
    private final WrongAnswerBookmarkService wrongAnswerBookmarkService;

    public WrongAnswerBookmarkRestController(WrongAnswerBookmarkService wrongAnswerBookmarkService) {
        this.wrongAnswerBookmarkService = wrongAnswerBookmarkService;
    }

    @GetMapping
    public List<WrongAnswerBookmark> getAllBookmarks() {
        return wrongAnswerBookmarkService.getAllBookmarks();
    }

    @GetMapping("/{id}")
    public WrongAnswerBookmark getBookmark(@PathVariable Long id) {
        return wrongAnswerBookmarkService.getBookmarkById(id);
    }

    @GetMapping("/user/{userId}")
    public List<WrongAnswerBookmark> getBookmarksByUser(@PathVariable Long userId) {
        return wrongAnswerBookmarkService.getBookmarksByUserId(userId);
    }

    @PostMapping
    public void createBookmark(@RequestBody WrongAnswerBookmark bookmark) {
        wrongAnswerBookmarkService.createBookmark(bookmark);
    }

    @PutMapping("/{id}")
    public void updateBookmark(@PathVariable Long id, @RequestBody WrongAnswerBookmark bookmark) {
        bookmark.setId(id);
        wrongAnswerBookmarkService.updateBookmark(bookmark);
    }

    @DeleteMapping("/{id}")
    public void deleteBookmark(@PathVariable Long id) {
        wrongAnswerBookmarkService.deleteBookmark(id);
    }
}
