-- DROP SCHEMA public;

CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- Sequences

CREATE SEQUENCE IF NOT EXISTS public.learning_card_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.problem_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.programming_language_problems_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.study_session_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.study_session_item_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.subject_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.subjective_problems_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.user_answer_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.user_statistics_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.wrong_answer_bookmark_id_seq INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;

-- Tables

CREATE TABLE IF NOT EXISTS public.subject ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, "name" varchar(255) NOT NULL, description varchar(1000) NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT subject_name_key UNIQUE (name), CONSTRAINT subject_pkey PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.users ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, google_id varchar(255) NULL, email varchar(255) NOT NULL, nickname varchar(255) NULL, "role" varchar(32) DEFAULT 'TRIAL_USER'::character varying NOT NULL, free_trial_started_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, free_trial_expires_at timestamp DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval) NOT NULL, subscription_started_at timestamp NULL, subscription_expires_at timestamp NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "password" varchar(255) NULL, username varchar(255) DEFAULT 'unknown'::character varying NOT NULL, CONSTRAINT users_email_key UNIQUE (email), CONSTRAINT users_google_id_key UNIQUE (google_id), CONSTRAINT users_pkey PRIMARY KEY (id), CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['TRIAL_USER'::character varying, 'USER'::character varying, 'PAID_USER'::character varying, 'ADMIN'::character varying])::text[]))));

