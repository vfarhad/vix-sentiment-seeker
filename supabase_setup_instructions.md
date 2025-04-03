
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
