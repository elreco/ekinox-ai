import { SearchResultItem, SearchResults } from '@/lib/types'

interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  imageUrl?: string
  category: string
  readingTime?: number
  score?: number
  author?: string
  tags?: string[]
  country?: string
}

// Use Tavily API to get trending news
async function getTrendingTopics(
  userCountry?: string,
  userLocale?: string
): Promise<NewsItem[]> {
  const tavilyApiKey = process.env.TAVILY_API_KEY

  console.log('Tavily API Key status:', tavilyApiKey ? 'Found' : 'Not found')

  if (!tavilyApiKey) {
    console.warn('Tavily API key not found, returning empty array')
    return []
  }

  try {
    // Get worldwide topics
    const worldwideTopics = [
      {
        query: 'artificial intelligence breakthrough 2024',
        category: 'Technology',
        tags: ['AI', 'Innovation'],
        country: 'worldwide'
      },
      {
        query: 'startup funding venture capital',
        category: 'Business',
        tags: ['Startups', 'Investment'],
        country: 'worldwide'
      },
      {
        query: 'climate change renewable energy',
        category: 'Environment',
        tags: ['Climate', 'Green Tech'],
        country: 'worldwide'
      },
      {
        query: 'space exploration NASA SpaceX',
        category: 'Science',
        tags: ['Space', 'Exploration'],
        country: 'worldwide'
      },
      {
        query: 'cybersecurity data breach news',
        category: 'Security',
        tags: ['Cybersecurity', 'Privacy'],
        country: 'worldwide'
      },
      {
        query: 'quantum computing research',
        category: 'Technology',
        tags: ['Quantum', 'Computing'],
        country: 'worldwide'
      }
    ]

    // Add country-specific topics if user country is provided
    let countryTopics: any[] = []
    if (userCountry && userCountry !== 'worldwide') {
      const countryName = getCountryName(userCountry)
      const countryLanguage = getCountryLanguage(userCountry, userLocale)
      const isEnglish = countryLanguage === 'en'

      // Create localized queries based on country language
      const localizedQueries = getLocalizedQueries(
        countryName,
        countryLanguage,
        isEnglish
      )

      countryTopics = [
        {
          query: localizedQueries.technology,
          category: 'Technology',
          tags: ['Local Tech', countryName],
          country: userCountry
        },
        {
          query: localizedQueries.business,
          category: 'Business',
          tags: ['Local Business', countryName],
          country: userCountry
        },
        {
          query: localizedQueries.environment,
          category: 'Environment',
          tags: ['Local Environment', countryName],
          country: userCountry
        },
        {
          query: localizedQueries.health,
          category: 'Health',
          tags: ['Healthcare', countryName],
          country: userCountry
        }
      ]
    }

    const topics = [...worldwideTopics, ...countryTopics]

    const newsPromises = topics.map(async topicObj => {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: topicObj.query,
            search_depth: 'advanced',
            include_answer: false,
            include_images: true,
            include_raw_content: false,
            max_results: 4,
            include_domains: [
              'techcrunch.com',
              'wired.com',
              'theverge.com',
              'arstechnica.com',
              'reuters.com',
              'bbc.com',
              'nature.com',
              'mit.edu',
              'stanford.edu',
              'github.blog'
            ]
          })
        })

        if (!response.ok) {
          throw new Error(`Tavily API error: ${response.status}`)
        }

        const data: SearchResults = await response.json()

        return data.results.map((result: SearchResultItem, index: number) => ({
          id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: result.title,
          description: result.content.substring(0, 180) + '...',
          url: result.url,
          source: extractDomain(result.url),
          publishedAt: new Date(
            Date.now() - (index + Math.random() * 0.5) * 60 * 60 * 1000
          ), // More realistic timestamps
          category: topicObj.category,
          tags: topicObj.tags,
          readingTime: Math.floor(result.content.length / 200) + 2, // Estimate reading time
          score: Math.random() * 0.3 + 0.7, // Score between 0.7 and 1.0
          country: topicObj.country,
          imageUrl:
            data.images && data.images.length > index
              ? typeof data.images[index] === 'string'
                ? data.images[index]
                : data.images[index]?.url
              : data.images && data.images.length > 0
                ? typeof data.images[0] === 'string'
                  ? data.images[0]
                  : data.images[0]?.url
                : undefined
        }))
      } catch (error) {
        console.error(
          `Error fetching news for topic "${topicObj.query}":`,
          error
        )
        return []
      }
    })

    const results = await Promise.all(newsPromises)
    const allResults = results.flat()

    // Sort by score and recency, then limit
    const sortedResults = allResults
      .sort(
        (a, b) =>
          (b.score || 0) * 0.7 +
          ((new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()) /
            1000000) *
            0.3
      )
      .slice(0, 24) // Increase limit to 24 news items for better variety

    if (sortedResults.length === 0) {
      console.warn('No valid news results from Tavily API')
      return []
    }

    console.log(`Successfully fetched ${sortedResults.length} news items`)
    return sortedResults
  } catch (error) {
    console.error('Error fetching trending topics:', error)
    return []
  }
}

