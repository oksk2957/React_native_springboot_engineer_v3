-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

-- DROP SEQUENCE problem_id_seq;

CREATE SEQUENCE problem_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE study_session_id_seq;

CREATE SEQUENCE study_session_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE subject_id_seq;

CREATE SEQUENCE subject_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE user_answer_id_seq;

CREATE SEQUENCE user_answer_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE user_statistics_id_seq;

CREATE SEQUENCE user_statistics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE users_id_seq;

CREATE SEQUENCE users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE wrong_answer_bookmark_id_seq;

CREATE SEQUENCE wrong_answer_bookmark_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;-- public.subject definition

-- Drop table

-- DROP TABLE subject;

CREATE TABLE subject (
	id bigserial NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT subject_name_key UNIQUE (name),
	CONSTRAINT subject_pkey PRIMARY KEY (id)
);


-- public.users definition

-- Drop table

-- DROP TABLE users;

CREATE TABLE users (
	id bigserial NOT NULL,
	google_id text NULL,
	email text NOT NULL,
	nickname text NULL,
	"role" text DEFAULT 'USER'::text NOT NULL,
	free_trial_started_at timestamptz DEFAULT now() NULL,
	subscription_started_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_google_id_key UNIQUE (google_id),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['USER'::text, 'ADMIN'::text, 'PAID_USER'::text])))
);


-- public.problem definition

-- Drop table

-- DROP TABLE problem;

CREATE TABLE problem (
	id bigserial NOT NULL,
	subject_id int8 NOT NULL,
	question text NOT NULL,
	answer text NOT NULL,
	explanation text NULL,
	"type" text NOT NULL,
	difficulty int4 NULL,
	option1 text NULL,
	option2 text NULL,
	option3 text NULL,
	option4 text NULL,
	option5 text NULL,
	is_ai_generated bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT problem_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 5))),
	CONSTRAINT problem_pkey PRIMARY KEY (id),
	CONSTRAINT problem_type_check CHECK ((type = ANY (ARRAY['SUBJECTIVE'::text, 'OBJECTIVE'::text]))),
	CONSTRAINT problem_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);


-- public.study_session definition

-- Drop table

-- DROP TABLE study_session;

CREATE TABLE study_session (
	id bigserial NOT NULL,
	user_id int8 NOT NULL,
	subject_id int8 NOT NULL,
	session_type text NOT NULL,
	status text DEFAULT 'IN_PROGRESS'::text NOT NULL,
	total_questions int4 DEFAULT 0 NULL,
	correct_count int4 DEFAULT 0 NULL,
	incorrect_count int4 DEFAULT 0 NULL,
	started_at timestamptz DEFAULT now() NULL,
	completed_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT study_session_pkey PRIMARY KEY (id),
	CONSTRAINT study_session_session_type_check CHECK ((session_type = ANY (ARRAY['SUBJECTIVE_RANDOM'::text, 'OBJECTIVE_RANDOM'::text, 'WRONG_ANSWER'::text]))),
	CONSTRAINT study_session_status_check CHECK ((status = ANY (ARRAY['IN_PROGRESS'::text, 'COMPLETED'::text, 'ABANDONED'::text]))),
	CONSTRAINT study_session_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
	CONSTRAINT study_session_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- public.user_answer definition

-- Drop table

-- DROP TABLE user_answer;

CREATE TABLE user_answer (
	id bigserial NOT NULL,
	user_id int8 NOT NULL,
	problem_id int8 NOT NULL,
	session_id int8 NOT NULL,
	submitted_answer text NOT NULL,
	is_correct bool NOT NULL,
	submitted_at timestamptz DEFAULT now() NULL,
	CONSTRAINT user_answer_pkey PRIMARY KEY (id),
	CONSTRAINT user_answer_session_id_problem_id_key UNIQUE (session_id, problem_id),
	CONSTRAINT user_answer_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES problem(id) ON DELETE CASCADE,
	CONSTRAINT user_answer_session_id_fkey FOREIGN KEY (session_id) REFERENCES study_session(id) ON DELETE CASCADE,
	CONSTRAINT user_answer_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- public.user_statistics definition

-- Drop table

-- DROP TABLE user_statistics;

CREATE TABLE user_statistics (
	id bigserial NOT NULL,
	user_id int8 NOT NULL,
	subject_id int8 NOT NULL,
	total_attempted int4 DEFAULT 0 NULL,
	correct_count int4 DEFAULT 0 NULL,
	incorrect_count int4 DEFAULT 0 NULL,
	last_studied_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT user_statistics_pkey PRIMARY KEY (id),
	CONSTRAINT user_statistics_user_id_subject_id_key UNIQUE (user_id, subject_id),
	CONSTRAINT user_statistics_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
	CONSTRAINT user_statistics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- public.wrong_answer_bookmark definition

-- Drop table

-- DROP TABLE wrong_answer_bookmark;

CREATE TABLE wrong_answer_bookmark (
	id bigserial NOT NULL,
	user_id int8 NOT NULL,
	problem_id int8 NOT NULL,
	bookmarked_at timestamptz DEFAULT now() NULL,
	review_count int4 DEFAULT 0 NULL,
	last_reviewed_at timestamptz NULL,
	CONSTRAINT wrong_answer_bookmark_pkey PRIMARY KEY (id),
	CONSTRAINT wrong_answer_bookmark_user_id_problem_id_key UNIQUE (user_id, problem_id),
	CONSTRAINT wrong_answer_bookmark_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES problem(id) ON DELETE CASCADE,
	CONSTRAINT wrong_answer_bookmark_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



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