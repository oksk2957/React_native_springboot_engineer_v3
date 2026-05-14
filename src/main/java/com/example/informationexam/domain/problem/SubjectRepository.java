package com.example.informationexam.domain.problem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Integer> {
    Optional<Subject> findByName(String name);
    
    /**
     * 대소문자 무시로 과목명 조회
     */
    @Query("SELECT s FROM Subject s WHERE LOWER(s.name) = LOWER(:name)")
    Optional<Subject> findByNameIgnoreCase(@Param("name") String name);
}
