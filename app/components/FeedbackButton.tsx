import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface FeedbackButtonProps {
  messageId: string
  isDarkMode: boolean
  onFeedbackSubmit: (feedback: { rating: number; comment: string }) => void
}

export function FeedbackButton({ messageId, isDarkMode, onFeedbackSubmit }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = () => {
    onFeedbackSubmit({ rating, comment })
    setIsSubmitted(true)
    setIsOpen(false)
  }

  if (isSubmitted) {
    return (
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Thank you for your feedback!
      </div>
    )
  }

  return (
    <div className="mt-2">
      {!isOpen ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`text-sm ${
            isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
          }`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Was this response helpful?
        </Button>
      ) : (
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={`focus:outline-none transition-colors ${
                    isDarkMode ? 'hover:text-yellow-400' : 'hover:text-yellow-500'
                  }`}
                >
                  <Star
                    className={`w-6 h-6 ${
                      value <= rating
                        ? isDarkMode
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-yellow-500 fill-yellow-500'
                        : isDarkMode
                        ? 'text-gray-600'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Additional comments (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`mt-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-200'
              }`}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={rating === 0}
                className={`${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 