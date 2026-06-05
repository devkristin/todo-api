CREATE TABLE todo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    schedule_date DATE NOT NULL,
    schedule_time TIME, 
    title TEXT NOT NULL,
    is_priority BOOLEAN DEFAULT FALSE NOT NULL,
    is_follow_up BOOLEAN DEFAULT FALSE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    position FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE food (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    schedule_date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE supplement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    schedule_date DATE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercise (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    schedule_date DATE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metrics_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    schedule_date DATE NOT NULL UNIQUE,
    weight FLOAT,
    water_consumed INT DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE todo ENABLE ROW LEVEL SECURITY;
ALTER TABLE food ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own todos" 
ON todo 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own food" 
ON food 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own supplements" 
ON supplement 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own exercises" 
ON exercise 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own metrics logs" 
ON metrics_log 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);
