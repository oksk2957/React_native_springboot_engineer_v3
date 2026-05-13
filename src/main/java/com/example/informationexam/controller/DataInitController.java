package com.example.informationexam.controller;

import com.example.informationexam.controller.dto.DataInitResponse;
import com.example.informationexam.service.DataInitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataInitController {

    private final DataInitService dataInitService;

    @PostMapping("/initialize")
    public DataInitResponse initializeData() {
        long count = dataInitService.initializeIfEmpty();
        return new DataInitResponse(count, true);
    }

    @GetMapping("/status")
    public DataInitResponse getStatus() {
        long count = dataInitService.initializeIfEmpty();
        return new DataInitResponse(count, false);
    }
}