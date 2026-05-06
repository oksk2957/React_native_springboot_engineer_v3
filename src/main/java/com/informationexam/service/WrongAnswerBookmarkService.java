package com.informationexam.service;

import com.informationexam.dao.WrongAnswerBookmarkDAO;
import com.informationexam.model.WrongAnswerBookmark;
import java.util.List;

public class WrongAnswerBookmarkService {
    private WrongAnswerBookmarkDAO wrongAnswerBookmarkDAO;

    public void setWrongAnswerBookmarkDAO(WrongAnswerBookmarkDAO wrongAnswerBookmarkDAO) {
        this.wrongAnswerBookmarkDAO = wrongAnswerBookmarkDAO;
    }

    public List<WrongAnswerBookmark> getAllBookmarks() {
        return wrongAnswerBookmarkDAO.findAll();
    }

    public WrongAnswerBookmark getBookmarkById(Long id) {
        return wrongAnswerBookmarkDAO.findById(id);
    }

    public List<WrongAnswerBookmark> getBookmarksByUserId(Long userId) {
        return wrongAnswerBookmarkDAO.findByUserId(userId);
    }

    public void createBookmark(WrongAnswerBookmark bookmark) {
        wrongAnswerBookmarkDAO.insert(bookmark);
    }

    public void updateBookmark(WrongAnswerBookmark bookmark) {
        wrongAnswerBookmarkDAO.update(bookmark);
    }

    public void deleteBookmark(Long id) {
        wrongAnswerBookmarkDAO.delete(id);
    }
}
