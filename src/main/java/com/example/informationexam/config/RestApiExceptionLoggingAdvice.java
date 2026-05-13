package com.example.informationexam.config;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * REST API 예외를 응답 본문과 함께 서버 콘솔 로그에 남긴다(스택 트레이스 포함).
 */
@RestControllerAdvice(annotations = RestController.class)
public class RestApiExceptionLoggingAdvice {

    private static final Logger log = LoggerFactory.getLogger(RestApiExceptionLoggingAdvice.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest req) {
        log.warn("[API] {} {} | IllegalArgument — {}",
                req.getMethod(), uriWithQuery(req), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(ex.getMessage(), ex));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest req) {
        log.error("[API 오류] {} {} | {} — {}",
                req.getMethod(), uriWithQuery(req), ex.getClass().getName(), ex.getMessage(), ex);
        String clientMsg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(body("서버 오류: " + clientMsg, ex));
    }

    private static String uriWithQuery(HttpServletRequest req) {
        String q = req.getQueryString();
        return q != null && !q.isBlank() ? req.getRequestURI() + "?" + q : req.getRequestURI();
    }

    private static Map<String, Object> body(String message, Throwable ex) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", true);
        m.put("message", message);
        m.put("exceptionType", ex.getClass().getName());
        return m;
    }
}
