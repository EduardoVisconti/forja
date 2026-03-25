-- Add persisted unit for exercise weight values.
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS weight_unit TEXT;

UPDATE exercises
SET weight_unit = 'kg'
WHERE weight_unit IS NULL;

ALTER TABLE exercises
ALTER COLUMN weight_unit SET DEFAULT 'kg';

ALTER TABLE exercises
ALTER COLUMN weight_unit SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exercises_weight_unit_check'
  ) THEN
    ALTER TABLE exercises
    ADD CONSTRAINT exercises_weight_unit_check
    CHECK (weight_unit IN ('kg', 'lbs'));
  END IF;
END
$$;
