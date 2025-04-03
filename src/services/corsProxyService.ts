
/**
 * Service to handle CORS issues by proxying requests through a public CORS proxy
 */

// List of available public CORS proxies
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors.bridged.cc/',
  'https://cors-proxy.htmldriven.com/?url=',
];

// Get the current proxy or set a default
export const getCurrentProxy = (): string => {
  const storedProxy = localStorage.getItem('corsProxy');
  return storedProxy || CORS_PROXIES[0];
};

// Set the current proxy
export const setCurrentProxy = (proxy: string): void => {
  localStorage.setItem('corsProxy', proxy);
};

// Apply the CORS proxy to a URL
export const applyProxy = (url: string): string => {
  const currentProxy = getCurrentProxy();
  const encodedUrl = encodeURIComponent(url);
  
  // Special handling for different proxy formats
  if (currentProxy.includes('?url=')) {
    // Proxies that use the ?url= format
    return `${currentProxy}${encodedUrl}`;
  }
  
  return `${currentProxy}${url}`;
};

// Function to test if CORS proxy works with a given URL
export const testCorsProxy = async (proxyUrl: string, testUrl: string): Promise<boolean> => {
  try {
    // Format the URL based on proxy type
    const fullUrl = proxyUrl.includes('?url=') 
      ? `${proxyUrl}${encodeURIComponent(testUrl)}`
      : `${proxyUrl}${testUrl}`;
    
    // Use no-cors mode if available to test 
    const response = await fetch(fullUrl, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    return true; // If we get here, proxy might work
  } catch (error) {
    console.error(`CORS proxy test failed for ${proxyUrl}`, error);
    return false;
  }
};

// Find a working CORS proxy
export const findWorkingProxy = async (url: string): Promise<string | null> => {
  for (const proxy of CORS_PROXIES) {
    try {
      const works = await testCorsProxy(proxy, url);
      if (works) {
        setCurrentProxy(proxy);
        console.log('Found working proxy:', proxy);
        return proxy;
      }
    } catch (e) {
      console.error(`Error testing proxy ${proxy}:`, e);
    }
  }
  return null;
};

// Common constants
export const VIX_URL = 'http://vixcentral.com';
