import { SearchResults } from '@/lib/types'

// Country name mapping
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom', 
    CA: 'Canada',
    AU: 'Australia',
    FR: 'France',
    DE: 'Germany',
    ES: 'Spain',
    IT: 'Italy',
    BR: 'Brazil',
    MX: 'Mexico',
    AR: 'Argentina',
    JP: 'Japan',
    KR: 'South Korea',
    CN: 'China',
    IN: 'India',
    RU: 'Russia',
    SA: 'Saudi Arabia',
    AE: 'UAE',
    NL: 'Netherlands',
    BE: 'Belgium',
    CH: 'Switzerland',
    AT: 'Austria',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
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
    AR: 'es',
    SA: 'ar',
    AE: 'ar'
  }

  return countryToLanguage[countryCode] || 'en'
}

export type MediaType =
  | 'article'
  | 'video'
  | 'research'
  | 'podcast'
  | 'report'
  | 'blog'

export interface MediaItem {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  imageUrl?: string
  category: string
  mediaType: MediaType
  score?: number
  author?: string
  tags?: string[]
  country?: string
  duration?: string // For videos/podcasts
  pageCount?: number // For documents/reports
}

interface MediaQuery {
  query: string
  category: string
  tags: string[]
  mediaType: MediaType
  domains?: string[]
}

const MEDIA_QUERIES: Record<MediaType, MediaQuery[]> = {
  article: [
    {
      query: 'trending news headlines latest',
      category: 'General',
      tags: ['News', 'Trending'],
      mediaType: 'article'
    },
    {
      query: 'breaking news worldwide',
      category: 'General',
      tags: ['Breaking', 'News'],
      mediaType: 'article'
    }
  ],
  research: [
    {
      query: 'research papers latest publications',
      category: 'General',
      tags: ['Research', 'Academic', 'Papers'],
      mediaType: 'research',
      domains: ['arxiv.org', 'scholar.google.com', 'nature.com', 'science.org']
    }
  ],
  video: [
    {
      query: 'trending videos latest',
      category: 'General',
      tags: ['Video', 'Trending'],
      mediaType: 'video'
    }
  ],
  podcast: [
    {
      query: 'trending podcasts latest episodes',
      category: 'General',
      tags: ['Podcast', 'Trending'],
      mediaType: 'podcast'
    }
  ],
  blog: [
    {
      query: 'trending blogs latest posts',
      category: 'General',
      tags: ['Blog', 'Trending'],
      mediaType: 'blog',
      domains: ['medium.com', 'dev.to', 'hashnode.com', 'substack.com']
    }
  ],
  report: [
    {
      query: 'latest reports analysis insights',
      category: 'General',
      tags: ['Report', 'Analysis'],
      mediaType: 'report',
      domains: ['mckinsey.com', 'pwc.com', 'deloitte.com', 'statista.com']
    }
  ]
}

// Use Tavily API to get diverse media content
async function getTrendingMedia(
  mediaTypes: MediaType[] = [
    'article',
    'research',
    'video',
    'podcast',
    'blog',
    'report'
  ],
  userCountry?: string,
  userLocale?: string
): Promise<MediaItem[]> {
  const tavilyApiKey = process.env.TAVILY_API_KEY

  console.log('Tavily API Key status:', tavilyApiKey ? 'Found' : 'Not found')

  if (!tavilyApiKey) {
    console.warn('Tavily API key not found, returning empty array')
    return []
  }

  try {
    // Build queries based on selected media types
    const selectedQueries = mediaTypes.flatMap(type =>
      MEDIA_QUERIES[type] ? MEDIA_QUERIES[type] : []
    )

    // Add country-specific queries if user country is provided
    let localQueries: MediaQuery[] = []
    if (userCountry && userCountry !== 'worldwide') {
      const countryName = getCountryName(userCountry)
      const language = getCountryLanguage(userCountry, userLocale)
      const localizedQueries = getLocalizedQueries(countryName, language)

      localQueries = [
        {
          query: localizedQueries.technology,
          category: 'Technology',
          tags: ['Local Tech', countryName],
          mediaType: 'article'
        },
        {
          query: localizedQueries.business,
          category: 'Business',
          tags: ['Local Business', countryName],
          mediaType: 'article'
        },
        {
          query: localizedQueries.research,
          category: 'Science',
          tags: ['Local Research', countryName],
          mediaType: 'research'
        }
      ]
    }

    const allQueries = [...selectedQueries, ...localQueries]

    const mediaPromises = allQueries.map(async queryObj => {
      try {
        const searchBody: any = {
          api_key: tavilyApiKey,
          query: queryObj.query,
          search_depth: 'advanced',
          include_answer: false,
          include_images: true,
          include_raw_content: false,
          max_results: 3,
          days: 7 // Limit to content from the last 7 days
        }

        // Only use domain filtering for research and reports to ensure quality
        if (
          queryObj.domains &&
          (queryObj.mediaType === 'research' || queryObj.mediaType === 'report')
        ) {
          searchBody.include_domains = queryObj.domains
        }
        // For other media types, let Tavily search broadly for better results

        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchBody)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Tavily API error ${response.status}: ${errorText}`)
          throw new Error(`Tavily API error: ${response.status}`)
        }

        const data: SearchResults = await response.json()

        // Debug logging
        console.log(
          `Query "${queryObj.query}" returned ${data.results?.length || 0} results`
        )

        return data.results.map((result, index) => ({
          id: `media-${queryObj.mediaType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: result.title,
          description:
            result.content.length > 200
              ? result.content.substring(0, 200) + '...'
              : result.content,
          url: result.url,
          source: extractDomain(result.url),
          publishedAt: new Date(
            Date.now() - (index + Math.random() * 0.5) * 60 * 60 * 1000
          ),
          category: queryObj.category,
          mediaType: queryObj.mediaType,
          tags: queryObj.tags,
          duration:
            queryObj.mediaType === 'video'
              ? getEstimatedDuration(queryObj.mediaType)
              : undefined,
          pageCount:
            queryObj.mediaType === 'report'
              ? Math.floor(Math.random() * 50) + 10
              : undefined,
          score: Math.random() * 0.3 + 0.7,
          country: localQueries.includes(queryObj)
            ? userCountry || 'worldwide'
            : 'worldwide',
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
          `Error fetching media for query "${queryObj.query}":`,
          error
        )
        return []
      }
    })

    const results = await Promise.all(mediaPromises)
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
      .slice(0, 32) // Increase limit for more variety

    if (sortedResults.length === 0) {
      console.warn('No valid media results from Tavily API')
      return [] // Return empty array instead of fake data
    }

    console.log(`Successfully fetched ${sortedResults.length} media items`)
    return sortedResults
  } catch (error) {
    console.error('Error fetching trending media:', error)
    return [] // Return empty array instead of fake data
  }
}

