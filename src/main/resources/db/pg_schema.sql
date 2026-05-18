-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.learning_card_id_seq;

CREATE SEQUENCE public.learning_card_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.learning_card_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.learning_card_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.learning_card_id_seq TO anon;
GRANT ALL ON SEQUENCE public.learning_card_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.learning_card_id_seq TO service_role;

-- DROP SEQUENCE public.problem_id_seq;

CREATE SEQUENCE public.problem_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.problem_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.problem_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.problem_id_seq TO anon;
GRANT ALL ON SEQUENCE public.problem_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.problem_id_seq TO service_role;

-- DROP SEQUENCE public.programming_language_problems_id_seq;

CREATE SEQUENCE public.programming_language_problems_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.programming_language_problems_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.programming_language_problems_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.programming_language_problems_id_seq TO anon;
GRANT ALL ON SEQUENCE public.programming_language_problems_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.programming_language_problems_id_seq TO service_role;

-- DROP SEQUENCE public.statistics_id_seq;

CREATE SEQUENCE public.statistics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.statistics_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.statistics_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.statistics_id_seq TO anon;
GRANT ALL ON SEQUENCE public.statistics_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.statistics_id_seq TO service_role;

-- DROP SEQUENCE public.study_session_id_seq;

CREATE SEQUENCE public.study_session_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.study_session_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.study_session_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.study_session_id_seq TO anon;
GRANT ALL ON SEQUENCE public.study_session_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.study_session_id_seq TO service_role;

-- DROP SEQUENCE public.study_session_item_id_seq;

CREATE SEQUENCE public.study_session_item_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.study_session_item_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.study_session_item_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.study_session_item_id_seq TO anon;
GRANT ALL ON SEQUENCE public.study_session_item_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.study_session_item_id_seq TO service_role;

-- DROP SEQUENCE public.subject_id_seq;

CREATE SEQUENCE public.subject_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.subject_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.subject_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.subject_id_seq TO anon;
GRANT ALL ON SEQUENCE public.subject_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.subject_id_seq TO service_role;

-- DROP SEQUENCE public.subjective_problems_id_seq;

CREATE SEQUENCE public.subjective_problems_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.subjective_problems_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.subjective_problems_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.subjective_problems_id_seq TO anon;
GRANT ALL ON SEQUENCE public.subjective_problems_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.subjective_problems_id_seq TO service_role;

-- DROP SEQUENCE public.user_answer_id_seq;

CREATE SEQUENCE public.user_answer_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_answer_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.user_answer_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.user_answer_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_answer_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_answer_id_seq TO service_role;

-- DROP SEQUENCE public.user_statistics_id_seq;

CREATE SEQUENCE public.user_statistics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_statistics_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.user_statistics_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.user_statistics_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_statistics_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_statistics_id_seq TO service_role;

-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;

-- DROP SEQUENCE public.wrong_answer_bookmark_id_seq;

CREATE SEQUENCE public.wrong_answer_bookmark_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.wrong_answer_bookmark_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.wrong_answer_bookmark_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.wrong_answer_bookmark_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wrong_answer_bookmark_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wrong_answer_bookmark_id_seq TO service_role;
-- public."statistics" definition

-- Drop table

-- DROP TABLE public."statistics";

CREATE TABLE public."statistics" ( id bigserial NOT NULL, is_correct bool NOT NULL, problem_type varchar(32) NOT NULL, reference_id int8 NOT NULL, submitted_at timestamp(6) NULL, user_id int8 NOT NULL, CONSTRAINT statistics_pkey PRIMARY KEY (id));
CREATE INDEX idx_statistics_problem_type ON public.statistics USING btree (problem_type);
CREATE INDEX idx_statistics_reference_id ON public.statistics USING btree (reference_id);
CREATE INDEX idx_statistics_user_id ON public.statistics USING btree (user_id);

-- Permissions

ALTER TABLE public."statistics" OWNER TO postgres;
GRANT ALL ON TABLE public."statistics" TO postgres;
GRANT ALL ON TABLE public."statistics" TO anon;
GRANT ALL ON TABLE public."statistics" TO authenticated;
GRANT ALL ON TABLE public."statistics" TO service_role;


