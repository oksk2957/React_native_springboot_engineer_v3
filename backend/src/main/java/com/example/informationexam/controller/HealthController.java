package com.example.informationexam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

// DEBUG: [D-2026-05-28] 백엔드 상태 확인 엔드포인트
// 원인: 프론트엔드에서 /api/health 엔드포인트 호출 시 404 오류
// 해결: /api/health 엔드포인트 추가하여 서버 상태, DB 연결 상태, 시간 정보 반환
// 사용법: GET /api/health
@RestController
@RequestMapping("/api")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        // DEBUG: [D-2026-05-28] 서버 상태 정보 수집
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        health.put("service", "information-exam-backend");

        // DB 연결 상태 확인
        // DEBUG: [D-2026-05-28] DB 연결 상태 확인 - Supabase Pooler 사용
        Map<String, Object> dbStatus = new LinkedHashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            dbStatus.put("status", "UP");
            dbStatus.put("database", connection.getMetaData().getDatabaseProductName());
            dbStatus.put("version", connection.getMetaData().getDatabaseProductVersion());
            // DEBUG: [D-2026-05-28] DB 연결 성공 로그
            System.out.println("[HealthCheck] DB 연결 성공: " + connection.getMetaData().getURL());
        } catch (Exception e) {
            dbStatus.put("status", "DOWN");
            dbStatus.put("error", e.getMessage());
            // DEBUG: [D-2026-05-28] DB 연결 실패 로그
            System.err.println("[HealthCheck] DB 연결 실패: " + e.getMessage());
        }
        health.put("database", dbStatus);

        // 시스템 정보
        Map<String, Object> systemInfo = new LinkedHashMap<>();
        systemInfo.put("javaVersion", System.getProperty("java.version"));
        systemInfo.put("osName", System.getProperty("os.name"));
        systemInfo.put("osVersion", System.getProperty("os.version"));
        systemInfo.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        systemInfo.put("freeMemory", Runtime.getRuntime().freeMemory() / 1024 / 1024 + " MB");
        systemInfo.put("totalMemory", Runtime.getRuntime().totalMemory() / 1024 / 1024 + " MB");
        health.put("system", systemInfo);

        // DEBUG: [D-2026-05-28] Health Check 완료 로그
        System.out.println("[HealthCheck] 상태 확인 완료: " + health.get("status"));

        return ResponseEntity.ok(health);
    }
}
