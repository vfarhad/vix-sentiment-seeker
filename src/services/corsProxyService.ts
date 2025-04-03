
/**
 * Service to handle CORS issues by proxying requests through a public CORS proxy
 */

// List of available public CORS proxies
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url='
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
  
  if (currentProxy === CORS_PROXIES[2]) {
    // Special handling for allorigins which requires encoded URL
    return `${currentProxy}${encodedUrl}`;
  }
  
  return `${currentProxy}${url}`;
};

// Function to test if CORS proxy works with a given URL
export const testCorsProxy = async (proxyUrl: string, testUrl: string): Promise<boolean> => {
  try {
    const fullUrl = proxyUrl + (proxyUrl.includes('?url=') ? encodeURIComponent(testUrl) : testUrl);
    
    // Create an AbortController with a 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(fullUrl, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error(`CORS proxy test failed for ${proxyUrl}`, error);
    return false;
  }
};

// Find a working CORS proxy
export const findWorkingProxy = async (url: string): Promise<string | null> => {
  for (const proxy of CORS_PROXIES) {
    const works = await testCorsProxy(proxy, url);
    if (works) {
      setCurrentProxy(proxy);
      return proxy;
    }
  }
  return null;
};
