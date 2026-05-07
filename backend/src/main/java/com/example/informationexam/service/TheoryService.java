package com.example.informationexam.service;

import com.example.informationexam.dto.theory.TheoryCardDto;
import com.example.informationexam.mapper.TheoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TheoryService {

    private final TheoryMapper theoryMapper;

    public List<TheoryCardDto> findTheoryCardsByCategory(String categoryName) {
        return theoryMapper.findTheoryCards(categoryName);
    }

}
