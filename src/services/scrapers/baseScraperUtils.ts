
import { toast } from "sonner";
import { applyProxy, findWorkingProxy } from "../corsProxyService";

// Helper function to fetch with CORS proxy, with improved error handling and retries
export const fetchWithProxy = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    // Try with current proxy first
    const proxiedUrl = applyProxy(url);
    console.log('Fetching with proxy:', proxiedUrl);
    
    try {
      // Try with standard CORS mode first
      const response = await fetch(proxiedUrl, {
        ...options,
        mode: 'cors',
        headers: {
          ...options.headers,
          'Origin': window.location.origin,
          'Referer': proxiedUrl.includes('?url=') ? url : proxiedUrl, // Set referer based on proxy type
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
            'Origin': window.location.origin,
            'Referer': workingProxy.includes('?url=') ? url : newProxiedUrl,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
    try {
      const directResponse = await fetch(url, {
        ...options,
        mode: 'no-cors', // This will give an opaque response but might work in some cases
        credentials: 'omit',
        headers: {
          ...options.headers,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      return directResponse;
    } catch (directError) {
      console.error('Direct request failed:', directError);
      throw directError;
    }
  } catch (error) {
    console.error('Error fetching with proxy:', error);
    throw error;
  }
};

// Common constants
export const VIX_URL = 'http://vixcentral.com';
export const INVESTING_URL = 'https://www.investing.com';
export const YAHOO_FINANCE_URL = 'https://finance.yahoo.com';
