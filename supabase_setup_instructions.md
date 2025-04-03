
# Supabase Database Setup for VIX Sentiment Seeker

## Table Creation Instructions

Run these SQL commands in the Supabase SQL Editor to create the necessary tables:

### 1. VIX Historical Data Table

```sql
CREATE TABLE IF NOT EXISTS vix_historical_data (
  date DATE PRIMARY KEY,
  value NUMERIC NOT NULL,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vix_historical_date ON vix_historical_data (date);

-- Set up Row Level Security
ALTER TABLE vix_historical_data ENABLE ROW LEVEL SECURITY;

-- Create policy that allows everyone to read data but only authenticated services to insert
CREATE POLICY "Allow public read access" ON vix_historical_data
  FOR SELECT USING (true);

CREATE POLICY "Allow service role to insert/update" ON vix_historical_data
  FOR INSERT USING (auth.role() = 'service_role');
  
CREATE POLICY "Allow service role to update" ON vix_historical_data
  FOR UPDATE USING (auth.role() = 'service_role');
```

### 2. VIX Futures Data Table

```sql
CREATE TABLE IF NOT EXISTS vix_futures_data (
  month TEXT NOT NULL,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (month, timestamp)
);

-- Add index for getting the latest timestamp quickly
CREATE INDEX IF NOT EXISTS idx_vix_futures_timestamp ON vix_futures_data (timestamp DESC);

-- Set up Row Level Security
ALTER TABLE vix_futures_data ENABLE ROW LEVEL SECURITY;

-- Create policy that allows everyone to read data but only authenticated services to insert
CREATE POLICY "Allow public read access" ON vix_futures_data
  FOR SELECT USING (true);

CREATE POLICY "Allow service role to insert/update" ON vix_futures_data
  FOR INSERT USING (auth.role() = 'service_role');
```

### 3. VIX Term Structure Table

```sql
CREATE TABLE IF NOT EXISTS vix_term_structure (
  id BIGSERIAL PRIMARY KEY,
  calculation_date DATE NOT NULL,
  month VARCHAR(20) NOT NULL,
  value REAL NOT NULL,
  days_to_expiration INTEGER,
  is_contango BOOLEAN,
  is_implied_forward BOOLEAN DEFAULT false,
  is_constant_maturity BOOLEAN DEFAULT false,
  forward_start_date DATE,
  forward_end_date DATE,
  maturity_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on calculation_date for faster queries
CREATE INDEX IF NOT EXISTS idx_vix_term_calculation_date ON vix_term_structure (calculation_date);

-- Create a unique constraint to prevent duplicate calculations
CREATE UNIQUE INDEX IF NOT EXISTS idx_vix_term_unique_values ON vix_term_structure (calculation_date, month, is_implied_forward, is_constant_maturity);

-- Set up Row Level Security
ALTER TABLE vix_term_structure ENABLE ROW LEVEL SECURITY;

-- Create policy that allows everyone to read data but only authenticated services to insert
CREATE POLICY "Allow public read access" ON vix_term_structure
  FOR SELECT USING (true);

CREATE POLICY "Allow service role to insert/update" ON vix_term_structure
  FOR INSERT USING (auth.role() = 'service_role');
```

## Automated Data Collection (Optional Future Feature)

You could set up a scheduled function to collect VIX data regularly:

```sql
-- Create a function to fetch and store VIX data
CREATE OR REPLACE FUNCTION fetch_vix_data()
RETURNS void AS $$
BEGIN
  -- This would contain logic to fetch VIX data and store it
  -- For now, this is a placeholder
  RAISE NOTICE 'VIX data collection would run here';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up a scheduled job to run daily (requires pg_cron extension)
-- IMPORTANT: Check if your Supabase plan supports pg_cron before attempting this
-- SELECT cron.schedule('0 18 * * *', 'SELECT fetch_vix_data()');
```

## Accessing the Data

The application is already configured to access these tables using the Supabase client.
