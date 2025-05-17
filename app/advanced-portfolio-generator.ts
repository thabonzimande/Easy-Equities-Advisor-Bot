import { getETFData, getMarketConditions } from "./data-service"

type Portfolio = {
  [key: string]: {
    allocation: number
    description: string
    price?: number
    change?: number
    volume?: number
    threeMonthReturn?: number
  }
}

type UserProfile = {
  age: number
  riskScore: number // 1-10
  investmentHorizon: number // in years
  incomeNeeds: boolean
  investmentType?: 'once-off' | 'monthly'
  monthlyAmount?: number
}

type PortfolioWithAnalysis = {
  portfolio: Portfolio
  marketAnalysis: {
    description: string
    factors: {
      factor: string
      impact: string
    }[]
    rationale: string[]
  }
}

export async function generateAdvancedPortfolio(userProfile: UserProfile, amount: number): Promise<PortfolioWithAnalysis> {
  const etfData = await getETFData()
  const marketConditions = await getMarketConditions()

  const portfolio: Portfolio = {}

  // Base allocations adjusted for income needs
  const equityAllocation = Math.min(0.9, Math.max(0.1, (110 - userProfile.age) / 100))
  let bondAllocation = 1 - equityAllocation

  // Adjust based on risk score and market conditions
  const riskAdjustment = (userProfile.riskScore - 5) / 10
  let adjustedEquityAllocation = equityAllocation + riskAdjustment * 0.2

  // Further adjust based on market volatility
  if (marketConditions.volatilityIndex && marketConditions.volatilityIndex > 25) {
    adjustedEquityAllocation *= 0.9; // Reduce equity exposure in high volatility
  }

  // Adjust for income needs
  if (userProfile.incomeNeeds) {
    // Increase allocation to dividend-paying ETFs and bonds for income generation
    bondAllocation = Math.min(0.4, bondAllocation + 0.1); // Increase bond allocation for stable income
    adjustedEquityAllocation = 1 - bondAllocation;
  }

  // Generate portfolio rationale
  const rationale = [
    `Age-based equity allocation: ${(equityAllocation * 100).toFixed(1)}% based on age ${userProfile.age}`,
    `Risk adjustment: ${(riskAdjustment * 20).toFixed(1)}% shift based on risk score ${userProfile.riskScore}`,
    `Investment horizon: ${userProfile.investmentHorizon} years`,
  ];

  if (userProfile.incomeNeeds) {
    rationale.push("Income requirement: Increase allocation to dividend-paying ETFs and bonds");
  }

  if (marketConditions.volatilityIndex && marketConditions.volatilityIndex > 25) {
    rationale.push(`Market volatility adjustment: -10% equity due to high VIX (${marketConditions.volatilityIndex.toFixed(1)})`);
  }

  // --- Monthly investment projection logic ---
  let monthlyProjection: string | null = null;
  if (userProfile.investmentType === 'monthly' && userProfile.monthlyAmount && userProfile.investmentHorizon) {
    // Assume average annual return of 7%
    const r = 0.07 / 12;
    const n = userProfile.investmentHorizon * 12;
    const FV = userProfile.monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    monthlyProjection = `If you invest R${userProfile.monthlyAmount.toLocaleString(undefined, {maximumFractionDigits:2})} per month for ${userProfile.investmentHorizon} years (assuming a 7% annual return), your projected portfolio value could be approximately R${FV.toLocaleString(undefined, {maximumFractionDigits:0})}.`;
    rationale.push("Projection includes monthly compounding and assumes a 7% average annual return. Actual returns may vary.");
  }

  // Select ETFs based on market conditions and user profile
  if (marketConditions.globalOutlook === "positive") {
    if (userProfile.incomeNeeds) {
      // Income-focused global portfolio
      portfolio["CoreShares S&P Global Dividend Aristocrats ETF"] = {
        allocation: adjustedEquityAllocation * 0.4,
        description: "Global dividend-growing companies",
        price: etfData["CoreShares S&P Global Dividend Aristocrats ETF"].price,
        change: etfData["CoreShares S&P Global Dividend Aristocrats ETF"].change,
        volume: etfData["CoreShares S&P Global Dividend Aristocrats ETF"].volume,
        threeMonthReturn: etfData["CoreShares S&P Global Dividend Aristocrats ETF"].threeMonthReturn
      }
      portfolio["Satrix MSCI World ETF"] = {
        allocation: adjustedEquityAllocation * 0.3,
        description: "Global developed market exposure",
        price: etfData["Satrix MSCI World ETF"].price,
        change: etfData["Satrix MSCI World ETF"].change,
        volume: etfData["Satrix MSCI World ETF"].volume,
        threeMonthReturn: etfData["Satrix MSCI World ETF"].threeMonthReturn
      }
      portfolio["CoreShares S&P South Africa Dividend Aristocrats ETF"] = {
        allocation: adjustedEquityAllocation * 0.3,
        description: "High-quality dividend-paying SA companies",
        price: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].price,
        change: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].change,
        volume: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].volume,
        threeMonthReturn: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].threeMonthReturn
      }
    } else {
      portfolio["Satrix MSCI World ETF"] = {
        allocation: adjustedEquityAllocation * 0.6,
        description: "Global developed market exposure",
        price: etfData["Satrix MSCI World ETF"].price,
        change: etfData["Satrix MSCI World ETF"].change,
        volume: etfData["Satrix MSCI World ETF"].volume,
        threeMonthReturn: etfData["Satrix MSCI World ETF"].threeMonthReturn
      }
      portfolio["Satrix MSCI Emerging Markets ETF"] = {
        allocation: adjustedEquityAllocation * 0.4,
        description: "Emerging markets exposure",
        price: etfData["Satrix MSCI Emerging Markets ETF"].price,
        change: etfData["Satrix MSCI Emerging Markets ETF"].change,
        volume: etfData["Satrix MSCI Emerging Markets ETF"].volume,
        threeMonthReturn: etfData["Satrix MSCI Emerging Markets ETF"].threeMonthReturn
      }
    }
    rationale.push(userProfile.incomeNeeds 
      ? "Global market outlook is positive: Balanced allocation between global and local dividend-paying ETFs"
      : "Global market outlook is positive: Increased allocation to international markets");
  } else {
    if (userProfile.incomeNeeds) {
      // Income-focused local portfolio
      portfolio["CoreShares S&P South Africa Dividend Aristocrats ETF"] = {
        allocation: adjustedEquityAllocation * 0.5,
        description: "High-quality dividend-paying SA companies",
        price: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].price,
        change: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].change,
        volume: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].volume,
        threeMonthReturn: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].threeMonthReturn
      }
      portfolio["Satrix Property ETF"] = {
        allocation: adjustedEquityAllocation * 0.3,
        description: "Local property income exposure",
        price: etfData["Satrix Property ETF"].price,
        change: etfData["Satrix Property ETF"].change,
        volume: etfData["Satrix Property ETF"].volume,
        threeMonthReturn: etfData["Satrix Property ETF"].threeMonthReturn
      }
      portfolio["Satrix Top 40 ETF"] = {
        allocation: adjustedEquityAllocation * 0.2,
        description: "Top 40 SA companies for growth",
        price: etfData["Satrix Top 40 ETF"].price,
        change: etfData["Satrix Top 40 ETF"].change,
        volume: etfData["Satrix Top 40 ETF"].volume,
        threeMonthReturn: etfData["Satrix Top 40 ETF"].threeMonthReturn
      }
    } else {
      portfolio["Satrix Top 40 ETF"] = {
        allocation: adjustedEquityAllocation * 0.7,
        description: "Tracks the 40 largest companies on the JSE",
        price: etfData["Satrix Top 40 ETF"].price,
        change: etfData["Satrix Top 40 ETF"].change,
        volume: etfData["Satrix Top 40 ETF"].volume,
        threeMonthReturn: etfData["Satrix Top 40 ETF"].threeMonthReturn
      }
      portfolio["CoreShares S&P South Africa Dividend Aristocrats ETF"] = {
        allocation: adjustedEquityAllocation * 0.3,
        description: "High-quality dividend-paying SA companies",
        price: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].price,
        change: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].change,
        volume: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].volume,
        threeMonthReturn: etfData["CoreShares S&P South Africa Dividend Aristocrats ETF"].threeMonthReturn
      }
    }
    rationale.push(userProfile.incomeNeeds
      ? "Market outlook is cautious: Focus on stable local dividend and property income"
      : "Global market outlook is cautious: Focusing on stable local market exposure");
  }

  // Add bond allocation
  portfolio["Satrix SA Bond ETF"] = {
    allocation: bondAllocation,
    description: "Exposure to South African government bonds",
    price: etfData["Satrix SA Bond ETF"].price,
    change: etfData["Satrix SA Bond ETF"].change,
    volume: etfData["Satrix SA Bond ETF"].volume,
    threeMonthReturn: etfData["Satrix SA Bond ETF"].threeMonthReturn
  }
  rationale.push(`Fixed income allocation: ${(bondAllocation * 100).toFixed(1)}% for ${userProfile.incomeNeeds ? 'income and' : ''} stability`);

  // Normalize allocations
  const totalAllocation = Object.values(portfolio).reduce((sum, etf) => sum + etf.allocation, 0)
  Object.keys(portfolio).forEach((etf) => {
    portfolio[etf].allocation = portfolio[etf].allocation / totalAllocation
  })

  return {
    portfolio,
    marketAnalysis: {
      description: marketConditions.marketAnalysis.description + (monthlyProjection ? `\n\n${monthlyProjection}` : ""),
      factors: marketConditions.marketAnalysis.factors,
      rationale
    }
  }
}

