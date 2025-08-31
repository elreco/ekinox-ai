import { generateId } from 'ai'

import { getCachedSuggestions } from '@/lib/cache/suggestions-cache'
import { getModels } from '@/lib/config/models'

import { Chat } from '@/components/chat'

export default async function Page() {
  const id = generateId()
  const models = await getModels()
  const suggestions = await getCachedSuggestions()
  return <Chat id={id} models={models} suggestions={suggestions} />
}
