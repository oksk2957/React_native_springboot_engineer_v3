package com.example.informationexam.controller;

import com.example.informationexam.dto.theory.TheoryCardDto;
import com.example.informationexam.service.TheoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TheoryApiController {

    private final TheoryService theoryService;

    @GetMapping({"/theory/cards", "/theory-cards"})
    public ResponseEntity<List<TheoryCardDto>> getTheoryCards(
            @RequestParam(value = "category", required = false) String categoryName) {
        List<TheoryCardDto> cards = theoryService.findTheoryCardsByCategory(categoryName);
        return ResponseEntity.ok(cards);
    }

    /**
     * 존재하지 않는 카테고리 호출시 명확한 에러 메시지 반환
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", true);
        response.put("message", e.getMessage());
        response.put("status", 400);
        return ResponseEntity.badRequest().body(response);
    }

}
