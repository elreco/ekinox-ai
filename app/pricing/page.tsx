import { PricingSection } from '@/components/pricing/pricing-section'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <PricingSection />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Pricing - Ekinox AI',
  description: 'Choose the perfect plan for your AI-powered search needs'
}
