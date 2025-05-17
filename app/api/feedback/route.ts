import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId, rating, comment } = body;

    // TODO: Store feedback in your database
    // For now, we'll just log it
    console.log('Feedback received:', {
      messageId,
      rating,
      comment,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
} 