"use client"

import { useState, useEffect } from "react"
import { Send, PieChart, BarChart2, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

type Message = {
  role: "user" | "bot"
  content: string
}

type Portfolio = {
  [key: string]: {
    allocation: number
    description: string
    price?: number
    change?: number
    threeMonthReturn?: number
  }
}

type MarketAnalysis = {
  description: string
  factors: {
    factor: string
    impact: string
  }[]
  rationale: string[]
}

type UserProfile = {
  investmentGoal: string
  timeHorizon: number
  riskTolerance: string
  incomeNeeds: string
  investmentAmount: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function EasyEquitiesAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Welcome to the Easy Equities Advisor Bot! I'm here to help you create a personalized investment portfolio. Let's start by gathering some information. What's your investment goal(in Rands)?",
    },
  ])
  const [input, setInput] = useState("")
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({})
  const [generatedPortfolio, setGeneratedPortfolio] = useState<Portfolio | null>(null)
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const scrollArea = document.querySelector(".scroll-area") as HTMLElement | null
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [])

  // Helper function to validate time horizon input
  const validateTimeHorizon = (input: string): number | null => {
    const years = parseInt(input.toLowerCase().replace(/[^0-9]/g, ""))
    return !isNaN(years) && years > 0 && years <= 50 ? years : null
  }

  // Helper function to validate risk tolerance input
  const validateRiskTolerance = (input: string): string | null => {
    const risk = input.toLowerCase()
    return ["low", "medium", "high"].includes(risk) ? risk : null
  }

  // Helper function to validate amount input
  const validateAmount = (input: string): number | null => {
    const amount = Number.parseFloat(input.replace(/[^0-9.]/g, ""))
    return !isNaN(amount) && amount > 0 ? amount : null
  }

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: "user", content: input }])
      generateBotResponse(input)
      setInput("")
    }
  }

  const generateBotResponse = async (userInput: string) => {
    let botResponse = ""
    const updatedProfile = { ...userProfile }

    if (!updatedProfile.investmentGoal) {
      updatedProfile.investmentGoal = userInput
      setUserProfile(updatedProfile)
      botResponse = "How long do you plan to invest for? Please specify the number of years (e.g., 5 years, 10 years, etc.)"
    } 
    else if (!updatedProfile.timeHorizon) {
      const timeHorizon = validateTimeHorizon(userInput)
      if (timeHorizon) {
        updatedProfile.timeHorizon = timeHorizon
        setUserProfile(updatedProfile)
        botResponse = "What's your risk tolerance? (Low, Medium, or High)"
      } else {
        botResponse = "Please enter a valid time horizon in years (between 1 and 50 years)"
      }
    }
    else if (!updatedProfile.riskTolerance) {
      const riskTolerance = validateRiskTolerance(userInput)
      if (riskTolerance) {
        updatedProfile.riskTolerance = riskTolerance
        setUserProfile(updatedProfile)
        botResponse = "Do you need regular income from this investment? (Yes/No)"
      } else {
        botResponse = "Please specify your risk tolerance as Low, Medium, or High"
      }
    }
    else if (!updatedProfile.incomeNeeds) {
      const incomeNeeds = userInput.toLowerCase()
      if (incomeNeeds === "yes" || incomeNeeds === "no") {
        updatedProfile.incomeNeeds = incomeNeeds
        setUserProfile(updatedProfile)
        botResponse = "How much are you planning to invest? (in Rands)"
      } else {
        botResponse = "Please answer Yes or No regarding your income needs"
      }
    }
    else if (!updatedProfile.investmentAmount) {
      const amount = validateAmount(userInput)
      if (amount) {
        updatedProfile.investmentAmount = amount.toString()
        setUserProfile(updatedProfile)
        try {
          const portfolioData = await generatePortfolio(updatedProfile)
          if (portfolioData) {
            botResponse = generateAdvice(portfolioData.portfolio, amount, updatedProfile)
          } else {
            botResponse = "I apologize, but I couldn't generate a portfolio at this time. Please try again later."
          }
        } catch (error) {
          console.error('Error in portfolio generation:', error)
          botResponse = "I apologize, but there was an error generating your portfolio. Please try again later."
        }
      } else {
        botResponse = "Please enter a valid investment amount (e.g., 10000)"
      }
    } else {
      botResponse = "I've already provided a portfolio recommendation. If you'd like a new one, please start a new session."
    }

    setMessages((prev) => [...prev, { role: "bot", content: botResponse }])
  }

  const generatePortfolio = async (profile: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: {
            age: 30, // Default age
            riskScore: profile.riskTolerance === 'low' ? 3 : profile.riskTolerance === 'medium' ? 5 : 8,
            investmentHorizon: profile.timeHorizon || 5,
            incomeNeeds: profile.incomeNeeds === 'yes'
          },
          amount: Number(profile.investmentAmount)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate portfolio');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedPortfolio(data.portfolio);
      setMarketAnalysis(data.marketAnalysis);
      return data;
    } catch (error) {
      console.error('Error generating portfolio:', error);
      return null;
    }
  };

  const generateAdvice = (portfolio: Portfolio, amount: number, profile: Partial<UserProfile>) => {
    let advice = `Based on your profile:\n\n`
    advice += `Investment Goal: ${profile.investmentGoal}\n`
    advice += `Time Horizon: ${profile.timeHorizon} years\n`
    advice += `Risk Tolerance: ${profile.riskTolerance}\n`
    advice += `Income Needs: ${profile.incomeNeeds}\n`
    advice += `Investment Amount: R${amount.toFixed(2)}\n\n`
    advice += `Here's your personalized Easy Equities portfolio:\n\n`
    advice += `Model Portfolio:\n\n`

    Object.entries(portfolio).forEach(([etf, details]) => {
      const allocation = details.allocation * 100
      const etfAmount = amount * details.allocation
      advice += `${etf} (${allocation.toFixed(1)}%): R${etfAmount.toFixed(2)}\n`
      advice += `${details.description}\n\n`
    })

    // Add time horizon specific advice if applicable
    if (profile.timeHorizon && profile.timeHorizon > 10) {
      advice += `Long-term Investment Strategy:\n\n`
      advice += `• Consider automatic reinvestment of dividends\n`
      advice += `• Plan for periodic rebalancing (every 6-12 months)\n`
      advice += `• Focus on cost-averaging through regular contributions\n\n`
    }

    // Add income needs specific advice
    if (profile.incomeNeeds === 'yes') {
      advice += `Income Strategy:\n\n`
      advice += `• Consider setting up a quarterly dividend withdrawal plan\n`
      advice += `• Monitor dividend payment schedules of your ETFs\n`
      advice += `• Maintain a cash buffer for consistent income\n\n`
    }

    advice += `Implementation Steps:\n\n`
    advice += `1. Log in to your Easy Equities account\n`
    advice += `2. Navigate to the 'Buy' section\n`
    advice += `3. Search for each ETF listed above\n`
    advice += `4. Enter the Rand amount for each ETF as calculated above\n`
    advice += `5. Review and confirm your orders\n\n`

    advice += `Remember to regularly review and rebalance your portfolio. Consider setting up a monthly debit order to consistently invest over time.\n\n`

    advice += `Disclaimer: This is a simplified model and should not be considered as professional financial advice. Always do your own research and consider consulting with a qualified financial advisor before making investment decisions.`

    return advice
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-20'
        } transition-all duration-300 ease-in-out ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } border-r ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        } p-6 flex flex-col relative`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute -right-4 top-8 rounded-full p-2 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          } shadow-lg`}
        >
          {isSidebarOpen ? '←' : '→'}
        </button>
        
        <div className="flex items-center mb-8 space-x-3">
          <PieChart className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          {isSidebarOpen && <h1 className="text-2xl font-bold">Easy Equities Advisor Bot</h1>}
        </div>

        {/* Theme Toggle */}
        <div className="mb-6 flex items-center justify-between">
          {isSidebarOpen && <span>Theme</span>}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Chat History */}
        {isSidebarOpen && (
          <div className="flex-grow overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Chat History</h2>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    message.role === "user"
                      ? isDarkMode
                        ? 'bg-blue-900/30 text-blue-200'
                        : 'bg-blue-50 text-blue-900'
                      : isDarkMode
                      ? 'bg-gray-700/50'
                      : 'bg-gray-100'
                  }`}
                >
                  <span className="font-medium">
                    {message.role === "user" ? "You: " : "Advisor: "}
                  </span>
                  {message.content.length > 50 ? message.content.slice(0, 50) + "..." : message.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Chat Interface */}
          <Card className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-lg mb-6`}>
            <CardHeader className="border-b border-gray-700 py-4">
              <CardTitle className="text-2xl font-bold">Investment Chat</CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                Get personalized investment advice for Easy Equities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                  >
                    <div
                      className={`rounded-lg px-6 py-3 max-w-[80%] shadow-sm ${
                        message.role === "user"
                          ? isDarkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDarkMode
                          ? 'bg-gray-700'
                          : 'bg-gray-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-700 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex w-full items-center space-x-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className={`flex-grow ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={`${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition-colors duration-200`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>

          {/* Portfolio Analysis */}
          {generatedPortfolio && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Analysis Card */}
              <Card className={`${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg animate-fadeIn`}>
                <CardHeader className="border-b border-gray-700 py-4">
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <TrendingUp className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span>Market Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {marketAnalysis && (
                    <div className="space-y-4">
                      <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {marketAnalysis.description}
                      </p>
                      <div className="space-y-4">
                        {marketAnalysis.factors.map((factor, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg ${
                              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                            }`}
                          >
                            <div className={`font-medium text-lg ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {factor.factor}
                            </div>
                            <div className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {factor.impact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Visualization Card */}
              <Card className={`${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg animate-fadeIn`}>
                <CardHeader className="border-b border-gray-700 py-4">
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <BarChart2 className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span>Portfolio Allocation</span>
                  </CardTitle>
                  <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Total Investment: R{Number(userProfile.investmentAmount).toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-6">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={Object.entries(generatedPortfolio).map(([name, { allocation }]) => ({
                              name,
                              value: allocation,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {Object.entries(generatedPortfolio).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(generatedPortfolio).map(([etf, details], index) => (
                        <div
                          key={etf}
                          className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                          } flex justify-between items-center`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{etf}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              {(details.allocation * 100).toFixed(1)}%
                            </div>
                            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                              R{(Number(userProfile.investmentAmount) * details.allocation).toFixed(2)}
                            </div>
                            {details.price && (
                              <div className="text-sm mt-1">
                                <span>R{details.price.toFixed(2)}</span>
                                {details.change && (
                                  <span className={details.change > 0 ? 'text-green-500' : 'text-red-500'}>
                                    {" "}({details.change > 0 ? "+" : ""}{details.change.toFixed(2)}%)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

