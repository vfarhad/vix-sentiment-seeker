
/**
 * Service to handle CORS issues by proxying requests through a public CORS proxy
 */

// List of available public CORS proxies
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors.bridged.cc/',
  'https://cors-proxy.htmldriven.com/?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
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
  if (currentProxy.includes('?url=') || currentProxy.includes('?quest=')) {
    // Proxies that use the ?url= or ?quest= format
    return `${currentProxy}${encodedUrl}`;
  }
  
  return `${currentProxy}${url}`;
};

// Function to test if CORS proxy works with a given URL
export const testCorsProxy = async (proxyUrl: string, testUrl: string): Promise<boolean> => {
  try {
    // Format the URL based on proxy type
    const fullUrl = proxyUrl.includes('?url=') || proxyUrl.includes('?quest=')
      ? `${proxyUrl}${encodeURIComponent(testUrl)}`
      : `${proxyUrl}${testUrl}`;
    
    console.log(`Testing proxy ${proxyUrl} with URL ${testUrl}`);
    
    // Use no-cors mode if available to test 
    const response = await fetch(fullUrl, { 
      method: 'HEAD',
      mode: 'cors',
      headers: {
        'Origin': window.location.origin,
        'Referer': proxyUrl.includes('?') ? testUrl : fullUrl
      },
      // Remove the timeout property as it's not supported in RequestInit
      // Add a signal with AbortController for timeout instead
      signal: AbortSignal.timeout(5000) // 5 second timeout for testing
    });
    
    if (response.status >= 200 && response.status < 400) {
      console.log(`Proxy ${proxyUrl} works for ${testUrl}`);
      return true;
    }
    
    console.log(`Proxy ${proxyUrl} returned status ${response.status} for ${testUrl}`);
    return false;
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
    
    // Add a small delay between proxy tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Return the first proxy as a fallback if none work
  console.warn('No working proxy found, using default');
  setCurrentProxy(CORS_PROXIES[0]);
  return CORS_PROXIES[0];
};

// Common constants
export const VIX_URL = 'http://vixcentral.com';
export const INVESTING_URL = 'https://www.investing.com';
export const YAHOO_FINANCE_URL = 'https://finance.yahoo.com';
