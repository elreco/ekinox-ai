import { ArrowRight } from 'lucide-react'

import { type SuggestionItem } from '@/lib/services/suggestions-service'

import { Button } from '@/components/ui/button'

export function EmptyScreen({
  submitMessage,
  className,
  suggestions
}: {
  submitMessage: (message: string) => void
  className?: string
  suggestions?: SuggestionItem[]
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-transparent p-2">
        <div className="mt-2 flex flex-col items-start space-y-2 mb-4">
          {suggestions &&
            suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="link"
                className="h-auto p-0 text-base text-foreground"
                name={suggestion.message}
                onClick={async () => {
                  submitMessage(suggestion.message)
                }}
              >
                <ArrowRight size={16} className="mr-2 text-muted-foreground" />
                {suggestion.heading}
              </Button>
            ))}
        </div>
      </div>
    </div>
  )
}
