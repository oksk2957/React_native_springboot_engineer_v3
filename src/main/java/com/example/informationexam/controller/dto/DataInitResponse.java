package com.example.informationexam.controller.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DataInitResponse {
    private long problemCount;
    private boolean initialized;
    private String status;

    public DataInitResponse(long problemCount, boolean initialized) {
        this.problemCount = problemCount;
        this.initialized = initialized;
        this.status = initialized ? "INITIALIZED" : "ALREADY_EXISTS";
    }
}