
import { toast } from "sonner";
import { applyProxy, findWorkingProxy } from "../corsProxyService";

// Helper function to fetch with CORS proxy, with improved error handling and retries
export const fetchWithProxy = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    // Try with current proxy first
    const proxiedUrl = applyProxy(url);
    console.log('Fetching with proxy:', proxiedUrl);
    
    try {
      // Try with no-cors mode if we're in the browser
      const response = await fetch(proxiedUrl, {
        ...options,
        mode: 'cors',
        headers: {
          ...options.headers,
          'Origin': window.location.origin
        }
      });
      
      if (response.ok) {
        return response;
      }
    } catch (err) {
      console.log('Initial proxy request failed, trying alternatives');
    }
    
    // If current proxy fails, find a working one
    console.log('Current proxy failed, finding a working proxy...');
    const workingProxy = await findWorkingProxy(url);
    
    if (workingProxy) {
      console.log('Found working proxy:', workingProxy);
      
      // Format URL based on proxy type
      const newProxiedUrl = workingProxy.includes('?url=')
        ? `${workingProxy}${encodeURIComponent(url)}`
        : `${workingProxy}${url}`;
      
      try {
        const response = await fetch(newProxiedUrl, {
          ...options,
          mode: 'cors',
          headers: {
            ...options.headers,
            'Origin': window.location.origin
          }
        });
        
        if (response.ok) {
          return response;
        }
      } catch (proxyError) {
        console.error('Error with alternative proxy:', proxyError);
      }
    }
    
    // If all proxies fail, try a direct request as a last resort
    console.log('All proxies failed, trying direct request');
    const directResponse = await fetch(url, {
      ...options,
      mode: 'no-cors', // This will give an opaque response but might work in some cases
    });
    
    return directResponse;
  } catch (error) {
    console.error('Error fetching with proxy:', error);
    throw error;
  }
};

// Common constants
export const VIX_URL = 'http://vixcentral.com';
