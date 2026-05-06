package com.informationexam.controller;

import com.informationexam.model.WrongAnswerBookmark;
import com.informationexam.service.WrongAnswerBookmarkService;
import java.util.List;

public class WrongAnswerBookmarkController {
    private WrongAnswerBookmarkService wrongAnswerBookmarkService;

    public void setWrongAnswerBookmarkService(WrongAnswerBookmarkService wrongAnswerBookmarkService) {
        this.wrongAnswerBookmarkService = wrongAnswerBookmarkService;
    }

    public List<WrongAnswerBookmark> listBookmarks() {
        return wrongAnswerBookmarkService.getAllBookmarks();
    }

    public WrongAnswerBookmark getBookmark(Long id) {
        return wrongAnswerBookmarkService.getBookmarkById(id);
    }

    public List<WrongAnswerBookmark> getBookmarksByUser(Long userId) {
        return wrongAnswerBookmarkService.getBookmarksByUserId(userId);
    }

    public void addBookmark(WrongAnswerBookmark bookmark) {
        wrongAnswerBookmarkService.createBookmark(bookmark);
    }

    public void editBookmark(WrongAnswerBookmark bookmark) {
        wrongAnswerBookmarkService.updateBookmark(bookmark);
    }

    public void removeBookmark(Long id) {
        wrongAnswerBookmarkService.deleteBookmark(id);
    }
}
