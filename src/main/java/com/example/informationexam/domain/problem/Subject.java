package com.example.informationexam.domain.problem;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "subject")
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    // DEBUG: [과목 문제유형] 과목별 문제유형 구분을 위한 필드 추가
    // 원인: 과목별로 객관식/주관식/혼합 유형을 구분해야 함
    // 해결: problem_type 컬럼 추가 (OBJECTIVE, SUBJECTIVE, MIXED)
    @Column(name = "problem_type")
    private String problemType = "MIXED";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder
    public Subject(String name, String description, String problemType) {
        this.name = name;
        this.description = description;
        this.problemType = problemType != null ? problemType : "MIXED";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters for Lombok compatibility
    public Integer getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
