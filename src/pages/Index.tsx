import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MarketBanner from '@/components/MarketBanner';
import VIXChart from '@/components/VIXChart';
import VIXFuturesChart from '@/components/VIXFuturesChart';
import SentimentIndicator from '@/components/SentimentIndicator';
import StatisticCard from '@/components/StatisticCard';
import MarketStatusBox from '@/components/MarketStatusBox';
import SupabaseSetup from '@/components/SupabaseSetup';
import SupabaseStatus from '@/components/SupabaseStatus';
import VIXContangoTable from '@/components/VIXContangoTable';
import CryptoWidget from '@/components/CryptoWidget';
import SP500Chart from '@/components/SP500Chart';
import { vixStatistics, marketSentiment, marketHeadlines } from '@/lib/mockData';
import { fetchMarketIndices, setupMarketDataPolling, MarketIndex } from '@/services/marketDataService';
import { scrapeHistoricalVIX, scrapeVIXFutures, VIXHistoricalDataPoint } from '@/services/vixScraperService';
import { 
  getVIXFuturesHistData, 
  calculateVIXTermStructure, 
  getLatestVIXTermStructure, 
  VIXTermStructurePoint,
  calculateContangoMetrics,
  fetchSP500Data
} from '@/services/sp500DataService';
import { storeHistoricalVIXData, getHistoricalVIXData, storeVIXFuturesData, getLatestVIXFuturesData, checkSupabaseTables, getVIXHistData } from '@/services/vixDataService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historicalVIXData, setHistoricalVIXData] = useState<VIXHistoricalDataPoint[]>([]);
  const [vixFuturesValues, setVIXFuturesValues] = useState<VIXTermStructurePoint[]>([]);
  const [vixFuturesVolumeData, setVIXFuturesVolumeData] = useState<any[]>([]);
  const [showVIXChart, setShowVIXChart] = useState(false);
  const [showVIXFutures, setShowVIXFutures] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [tablesExist, setTablesExist] = useState(false);
  const [showSetupInterface, setShowSetupInterface] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [vixFuturesLoading, setVIXFuturesLoading] = useState(true);
  const [contangoPercentages, setContangoPercentages] = useState<any[]>([]);
  const [contangoDifferences, setContangoDifferences] = useState<any[]>([]);
  const [termStructure, setTermStructure] = useState<any[]>([]);
  const [monthRangeMetrics, setMonthRangeMetrics] = useState<any[]>([]);
  const [sp500Data, setSP500Data] = useState<any[]>([]);
  const [sp500Loading, setSP500Loading] = useState(true);
  const [showSP500Chart, setShowSP500Chart] = useState(false);

  const { data, isError } = useQuery({
    queryKey: ['marketIndices'],
    queryFn: fetchMarketIndices,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (data) {
      setMarketIndices(data);
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (isError) {
      const cleanup = setupMarketDataPolling((newData) => {
        setMarketIndices(newData);
        setIsLoading(false);
      });
      
      return cleanup;
    }
  }, [isError]);

  useEffect(() => {
    const fetchSP500HistoricalData = async () => {
      setSP500Loading(true);
      try {
        const data = await fetchSP500Data();
        if (data && data.length > 0) {
          setSP500Data(data);
          setShowSP500Chart(true);
          toast.success('S&P 500 historical data loaded successfully');
        } else {
          console.warn('No S&P 500 historical data found');
          toast.error('Failed to load S&P 500 historical data');
          setShowSP500Chart(false);
        }
      } catch (error) {
        console.error('Error fetching S&P 500 historical data:', error);
        toast.error('Failed to load S&P 500 historical data');
        setShowSP500Chart(false);
      } finally {
        setSP500Loading(false);
      }
    };

    fetchSP500HistoricalData();
  }, []);

  useEffect(() => {
    const fetchHistoricalVIX = async () => {
      setDataLoading(true);
      try {
        const vixHistData = await getVIXHistData();
        if (vixHistData && vixHistData.length > 0) {
          setHistoricalVIXData(vixHistData);
          setShowVIXChart(true);
          toast.success('VIX historical data loaded successfully');
          setDataLoading(false);
          return;
        }
        
        const supabaseData = await getHistoricalVIXData();
        if (supabaseData && supabaseData.length > 0) {
          setHistoricalVIXData(supabaseData);
          setShowVIXChart(true);
          toast.success('VIX historical data loaded from Supabase');
          setDataLoading(false);
        } else {
          const scrapedData = await scrapeHistoricalVIX();
          if (scrapedData && scrapedData.length > 0) {
            setHistoricalVIXData(scrapedData);
            setShowVIXChart(true);
            toast.success('VIX historical data loaded from web scraping');
            
            try {
              await storeHistoricalVIXData(scrapedData);
            } catch (storageError) {
              console.warn('Failed to store historical VIX data:', storageError);
            }
            
            setDataLoading(false);
          } else {
            console.warn('No historical VIX data found from any source');
            toast.error('Failed to load VIX historical data');
            setShowVIXChart(false);
            setDataLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching historical VIX data:', error);
        toast.error('Failed to load VIX historical data');
        setShowVIXChart(false);
        setDataLoading(false);
      }
    };

    fetchHistoricalVIX();
  }, []);

  useEffect(() => {
    const fetchVIXFutures = async () => {
      setVIXFuturesLoading(true);
      try {
        const termStructure = await getLatestVIXTermStructure();
        
        if (termStructure && termStructure.length > 0) {
          const volumeData = await getVIXFuturesHistData();
          if (volumeData && volumeData.length > 0) {
            setVIXFuturesVolumeData(volumeData);
          }
          
          setVIXFuturesValues(termStructure);
          
          const metrics = calculateContangoMetrics(termStructure);
          setContangoPercentages(metrics.contangoPercentages);
          setContangoDifferences(metrics.contangoDifferences);
          setTermStructure(metrics.termStructure);
          setMonthRangeMetrics(metrics.monthRangeMetrics);
          
          setShowVIXFutures(true);
          toast.success('VIX term structure loaded successfully');
          setVIXFuturesLoading(false);
          return;
        }
        
        const calculatedTermStructure = await calculateVIXTermStructure();
        if (calculatedTermStructure && calculatedTermStructure.length > 0) {
          const volumeData = await getVIXFuturesHistData();
          if (volumeData && volumeData.length > 0) {
            setVIXFuturesVolumeData(volumeData);
          }
          
          setVIXFuturesValues(calculatedTermStructure);
          
          const metrics = calculateContangoMetrics(calculatedTermStructure);
          setContangoPercentages(metrics.contangoPercentages);
          setContangoDifferences(metrics.contangoDifferences);
          setTermStructure(metrics.termStructure);
          setMonthRangeMetrics(metrics.monthRangeMetrics);
          
          setShowVIXFutures(true);
          toast.success('VIX term structure calculated successfully');
        } else {
          const supabaseData = await getLatestVIXFuturesData();
          if (supabaseData && supabaseData.length > 0) {
            setVIXFuturesValues(supabaseData);
            
            const metrics = calculateContangoMetrics(supabaseData);
            setContangoPercentages(metrics.contangoPercentages);
            setContangoDifferences(metrics.contangoDifferences);
            setTermStructure(metrics.termStructure);
            setMonthRangeMetrics(metrics.monthRangeMetrics);
            
            setShowVIXFutures(true);
            toast.success('VIX futures data loaded from Supabase');
          } else {
            const scrapedData = await scrapeVIXFutures();
            if (scrapedData && scrapedData.length > 0) {
              setVIXFuturesValues(scrapedData);
              
              const futuresWithMetadata = scrapedData.map((item, index) => ({
                ...item,
                daysToExpiration: index * 30,
                isContango: index > 0 ? scrapedData[index].value > scrapedData[0].value : undefined
              }));
              
              const metrics = calculateContangoMetrics(futuresWithMetadata);
              setContangoPercentages(metrics.contangoPercentages);
              setContangoDifferences(metrics.contangoDifferences);
              setTermStructure(metrics.termStructure);
              setMonthRangeMetrics(metrics.monthRangeMetrics);
              
              setShowVIXFutures(true);
              toast.success('VIX futures data loaded');
              
              try {
                await storeVIXFuturesData(scrapedData);
              } catch (storageError) {
                console.warn('Failed to store VIX futures data:', storageError);
              }
            } else {
              console.warn('No VIX futures data found');
              toast.error('Failed to load VIX futures data');
              setShowVIXFutures(false);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching VIX futures data:', error);
        toast.error('Failed to load VIX futures data');
        setShowVIXFutures(false);
      } finally {
        setVIXFuturesLoading(false);
      }
    };

    fetchVIXFutures();
  }, []);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { data, error } = await supabase.from('VIX_HIST_DATA').select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Supabase connection error:', error);
          setIsSupabaseConnected(false);
          return;
        }
        
        setIsSupabaseConnected(true);
        
        const hasData = data && data.length > 0;
        console.log('VIX_HIST_DATA has data:', hasData);

        const tablesExist = await checkSupabaseTables();
        setTablesExist(tablesExist);
      } catch (error) {
        console.error('Error checking Supabase status:', error);
        setIsSupabaseConnected(false);
      }
    };

    checkSupabase();
  }, []);

  const handleSetupComplete = useCallback(() => {
    setTablesExist(true);
    setShowSetupInterface(false);
    toast.success('Supabase setup complete!');
  }, []);

  const showSetup = useCallback(() => {
    setShowSetupInterface(true);
  }, []);

  const handleRetryDataLoad = useCallback(async () => {
    toast.info('Retrying data load...');
    setDataLoading(true);
    
    try {
      const vixHistData = await getVIXHistData();
      if (vixHistData && vixHistData.length > 0) {
        setHistoricalVIXData(vixHistData);
        setShowVIXChart(true);
        toast.success('VIX historical data loaded successfully');
      } else {
        toast.error('No VIX data available');
        setShowVIXChart(false);
      }
    } catch (error) {
      console.error('Error reloading VIX data:', error);
      toast.error('Failed to reload VIX data');
      setShowVIXChart(false);
    }
    
    setDataLoading(false);
  }, []);

  const handleRetryFuturesLoad = useCallback(async () => {
    toast.info('Retrying VIX term structure data load...');
    setVIXFuturesLoading(true);
    
    try {
      const termStructure = await calculateVIXTermStructure();
      if (termStructure && termStructure.length > 0) {
        const volumeData = await getVIXFuturesHistData();
        if (volumeData && volumeData.length > 0) {
          setVIXFuturesVolumeData(volumeData);
        }
        
        setVIXFuturesValues(termStructure);
        
        const metrics = calculateContangoMetrics(termStructure);
        setContangoPercentages(metrics.contangoPercentages);
        setContangoDifferences(metrics.contangoDifferences);
        setTermStructure(metrics.termStructure);
        setMonthRangeMetrics(metrics.monthRangeMetrics);
        
        setShowVIXFutures(true);
        toast.success('VIX term structure calculated successfully');
        return;
      }
      
      const scrapedData = await scrapeVIXFutures();
      if (scrapedData && scrapedData.length > 0) {
        setVIXFuturesValues(scrapedData);
        
        const futuresWithMetadata = scrapedData.map((item, index) => ({
          ...item,
          daysToExpiration: index * 30,
          isContango: index > 0 ? scrapedData[index].value > scrapedData[0].value : undefined
        }));
        
        const metrics = calculateContangoMetrics(futuresWithMetadata);
        setContangoPercentages(metrics.contangoPercentages);
        setContangoDifferences(metrics.contangoDifferences);
        setTermStructure(metrics.termStructure);
        setMonthRangeMetrics(metrics.monthRangeMetrics);
        
        setShowVIXFutures(true);
        toast.success('VIX futures data loaded');
      } else {
        toast.error('No VIX futures data available');
        setShowVIXFutures(false);
      }
    } catch (error) {
      console.error('Error reloading VIX futures data:', error);
      toast.error('Failed to reload VIX futures data');
      setShowVIXFutures(false);
    } finally {
      setVIXFuturesLoading(false);
    }
  }, []);

  const handleRetrySP500Load = useCallback(async () => {
    toast.info('Retrying S&P 500 data load...');
    setSP500Loading(true);
    
    try {
      const data = await fetchSP500Data();
      if (data && data.length > 0) {
        setSP500Data(data);
        setShowSP500Chart(true);
        toast.success('S&P 500 historical data loaded successfully');
      } else {
        toast.error('No S&P 500 data available');
        setShowSP500Chart(false);
      }
    } catch (error) {
      console.error('Error reloading S&P 500 data:', error);
      toast.error('Failed to reload S&P 500 data');
      setShowSP500Chart(false);
    }
    
    setSP500Loading(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <MarketBanner isLoading={isLoading} />
      
      <main className="flex-1 p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {isSupabaseConnected && (
            <div className="px-3 py-1 bg-positive/20 text-positive inline-flex items-center rounded-md text-sm">
              <div className="w-2 h-2 rounded-full bg-positive mr-2 animate-pulse"></div>
              Connected to Supabase
            </div>
          )}
          
          {isSupabaseConnected && !tablesExist && (
            <div className="px-3 py-1 bg-warning/20 text-warning inline-flex items-center rounded-md text-sm">
              <div className="w-2 h-2 rounded-full bg-warning mr-2"></div>
              Database tables missing
            </div>
          )}
          
          {isSupabaseConnected && tablesExist && (
            <div className="px-3 py-1 bg-positive/20 text-positive inline-flex items-center rounded-md text-sm">
              <div className="w-2 h-2 rounded-full bg-positive mr-2"></div>
              Database tables ready
            </div>
          )}
        </div>
        
        {showSetupInterface && (
          <div className="mb-6">
            <SupabaseSetup onSetupComplete={handleSetupComplete} />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {sp500Loading ? (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-primary animate-ping"></div>
                  <p className="text-muted-foreground">Loading S&P 500 historical data...</p>
                </div>
              </div>
            ) : showSP500Chart ? (
              <SP500Chart data={sp500Data} />
            ) : (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Unable to load S&P 500 historical data</p>
                <button 
                  onClick={handleRetrySP500Load}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            
            {dataLoading ? (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-primary animate-ping"></div>
                  <p className="text-muted-foreground">Loading VIX historical data...</p>
                </div>
              </div>
            ) : showVIXChart ? (
              <VIXChart data={historicalVIXData} />
            ) : (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Unable to load VIX historical data</p>
                <button 
                  onClick={handleRetryDataLoad}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            
            {vixFuturesLoading ? (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-primary animate-ping"></div>
                  <p className="text-muted-foreground">Loading VIX futures data...</p>
                </div>
              </div>
            ) : showVIXFutures ? (
              <>
                <VIXFuturesChart 
                  data={vixFuturesValues} 
                  volumeData={vixFuturesVolumeData} 
                />
                
                {contangoPercentages.length > 0 && contangoDifferences.length > 0 && (
                  <VIXContangoTable 
                    contangoData={[
                      {
                        label: 'Term Structure',
                        values: termStructure
                      },
                      {
                        label: '% Contango',
                        values: contangoPercentages
                      },
                      {
                        label: 'Difference',
                        values: contangoDifferences
                      }
                    ]}
                    monthRangeMetrics={monthRangeMetrics}
                  />
                )}
              </>
            ) : (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Unable to load VIX futures data</p>
                <button 
                  onClick={handleRetryFuturesLoad}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {vixStatistics.map((stat, index) => (
                <StatisticCard
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  change={stat.change}
                  sentiment={stat.sentiment as 'bullish' | 'bearish' | 'neutral' | undefined}
                  isAverage={stat.isAverage}
                  date={stat.date}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <SentimentIndicator 
              sentiment={marketSentiment.current as 'bullish' | 'bearish' | 'neutral'} 
              strength={marketSentiment.strength as 'strong' | 'moderate' | 'weak'} 
            />
            
            <div className="bg-card rounded-lg border border-border p-1 h-[300px]">
              <CryptoWidget />
            </div>
            
            <SupabaseStatus 
              isConnected={isSupabaseConnected}
              tablesExist={tablesExist}
              onSetupClick={showSetup}
            />
            
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold mb-4">Market Headlines</h2>
              <div className="space-y-4">
                {marketHeadlines.map((headline, index) => (
                  <div key={index} className="border-b border-border pb-3 last:border-none last:pb-0">
                    <h3 className="font-medium mb-1">{headline.title}</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{headline.source}</span>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`px-1.5 py-0.5 text-xs rounded-full 
                            ${headline.sentiment === 'bullish' ? 'bg-positive/20 text-positive' : 
                              headline.sentiment === 'bearish' ? 'bg-negative/20 text-negative' : 
                              'bg-neutral/20 text-neutral'}`}
                        >
                          {headline.sentiment}
                        </span>
                        <span className="text-muted-foreground">{headline.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <MarketStatusBox />
      
      <footer className="bg-card py-3 px-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>VIX Sentiment Seeker - Real-time market data updated every minute</p>
      </footer>
    </div>
  );
};

export default Index;
