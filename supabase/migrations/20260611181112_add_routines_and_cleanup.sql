-- 1. CLEANUP UNUSED TABLES
DROP TABLE IF EXISTS food CASCADE;
DROP TABLE IF EXISTS supplement CASCADE;
DROP TABLE IF EXISTS exercise CASCADE;
DROP TABLE IF EXISTS metrics_log CASCADE;

-- 2. CREATE NEW ROUTINE TABLES
CREATE TABLE routine (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    recurrence_rule TEXT DEFAULT 'manual' NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routine_todo_blueprint (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES routine(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    schedule_time TIME,
    title TEXT NOT NULL,
    is_priority BOOLEAN DEFAULT FALSE NOT NULL,
    is_follow_up BOOLEAN DEFAULT FALSE NOT NULL,
    position FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LINK STABLE TODOS TO ROUTINES
ALTER TABLE todo ADD COLUMN IF NOT EXISTS routine_id UUID REFERENCES routine(id) ON DELETE SET NULL;

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE routine ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_todo_blueprint ENABLE ROW LEVEL SECURITY;

-- 5. DEFINE RLS POLICIES
CREATE POLICY "Users can only access their own routines"
ON routine FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own blueprints"
ON routine_todo_blueprint FOR ALL TO authenticated USING (auth.uid() = user_id);