-- Convert courses.price from TEXT to INTEGER (matches events table)
ALTER TABLE courses ALTER COLUMN price TYPE INTEGER USING (
  CASE WHEN price ~ '^\d+$' THEN price::integer ELSE NULL END
);