CREATE TABLE IF NOT EXISTS public.learning_card ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, subject_id int8 NOT NULL, card_type varchar(32) NOT NULL, front_text varchar(4000) NOT NULL, back_text varchar(4000) NULL, answer_text varchar(2000) NULL, explanation varchar(4000) NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT learning_card_pkey PRIMARY KEY (id), CONSTRAINT learning_card_type_check CHECK (((card_type)::text = ANY ((ARRAY['FLASHCARD'::character varying, 'SUBJECTIVE_CARD'::character varying])::text[]))), CONSTRAINT learning_card_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.problem ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, subject_id int8 NOT NULL, question varchar(2000) NOT NULL, answer varchar(2000) NOT NULL, explanation varchar(4000) NULL, "type" varchar(32) NOT NULL, difficulty int4 NULL, option1 varchar(2000) NULL, option2 varchar(2000) NULL, option3 varchar(2000) NULL, option4 varchar(2000) NULL, option5 varchar(2000) NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT problem_difficulty_check CHECK (((difficulty IS NULL) OR ((difficulty >= 1) AND (difficulty <= 5)))), CONSTRAINT problem_pkey PRIMARY KEY (id), CONSTRAINT problem_type_check CHECK (((type)::text = ANY ((ARRAY['SUBJECTIVE'::character varying, 'OBJECTIVE'::character varying])::text[]))), CONSTRAINT problem_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.programming_language_problems ( id bigserial NOT NULL, subject_id int8 NULL, prog_language varchar(64) NOT NULL, question varchar(2000) NOT NULL, answer varchar(2000) NOT NULL, explanation varchar(4000) NULL, difficulty int4 NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT programming_language_problems_pkey PRIMARY KEY (id), CONSTRAINT fk_prog_problems_subject FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.study_session ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, subject_id int8 NOT NULL, session_branch varchar(32) NOT NULL, session_type varchar(32) NOT NULL, status varchar(32) DEFAULT 'IN_PROGRESS'::character varying NOT NULL, total_questions int4 DEFAULT 0 NOT NULL, correct_count int4 DEFAULT 0 NOT NULL, incorrect_count int4 DEFAULT 0 NOT NULL, started_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, completed_at timestamp NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT study_session_branch_check CHECK (((session_branch)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT study_session_pkey PRIMARY KEY (id), CONSTRAINT study_session_status_check CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'ABANDONED'::character varying])::text[]))), CONSTRAINT study_session_type_check CHECK (((session_type)::text = ANY ((ARRAY['OBJECTIVE_RANDOM'::character varying, 'SUBJECTIVE_RANDOM'::character varying, 'WRONG_ANSWER'::character varying, 'PROGRAMMING_RANDOM'::character varying, 'THEORY_FLASHCARD'::character varying, 'THEORY_SUBJECTIVE'::character varying])::text[]))), CONSTRAINT study_session_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE, CONSTRAINT study_session_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.study_session_item ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, session_id int8 NOT NULL, item_type varchar(32) NOT NULL, reference_id int8 NOT NULL, subject_id int8 NOT NULL, item_order int4 NOT NULL, presented_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, answered_at timestamp NULL, is_answered bool DEFAULT false NOT NULL, is_correct bool NULL, user_submitted_answer varchar(4000) NULL, bookmarked_wrong bool DEFAULT false NOT NULL, CONSTRAINT study_session_item_pkey PRIMARY KEY (id), CONSTRAINT study_session_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT study_session_item_session_fk FOREIGN KEY (session_id) REFERENCES public.study_session(id) ON DELETE CASCADE, CONSTRAINT study_session_item_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.subjective_problems ( id bigserial NOT NULL, subject_id int8 NULL, question varchar(2000) NOT NULL, answer varchar(2000) NOT NULL, explanation varchar(4000) NULL, difficulty int4 NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT subjective_problems_pkey PRIMARY KEY (id), CONSTRAINT fk_subjective_problems_subject FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.user_answer ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, session_id int8 NOT NULL, item_type varchar(32) NOT NULL, reference_id int8 NOT NULL, submitted_answer varchar(4000) NOT NULL, is_correct bool NOT NULL, submitted_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT user_answer_pkey PRIMARY KEY (id), CONSTRAINT user_answer_type_check CHECK (((item_type)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT user_answer_unique UNIQUE (session_id, reference_id, item_type), CONSTRAINT user_answer_session_fk FOREIGN KEY (session_id) REFERENCES public.study_session(id) ON DELETE CASCADE, CONSTRAINT user_answer_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.user_statistics ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, subject_id int8 NOT NULL, branch varchar(32) NOT NULL, total_attempted int4 DEFAULT 0 NOT NULL, correct_count int4 DEFAULT 0 NOT NULL, incorrect_count int4 DEFAULT 0 NOT NULL, last_studied_at timestamp NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT user_statistics_branch_check CHECK (((branch)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying])::text[]))), CONSTRAINT user_statistics_pkey PRIMARY KEY (id), CONSTRAINT user_statistics_unique UNIQUE (user_id, subject_id, branch), CONSTRAINT user_statistics_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE, CONSTRAINT user_statistics_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS public.wrong_answer_bookmark ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, item_type varchar(32) NOT NULL, reference_id int8 NOT NULL, bookmarked_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, review_count int4 DEFAULT 0 NOT NULL, last_reviewed_at timestamp NULL, CONSTRAINT wrong_answer_bookmark_pkey PRIMARY KEY (id), CONSTRAINT wrong_answer_bookmark_type_check CHECK (((item_type)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT wrong_answer_bookmark_unique UNIQUE (user_id, item_type, reference_id), CONSTRAINT wrong_answer_bookmark_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);

-- Functions

CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id bigint)
 RETURNS TABLE(total_problems bigint, solved_problems bigint, correct_count bigint, wrong_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ((SELECT COUNT(*) FROM problem) + (SELECT COUNT(*) FROM programming_language_problems))::BIGINT AS total_problems,
        (SELECT COUNT(DISTINCT reference_id) FROM user_answer WHERE user_id = p_user_id)::BIGINT AS solved_problems,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = p_user_id AND is_correct = TRUE)::BIGINT AS correct_count,
        (SELECT COUNT(*) FROM user_answer WHERE user_id = p_user_id AND is_correct = FALSE)::BIGINT AS wrong_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
   BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
   END;
$function$;

-- Triggers for automatic updated_at updates
CREATE TRIGGER update_subject_updated_at BEFORE UPDATE ON subject
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_updated_at BEFORE UPDATE ON problem
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjective_problems_updated_at BEFORE UPDATE ON subjective_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programming_language_problems_updated_at BEFORE UPDATE ON programming_language_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_card_updated_at BEFORE UPDATE ON learning_card
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_session_updated_at BEFORE UPDATE ON study_session
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_session_item_updated_at BEFORE UPDATE ON study_session_item
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_answer_updated_at BEFORE UPDATE ON user_answer
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wrong_answer_bookmark_updated_at BEFORE UPDATE ON wrong_answer_bookmark
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_answer(p_problem_id bigint, p_submitted_answer text, p_problem_type text DEFAULT 'OBJECTIVE'::text)
 RETURNS TABLE(is_correct boolean, explanation text, correct_answer text)
 LANGUAGE plpgsql
AS $function$
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
$function$;