function getFallbackNews(): NewsItem[] {
  const now = new Date()
  return [
    {
      id: 'fallback-1',
      title: 'AI Advances in Search Technology',
      description:
        'Recent developments in AI-powered search engines are changing how we discover information online. Machine learning algorithms are becoming more sophisticated in understanding user intent and delivering personalized results...',
      url: 'https://techcrunch.com/ai-search-technology',
      source: 'TechCrunch',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      category: 'Technology',
      imageUrl:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop'
    },
    {
      id: 'fallback-2',
      title: 'Breakthrough in Renewable Energy Storage',
      description:
        'Scientists have developed a new battery technology that could revolutionize renewable energy storage, making solar and wind power more reliable and cost-effective for widespread adoption...',
      url: 'https://www.wired.com/renewable-energy-breakthrough',
      source: 'Wired',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      category: 'Environment',
      imageUrl:
        'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=200&fit=crop'
    },
    {
      id: 'fallback-3',
      title: 'Quantum Computing Reaches New Milestone',
      description:
        'Researchers achieve quantum advantage in a practical application, bringing us closer to real-world quantum computing solutions that could transform cryptography, drug discovery, and financial modeling...',
      url: 'https://arstechnica.com/quantum-computing-milestone',
      source: 'Ars Technica',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      category: 'Science',
      imageUrl:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop'
    },
    {
      id: 'fallback-4',
      title: 'Major Cybersecurity Vulnerability Discovered',
      description:
        'Security researchers uncover a critical flaw affecting millions of devices worldwide. Companies are rushing to deploy patches as experts recommend immediate security measures for users and enterprises...',
      url: 'https://theverge.com/cybersecurity-vulnerability',
      source: 'The Verge',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
      category: 'Security',
      imageUrl:
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop'
    }
  ]
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0] || domain
  } catch {
    return 'Unknown'
  }
}

function getCategoryFromTopic(topic: string): string {
  if (topic.includes('AI') || topic.includes('tech')) return 'Technology'
  if (topic.includes('startup') || topic.includes('funding')) return 'Business'
  if (topic.includes('climate') || topic.includes('environment'))
    return 'Environment'
  if (topic.includes('space')) return 'Science'
  if (topic.includes('cyber')) return 'Security'
  return 'General'
}

function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    US: 'United States',
    FR: 'France',
    GB: 'United Kingdom',
    DE: 'Germany',
    IT: 'Italy',
    ES: 'Spain',
    CA: 'Canada',
    AU: 'Australia',
    JP: 'Japan',
    CN: 'China',
    IN: 'India',
    BR: 'Brazil',
    MX: 'Mexico',
    RU: 'Russia',
    KR: 'South Korea',
    NL: 'Netherlands',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    CH: 'Switzerland',
    AT: 'Austria',
    BE: 'Belgium',
    IE: 'Ireland',
    PT: 'Portugal',
    PL: 'Poland',
    CZ: 'Czech Republic',
    HU: 'Hungary',
    GR: 'Greece',
    TR: 'Turkey',
    IL: 'Israel',
    ZA: 'South Africa',
    NG: 'Nigeria',
    EG: 'Egypt',
    MA: 'Morocco',
    KE: 'Kenya',
    GH: 'Ghana',
    TH: 'Thailand',
    SG: 'Singapore',
    MY: 'Malaysia',
    ID: 'Indonesia',
    PH: 'Philippines',
    VN: 'Vietnam',
    NZ: 'New Zealand'
  }
  return countryNames[countryCode] || countryCode
}

function getCountryFromLocale(locale?: string): string {
  if (!locale) return 'worldwide'

  // Extract country code from locale (e.g., 'en-US' -> 'US')
  const parts = locale.split('-')
  if (parts.length > 1) {
    return parts[1].toUpperCase()
  }

  // Handle special cases for language codes
  const languageToCountry: Record<string, string> = {
    en: 'US',
    fr: 'FR',
    de: 'DE',
    es: 'ES',
    it: 'IT',
    ja: 'JP',
    ko: 'KR',
    zh: 'CN',
    pt: 'PT',
    ru: 'RU',
    ar: 'SA',
    hi: 'IN'
  }

  return languageToCountry[parts[0].toLowerCase()] || 'worldwide'
}

