"use client"

import { useState, useEffect } from "react"
import { Send, PieChart, BarChart2, TrendingUp, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { FeedbackButton } from './components/FeedbackButton'

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
  investmentType?: 'once-off' | 'monthly'
  monthlyAmount?: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

// Add a simple thumbs feedback component
function ThumbsFeedback({ label, onFeedback, isDarkMode }: { label: string; onFeedback: (val: 'up' | 'down') => void; isDarkMode: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className="flex items-center space-x-2 mt-4">
      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
      <button
        aria-label="Thumbs up"
        onClick={() => { setSelected('up'); onFeedback('up') }}
        className={`p-1 rounded-full border ${selected === 'up' ? 'border-green-500' : 'border-transparent'} ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
      >
        <ThumbsUp className={`w-5 h-5 ${selected === 'up' ? 'text-green-500' : isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
      </button>
      <button
        aria-label="Thumbs down"
        onClick={() => { setSelected('down'); onFeedback('down') }}
        className={`p-1 rounded-full border ${selected === 'down' ? 'border-red-500' : 'border-transparent'} ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
      >
        <ThumbsDown className={`w-5 h-5 ${selected === 'down' ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
      </button>
      {selected && <span className="ml-2 text-xs text-green-500">Thank you!</span>}
    </div>
  )
}

// Custom label for Pie slices
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any, isDarkMode: boolean) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill={isDarkMode ? '#fff' : '#222'}
      fontSize={14}
      fontWeight="bold"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ textShadow: isDarkMode ? '0 1px 2px #000' : '0 1px 2px #fff' }}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// Helper to render a markdown-like table as HTML
function renderPortfolioTable(tableText: string) {
  const lines = tableText.trim().split('\n');
  if (lines.length < 3) return null;
  const headers = lines[1].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line => line.split('|').map(cell => cell.trim()).filter(Boolean));
  return (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-700 text-white">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-3 py-2 font-semibold text-left border-b border-gray-600">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-700 last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 whitespace-nowrap text-gray-100">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EasyEquitiesAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Welcome to the Easy Equities Advisor Bot! I'm here to help you create a personalized investment portfolio.\n\nWhat's your investment goal(in Rands)?",
    },
  ])
  const [input, setInput] = useState("")
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({})
  const [generatedPortfolio, setGeneratedPortfolio] = useState<Portfolio | null>(null)
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)

  useEffect(() => {
    const scrollArea = document.querySelector('.scroll-area-viewport');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

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

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = input.trim();
      setInput("");
      setMessages(prev => [...prev, { role: "user", content: userMessage }]);
      
      try {
        await generateBotResponse(userMessage);
      } catch (error) {
        console.error('Error generating response:', error);
        setMessages(prev => [...prev, { 
          role: "bot", 
          content: "I apologize, but I encountered an error. Please try again." 
        }]);
      }
    }
  };

  const generateBotResponse = async (userInput: string) => {
    const updatedProfile = { ...userProfile };
    let botResponse = "";

    try {
      if (!updatedProfile.investmentGoal) {
        const amount = validateAmount(userInput);
        if (amount) {
          updatedProfile.investmentGoal = userInput;
          setUserProfile(updatedProfile);
          botResponse = "How long do you plan to invest for? Please specify the number of years (e.g., 5 years, 10 years, etc.)";
        } else {
          botResponse = "Please enter a valid investment amount (e.g., 10000)";
        }
      } else if (!updatedProfile.timeHorizon) {
        const timeHorizon = validateTimeHorizon(userInput);
        if (timeHorizon) {
          updatedProfile.timeHorizon = timeHorizon;
          setUserProfile(updatedProfile);
          botResponse = "What's your risk tolerance? (Low, Medium, or High)";
        } else {
          botResponse = "Please enter a valid time horizon in years (between 1 and 50 years)";
        }
      } else if (!updatedProfile.riskTolerance) {
        const riskTolerance = validateRiskTolerance(userInput);
        if (riskTolerance) {
          updatedProfile.riskTolerance = riskTolerance;
          setUserProfile(updatedProfile);
          botResponse = "Do you need regular income from this investment? (Yes/No)";
        } else {
          botResponse = "Please specify your risk tolerance as Low, Medium, or High";
        }
      } else if (!updatedProfile.incomeNeeds) {
        const incomeNeeds = userInput.toLowerCase();
        if (incomeNeeds === "yes" || incomeNeeds === "no") {
          updatedProfile.incomeNeeds = incomeNeeds;
          setUserProfile(updatedProfile);
          botResponse = "How much are you planning to invest? (in Rands)";
        } else {
          botResponse = "Please answer Yes or No regarding your income needs";
        }
      } else if (!updatedProfile.investmentAmount) {
        const amount = validateAmount(userInput);
        if (amount) {
          updatedProfile.investmentAmount = amount.toString();
          setUserProfile(updatedProfile);
          botResponse = "Is this a once-off lump sum investment or a recurring monthly investment? (Type 'once-off' or 'monthly')";
        } else {
          botResponse = "Please enter a valid investment amount (e.g., 10000)";
        }
      } else if (!updatedProfile.investmentType) {
        const type = userInput.toLowerCase();
        if (type === 'once-off' || type === 'monthly') {
          updatedProfile.investmentType = type as 'once-off' | 'monthly';
          setUserProfile(updatedProfile);
          if (type === 'monthly') {
            botResponse = "What is the monthly amount you plan to invest? (in Rands)";
          } else {
            // Proceed to portfolio generation for once-off
            const portfolioData = await generatePortfolio(updatedProfile);
            if (portfolioData) {
              botResponse = generateAdvice(portfolioData.portfolio, Number(updatedProfile.investmentAmount), updatedProfile);
            } else {
              botResponse = "I apologize, but I couldn't generate a portfolio at this time. Please try again later.";
            }
          }
        } else {
          botResponse = "Please specify 'once-off' for a lump sum or 'monthly' for a recurring investment.";
        }
      } else if (updatedProfile.investmentType === 'monthly' && !updatedProfile.monthlyAmount) {
        const monthly = validateAmount(userInput);
        if (monthly) {
          updatedProfile.monthlyAmount = monthly.toString();
          setUserProfile(updatedProfile);
          // Proceed to portfolio generation for monthly
          const portfolioData = await generatePortfolio(updatedProfile);
          if (portfolioData) {
            botResponse = generateAdvice(portfolioData.portfolio, Number(updatedProfile.monthlyAmount), updatedProfile);
          } else {
            botResponse = "I apologize, but I couldn't generate a portfolio at this time. Please try again later.";
          }
        } else {
          botResponse = "Please enter a valid monthly investment amount (e.g., 1000)";
        }
      } else {
        botResponse = "I've already provided a portfolio recommendation. If you'd like a new one, please refresh the page to start over.";
      }

      setMessages(prev => [...prev, { role: "bot", content: botResponse }]);
    } catch (error) {
      console.error('Error in bot response:', error);
      throw error;
    }
  };

  const generatePortfolio = async (profile: Partial<UserProfile>) => {
    try {
      const amount = profile.investmentType === 'monthly' && profile.monthlyAmount
        ? Number(profile.monthlyAmount)
        : Number(profile.investmentAmount);
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
            incomeNeeds: profile.incomeNeeds === 'yes',
            investmentType: profile.investmentType,
          },
          amount
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
    let advice = `Based on your profile:\n\n`;
    advice += `Investment Goal: ${profile.investmentGoal}\n`;
    advice += `Time Horizon: ${profile.timeHorizon} years\n`;
    advice += `Risk Tolerance: ${profile.riskTolerance}\n`;
    advice += `Income Needs: ${profile.incomeNeeds}\n`;
    if (profile.investmentType === 'monthly') {
      advice += `Investment Type: Monthly\n`;
      advice += `Monthly Amount: R${amount.toFixed(2)}\n`;
    } else {
      advice += `Investment Type: Once-off\n`;
      advice += `Investment Amount: R${amount.toFixed(2)}\n`;
    }
    advice += `\nHere's your personalized Easy Equities portfolio:\n\n`;
    advice += `Model Portfolio (Table):\n\n`;
    advice += `| ETF | Allocation | Amount (R) | Description |\n`;
    advice += `| --- | ---------- | ---------- | ----------- |\n`;

    Object.entries(portfolio).forEach(([etf, details]) => {
      const allocation = details.allocation * 100;
      const etfAmount = amount * details.allocation;
      advice += `| ${etf} | ${allocation.toFixed(1)}% | R${etfAmount.toFixed(2)} | ${details.description} |\n`;
    });

    if (profile.investmentType === 'monthly') {
      advice += `\nMonthly Investment Strategy:\n\n`;
      advice += `• Consider setting up a monthly debit order for consistent investing (rand-cost averaging)\n`;
      advice += `• Review your portfolio allocation every 6-12 months\n`;
      advice += `• Reinvest dividends to maximize compounding\n\n`;
    }

    if (profile.timeHorizon && profile.timeHorizon > 10) {
      advice += `Long-term Investment Strategy:\n\n`;
      advice += `• Consider automatic reinvestment of dividends\n`;
      advice += `• Plan for periodic rebalancing (every 6-12 months)\n`;
      advice += `• Focus on cost-averaging through regular contributions\n\n`;
    }

    if (profile.incomeNeeds === 'yes') {
      advice += `Income Strategy:\n\n`;
      advice += `• Consider setting up a quarterly dividend withdrawal plan\n`;
      advice += `• Monitor dividend payment schedules of your ETFs\n`;
      advice += `• Maintain a cash buffer for consistent income\n\n`;
    }

    advice += `Implementation Steps:\n\n`;
    advice += `1. Log in to your Easy Equities account\n`;
    advice += `2. Navigate to the 'Buy' section\n`;
    advice += `3. Search for each ETF listed above\n`;
    advice += `4. Enter the Rand amount for each ETF as calculated above\n`;
    advice += `5. Review and confirm your orders\n\n`;

    advice += `Remember to regularly review and rebalance your portfolio. Consider setting up a monthly debit order to consistently invest over time.\n\n`;

    advice += `Disclaimer: This is a simplified model and should not be considered as professional financial advice. Always do your own research and consider consulting with a qualified financial advisor before making investment decisions.`;

    return advice;
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isDesktopSidebarOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}
          transition-transform duration-300 ease-in-out 
          fixed md:static top-0 left-0 h-full
          ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
          border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          p-6 flex flex-col z-50 w-80
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className={`absolute right-4 top-4 p-2 rounded-lg md:hidden ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          ✕
        </button>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          className={`absolute -right-4 top-8 rounded-full p-2 hidden md:block ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          } shadow-lg`}
        >
          {isDesktopSidebarOpen ? '←' : '→'}
        </button>
        
        <div className="flex items-center mb-8 space-x-3">
          <PieChart className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className="text-2xl font-bold">Easy Equities Advisor Bot</h1>
        </div>

        {/* Theme Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <span>Theme</span>
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
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto w-full">
        <div className="p-2 md:p-6 max-w-[1600px] mx-auto space-y-4 md:space-y-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between md:hidden p-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`p-2 rounded-lg ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              ☰
            </button>
            <div className="flex items-center space-x-2">
              <PieChart className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-lg font-bold">Easy Equities Advisor</h1>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Chat Interface */}
          <Card className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-lg`}>
            <CardHeader className="border-b border-gray-700 py-4">
              <CardTitle className="text-2xl font-bold">Investment Chat</CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Get personalized investment advice for Easy Equities
            </CardDescription>
          </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pb-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn w-full`}
                    >
                      <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                        <div
                          className={`rounded-lg px-6 py-3 w-full shadow-sm ${
                            message.role === "user"
                              ? isDarkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500 text-white'
                              : isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {message.role === "bot" && message.content.includes('Model Portfolio (Table):')
                              ? (() => {
                                  const [before, tableAndAfter] = message.content.split('Model Portfolio (Table):');
                                  const tableMatch = tableAndAfter.match(/\| ETF \|[\s\S]+?(?=\n\n|$)/);
                                  const tableText = tableMatch ? tableMatch[0] : '';
                                  const after = tableAndAfter.replace(tableText, '');
                                  return <>
                                    {before && <span>{before.trim()}\n\n</span>}
                                    {tableText && renderPortfolioTable(tableText)}
                                    {after && <span>{after.trim()}</span>}
                                  </>;
                                })()
                              : message.content}
                          </div>
                        </div>
                        {message.role === "bot" && 
                         userProfile.investmentAmount && 
                         message.content.includes("Model Portfolio:") && (
                          <FeedbackButton
                            messageId={`msg-${index}`}
                            isDarkMode={isDarkMode}
                            onFeedbackSubmit={async (feedback) => {
                              try {
                                const response = await fetch('/api/feedback', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    messageId: `msg-${index}`,
                                    userProfile,
                                    ...feedback,
                                  }),
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to submit feedback');
                                }
                              } catch (error) {
                                console.error('Error submitting feedback:', error);
                              }
                            }}
                          />
                        )}
                      </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
            <CardFooter className="border-t border-gray-700 p-3">
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
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {/* Market Analysis Card */}
              <Card className={`${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg animate-fadeIn h-full`}>
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
                      <ThumbsFeedback label="Was this market analysis helpful?" isDarkMode={isDarkMode} onFeedback={(val) => {
                        fetch('/api/feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'market', value: val, userProfile })
                        })
                      }} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Visualization Card */}
              <Card className={`${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg animate-fadeIn h-full`}>
                <CardHeader className="border-b border-gray-700 py-3 md:py-4">
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <BarChart2 className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span>Portfolio Allocation</span>
              </CardTitle>
                  <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Total Investment: R{Number(userProfile.investmentAmount).toFixed(2)}
              </CardDescription>
            </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <div className="flex flex-col space-y-4 md:space-y-6">
                    <div className="h-[300px] md:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(generatedPortfolio).map(([name, { allocation }]) => ({
                        name,
                        value: allocation,
                      }))}
                      cx="50%"
                      cy="50%"
                            outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                            label={props => renderPieLabel(props, isDarkMode)}
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
                    <ThumbsFeedback label="Was this portfolio visualization helpful?" isDarkMode={isDarkMode} onFeedback={(val) => {
                      fetch('/api/feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'visual', value: val, userProfile })
                      })
                    }} />
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