-- public.subject definition

-- Drop table

-- DROP TABLE public.subject;

CREATE TABLE public.subject ( id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL, "name" varchar(255) NOT NULL, description varchar(1000) NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT subject_name_key UNIQUE (name), CONSTRAINT subject_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE public.subject OWNER TO postgres;
GRANT ALL ON TABLE public.subject TO postgres;
GRANT ALL ON TABLE public.subject TO anon;
GRANT ALL ON TABLE public.subject TO authenticated;
GRANT ALL ON TABLE public.subject TO service_role;


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, google_id varchar(255) NULL, email varchar(255) NOT NULL, nickname varchar(255) NULL, "role" varchar(32) DEFAULT 'free_user'::character varying NOT NULL, trial_started_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, trial_expires_at timestamp DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval day) NOT NULL, subscription_started_at timestamp NULL, subscription_expires_at timestamp NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "password" varchar(255) NULL, username varchar(255) DEFAULT 'unknown'::character varying NOT NULL, CONSTRAINT users_email_key UNIQUE (email), CONSTRAINT users_google_id_key UNIQUE (google_id), CONSTRAINT users_pkey PRIMARY KEY (id), CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('free_user'::character varying)::text, ('money_user'::character varying)::text, ('admin'::character varying)::text]))));

-- Permissions

ALTER TABLE public.users OWNER TO postgres;
GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


-- public.wrong_answer_bookmark definition

-- Drop table

-- DROP TABLE public.wrong_answer_bookmark;

