type Portfolio = {
  [key: string]: {
    allocation: number
    description: string
  }
}

export function generatePortfolio(risk: string, amount: number): Portfolio {
  let portfolio: Portfolio = {}

  switch (risk.toLowerCase()) {
    case "low":
      portfolio = {
        "Satrix Top 40 ETF": { allocation: 0.4, description: "Tracks the 40 largest companies on the JSE" },
        "CoreShares Total World Stock ETF": { allocation: 0.3, description: "Global equity exposure" },
        "Satrix SA Bond ETF": { allocation: 0.2, description: "Exposure to South African government bonds" },
        "NewGold ETF": { allocation: 0.1, description: "Gold bullion investment" },
      }
      break
    case "medium":
      portfolio = {
        "Satrix MSCI World ETF": { allocation: 0.35, description: "Global developed market exposure" },
        "Sygnia Itrix 4th Industrial Revolution Global Equity ETF": {
          allocation: 0.25,
          description: "Exposure to innovative tech companies",
        },
        "CoreShares S&P South Africa Dividend Aristocrats ETF": {
          allocation: 0.2,
          description: "High-quality dividend-paying SA companies",
        },
        "Ashburton MidCap ETF": { allocation: 0.15, description: "Exposure to mid-sized SA companies" },
        "Satrix Property ETF": { allocation: 0.05, description: "Diversified property exposure" },
      }
      break
    case "high":
      portfolio = {
        "Sygnia FAANG Plus Equity ETF": { allocation: 0.3, description: "High-growth global tech giants" },
        "CoreShares S&P Global Dividend Aristocrats ETF": {
          allocation: 0.25,
          description: "Global dividend-growing companies",
        },
        "Satrix MSCI Emerging Markets ETF": { allocation: 0.2, description: "Emerging markets exposure" },
        "Sygnia Itrix 4th Industrial Revolution Global Equity ETF": {
          allocation: 0.15,
          description: "Innovative tech companies",
        },
        "Satrix Fini ETF": { allocation: 0.1, description: "SA financial sector exposure" },
      }
      break
    default:
      throw new Error("Invalid risk tolerance")
  }

  return portfolio
}

