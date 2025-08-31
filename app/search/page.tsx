import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { generateId } from 'ai'

import { getModels } from '@/lib/config/models'

import { Chat } from '@/components/chat'

export async function generateMetadata(props: {
  searchParams: Promise<{ q: string }>
}): Promise<Metadata> {
  const { q } = await props.searchParams
  
  if (!q) {
    return {
      title: 'AI Search - Get Intelligent Answers with Sources',
      description: 'Ask questions and get comprehensive answers with sources from across the web. Powered by advanced AI for accurate, real-time information.',
    }
  }

  const query = decodeURIComponent(q)
  const truncatedQuery = query.length > 50 ? `${query.substring(0, 50)}...` : query
  
  return {
    title: `${truncatedQuery} | AI Search Results`,
    description: `Get intelligent AI-powered answers for "${query}" with comprehensive sources and real-time information.`,
    openGraph: {
      title: `AI Search: ${truncatedQuery}`,
      description: `Get intelligent answers for "${query}" with comprehensive sources.`,
      url: `https://www.ekinox.app/search?q=${encodeURIComponent(query)}`,
    },
    twitter: {
      title: `AI Search: ${truncatedQuery}`,
      description: `Get intelligent answers for "${query}" with comprehensive sources.`,
    },
  }
}

export const maxDuration = 60

export default async function SearchPage(props: {
  searchParams: Promise<{ q: string }>
}) {
  const { q } = await props.searchParams
  if (!q) {
    redirect('/')
  }

  const id = generateId()
  const models = await getModels()
  return <Chat id={id} query={q} models={models} />
}
