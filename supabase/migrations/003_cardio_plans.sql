CREATE TABLE cardio_plans (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  activity_type text NOT NULL CHECK (activity_type IN ('running','cycling','swimming')),
  title text NOT NULL,
  training_type text,
  planned_date text NOT NULL,
  target_distance numeric,
  target_duration text,
  target_zone text,
  target_pace text,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','skipped')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  completed_record_id text
);

CREATE TABLE cardio_records (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  plan_id text REFERENCES cardio_plans(id),
  activity_type text NOT NULL CHECK (activity_type IN ('running','cycling','swimming')),
  training_type text,
  performed_at text NOT NULL,
  duration text,
  distance_km numeric,
  avg_pace text,
  avg_hr integer,
  zone text,
  notes text,
  perceived_effort integer CHECK (perceived_effort BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cardio_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cardio_plans" ON cardio_plans
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE cardio_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cardio_records" ON cardio_records
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
