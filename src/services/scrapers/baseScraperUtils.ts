
import { toast } from "sonner";
import { applyProxy, findWorkingProxy } from "../corsProxyService";

// Helper function to fetch with CORS proxy
export const fetchWithProxy = async (url: string): Promise<Response> => {
  try {
    // Try with current proxy first
    const proxiedUrl = applyProxy(url);
    console.log('Fetching with proxy:', proxiedUrl);
    
    const response = await fetch(proxiedUrl);
    if (response.ok) {
      return response;
    }
    
    // If current proxy fails, find a working one
    console.log('Current proxy failed, finding a working proxy...');
    const workingProxy = await findWorkingProxy(url);
    
    if (workingProxy) {
      console.log('Found working proxy:', workingProxy);
      const newProxiedUrl = `${workingProxy}${url}`;
      return await fetch(newProxiedUrl);
    }
    
    throw new Error('No working CORS proxy found');
  } catch (error) {
    console.error('Error fetching with proxy:', error);
    throw error;
  }
};

// Common constants
export const VIX_URL = 'http://vixcentral.com';
export const BARCHART_URL = 'https://www.barchart.com';
