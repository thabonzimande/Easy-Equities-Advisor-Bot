import { NextResponse } from 'next/server';
import { generateAdvancedPortfolio } from '@/app/advanced-portfolio-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userProfile, amount } = body;

    const portfolioData = await generateAdvancedPortfolio(userProfile, amount);

    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error('Error generating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to generate portfolio' },
      { status: 500 }
    );
  }
} 