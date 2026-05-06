CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE subject (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(1000),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  nickname VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'TRIAL_USER',
  free_trial_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  free_trial_expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7' DAY),
  subscription_started_at TIMESTAMP,
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  password VARCHAR(255),
  username VARCHAR(255) NOT NULL DEFAULT 'unknown',
  CONSTRAINT users_role_check CHECK (role IN ('TRIAL_USER', 'USER', 'PAID_USER', 'ADMIN'))
);

CREATE TABLE problem (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL,
  question VARCHAR(2000) NOT NULL,
  answer VARCHAR(2000) NOT NULL,
  explanation VARCHAR(4000),
  type VARCHAR(32) NOT NULL,
  difficulty INTEGER,
  option1 VARCHAR(2000),
  option2 VARCHAR(2000),
  option3 VARCHAR(2000),
  option4 VARCHAR(2000),
  option5 VARCHAR(2000),
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT problem_type_check CHECK (type IN ('SUBJECTIVE', 'OBJECTIVE')),
  CONSTRAINT problem_difficulty_check CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5)),
CONSTRAINT problem_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);

CREATE TABLE subjective_problems (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL,
  question VARCHAR(2000) NOT NULL,
  answer VARCHAR(2000) NOT NULL,
  explanation VARCHAR(4000),
  difficulty INTEGER,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subjective_problems_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
  CONSTRAINT subjective_problems_difficulty_check CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);

CREATE INDEX idx_subjective_problems_subject_id ON subjective_problems(subject_id);

CREATE TABLE programming_language_problems (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL,
  prog_language VARCHAR(64) NOT NULL,
  question VARCHAR(2000) NOT NULL,
  answer VARCHAR(2000) NOT NULL,
  explanation VARCHAR(4000),
  difficulty INTEGER,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT programming_language_difficulty_check CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5)),
  CONSTRAINT programming_language_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);

CREATE TABLE learning_card (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL,
  card_type VARCHAR(32) NOT NULL,
  front_text VARCHAR(4000) NOT NULL,
  back_text VARCHAR(4000),
  answer_text VARCHAR(2000),
  explanation VARCHAR(4000),
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT learning_card_type_check CHECK (card_type IN ('FLASHCARD', 'SUBJECTIVE_CARD')),
  CONSTRAINT learning_card_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);

CREATE TABLE study_session (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  session_branch VARCHAR(32) NOT NULL,
  session_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT study_session_branch_check CHECK (session_branch IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE', 'LEARNING')),
  CONSTRAINT study_session_type_check CHECK (session_type IN ('OBJECTIVE_RANDOM', 'SUBJECTIVE_RANDOM', 'WRONG_ANSWER', 'PROGRAMMING_RANDOM', 'THEORY_FLASHCARD', 'THEORY_SUBJECTIVE')),
  CONSTRAINT study_session_status_check CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
  CONSTRAINT study_session_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT study_session_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);

CREATE TABLE study_session_item (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id BIGINT NOT NULL,
  item_type VARCHAR(32) NOT NULL,
  reference_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  item_order INTEGER NOT NULL,
  presented_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  is_correct BOOLEAN,
  user_submitted_answer VARCHAR(4000),
  bookmarked_wrong BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT study_session_item_type_check CHECK (item_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE', 'LEARNING')),
  CONSTRAINT study_session_item_session_fk FOREIGN KEY (session_id) REFERENCES study_session(id) ON DELETE CASCADE,
  CONSTRAINT study_session_item_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);

CREATE TABLE user_answer (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  session_id BIGINT NOT NULL,
  item_type VARCHAR(32) NOT NULL,
  reference_id BIGINT NOT NULL,
  submitted_answer VARCHAR(4000) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_answer_type_check CHECK (item_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE', 'LEARNING')),
  CONSTRAINT user_answer_session_fk FOREIGN KEY (session_id) REFERENCES study_session(id) ON DELETE CASCADE,
  CONSTRAINT user_answer_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_answer_unique UNIQUE (session_id, reference_id, item_type)
);

CREATE TABLE wrong_answer_bookmark (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  item_type VARCHAR(32) NOT NULL,
  reference_id BIGINT NOT NULL,
  bookmarked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  review_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP,
  CONSTRAINT wrong_answer_bookmark_type_check CHECK (item_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE', 'LEARNING')),
  CONSTRAINT wrong_answer_bookmark_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT wrong_answer_bookmark_unique UNIQUE (user_id, item_type, reference_id)
);

CREATE TABLE user_statistics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  branch VARCHAR(32) NOT NULL,
  total_attempted INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  last_studied_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_statistics_branch_check CHECK (branch IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE')),
  CONSTRAINT user_statistics_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_statistics_subject_fk FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
  CONSTRAINT user_statistics_unique UNIQUE (user_id, subject_id, branch)
);
