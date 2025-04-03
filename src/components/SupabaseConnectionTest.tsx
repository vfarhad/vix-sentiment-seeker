
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testSupabaseConnection } from '@/services/sp500/sp500DataService';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const SupabaseConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');

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

  return (
    <div className="p-4 bg-card border border-border rounded-md">
      <h3 className="text-lg font-medium mb-4">Supabase Connection Test</h3>
      
      <div className="flex flex-col space-y-4">
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
          <div className={`flex items-center p-3 rounded-md ${connectionStatus === 'success' ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>
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
    </div>
  );
};

export default SupabaseConnectionTest;