function getDefaultDomainsForMediaType(mediaType: MediaType): string[] {
  const domainMap: Record<MediaType, string[]> = {
    article: [
      'techcrunch.com',
      'wired.com',
      'theverge.com',
      'arstechnica.com',
      'reuters.com',
      'bbc.com',
      'nytimes.com',
      'washingtonpost.com'
    ],
    research: [
      'arxiv.org',
      'nature.com',
      'science.org',
      'scholar.google.com',
      'pubmed.ncbi.nlm.nih.gov',
      'ieee.org',
      'acm.org'
    ],
    video: ['youtube.com', 'vimeo.com', 'ted.com'],
    podcast: ['spotify.com', 'apple.com', 'soundcloud.com', 'anchor.fm'],
    blog: ['medium.com', 'dev.to', 'hashnode.com', 'substack.com', 'ghost.org'],
    report: [
      'mckinsey.com',
      'pwc.com',
      'deloitte.com',
      'bcg.com',
      'gartner.com',
      'forrester.com',
      'statista.com'
    ]
  }

  return domainMap[mediaType] || []
}

function getEstimatedDuration(mediaType: MediaType): string | undefined {
  if (mediaType === 'video') {
    const minutes = Math.floor(Math.random() * 30) + 5 // 5-35 minutes
    return `${minutes}:${Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, '0')}`
  }
  if (mediaType === 'podcast') {
    const minutes = Math.floor(Math.random() * 60) + 15 // 15-75 minutes
    return `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}:00`
  }
  return undefined
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0] || domain
  } catch {
    return 'Unknown'
  }
}

function getLocalizedQueries(countryName: string, language: string) {
  const queries: Record<string, Record<string, string>> = {
    fr: {
      technology: `${countryName} technologie innovation startups actualités`,
      business: `${countryName} entreprises économie marché nouvelles`,
      research: `${countryName} recherche universitaire académique`
    },
    es: {
      technology: `${countryName} tecnología innovación startups noticias`,
      business: `${countryName} empresas economía mercado noticias`,
      research: `${countryName} investigación universitaria académica`
    },
    de: {
      technology: `${countryName} Technologie Innovation Startups Nachrichten`,
      business: `${countryName} Unternehmen Wirtschaft Markt Nachrichten`,
      research: `${countryName} Forschung Universität Akademie`
    },
    it: {
      technology: `${countryName} tecnologia innovazione startup notizie`,
      business: `${countryName} imprese economia mercato notizie`,
      research: `${countryName} ricerca universitaria accademica`
    },
    pt: {
      technology: `${countryName} tecnologia inovação startups notícias`,
      business: `${countryName} empresas economia mercado notícias`,
      research: `${countryName} pesquisa universitária acadêmica`
    },
    ru: {
      technology: `${countryName} технологии инновации стартапы новости`,
      business: `${countryName} бизнес экономика рынок новости`,
      research: `${countryName} исследования университет академический`
    },
    ja: {
      technology: `${countryName} テクノロジー イノベーション スタートアップ ニュース`,
      business: `${countryName} ビジネス 経済 市場 ニュース`,
      research: `${countryName} 研究 大学 学術`
    },
    ko: {
      technology: `${countryName} 기술 혁신 스타트업 뉴스`,
      business: `${countryName} 비즈니스 경제 시장 뉴스`,
      research: `${countryName} 연구 대학 학술`
    },
    zh: {
      technology: `${countryName} 技术创新创业公司新闻`,
      business: `${countryName} 商业经济市场新闻`,
      research: `${countryName} 研究大学学术`
    },
    nl: {
      technology: `${countryName} technologie innovatie startups nieuws`,
      business: `${countryName} bedrijven economie markt nieuws`,
      research: `${countryName} onderzoek universiteit academisch`
    },
    ar: {
      technology: `${countryName} تكنولوجيا ابتكار شركات ناشئة أخبار`,
      business: `${countryName} أعمال اقتصاد سوق أخبار`,
      research: `${countryName} بحوث جامعة أكاديمي`
    }
  }

  // Fallback to English if language not supported
  const fallbackQueries = {
    technology: `${countryName} technology innovation startups news`,
    business: `${countryName} business economy market news`,
    research: `${countryName} research university academic`
  }

  return queries[language] || fallbackQueries
}

export { getCountryFromLocale, getCountryLanguage,getCountryName, getTrendingMedia }
