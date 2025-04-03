
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SupabaseSetupProps {
  onSetupComplete: () => void;
}

const SupabaseSetup: React.FC<SupabaseSetupProps> = ({ onSetupComplete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupProgress, setSetupProgress] = useState<string[]>([]);

  const createTables = async () => {
    setIsCreating(true);
    setSetupProgress([]);

    try {
      // Create historical data table
      setSetupProgress(prev => [...prev, "Creating VIX historical data table..."]);
      const { error: historicalError } = await supabase.rpc(
        'create_vix_historical_table'
      );

      if (historicalError) {
        // If RPC doesn't exist, fall back to direct SQL
        setSetupProgress(prev => [...prev, "RPC not available, using direct SQL..."]);
        const { error: directSqlError } = await supabase.from('vix_historical_data').insert({
          date: new Date().toISOString().split('T')[0],
          value: 0,
          inserted_at: new Date().toISOString()
        });

        // If table doesn't exist, this will fail, which is expected
        if (directSqlError && directSqlError.code !== '42P01') {
          throw directSqlError;
        }

        // Since direct insert failed as expected, let's try to create the table
        setSetupProgress(prev => [...prev, "Creating historical table via SQL..."]);
        const createHistoricalResult = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS vix_historical_data (
              date DATE PRIMARY KEY,
              value NUMERIC NOT NULL,
              inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_vix_historical_date ON vix_historical_data (date);
          `
        });

        if (createHistoricalResult.error) {
          throw createHistoricalResult.error;
        }
      }

      setSetupProgress(prev => [...prev, "VIX historical data table created successfully!"]);

      // Create futures data table
      setSetupProgress(prev => [...prev, "Creating VIX futures data table..."]);
      const { error: futuresError } = await supabase.rpc(
        'create_vix_futures_table'
      );

      if (futuresError) {
        // If RPC doesn't exist, fall back to direct SQL
        setSetupProgress(prev => [...prev, "RPC not available, using direct SQL..."]);
        const createFuturesResult = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS vix_futures_data (
              month TEXT NOT NULL,
              value NUMERIC NOT NULL,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              PRIMARY KEY (month, timestamp)
            );
            CREATE INDEX IF NOT EXISTS idx_vix_futures_timestamp ON vix_futures_data (timestamp DESC);
          `
        });

        if (createFuturesResult.error) {
          throw createFuturesResult.error;
        }
      }

      setSetupProgress(prev => [...prev, "VIX futures data table created successfully!"]);

      // Enable RLS policies if needed
      setSetupProgress(prev => [...prev, "Setting up security policies..."]);
      const rlsResult = await supabase.rpc('exec_sql', {
        sql_query: `
          -- Set up Row Level Security for historical data
          ALTER TABLE IF EXISTS vix_historical_data ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Allow public read access" ON vix_historical_data;
          CREATE POLICY "Allow public read access" ON vix_historical_data FOR SELECT USING (true);
          DROP POLICY IF EXISTS "Allow service role to insert/update" ON vix_historical_data;
          CREATE POLICY "Allow service role to insert/update" ON vix_historical_data FOR INSERT USING (auth.role() = 'service_role');
          DROP POLICY IF EXISTS "Allow service role to update" ON vix_historical_data;
          CREATE POLICY "Allow service role to update" ON vix_historical_data FOR UPDATE USING (auth.role() = 'service_role');

          -- Set up Row Level Security for futures data
          ALTER TABLE IF EXISTS vix_futures_data ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Allow public read access" ON vix_futures_data;
          CREATE POLICY "Allow public read access" ON vix_futures_data FOR SELECT USING (true);
          DROP POLICY IF EXISTS "Allow service role to insert/update" ON vix_futures_data;
          CREATE POLICY "Allow service role to insert/update" ON vix_futures_data FOR INSERT USING (auth.role() = 'service_role');
        `
      });

      if (rlsResult.error) {
        // RLS setup is not critical for functionality, so just log the error
        console.warn("Failed to set up RLS policies:", rlsResult.error);
        setSetupProgress(prev => [...prev, "Warning: Failed to set up security policies (not critical)"]);
      } else {
        setSetupProgress(prev => [...prev, "Security policies set up successfully"]);
      }

      // Setup complete
      setSetupProgress(prev => [...prev, "Database setup complete!"]);
      setSetupComplete(true);
      toast.success("Supabase database setup completed");
      onSetupComplete();
    } catch (error) {
      console.error("Error setting up Supabase tables:", error);
      toast.error("Database setup failed. Please set up tables manually.");
      setSetupProgress(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h2 className="text-lg font-bold mb-2">Supabase Database Setup</h2>
      
      {!setupComplete ? (
        <>
          <p className="mb-2">Your Supabase connection is working, but the required tables don't exist yet.</p>
          <p className="mb-2">Click the button below to automatically create the necessary tables:</p>
          
          <button 
            onClick={createTables}
            disabled={isCreating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 mb-4"
          >
            {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isCreating ? 'Creating Tables...' : 'Create Database Tables'}
          </button>
          
          {setupProgress.length > 0 && (
            <div className="bg-background p-3 rounded overflow-auto max-h-60 text-sm">
              <h3 className="font-medium mb-1">Setup Progress:</h3>
              <ul className="space-y-1">
                {setupProgress.map((message, index) => (
                  <li key={index} className={message.startsWith('Error') ? 'text-negative' : message.startsWith('Warning') ? 'text-warning' : ''}>
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="font-medium mb-2">Manual Setup Alternative</h3>
            <p className="mb-2">If automatic setup fails, you can manually create tables by running the following SQL in the Supabase SQL Editor:</p>
            
            <div className="bg-background p-3 rounded overflow-auto my-3 text-sm">
              <pre className="whitespace-pre-wrap">
                {`-- Create VIX Historical Data Table
CREATE TABLE IF NOT EXISTS vix_historical_data (
  date DATE PRIMARY KEY,
  value NUMERIC NOT NULL,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create VIX Futures Data Table
CREATE TABLE IF NOT EXISTS vix_futures_data (
  month TEXT NOT NULL,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (month, timestamp)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vix_historical_date ON vix_historical_data (date);
CREATE INDEX IF NOT EXISTS idx_vix_futures_timestamp ON vix_futures_data (timestamp DESC);`}
              </pre>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-positive/20 text-positive mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Setup Complete!</h3>
          <p>The database tables have been created successfully.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Application
          </button>
        </div>
      )}
    </div>
  );
};

export default SupabaseSetup;
