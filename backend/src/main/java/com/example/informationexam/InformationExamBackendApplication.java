package com.example.informationexam;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = { org.springframework.boot.autoconfigure.session.SessionAutoConfiguration.class })
@MapperScan("com.example.informationexam.mapper")
public class InformationExamBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(InformationExamBackendApplication.class, args);
    }
}
