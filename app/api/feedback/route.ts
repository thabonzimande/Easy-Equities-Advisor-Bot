import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE = 'feedback-logs.json';

interface Feedback {
  timestamp: string;
  messageId: string;
  userProfile: any;
  rating: 'helpful' | 'not_helpful';
  comment?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const feedback: Feedback = {
      timestamp: new Date().toISOString(),
      messageId: body.messageId,
      userProfile: body.userProfile,
      rating: body.rating,
      comment: body.comment
    };

    // Create feedback file if it doesn't exist
    const filePath = path.join(process.cwd(), FEEDBACK_FILE);
    let feedbacks: Feedback[] = [];
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      feedbacks = JSON.parse(fileContent);
    }

    // Add new feedback
    feedbacks.push(feedback);

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(feedbacks, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
} 