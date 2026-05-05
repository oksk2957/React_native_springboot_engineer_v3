package com.example.informationexam.service;

import com.example.informationexam.domain.problem.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DataInitService {

    private final ProblemRepository problemRepository;
    private final SubjectRepository subjectRepository;

    @Transactional
    public long initializeIfEmpty() {
        long count = problemRepository.count();
        if (count == 0) {
            createSubjects();
            createProblems();
            return problemRepository.count();
        }
        return count;
    }

    private void createSubjects() {
        Subject database = Subject.builder().name("데이터베이스").description("Database").build();
        Subject os = Subject.builder().name("운영체제").description("Operating System").build();
        Subject network = Subject.builder().name("네트워크").description("Network").build();
        Subject security = Subject.builder().name("정보보안").description("Information Security").build();
        subjectRepository.saveAll(Arrays.asList(database, os, network, security));
    }

    private void createProblems() {
        Subject database = subjectRepository.findByName("데이터베이스")
                .orElseThrow(() -> new IllegalStateException("Subject not found"));

        List<Problem> objectiveProblems = Arrays.asList(
            createProblem("데이터베이스의 무결성 제약조건으로 데이터의 일관성을 유지할 수 있는 것은?", 
                "A. 기본키", "B. 외래키", "C. UNIQUE", "D. CHECK", "E. DEFAULT",
                "A", database, ProblemType.OBJECTIVE),
            createProblem("관계데이터베이스에서 속성 값으로 속성 집합에 없는 튜플을 삽입할 수 없는 것은?", 
                "A. 개체 무결성", "B. 참조 무결성", "C. 도메인 무결성", "D. 키 무결성", "E. 값 무결성",
                "A", database, ProblemType.OBJECTIVE),
            createProblem("SQL에서 부모 테이블의 기본키가 자식 테이블의 외래키로 참조될 때, 부모 테이블의 기본키가 삭제될 수 없도록 하는 제약조건은?", 
                "A. CASCADE", "B. SET NULL", "C. RESTRICT", "D. NO ACTION", "E. SET DEFAULT",
                "C", database, ProblemType.OBJECTIVE),
            createProblem("트랜잭션이란?", 
                "A. 데이터베이스 조작의 논리적인 Unit", "B. 병렬 처리를 위한 기술", "C. 인덱스를 생성하는 명령", "D. 백업을 위한 기술", "E. 복구를 위한 기술",
                "A", database, ProblemType.OBJECTIVE),
            createProblem("ACID 특성 중 '모든 변화작업이 완벽하게 실행되거나 완전히 취소되어야 한다'는 것은?", 
                "A. Atomicity", "B. Consistency", "C. Isolation", "D. Durability", "E. Availability",
                "A", database, ProblemType.OBJECTIVE)
        );
        problemRepository.saveAll(objectiveProblems);
    }

    private Problem createProblem(String question, String option1, String option2, String option3, 
                                   String option4, String option5, String answer, Subject subject, ProblemType type) {
        return Problem.builder()
                .question(question)
                .answer(answer)
                .explanation("해설: 해당 개념을 이해하기 위해 관련 문법이나 이론을 복습하세요.")
                .type(type.name())
                .difficulty(2)
                .subject(subject)
                .option1(option1)
                .option2(option2)
                .option3(option3)
                .option4(option4)
                .option5(option5)
                .isAiGenerated(false)
                .build();
    }
}