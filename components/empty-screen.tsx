import Link from 'next/link'

import { ArrowRight, Crown } from 'lucide-react'

import { Button } from '@/components/ui/button'

const exampleMessages = [
  {
    heading: 'What is DeepSeek R1?',
    message: 'What is DeepSeek R1?'
  },
  {
    heading: 'Why is Nvidia growing rapidly?',
    message: 'Why is Nvidia growing rapidly?'
  },
  {
    heading: 'Tesla vs Rivian',
    message: 'Tesla vs Rivian'
  },
  {
    heading: 'Summary: https://arxiv.org/pdf/2501.05707',
    message: 'Summary: https://arxiv.org/pdf/2501.05707'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-2 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <ArrowRight size={16} className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
        
        <div className="mt-6 p-4 border border-primary/20 rounded-lg bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">Upgrade to Pro</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Get unlimited searches, priority support, and advanced features.
          </p>
          <Button asChild size="sm" className="w-full">
            <Link href="/pricing">
              View Plans
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
