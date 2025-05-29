import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface FeedbackComponentProps {
  messageId: string;
  userProfile: any;
  isDarkMode: boolean;
}

export function FeedbackComponent({ messageId, userProfile, isDarkMode }: FeedbackComponentProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedRating, setSelectedRating] = useState<'helpful' | 'not_helpful' | null>(null);

  const submitFeedback = async (withComment: boolean = false) => {
    if (isSubmitting || !selectedRating) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          userProfile,
          rating: selectedRating,
          comment: withComment ? comment : undefined,
        }),
      });

      if (response.ok) {
        setFeedbackGiven(true);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = (rating: 'helpful' | 'not_helpful') => {
    setSelectedRating(rating);
    setShowCommentBox(true);
  };

  if (feedbackGiven) {
    return (
      <div className="flex items-center space-x-2 mt-2">
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Thank you for your feedback on the portfolio recommendation!
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4 border-t border-gray-700 pt-4">
      <div className="flex items-center space-x-3">
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          How satisfied are you with this portfolio recommendation?
        </span>
        <button
          onClick={() => handleRating('helpful')}
          disabled={isSubmitting}
          className={`p-1.5 rounded-full transition-colors ${
            selectedRating === 'helpful'
              ? 'bg-green-500/20 text-green-400'
              : isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-green-400'
                : 'hover:bg-gray-100 text-gray-600 hover:text-green-600'
          }`}
          aria-label="Satisfied"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleRating('not_helpful')}
          disabled={isSubmitting}
          className={`p-1.5 rounded-full transition-colors ${
            selectedRating === 'not_helpful'
              ? 'bg-red-500/20 text-red-400'
              : isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'
          }`}
          aria-label="Not satisfied"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {showCommentBox && (
        <div className="space-y-3">
          <Textarea
            placeholder="Please share your thoughts about this portfolio recommendation..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`w-full min-h-[100px] ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          />
          <div className="flex space-x-3">
            <Button
              onClick={() => submitFeedback(true)}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Feedback
            </Button>
            <Button
              onClick={() => submitFeedback(false)}
              disabled={isSubmitting}
              variant="outline"
              className={isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}
            >
              Skip Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 