CREATE TABLE public.wrong_answer_bookmark ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, item_type varchar(32) NOT NULL, reference_id int8 NOT NULL, bookmarked_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, review_count int4 DEFAULT 0 NOT NULL, CONSTRAINT wrong_answer_bookmark_pkey PRIMARY KEY (id), CONSTRAINT wrong_answer_bookmark_type_check CHECK (((item_type)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT wrong_answer_bookmark_unique UNIQUE (user_id, item_type, reference_id));

-- Permissions

ALTER TABLE public.wrong_answer_bookmark OWNER TO postgres;
GRANT ALL ON TABLE public.wrong_answer_bookmark TO postgres;
GRANT ALL ON TABLE public.wrong_answer_bookmark TO anon;
GRANT ALL ON TABLE public.wrong_answer_bookmark TO authenticated;
GRANT ALL ON TABLE public.wrong_answer_bookmark TO service_role;


-- public.learning_card definition

-- Drop table

-- DROP TABLE public.learning_card;

CREATE TABLE public.learning_card ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, subject_id int8 NOT NULL, card_type varchar(32) NOT NULL, front_text varchar(4000) NOT NULL, back_text varchar(4000) NULL, answer_text varchar(2000) NULL, explanation varchar(4000) NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT learning_card_pkey PRIMARY KEY (id), CONSTRAINT learning_card_type_check CHECK (((card_type)::text = ANY ((ARRAY['FLASHCARD'::character varying, 'SUBJECTIVE_CARD'::character varying])::text[]))), CONSTRAINT learning_card_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.learning_card OWNER TO postgres;
GRANT ALL ON TABLE public.learning_card TO postgres;
GRANT ALL ON TABLE public.learning_card TO anon;
GRANT ALL ON TABLE public.learning_card TO authenticated;
GRANT ALL ON TABLE public.learning_card TO service_role;


-- public.problem definition

-- Drop table

-- DROP TABLE public.problem;

CREATE TABLE public.problem ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, subject_id int4 NOT NULL, question varchar(2000) NOT NULL, answer varchar(2000) NOT NULL, explanation varchar(4000) NULL, "type" varchar(32) NOT NULL, difficulty int4 NULL, option1 varchar(2000) NULL, option2 varchar(2000) NULL, option3 varchar(2000) NULL, option4 varchar(2000) NULL, option5 varchar(2000) NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT problem_difficulty_check CHECK (((difficulty IS NULL) OR ((difficulty >= 1) AND (difficulty <= 5)))), CONSTRAINT problem_pkey PRIMARY KEY (id), CONSTRAINT problem_type_check CHECK (((type)::text = ANY ((ARRAY['SUBJECTIVE'::character varying, 'OBJECTIVE'::character varying])::text[]))), CONSTRAINT problem_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.problem OWNER TO postgres;
GRANT ALL ON TABLE public.problem TO postgres;
GRANT ALL ON TABLE public.problem TO anon;
GRANT ALL ON TABLE public.problem TO authenticated;
GRANT ALL ON TABLE public.problem TO service_role;


-- public.programming_language_problems definition

-- Drop table

-- DROP TABLE public.programming_language_problems;

CREATE TABLE public.programming_language_problems ( id bigserial NOT NULL, subject_id int4 NULL, prog_language varchar(64) NOT NULL, question varchar(1000) NOT NULL, answer varchar(500) NOT NULL, explanation varchar(2000) NULL, difficulty int4 NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp NULL, updated_at timestamp NULL, CONSTRAINT programming_language_problems_pkey PRIMARY KEY (id), CONSTRAINT fk_prog_problems_subject FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.programming_language_problems OWNER TO postgres;
GRANT ALL ON TABLE public.programming_language_problems TO postgres;
GRANT ALL ON TABLE public.programming_language_problems TO anon;
GRANT ALL ON TABLE public.programming_language_problems TO authenticated;
GRANT ALL ON TABLE public.programming_language_problems TO service_role;


-- public.study_session definition

-- Drop table

-- DROP TABLE public.study_session;

CREATE TABLE public.study_session ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, subject_id int4 NOT NULL, session_branch varchar(32) NOT NULL, session_type varchar(32) NOT NULL, status varchar(32) DEFAULT 'IN_PROGRESS'::character varying NOT NULL, total_questions int4 DEFAULT 0 NOT NULL, correct_count int4 DEFAULT 0 NOT NULL, incorrect_count int4 DEFAULT 0 NOT NULL, started_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, completed_at timestamp NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, problem_branch varchar(32) NULL, CONSTRAINT study_session_branch_check CHECK (((session_branch)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT study_session_pkey PRIMARY KEY (id), CONSTRAINT study_session_status_check CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'ABANDONED'::character varying])::text[]))), CONSTRAINT study_session_type_check CHECK (((session_type)::text = ANY ((ARRAY['OBJECTIVE_RANDOM'::character varying, 'SUBJECTIVE_RANDOM'::character varying, 'WRONG_ANSWER'::character varying, 'PROGRAMMING_RANDOM'::character varying, 'THEORY_FLASHCARD'::character varying, 'THEORY_SUBJECTIVE'::character varying])::text[]))), CONSTRAINT study_session_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.study_session OWNER TO postgres;
GRANT ALL ON TABLE public.study_session TO postgres;
GRANT ALL ON TABLE public.study_session TO anon;
GRANT ALL ON TABLE public.study_session TO authenticated;
GRANT ALL ON TABLE public.study_session TO service_role;


-- public.study_session_item definition

-- Drop table

-- DROP TABLE public.study_session_item;

CREATE TABLE public.study_session_item ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, session_id int8 NOT NULL, item_type varchar(32) NOT NULL, reference_id int8 NOT NULL, subject_id int8 NOT NULL, item_order int4 NOT NULL, presented_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, answered_at timestamp NULL, is_answered bool DEFAULT false NOT NULL, is_correct bool NULL, user_submitted_answer varchar(4000) NULL, bookmarked_wrong bool DEFAULT false NOT NULL, CONSTRAINT study_session_item_pkey PRIMARY KEY (id), CONSTRAINT study_session_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT study_session_item_session_fk FOREIGN KEY (session_id) REFERENCES public.study_session(id) ON DELETE CASCADE, CONSTRAINT study_session_item_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.study_session_item OWNER TO postgres;
GRANT ALL ON TABLE public.study_session_item TO postgres;
GRANT ALL ON TABLE public.study_session_item TO anon;
GRANT ALL ON TABLE public.study_session_item TO authenticated;
GRANT ALL ON TABLE public.study_session_item TO service_role;


-- public.subjective_problems definition

-- Drop table

-- DROP TABLE public.subjective_problems;

