-- Score columns were NUMERIC(5,2) NULLABLE but the application always
-- initializes them to 0. Make them NOT NULL with DEFAULT 0 to enforce
-- the invariant at the database level.

ALTER TABLE opportunities
  ALTER COLUMN pain_score               SET DEFAULT 0,
  ALTER COLUMN pain_score               SET NOT NULL,
  ALTER COLUMN frequency_score          SET DEFAULT 0,
  ALTER COLUMN frequency_score          SET NOT NULL,
  ALTER COLUMN buyer_clarity_score      SET DEFAULT 0,
  ALTER COLUMN buyer_clarity_score      SET NOT NULL,
  ALTER COLUMN willingness_to_pay_score SET DEFAULT 0,
  ALTER COLUMN willingness_to_pay_score SET NOT NULL,
  ALTER COLUMN feasibility_score        SET DEFAULT 0,
  ALTER COLUMN feasibility_score        SET NOT NULL,
  ALTER COLUMN distribution_score       SET DEFAULT 0,
  ALTER COLUMN distribution_score       SET NOT NULL,
  ALTER COLUMN strategic_fit_score      SET DEFAULT 0,
  ALTER COLUMN strategic_fit_score      SET NOT NULL,
  ALTER COLUMN portfolio_value_score    SET DEFAULT 0,
  ALTER COLUMN portfolio_value_score    SET NOT NULL,
  ALTER COLUMN overall_score            SET DEFAULT 0,
  ALTER COLUMN overall_score            SET NOT NULL,
  ALTER COLUMN confidence_level         SET DEFAULT 'medium',
  ALTER COLUMN confidence_level         SET NOT NULL;
