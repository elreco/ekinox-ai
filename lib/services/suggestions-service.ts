import { SearchResults } from '@/lib/types'

export interface SuggestionItem {
  heading: string
  message: string
}

// Service to generate trending topic suggestions for the homepage
async function getTrendingSuggestions(): Promise<SuggestionItem[]> {
  const tavilyApiKey = process.env.TAVILY_API_KEY

  console.log('Fetching trending suggestions from Tavily API...')

  if (!tavilyApiKey) {
    console.warn('Tavily API key not found, returning fallback suggestions')
    return getFallbackSuggestions()
  }

  try {
    // Get trending topics from different categories
    const trendingQueries = [
      'breaking news headlines',
      'trending business stories',
      'viral science discoveries',
      'popular health news',
      'trending sports news',
      'latest entertainment news',
      'trending politics news',
      'popular finance topics',
      'viral social media trends',
      'trending lifestyle news',
      'popular environmental news',
      'trending educational topics',
      'latest innovation breakthroughs',
      'trending travel destinations',
      'popular food trends',
      'trending fashion news'
    ]

    // Get random 6 queries to have variety
    const selectedQueries = trendingQueries
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)

    const suggestionPromises = selectedQueries.map(async (query) => {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query,
            search_depth: 'basic',
            include_answer: false,
            include_images: false,
            include_raw_content: false,
            max_results: 3
          })
        })

        if (!response.ok) {
          console.error(`Tavily API error for "${query}": ${response.status}`)
          return []
        }

        const data: SearchResults = await response.json()
        
        return data.results.map(result => {
          // Create engaging questions from titles
          const title = result.title
          const suggestion = generateSuggestionFromTitle(title)
          
          return {
            heading: suggestion,
            message: suggestion
          }
        })
      } catch (error) {
        console.error(`Error fetching suggestions for "${query}":`, error)
        return []
      }
    })

    const results = await Promise.all(suggestionPromises)
    const allSuggestions = results.flat()

    if (allSuggestions.length === 0) {
      console.warn('No suggestions from Tavily API, using fallback')
      return getFallbackSuggestions()
    }

    // Filter and select the best 4 suggestions
    const uniqueSuggestions = removeDuplicates(allSuggestions)
    const selectedSuggestions = selectBestSuggestions(uniqueSuggestions, 4)

    console.log(`Successfully generated ${selectedSuggestions.length} trending suggestions`)
    return selectedSuggestions

  } catch (error) {
    console.error('Error fetching trending suggestions:', error)
    return getFallbackSuggestions()
  }
}

function generateSuggestionFromTitle(title: string): string {
  // Remove common prefixes and clean up titles
  let cleanTitle = title
    .replace(/^(Latest|Breaking|New|Top|Best|Why|How|What|The)\s+/i, '')
    .replace(/\s+\|\s+.+$/, '') // Remove "| Source Name"
    .replace(/\s+-\s+.+$/, '') // Remove "- Source Name"
    .trim()

  // Convert to question format for better engagement
  const questionStarters = [
    'What is',
    'How does',
    'Why is',
    'What are the latest developments in',
    'Tell me about',
    'Explain',
    'What happened with',
    'Analysis of'
  ]

  // Check if it's already a question
  if (cleanTitle.includes('?')) {
    return cleanTitle
  }

  // For company/product mentions, create specific questions
  if (cleanTitle.toLowerCase().includes(' vs ')) {
    return `Compare: ${cleanTitle}`
  }

  if (cleanTitle.toLowerCase().includes('announces') || cleanTitle.toLowerCase().includes('launches')) {
    return `What did ${cleanTitle.split(' ')[0]} announce?`
  }

  // For general topics, use appropriate question starter
  const randomStarter = questionStarters[Math.floor(Math.random() * questionStarters.length)]
  
  // Limit length to keep suggestions concise
  const suggestion = `${randomStarter} ${cleanTitle}`.substring(0, 80)
  return suggestion.endsWith('...') ? suggestion : suggestion + (suggestion.length >= 77 ? '...' : '')
}

function removeDuplicates(suggestions: SuggestionItem[]): SuggestionItem[] {
  const seen = new Set<string>()
  return suggestions.filter(suggestion => {
    const key = suggestion.heading.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function selectBestSuggestions(suggestions: SuggestionItem[], count: number): SuggestionItem[] {
  // Score suggestions based on engagement potential
  const scoredSuggestions = suggestions.map(suggestion => ({
    ...suggestion,
    score: calculateSuggestionScore(suggestion.heading)
  }))

  // Sort by score and return top suggestions
  return scoredSuggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ heading, message }) => ({ heading, message }))
}

function calculateSuggestionScore(heading: string): number {
  let score = 0

  // Prefer questions
  if (heading.includes('?')) score += 20
  
  // Prefer diverse trending topics
  const trendingWords = [
    'AI', 'Bitcoin', 'Tesla', 'Apple', 'Google', 'Meta', 'OpenAI', 'ChatGPT', 'DeepSeek', 'Nvidia', // Tech
    'Olympics', 'World Cup', 'NBA', 'FIFA', 'Champions League', // Sports
    'Netflix', 'Disney', 'Marvel', 'Hollywood', 'Oscar', // Entertainment
    'Climate', 'Election', 'Trump', 'Biden', 'Ukraine', 'China', // News/Politics
    'Health', 'COVID', 'Vaccine', 'Diet', 'Fitness', // Health
    'Travel', 'Tourism', 'Fashion', 'Food', 'Recipe' // Lifestyle
  ]
  const hasTerendingWord = trendingWords.some(word => heading.toLowerCase().includes(word.toLowerCase()))
  if (hasTerendingWord) score += 15

  // Prefer action words
  const actionWords = ['announces', 'launches', 'reveals', 'breakthrough', 'develops', 'creates']
  const hasActionWord = actionWords.some(word => heading.toLowerCase().includes(word))
  if (hasActionWord) score += 10

  // Penalize very long suggestions
  if (heading.length > 60) score -= 10
  if (heading.length > 80) score -= 20

  // Prefer moderate length
  if (heading.length >= 30 && heading.length <= 60) score += 5

  return score
}

function getFallbackSuggestions(): SuggestionItem[] {
  const todayVariations = [
    {
      heading: 'What are the latest AI developments?',
      message: 'What are the latest AI developments?'
    },
    {
      heading: 'Tell me about trending sports news',
      message: 'Tell me about trending sports news'
    },
    {
      heading: 'What is happening in entertainment?',
      message: 'What is happening in entertainment?'
    },
    {
      heading: 'Explain the latest health discoveries',
      message: 'Explain the latest health discoveries'
    },
    {
      heading: 'What are the hottest business trends?',
      message: 'What are the hottest business trends?'
    },
    {
      heading: 'Summary of breaking news headlines',
      message: 'Summary of breaking news headlines'
    },
    {
      heading: 'What are the trending travel destinations?',
      message: 'What are the trending travel destinations?'
    },
    {
      heading: 'Tell me about popular food trends',
      message: 'Tell me about popular food trends'
    }
  ]

  // Return 4 random suggestions from fallback
  return todayVariations
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
}

export { getTrendingSuggestions }