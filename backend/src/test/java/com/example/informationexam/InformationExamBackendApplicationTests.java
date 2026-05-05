package com.example.informationexam;

import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.problem.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class InformationExamBackendApplicationTests {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Test
    void contextLoads() {
        System.out.println(">>> Subject count: " + subjectRepository.count());
        System.out.println(">>> Problem count: " + problemRepository.count());
    }
}
