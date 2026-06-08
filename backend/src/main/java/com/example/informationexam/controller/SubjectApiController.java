package com.example.informationexam.controller;

import com.example.informationexam.mapper.ProblemQueryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class SubjectApiController {
    private final ProblemQueryMapper problemQueryMapper;

    @GetMapping("/subjects")
    public ResponseEntity<List<Map<String, Object>>> getSubjects() {
        log.info("[SubjectAPI] 과목 목록 조회");
        List<Map<String, Object>> subjects = problemQueryMapper.selectAllSubjects();
        return ResponseEntity.ok(subjects);
    }
}