CREATE TABLE public.subjective_problems ( id bigserial NOT NULL, subject_id int4 NULL, question varchar(1000) NOT NULL, answer varchar(500) NOT NULL, explanation varchar(2000) NULL, difficulty int4 NULL, is_ai_generated bool DEFAULT false NOT NULL, created_at timestamp NULL, updated_at timestamp NULL, CONSTRAINT subjective_problems_pkey PRIMARY KEY (id), CONSTRAINT fk_subjective_problems_subject FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.subjective_problems OWNER TO postgres;
GRANT ALL ON TABLE public.subjective_problems TO postgres;
GRANT ALL ON TABLE public.subjective_problems TO anon;
GRANT ALL ON TABLE public.subjective_problems TO authenticated;
GRANT ALL ON TABLE public.subjective_problems TO service_role;


-- public.user_answer definition

-- Drop table

-- DROP TABLE public.user_answer;

CREATE TABLE public.user_answer ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, session_id int8 NOT NULL, item_type varchar(32) NOT NULL, reference_id int8 NOT NULL, submitted_answer varchar(4000) NOT NULL, is_correct bool NOT NULL, submitted_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT user_answer_pkey PRIMARY KEY (id), CONSTRAINT user_answer_type_check CHECK (((item_type)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying, 'LEARNING'::character varying])::text[]))), CONSTRAINT user_answer_unique UNIQUE (session_id, reference_id, item_type), CONSTRAINT user_answer_session_fk FOREIGN KEY (session_id) REFERENCES public.study_session(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.user_answer OWNER TO postgres;
GRANT ALL ON TABLE public.user_answer TO postgres;
GRANT ALL ON TABLE public.user_answer TO anon;
GRANT ALL ON TABLE public.user_answer TO authenticated;
GRANT ALL ON TABLE public.user_answer TO service_role;


-- public.user_statistics definition

-- Drop table

-- DROP TABLE public.user_statistics;

CREATE TABLE public.user_statistics ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, user_id int8 NOT NULL, subject_id int8 NOT NULL, branch varchar(32) NOT NULL, total_attempted int4 DEFAULT 0 NOT NULL, correct_count int4 DEFAULT 0 NOT NULL, incorrect_count int4 DEFAULT 0 NOT NULL, last_studied_at timestamp NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT user_statistics_branch_check CHECK (((branch)::text = ANY ((ARRAY['OBJECTIVE'::character varying, 'SUBJECTIVE'::character varying, 'PROGRAMMING_LANGUAGE'::character varying])::text[]))), CONSTRAINT user_statistics_pkey PRIMARY KEY (id), CONSTRAINT user_statistics_unique UNIQUE (user_id, subject_id, branch), CONSTRAINT user_statistics_subject_fk FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.user_statistics OWNER TO postgres;
GRANT ALL ON TABLE public.user_statistics TO postgres;
GRANT ALL ON TABLE public.user_statistics TO anon;
GRANT ALL ON TABLE public.user_statistics TO authenticated;
GRANT ALL ON TABLE public.user_statistics TO service_role;



-- DROP FUNCTION public.get_user_statistics(int8);

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
$function$
;

-- Permissions

ALTER FUNCTION public.get_user_statistics(int8) OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_user_statistics(int8) TO public;
GRANT ALL ON FUNCTION public.get_user_statistics(int8) TO postgres;
GRANT ALL ON FUNCTION public.get_user_statistics(int8) TO anon;
GRANT ALL ON FUNCTION public.get_user_statistics(int8) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_statistics(int8) TO service_role;

-- DROP FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $function$
;

-- Permissions

ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO public;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO postgres;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;

-- DROP FUNCTION public.validate_answer(int8, text, text);

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
$function$
;

-- Permissions

ALTER FUNCTION public.validate_answer(int8, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.validate_answer(int8, text, text) TO public;
GRANT ALL ON FUNCTION public.validate_answer(int8, text, text) TO postgres;
GRANT ALL ON FUNCTION public.validate_answer(int8, text, text) TO anon;
GRANT ALL ON FUNCTION public.validate_answer(int8, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.validate_answer(int8, text, text) TO service_role;


-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT UPDATE, SELECT, USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT DELETE, UPDATE, MAINTAIN, INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;