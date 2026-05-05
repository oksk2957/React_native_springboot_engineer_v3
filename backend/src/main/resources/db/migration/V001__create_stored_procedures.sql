-- 답변 검증 함수 (비즈니스 로직 SQL 이관)
CREATE OR REPLACE FUNCTION validate_answer(
    p_problem_id BIGINT,
    p_submitted_answer TEXT,
    p_problem_type TEXT DEFAULT 'OBJECTIVE'
)
RETURNS TABLE(
    is_correct BOOLEAN,
    explanation TEXT,
    correct_answer TEXT
) AS $$
BEGIN
    IF p_problem_type = 'PROGRAMMING_LANGUAGE' THEN
        RETURN QUERY
        SELECT 
            UPPER(TRIM(answer)) = UPPER(TRIM(p_submitted_answer)) AS is_correct,
            p.explanation,
            answer AS correct_answer
        FROM programming_language_problems p
        WHERE id = p_problem_id;
    ELSE
        RETURN QUERY
        SELECT 
            UPPER(TRIM(answer)) = UPPER(TRIM(p_submitted_answer)) AS is_correct,
            p.explanation,
            answer AS correct_answer
        FROM problem p
        WHERE id = p_problem_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 사용자 통계 함수 (비즈니스 로직 SQL 이관)
CREATE OR REPLACE FUNCTION get_user_statistics(
    p_user_id BIGINT
)
RETURNS TABLE(
    total_problems BIGINT,
    solved_problems BIGINT,
    correct_count BIGINT,
    wrong_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ((SELECT COUNT(*) FROM problem) + (SELECT COUNT(*) FROM programming_language_problems))::BIGINT AS total_problems,
        (SELECT COUNT(DISTINCT reference_id) FROM user_answer WHERE user_id = p_user_id)::BIGINT AS solved_problems,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = p_user_id AND is_correct = TRUE)::BIGINT AS correct_count,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = p_user_id AND is_correct = FALSE)::BIGINT AS wrong_count;
END;
$$ LANGUAGE plpgsql;