function getCountryLanguage(countryCode: string, userLocale?: string): string {
  // If we have a full locale, extract the language part
  if (userLocale) {
    const parts = userLocale.split('-')
    if (parts.length > 0) {
      return parts[0].toLowerCase()
    }
  }

  // Fallback to country-specific primary languages
  const countryToLanguage: Record<string, string> = {
    FR: 'fr',
    DE: 'de',
    ES: 'es',
    IT: 'it',
    PT: 'pt',
    RU: 'ru',
    JP: 'ja',
    KR: 'ko',
    CN: 'zh',
    IN: 'hi',
    BR: 'pt',
    MX: 'es',
    NL: 'nl',
    SE: 'sv',
    NO: 'no',
    DK: 'da',
    FI: 'fi',
    PL: 'pl',
    CZ: 'cs',
    HU: 'hu',
    GR: 'el',
    TR: 'tr',
    IL: 'he',
    SA: 'ar',
    EG: 'ar',
    MA: 'ar',
    TH: 'th',
    VN: 'vi',
    ID: 'id',
    MY: 'ms',
    PH: 'tl'
  }

  return countryToLanguage[countryCode] || 'en'
}

function getLocalizedQueries(
  countryName: string,
  language: string,
  isEnglish: boolean
) {
  const queries: Record<string, Record<string, string>> = {
    fr: {
      technology: `${countryName} technologie innovation actualités`,
      business: `${countryName} entreprises startups financement`,
      environment: `${countryName} énergies renouvelables politiques`,
      health: `${countryName} recherche médicale santé`
    },
    es: {
      technology: `${countryName} tecnología innovación noticias`,
      business: `${countryName} empresas startups financiación`,
      environment: `${countryName} energías renovables políticas`,
      health: `${countryName} investigación médica salud`
    },
    de: {
      technology: `${countryName} Technologie Innovation Nachrichten`,
      business: `${countryName} Unternehmen Startups Finanzierung`,
      environment: `${countryName} erneuerbare Energien Politik`,
      health: `${countryName} medizinische Forschung Gesundheit`
    },
    it: {
      technology: `${countryName} tecnologia innovazione notizie`,
      business: `${countryName} imprese startup finanziamenti`,
      environment: `${countryName} energie rinnovabili politiche`,
      health: `${countryName} ricerca medica salute`
    },
    pt: {
      technology: `${countryName} tecnologia inovação notícias`,
      business: `${countryName} empresas startups financiamento`,
      environment: `${countryName} energias renováveis políticas`,
      health: `${countryName} pesquisa médica saúde`
    },
    ru: {
      technology: `${countryName} технологии инновации новости`,
      business: `${countryName} бизнес стартапы финансирование`,
      environment: `${countryName} возобновляемая энергия политика`,
      health: `${countryName} медицинские исследования здоровье`
    },
    ja: {
      technology: `${countryName} テクノロジー イノベーション ニュース`,
      business: `${countryName} ビジネス スタートアップ 資金調達`,
      environment: `${countryName} 再生可能エネルギー 政策`,
      health: `${countryName} 医学研究 健康`
    },
    ko: {
      technology: `${countryName} 기술 혁신 뉴스`,
      business: `${countryName} 비즈니스 스타트업 자금조달`,
      environment: `${countryName} 재생에너지 정책`,
      health: `${countryName} 의학연구 건강`
    },
    zh: {
      technology: `${countryName} 技术创新新闻`,
      business: `${countryName} 商业初创企业融资`,
      environment: `${countryName} 可再生能源政策`,
      health: `${countryName} 医学研究健康`
    },
    nl: {
      technology: `${countryName} technologie innovatie nieuws`,
      business: `${countryName} bedrijven startups financiering`,
      environment: `${countryName} hernieuwbare energie beleid`,
      health: `${countryName} medisch onderzoek gezondheid`
    },
    ar: {
      technology: `${countryName} تكنولوجيا ابتكار أخبار`,
      business: `${countryName} شركات ناشئة تمويل`,
      environment: `${countryName} طاقة متجددة سياسات`,
      health: `${countryName} بحوث طبية صحة`
    }
  }

  // Fallback to English if language not supported
  const fallbackQueries = {
    technology: `${countryName} technology innovation news`,
    business: `${countryName} business startup funding`,
    environment: `${countryName} renewable energy policies`,
    health: `${countryName} medical research healthcare`
  }

  return queries[language] || fallbackQueries
}

export {
  getCountryFromLocale,
  getCountryLanguage,
  getTrendingTopics,
  type NewsItem
}
