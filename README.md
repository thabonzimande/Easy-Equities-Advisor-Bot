# Easy Equities Portfolio Advisor

A modern, AI-powered investment portfolio advisor built with Next.js and TypeScript. This application helps users create personalized ETF portfolios based on their investment goals, risk tolerance, and market conditions.

## Features

- 🤖 Interactive chatbot interface for gathering user preferences
- 📊 Real-time market data integration via Yahoo Finance API
- 📈 Dynamic portfolio visualization with interactive charts
- 🌓 Dark/Light mode support
- 📱 Responsive design for all devices
- 💼 Personalized portfolio recommendations
- 📉 Market analysis and insights
- 💰 Income-focused portfolio options

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI Components
- Recharts for data visualization
- Yahoo Finance API for market data

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/easy-equities-advisor.git
cd easy-equities-advisor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
# Add any required environment variables here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
easy-equities-advisor/
├── app/
│   ├── api/
│   │   └── portfolio/
│   │       └── route.ts
│   ├── components/
│   ├── advanced-portfolio-generator.ts
│   ├── data-service.ts
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── styles/
├── types/
├── .env.local
├── package.json
└── README.md
```

## Features in Detail

### Portfolio Generation
- Risk-adjusted portfolio allocation
- Market condition-based adjustments
- Income vs. Growth strategy options
- Dynamic ETF selection

### Market Analysis
- Real-time market indicators
- Volatility analysis
- Market trend insights
- Portfolio impact assessment

### User Interface
- Intuitive chat interface
- Interactive portfolio visualization
- Real-time market data display
- Responsive design

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Easy Equities for inspiration
- Yahoo Finance for market data
- Shadcn/UI for components
- Recharts for visualization 