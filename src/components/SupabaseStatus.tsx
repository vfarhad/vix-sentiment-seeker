
import React from 'react';
import { Database, Server, HardDrive, AlertCircle } from 'lucide-react';

interface SupabaseStatusProps {
  isConnected: boolean;
  tablesExist: boolean;
  onSetupClick: () => void;
}

const SupabaseStatus: React.FC<SupabaseStatusProps> = ({ 
  isConnected, 
  tablesExist,
  onSetupClick
}) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Database className="h-5 w-5" />
        Supabase Status
      </h2>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span>Connection</span>
          </div>
          <div className={`flex items-center gap-1 ${isConnected ? 'text-positive' : 'text-negative'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-positive' : 'bg-negative'} ${isConnected ? 'animate-pulse' : ''}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>Database Tables</span>
          </div>
          <div className={`flex items-center gap-1 ${tablesExist ? 'text-positive' : 'text-warning'}`}>
            <div className={`w-2 h-2 rounded-full ${tablesExist ? 'bg-positive' : 'bg-warning'}`}></div>
            <span>{tablesExist ? 'Ready' : 'Missing'}</span>
          </div>
        </div>
        
        {!tablesExist && isConnected && (
          <div className="pt-3 border-t border-border mt-3">
            <button
              onClick={onSetupClick}
              className="w-full px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Set Up Database Tables
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseStatus;
