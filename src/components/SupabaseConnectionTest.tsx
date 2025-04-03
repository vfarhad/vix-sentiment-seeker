
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testSupabaseConnection, testSP500DataTable } from '@/services/sp500/sp500DataService';
import { AlertCircle, CheckCircle, Loader2, Database } from 'lucide-react';

const SupabaseConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [sp500Loading, setSP500Loading] = useState(false);
  const [sp500Status, setSP500Status] = useState<'untested' | 'success' | 'error' | 'empty'>('untested');
  const [sp500Record, setSP500Record] = useState<any>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      console.error('Error during connection test:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSP500Table = async () => {
    setSP500Loading(true);
    setSP500Record(null);
    try {
      const result = await testSP500DataTable();
      if (result.success) {
        setSP500Status(result.data.length > 0 ? 'success' : 'empty');
        if (result.data.length > 0) {
          setSP500Record(result.data[0]);
        }
      } else {
        setSP500Status('error');
      }
    } catch (error) {
      console.error('Error testing SP500 data table:', error);
      setSP500Status('error');
    } finally {
      setSP500Loading(false);
    }
  };

  return (
    <div className="p-4 bg-card border border-border rounded-md">
      <h3 className="text-lg font-medium mb-4">Supabase Connection Tests</h3>
      
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Button 
              onClick={handleTestConnection}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Supabase Connection'
              )}
            </Button>
            
            {connectionStatus !== 'untested' && (
              <div className={`mt-2 flex items-center p-3 rounded-md ${connectionStatus === 'success' ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>
                {connectionStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Connection successful! Supabase is properly configured.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Connection failed. Check console for details.</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div>
            <Button 
              onClick={handleTestSP500Table}
              disabled={sp500Loading}
              className="w-full"
              variant="outline"
            >
              {sp500Loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing SP500 Table...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Test SP500 Data Table
                </>
              )}
            </Button>
            
            {sp500Status !== 'untested' && (
              <div className={`mt-2 flex flex-col p-3 rounded-md ${
                sp500Status === 'success' ? 'bg-positive/20 text-positive' : 
                sp500Status === 'empty' ? 'bg-warning/20 text-warning' : 
                'bg-negative/20 text-negative'
              }`}>
                {sp500Status === 'success' ? (
                  <>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>SP500 data table accessible with records!</span>
                    </div>
                    {sp500Record && (
                      <div className="mt-2 p-2 bg-background/50 rounded-md text-sm">
                        <div className="font-medium">Sample Record:</div>
                        <pre className="overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(sp500Record, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : sp500Status === 'empty' ? (
                  <>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>SP500 data table exists but contains no records.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>Failed to access SP500 data table. Check console for details.</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionTest;
