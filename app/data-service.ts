// app/data-service.ts

import yahooFinance from 'yahoo-finance2';

type ETFData = {
  [key: string]: {
    description: string
    price?: number
    change?: number
    volume?: number
    yearToDateReturn?: number
    threeMonthReturn?: number
  }
}

type MarketConditions = {
  globalOutlook: "positive" | "negative"
  spReturn: number
  volatilityIndex?: number
  marketAnalysis: {
    description: string
    factors: {
      factor: string
      impact: string
    }[]
  }
}

// Map of Easy Equities ETF names to Yahoo Finance symbols
const ETF_SYMBOLS: { [key: string]: string } = {
  "Satrix Top 40 ETF": "STX40.JO",
  "CoreShares Total World Stock ETF": "GLOBAL.JO",
  "Satrix SA Bond ETF": "STXGOV.JO",
  "NewGold ETF": "GLD.JO",
  "Satrix MSCI World ETF": "STXWDM.JO",
  "Sygnia Itrix 4th Industrial Revolution Global Equity ETF": "SYG4IR.JO",
  "CoreShares S&P South Africa Dividend Aristocrats ETF": "DIVTRX.JO",
  "Ashburton MidCap ETF": "ASHMID.JO",
  "Satrix Property ETF": "STXPRO.JO",
  "Sygnia FAANG Plus Equity ETF": "FAANG.JO",
  "CoreShares S&P Global Dividend Aristocrats ETF": "GLODIV.JO",
  "Satrix MSCI Emerging Markets ETF": "STXEMG.JO",
  "Satrix Fini ETF": "STXFIN.JO"
};

export async function getETFData(): Promise<ETFData> {
  const etfData: ETFData = {};
  
  try {
    // Fetch data for all ETFs in parallel
    const results = await Promise.all(
      Object.entries(ETF_SYMBOLS).map(async ([name, symbol]) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          const historicalData = await yahooFinance.historical(symbol, {
            period1: new Date(new Date().setMonth(new Date().getMonth() - 3)), // 3 months ago
            period2: new Date(),
            interval: '1d'
          });

          // Calculate returns
          const threeMonthReturn = historicalData.length > 0 
            ? ((quote.regularMarketPrice - historicalData[0].close) / historicalData[0].close) * 100
            : undefined;

          return {
            name,
            data: {
              description: name,
              price: quote.regularMarketPrice,
              change: quote.regularMarketChangePercent,
              volume: quote.regularMarketVolume,
              threeMonthReturn
            }
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return {
            name,
            data: { description: name }
          };
        }
      })
    );

    // Populate ETF data
    results.forEach(({ name, data }) => {
      etfData[name] = data;
    });

    return etfData;
  } catch (error) {
    console.error('Error fetching ETF data:', error);
    return Object.keys(ETF_SYMBOLS).reduce((acc, name) => {
      acc[name] = { description: name };
      return acc;
    }, {} as ETFData);
  }
}

export async function getMarketConditions(): Promise<MarketConditions> {
  try {
    // Fetch multiple market indicators
    const [spyQuote, vixQuote] = await Promise.all([
      yahooFinance.quote('^GSPC'),
      yahooFinance.quote('^VIX')
    ]);

    const spReturn = spyQuote.regularMarketChangePercent;
    const volatilityIndex = vixQuote.regularMarketPrice;
    const globalOutlook = spReturn > 0 ? "positive" : "negative";

    // Generate market analysis based on indicators
    const marketAnalysis = {
      description: generateMarketDescription(spReturn, volatilityIndex),
      factors: generateMarketFactors(spReturn, volatilityIndex)
    };

    return {
      globalOutlook,
      spReturn,
      volatilityIndex,
      marketAnalysis
    };
  } catch (error) {
    console.error('Error fetching market conditions:', error);
    return {
      globalOutlook: "positive",
      spReturn: 0,
      marketAnalysis: {
        description: "Market data unavailable",
        factors: []
      }
    };
  }
}

function generateMarketDescription(spReturn: number, vix?: number): string {
  let description = "";
  
  if (spReturn > 2) {
    description = "Markets are showing strong bullish momentum";
  } else if (spReturn > 0) {
    description = "Markets are slightly positive with moderate growth potential";
  } else if (spReturn > -2) {
    description = "Markets are showing slight weakness but remain stable";
  } else {
    description = "Markets are experiencing significant downward pressure";
  }

  if (vix) {
    if (vix < 15) {
      description += ", with low volatility indicating stable conditions";
    } else if (vix < 25) {
      description += ", with moderate market volatility";
    } else {
      description += ", with high volatility suggesting increased uncertainty";
    }
  }

  return description;
}

function generateMarketFactors(spReturn: number, vix?: number): { factor: string; impact: string }[] {
  const factors = [];

  // S&P 500 Performance
  factors.push({
    factor: "S&P 500 Performance",
    impact: `${spReturn > 0 ? "Positive" : "Negative"} market sentiment (${spReturn.toFixed(2)}% change)`
  });

  // Volatility
  if (vix) {
    factors.push({
      factor: "Market Volatility (VIX)",
      impact: vix < 20 ? "Low risk environment" : vix < 30 ? "Moderate market uncertainty" : "High market uncertainty"
    });
  }

  // Portfolio Implications
  factors.push({
    factor: "Portfolio Strategy",
    impact: spReturn > 0 
      ? "Favoring growth-oriented global ETFs" 
      : "Emphasizing defensive local market exposure"
  });

  return factors;
}

