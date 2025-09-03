'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  FilterX,
  Globe,
  Grid3X3,
  List,
  MapPin,
  Mic,
  Microscope,
  Play,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Video
} from 'lucide-react'

import { type MediaItem } from '@/lib/services/media-service'
import { cn, formatTimeAgo } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

interface DiscoverPageProps {
  media: MediaItem[]
  userCountry?: string
}

type ViewMode = 'grid' | 'list'
type SortBy = 'recency' | 'relevance'
type CountryFilter = 'all' | 'worldwide' | 'local'

const CATEGORIES = [
  { id: 'all', label: 'All Categories', color: 'bg-gray-100 text-gray-800' },
  { id: 'Technology', label: 'Technology', color: 'bg-blue-100 text-blue-800' },
  { id: 'Business', label: 'Business', color: 'bg-green-100 text-green-800' },
  { id: 'Science', label: 'Science', color: 'bg-purple-100 text-purple-800' },
  { id: 'Health', label: 'Health', color: 'bg-red-100 text-red-800' },
  {
    id: 'Environment',
    label: 'Environment',
    color: 'bg-emerald-100 text-emerald-800'
  },
  { id: 'Security', label: 'Security', color: 'bg-orange-100 text-orange-800' },
  { id: 'Finance', label: 'Finance', color: 'bg-yellow-100 text-yellow-800' }
]

const MEDIA_TYPES = [
  {
    id: 'all',
    label: 'All Media',
    icon: Globe,
    color: 'bg-gray-100 text-gray-800'
  },
  {
    id: 'article',
    label: 'Articles',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'research',
    label: 'Research',
    icon: Microscope,
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'video',
    label: 'Videos',
    icon: Video,
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'podcast',
    label: 'Podcasts',
    icon: Mic,
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'blog',
    label: 'Blogs',
    icon: BookOpen,
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'report',
    label: 'Reports',
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-800'
  }
]

