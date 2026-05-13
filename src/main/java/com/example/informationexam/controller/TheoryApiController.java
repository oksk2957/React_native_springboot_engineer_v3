package com.example.informationexam.controller;

import com.example.informationexam.dto.theory.TheoryCardDto;
import com.example.informationexam.service.TheoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/theory")
@RequiredArgsConstructor
public class TheoryApiController {

    private final TheoryService theoryService;

    @GetMapping("/cards")
    public ResponseEntity<List<TheoryCardDto>> getTheoryCards(
            @RequestParam(value = "category", required = false) String categoryName) {
        List<TheoryCardDto> cards = theoryService.findTheoryCardsByCategory(categoryName);
        return ResponseEntity.ok(cards);
    }

}
