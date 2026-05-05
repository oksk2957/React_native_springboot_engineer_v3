package com.example.informationexam;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@SpringBootApplication(exclude = { org.springframework.boot.autoconfigure.session.SessionAutoConfiguration.class })
@MapperScan("com.example.informationexam.mapper")
public class InformationExamBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(InformationExamBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner run(JdbcTemplate jdbcTemplate) {
        return args -> {
            System.out.println("=== DB CHECK START ===");
            try {
                List<Map<String, Object>> columns = jdbcTemplate.queryForList("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'problem'");
                System.out.println("Columns in 'problem': " + columns);
                
                List<Map<String, Object>> problems = jdbcTemplate.queryForList("SELECT id, type, subject_id FROM problem LIMIT 10");
                System.out.println("Sample problems: " + problems);
                
                List<Map<String, Object>> plProblems = jdbcTemplate.queryForList("SELECT id, prog_language, question FROM programming_language_problems LIMIT 3");
                System.out.println("Sample PL problems: " + plProblems);
            } catch (Exception e) {
                e.printStackTrace();
            }
            System.out.println("=== DB CHECK END ===");
            System.exit(0);
        };
    }
}