export function DiscoverPage({ media, userCountry }: DiscoverPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categories')?.split(',') || ['all']
  )
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(
    searchParams.get('mediaTypes')?.split(',') || ['all']
  )
  const [countryFilter, setCountryFilter] = useState<CountryFilter>(
    (searchParams.get('country') as CountryFilter) || 'all'
  )
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get('sort') as SortBy) || 'relevance'
  )
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'grid'
  )
  const [showFilters, setShowFilters] = useState(false)

  // Function to update URL with current filter state
  const updateURL = (params: {
    search?: string
    categories?: string[]
    mediaTypes?: string[]
    country?: CountryFilter
    sort?: SortBy
    view?: ViewMode
  }) => {
    const url = new URL(window.location.href)

    // Update search param
    if (params.search !== undefined) {
      if (params.search) {
        url.searchParams.set('search', params.search)
      } else {
        url.searchParams.delete('search')
      }
    }

    // Update categories param
    if (params.categories !== undefined) {
      if (params.categories.length > 0 && !params.categories.includes('all')) {
        url.searchParams.set('categories', params.categories.join(','))
      } else {
        url.searchParams.delete('categories')
      }
    }

    // Update media types param
    if (params.mediaTypes !== undefined) {
      if (params.mediaTypes.length > 0 && !params.mediaTypes.includes('all')) {
        url.searchParams.set('mediaTypes', params.mediaTypes.join(','))
      } else {
        url.searchParams.delete('mediaTypes')
      }
    }

    // Update country param
    if (params.country !== undefined) {
      if (params.country !== 'all') {
        url.searchParams.set('country', params.country)
      } else {
        url.searchParams.delete('country')
      }
    }

    // Update sort param
    if (params.sort !== undefined) {
      if (params.sort !== 'relevance') {
        url.searchParams.set('sort', params.sort)
      } else {
        url.searchParams.delete('sort')
      }
    }

    // Update view param
    if (params.view !== undefined) {
      if (params.view !== 'grid') {
        url.searchParams.set('view', params.view)
      } else {
        url.searchParams.delete('view')
      }
    }

    // Update URL without page refresh
    window.history.replaceState({}, '', url.toString())
  }

  // Function to create a chat from a media item
  const handleMediaClick = (mediaItem: MediaItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Create a comprehensive query based on media type
    const mediaTypeQueries = {
      article: `Tell me more about: "${mediaItem.title}". Please provide detailed insights, context, and recent developments about this topic.`,
      research: `Explain this research: "${mediaItem.title}". Help me understand the methodology, key findings, and implications.`,
      video: `Summarize and discuss: "${mediaItem.title}". What are the main points and takeaways?`,
      podcast: `What are the key insights from: "${mediaItem.title}"? Please provide a summary and analysis.`,
      blog: `Analyze this blog post: "${mediaItem.title}". What are the main arguments and insights?`,
      report: `Break down this report: "${mediaItem.title}". What are the key findings and business implications?`
    }

    const query =
      mediaTypeQueries[mediaItem.mediaType] ||
      `Tell me more about: "${mediaItem.title}".`

    // Navigate to search page with the query
    const encodedQuery = encodeURIComponent(query)
    router.push(`/search?q=${encodedQuery}`)
  }

  // Filter and sort media
  const filteredMedia = useMemo(() => {
    let filtered = media

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.mediaType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags?.some(tag =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    }

    // Category filter
    if (!selectedCategories.includes('all')) {
      filtered = filtered.filter(item =>
        selectedCategories.includes(item.category)
      )
    }

    // Media type filter
    if (!selectedMediaTypes.includes('all')) {
      filtered = filtered.filter(item =>
        selectedMediaTypes.includes(item.mediaType)
      )
    }

    // Country filter
    if (countryFilter !== 'all') {
      if (countryFilter === 'worldwide') {
        filtered = filtered.filter(item => item.country === 'worldwide')
      } else if (countryFilter === 'local') {
        filtered = filtered.filter(item => item.country !== 'worldwide')
      }
    }

    // Sort
    switch (sortBy) {
      case 'recency':
        filtered.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        break
      case 'relevance':
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0))
        break
    }

    return filtered
  }, [
    media,
    searchQuery,
    selectedCategories,
    selectedMediaTypes,
    countryFilter,
    sortBy
  ])

  const handleCategoryToggle = (categoryId: string) => {
    if (categoryId === 'all') {
      const newCategories = ['all']
      setSelectedCategories(newCategories)
      updateURL({ categories: newCategories })
    } else {
      setSelectedCategories(prev => {
        const categories = prev.includes('all')
          ? []
          : prev.filter(id => id !== 'all')
        const newCategories = prev.includes(categoryId)
          ? categories.filter(id => id !== categoryId)
          : [...categories, categoryId]

        const finalCategories =
          newCategories.length === 0 ? ['all'] : newCategories
        updateURL({ categories: finalCategories })
        return finalCategories
      })
    }
  }

  const handleMediaTypeToggle = (mediaTypeId: string) => {
    if (mediaTypeId === 'all') {
      const newMediaTypes = ['all']
      setSelectedMediaTypes(newMediaTypes)
      updateURL({ mediaTypes: newMediaTypes })
    } else {
      setSelectedMediaTypes(prev => {
        const mediaTypes = prev.includes('all')
          ? []
          : prev.filter(id => id !== 'all')
        const newMediaTypes = prev.includes(mediaTypeId)
          ? mediaTypes.filter(id => id !== mediaTypeId)
          : [...mediaTypes, mediaTypeId]

        const finalMediaTypes =
          newMediaTypes.length === 0 ? ['all'] : newMediaTypes
        updateURL({ mediaTypes: finalMediaTypes })
        return finalMediaTypes
      })
    }
  }

  const getCategoryStats = () => {
    const stats = media.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    return stats
  }

  const getMediaTypeStats = () => {
    const stats = media.reduce(
      (acc, item) => {
        acc[item.mediaType] = (acc[item.mediaType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    return stats
  }

  const categoryStats = getCategoryStats()
  const mediaTypeStats = getMediaTypeStats()

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery !== '' ||
    !selectedCategories.includes('all') ||
    !selectedMediaTypes.includes('all') ||
    countryFilter !== 'all' ||
    sortBy !== 'relevance' ||
    viewMode !== 'grid'

  // Function to reset all filters
  const resetAllFilters = () => {
    setSearchQuery('')
    setSelectedCategories(['all'])
    setSelectedMediaTypes(['all'])
    setCountryFilter('all')
    setSortBy('relevance')
    setViewMode('grid')
    // Clear all URL params
    const url = new URL(window.location.href)
    url.search = ''
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="min-h-screen">
        {/* Enhanced Hero Section */}
        <div className="border-b bg-gradient-to-br from-background via-background to-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-2 rounded-full bg-primary/10 px-6 py-3">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Discover
                  </span>
                </div>
              </div>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">
                Discover All Media
              </h1>
              <p className="mx-auto max-w-3xl text-xl text-muted-foreground mb-8">
                Explore trending articles, research papers, videos, podcasts,
                and reports from trusted sources worldwide. Start intelligent
                conversations with AI about any type of content.
              </p>

              {/* Quick Stats */}
              <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{media.length} Fresh Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>{Object.keys(categoryStats).length} Categories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Updated hourly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters & Search */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content, topics, or categories..."
                  value={searchQuery}
                  onChange={e => {
                    const value = e.target.value
                    setSearchQuery(value)
                    updateURL({ search: value })
                  }}
                  className="pl-10"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-3">
                {/* Country Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Globe className="h-4 w-4" />
                      {countryFilter === 'all' && 'All News'}
                      {countryFilter === 'worldwide' && 'Worldwide'}
                      {countryFilter === 'local' && 'Local'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setCountryFilter('all')
                        updateURL({ country: 'all' })
                      }}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      All Content
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setCountryFilter('worldwide')
                        updateURL({ country: 'worldwide' })
                      }}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Worldwide
                    </DropdownMenuItem>
                    {userCountry && userCountry !== 'worldwide' && (
                      <DropdownMenuItem
                        onClick={() => {
                          setCountryFilter('local')
                          updateURL({ country: 'local' })
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Local Content
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Media Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Video className="h-4 w-4" />
                      Media Types
                      {selectedMediaTypes.length > 0 &&
                        !selectedMediaTypes.includes('all') && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedMediaTypes.length}
                          </Badge>
                        )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by Media Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {MEDIA_TYPES.map(mediaType => (
                      <DropdownMenuCheckboxItem
                        key={mediaType.id}
                        checked={selectedMediaTypes.includes(mediaType.id)}
                        onCheckedChange={() =>
                          handleMediaTypeToggle(mediaType.id)
                        }
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <mediaType.icon className="h-4 w-4" />
                          <span>{mediaType.label}</span>
                        </div>
                        {mediaType.id !== 'all' && (
                          <Badge variant="outline" className="text-xs">
                            {mediaTypeStats[mediaType.id] || 0}
                          </Badge>
                        )}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Category Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Categories
                      {selectedCategories.length > 0 &&
                        !selectedCategories.includes('all') && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedCategories.length}
                          </Badge>
                        )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {CATEGORIES.map(category => (
                      <DropdownMenuCheckboxItem
                        key={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() =>
                          handleCategoryToggle(category.id)
                        }
                        className="flex items-center justify-between"
                      >
                        <span>{category.label}</span>
                        {category.id !== 'all' && (
                          <Badge variant="outline" className="text-xs">
                            {categoryStats[category.id] || 0}
                          </Badge>
                        )}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy('relevance')
                        updateURL({ sort: 'relevance' })
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      By Relevance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy('recency')
                        updateURL({ sort: 'recency' })
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Most Recent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode Toggle */}
                <div className="flex rounded-lg border">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('grid')
                      updateURL({ view: 'grid' })
                    }}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('list')
                      updateURL({ view: 'list' })
                    }}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllFilters}
                    className="gap-2 text-muted-foreground hover:text-foreground border-dashed"
                  >
                    <FilterX className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {((selectedCategories.length > 0 &&
              !selectedCategories.includes('all')) ||
              (selectedMediaTypes.length > 0 &&
                !selectedMediaTypes.includes('all')) ||
              searchQuery) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        updateURL({ search: '' })
                      }}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedMediaTypes
                  .filter(id => id !== 'all')
                  .map(mediaTypeId => {
                    const mediaType = MEDIA_TYPES.find(
                      t => t.id === mediaTypeId
                    )
                    return (
                      mediaType && (
                        <Badge
                          key={mediaTypeId}
                          variant="secondary"
                          className="gap-1"
                        >
                          <mediaType.icon className="h-3 w-3 mr-1" />
                          {mediaType.label}
                          <button
                            onClick={() => {
                              handleMediaTypeToggle(mediaTypeId)
                            }}
                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    )
                  })}
                {selectedCategories
                  .filter(id => id !== 'all')
                  .map(categoryId => {
                    const category = CATEGORIES.find(c => c.id === categoryId)
                    return (
                      category && (
                        <Badge
                          key={categoryId}
                          variant="secondary"
                          className="gap-1"
                        >
                          {category.label}
                          <button
                            onClick={() => {
                              handleCategoryToggle(categoryId)
                            }}
                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredMedia.length} of {media.length} items
            </span>
            <span>
              Sorted by {sortBy === 'relevance' ? 'relevance' : 'most recent'}
            </span>
          </div>
        </div>

        {/* Enhanced Articles Grid/List */}
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {media.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No content available
              </h3>
              <p className="text-muted-foreground mb-4">
                Unable to fetch content at the moment. Please check your API
                configuration.
              </p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filter settings.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategories(['all'])
                  setSelectedMediaTypes(['all'])
                  setCountryFilter('all')
                  // Clear all URL params
                  const url = new URL(window.location.href)
                  url.search = ''
                  window.history.replaceState({}, '', url.toString())
                }}
                variant="outline"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
                  : 'space-y-6'
              )}
            >
              {filteredMedia.map(item => (
                <Card
                  key={item.id}
                  className={cn(
                    'group hover:shadow-xl border-0 bg-card/50 backdrop-blur transition-all duration-300 hover:bg-card/80 overflow-hidden cursor-pointer',
                    viewMode === 'list'
                      ? 'flex flex-row h-auto min-h-[200px]'
                      : 'flex flex-col h-full'
                  )}
                  onClick={e => handleMediaClick(item, e)}
                >
                  {/* Image Section */}
                  <div
                    className={cn(
                      'relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted',
                      viewMode === 'grid'
                        ? 'aspect-video w-full'
                        : 'w-full sm:w-56 aspect-video sm:aspect-[4/3] flex-shrink-0'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl || '/images/placeholder-image.png'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={e => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/placeholder-image.png'
                      }}
                    />

                    {/* Overlay badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Source badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs font-medium">
                        {item.source}
                      </Badge>
                    </div>

                    {/* Featured badge */}
                    {item.score && item.score > 0.9 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-amber-500/90 backdrop-blur-sm text-black border-amber-400/50 text-xs font-medium">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Country indicator */}
                    {item.country && item.country !== 'worldwide' && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-blue-500/20 backdrop-blur-sm text-white border-blue-400/30 text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          Local
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div
                    className={cn(
                      'flex flex-col flex-1',
                      viewMode === 'list' ? 'p-4 sm:p-6' : 'p-6'
                    )}
                  >
                    {/* Media Type and Category Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-xs font-medium px-2 py-1"
                      >
                        {(() => {
                          const mediaType = MEDIA_TYPES.find(
                            t => t.id === item.mediaType
                          )
                          const IconComponent = mediaType?.icon
                          return (
                            <div className="flex items-center gap-1">
                              {IconComponent && (
                                <IconComponent className="h-3 w-3" />
                              )}
                              <span>{mediaType?.label || item.mediaType}</span>
                            </div>
                          )
                        })()}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs font-medium',
                          CATEGORIES.find(c => c.id === item.category)?.color ||
                            'bg-gray-100 text-gray-800'
                        )}
                      >
                        {item.category}
                      </Badge>
                    </div>

                    {/* Title and Description */}
                    <div className="flex-1 mb-4">
                      <h3
                        className={cn(
                          'font-bold text-foreground group-hover:text-primary transition-colors mb-2 leading-tight',
                          viewMode === 'list'
                            ? 'text-base sm:text-lg line-clamp-2'
                            : 'text-lg line-clamp-3'
                        )}
                      >
                        {item.title}
                      </h3>
                      <p
                        className={cn(
                          'text-muted-foreground text-sm leading-relaxed',
                          viewMode === 'list'
                            ? 'line-clamp-2 sm:line-clamp-3'
                            : 'line-clamp-3'
                        )}
                      >
                        {item.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags
                          .slice(0, viewMode === 'list' ? 3 : 4)
                          .map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs px-2 py-1 rounded-full border-muted-foreground/20"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    )}

                    {/* Additional Media Info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      {item.duration && (
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {item.duration}
                        </div>
                      )}
                      {item.pageCount && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {item.pageCount} pages
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.publishedAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        className="flex-1 h-9 text-sm font-medium bg-primary hover:bg-primary/90"
                        onClick={e => {
                          e.stopPropagation()
                          handleMediaClick(item, e)
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Discuss with AI
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 border-muted-foreground/20"
                        onClick={e => {
                          e.stopPropagation()
                          window.open(item.url, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
