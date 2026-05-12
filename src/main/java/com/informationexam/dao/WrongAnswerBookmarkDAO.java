package com.informationexam.dao;

import com.informationexam.model.WrongAnswerBookmark;
import java.util.List;

public interface WrongAnswerBookmarkDAO {
    List<WrongAnswerBookmark> findAll();
    WrongAnswerBookmark findById(Long id);
    List<WrongAnswerBookmark> findByUserId(Long userId);
    void insert(WrongAnswerBookmark bookmark);
    void update(WrongAnswerBookmark bookmark);
    void delete(Long id);
}
