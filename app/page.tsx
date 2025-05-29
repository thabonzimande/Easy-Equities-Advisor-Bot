"use client"

import { useState, useEffect, useRef } from "react"
import { Send, PieChart, BarChart2, TrendingUp, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { FeedbackButton } from './components/FeedbackButton'
import { FeedbackComponent } from './components/FeedbackComponent'

type Message = {
  role: "user" | "bot"
  content: string
  id?: string
  isPortfolioRecommendation?: boolean
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

  // Find the header line (should contain ETF, Allocation, etc.)
  const headerLine = lines.find(line => line.toLowerCase().includes('etf') || line.toLowerCase().includes('allocation'));
  if (!headerLine) return null;

  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines
    .filter(line => line.includes('|') && !line.includes('---') && line !== headerLine)
    .map(line => line.split('|').map(cell => cell.trim()).filter(Boolean));

  return (
    <div className="w-full overflow-x-auto my-2 rounded-lg">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                {headers.map((header, i) => (
                  <th key={i} scope="col" className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-800">
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Add this function before the main component
function generateGrowthData(amount: number, years: number, monthlyAmount: number | undefined, riskLevel: string) {
  const data = [];
  let currentAmount = amount;
  
  // Set growth rate based on risk level
  const baseRate = riskLevel === 'low' ? 0.06 : riskLevel === 'medium' ? 0.08 : 0.10;
  const volatility = riskLevel === 'low' ? 0.02 : riskLevel === 'medium' ? 0.03 : 0.04;

  for (let year = 0; year <= years; year++) {
    // Add some randomness to make it more realistic
    const yearlyRate = baseRate + (Math.random() * volatility - volatility/2);
    
    if (monthlyAmount) {
      // Add monthly contributions
      currentAmount += monthlyAmount * 12;
    }
    
    // Calculate growth
    currentAmount *= (1 + yearlyRate);

    data.push({
      year,
      value: Math.round(currentAmount),
      tooltip: `R${Math.round(currentAmount).toLocaleString()}`
    });
  }

  return data;
}

export default function EasyEquitiesAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Welcome to the Easy Equities Advisor Bot! I'm here to help you create a personalized investment portfolio.\n\nWhat's your investment goal(in Rands)?",
      id: "welcome-message"
    },
  ])
  const [input, setInput] = useState("")
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({})
  const [generatedPortfolio, setGeneratedPortfolio] = useState<Portfolio | null>(null)
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      })
    }
  }

  // Scroll to bottom when messages change, except for portfolio recommendation
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    // Only scroll if it's not a portfolio recommendation
    if (lastMessage && !lastMessage.isPortfolioRecommendation) {
      scrollToBottom();
    }
  }, [messages]);

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
          content: "I apologize, but I encountered an error. Please try again.",
          id: `error-${Date.now()}`
        }]);
      }
    }
  };

  const generateBotResponse = async (userInput: string) => {
    const updatedProfile = { ...userProfile };
    let botResponse = "";
    let isPortfolioRecommendation = false;

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
            // Portfolio generation for once-off
            const portfolioData = await generatePortfolio(updatedProfile);
            if (portfolioData) {
              botResponse = generateAdvice(portfolioData.portfolio, Number(updatedProfile.investmentAmount), updatedProfile);
              isPortfolioRecommendation = true;
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
          // Portfolio generation for monthly
          const portfolioData = await generatePortfolio(updatedProfile);
          if (portfolioData) {
            botResponse = generateAdvice(portfolioData.portfolio, Number(updatedProfile.monthlyAmount), updatedProfile);
            isPortfolioRecommendation = true;
          } else {
            botResponse = "I apologize, but I couldn't generate a portfolio at this time. Please try again later.";
          }
        } else {
          botResponse = "Please enter a valid monthly investment amount (e.g., 1000)";
        }
      } else {
        botResponse = "I've already provided a portfolio recommendation. If you'd like a new one, please refresh the page to start over.";
      }

      setMessages(prev => [...prev, { 
        role: "bot", 
        content: botResponse,
        id: `msg-${Date.now()}`,
        isPortfolioRecommendation
      }]);
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
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed md:static w-64 h-full transition-transform duration-300 ease-in-out z-50 
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 ${isDesktopSidebarOpen ? 'md:w-64' : 'md:w-0'}
          ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900 border-r border-gray-200'}`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className={`absolute right-4 top-4 p-2 rounded-lg md:hidden ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ✕
        </button>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          className={`absolute -right-4 top-8 rounded-full p-2 hidden md:block 
            ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}
        >
          {isDesktopSidebarOpen ? '←' : '→'}
        </button>
        
        {/* Sidebar Content */}
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center mb-6 space-x-3">
            <PieChart className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            <h1 className="text-xl font-bold">Easy Equities Advisor Bot</h1>
          </div>

          {/* Theme Toggle */}
          <div className={`mb-6 flex items-center justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <span>Theme</span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Chat History */}
          <div className="flex flex-col flex-grow overflow-hidden">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Chat History
            </h2>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
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
                        ? 'bg-gray-700/50 text-gray-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span className="font-medium">
                      {message.role === "user" ? "You: " : "Advisor: "}
                    </span>
                    <div className="whitespace-pre-wrap break-words line-clamp-3">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center justify-between p-4 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white border-b border-gray-200'
        }`}>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className={`p-2 rounded-md ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Easy Equities Advisor
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-md ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>

        {/* Chat and Visualization Container */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} scroll-smooth`}
        >
          <div className="container mx-auto max-w-4xl px-2 py-4 md:px-4 md:py-6">
            {/* Messages */}
            <div className="space-y-4 mb-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[85%] sm:max-w-[75%] ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : isDarkMode
                          ? "bg-gray-800 text-gray-100"
                          : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.role === "bot" && message.content.includes('Model Portfolio (Table):')
                        ? (() => {
                            const [before, tableAndAfter] = message.content.split('Model Portfolio (Table):');
                            const tableMatch = tableAndAfter.match(/\|[\s\S]+?(?=\n\n|$)/);
                            const tableText = tableMatch ? tableMatch[0] : '';
                            const after = tableAndAfter.replace(tableText, '');
                            return (
                              <>
                                {before && <div>{before.trim()}</div>}
                                {tableText && (
                                  <div className="w-full overflow-x-auto my-4 -mx-4 px-4">
                                    <table className={`min-w-full divide-y ${
                                      isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                                    }`}>
                                      <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                        <tr>
                                          {tableText.split('\n')[0].split('|')
                                            .map(h => h.trim())
                                            .filter(Boolean)
                                            .map((header, i) => (
                                              <th key={i} className={`px-4 py-3 text-left text-sm font-semibold ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                              } whitespace-nowrap`}>
                                                {header}
                                              </th>
                                            ))}
                                        </tr>
                                      </thead>
                                      <tbody className={`divide-y ${
                                        isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
                                      }`}>
                                        {tableText
                                          .split('\n')
                                          .filter(line => line.includes('|') && !line.includes('---'))
                                          .slice(1)
                                          .map((line, i) => (
                                            <tr key={i}>
                                              {line
                                                .split('|')
                                                .map(cell => cell.trim())
                                                .filter(Boolean)
                                                .map((cell, j) => (
                                                  <td key={j} className={`px-4 py-3 text-sm ${
                                                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                                                  } whitespace-nowrap`}>
                                                    {cell}
                                                  </td>
                                                ))}
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {after && <div>{after.trim()}</div>}
                              </>
                            );
                          })()
                        : message.content}
                    </div>
                    {message.role === "bot" && message.id && message.isPortfolioRecommendation && (
                      <FeedbackComponent
                        messageId={message.id}
                        userProfile={userProfile}
                        isDarkMode={isDarkMode}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* Invisible element to scroll to */}
            </div>

            {/* Portfolio Analysis */}
            {generatedPortfolio && (
              <div className="space-y-4">
                {/* Market Analysis Card */}
                <Card className={`shadow-lg w-full ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-100' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
                    <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                      <TrendingUp className={`w-5 h-5 md:w-6 md:h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span>Market Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {marketAnalysis && (
                      <div className="space-y-4">
                        <p className={`text-base md:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {marketAnalysis.description}
                        </p>
                        <div className="space-y-3">
                          {marketAnalysis.factors.map((factor, index) => (
                            <div
                              key={index}
                              className={`p-3 md:p-4 rounded-lg ${
                                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                              }`}
                            >
                              <div className={`font-medium text-base md:text-lg ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                                {factor.factor}
                              </div>
                              <div className={`mt-1 md:mt-2 text-sm md:text-base ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
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
                <Card className={`shadow-lg w-full ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-100' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
                    <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                      <PieChart className={`w-5 h-5 md:w-6 md:h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span>Portfolio Allocation</span>
                    </CardTitle>
                    <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Total Investment: R{Number(userProfile.investmentAmount).toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={Object.entries(generatedPortfolio).map(([name, { allocation }]) => ({
                                name,
                                value: allocation,
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius="80%"
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

                      <div className="space-y-2">
                        {Object.entries(generatedPortfolio).map(([etf, details], index) => (
                          <div
                            key={etf}
                            className="p-3 rounded-lg bg-gray-700/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium text-sm md:text-base">{etf}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-base">
                                  {(details.allocation * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-400">
                                  R{(Number(userProfile.investmentAmount) * details.allocation).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            {details.price && (
                              <div className="mt-2 text-xs border-t border-gray-600 pt-2">
                                <span>R{details.price.toFixed(2)}</span>
                                {details.change && (
                                  <span className={details.change > 0 ? 'text-green-500' : 'text-red-500'}>
                                    {" "}({details.change > 0 ? "+" : ""}{details.change.toFixed(2)}%)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Investment Growth Projection Card */}
                <Card className={`shadow-lg w-full ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-100' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
                    <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                      <TrendingUp className={`w-5 h-5 md:w-6 md:h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span>Investment Growth Projection</span>
                    </CardTitle>
                    <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {userProfile.investmentType === 'monthly' 
                        ? `Monthly Investment: R${userProfile.monthlyAmount}`
                        : `Initial Investment: R${userProfile.investmentAmount}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={generateGrowthData(
                              Number(userProfile.investmentAmount),
                              Number(userProfile.timeHorizon),
                              userProfile.investmentType === 'monthly' ? Number(userProfile.monthlyAmount) : undefined,
                              userProfile.riskTolerance || 'medium'
                            )}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                            <XAxis 
                              dataKey="year" 
                              stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                              label={{ 
                                value: 'Years', 
                                position: 'bottom',
                                style: { fill: isDarkMode ? '#9CA3AF' : '#4B5563' }
                              }}
                            />
                            <YAxis 
                              stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                              tickFormatter={(value) => `R${(value/1000).toFixed(0)}K`}
                              label={{ 
                                value: 'Portfolio Value', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { fill: isDarkMode ? '#9CA3AF' : '#4B5563' }
                              }}
                            />
                            <Tooltip 
                              formatter={(value: number) => [`R${value.toLocaleString()}`, 'Portfolio Value']}
                              labelFormatter={(label) => `Year ${label}`}
                              contentStyle={{
                                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                                color: isDarkMode ? '#E5E7EB' : '#111827'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3B82F6"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 6, fill: "#3B82F6" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>* Projection based on historical market data and risk profile</p>
                        <p>* Actual returns may vary due to market conditions</p>
                        <p>* {userProfile.riskTolerance?.charAt(0).toUpperCase()}{userProfile.riskTolerance?.slice(1)} risk profile: 
                          {userProfile.riskTolerance === 'low' ? ' 6-8%' : 
                           userProfile.riskTolerance === 'medium' ? ' 8-11%' : ' 10-14%'} expected annual return
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${
          isDarkMode 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="max-w-4xl mx-auto flex gap-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type your message..."
              className={isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' 
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'
              }
            />
            <Button 
              onClick={handleSend} 
              className={`${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

