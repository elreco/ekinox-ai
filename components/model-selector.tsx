'use client'

import { useEffect, useState } from 'react'
import * as FaIcons from 'react-icons/fa'
import Link from 'next/link'

import { Check, ChevronsUpDown, Crown, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

import { useSubscription } from '@/lib/hooks/use-subscription'
import { Model } from '@/lib/types/models'
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { isReasoningModel } from '@/lib/utils/registry'

import { createModelId } from '../lib/utils'

import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface ModelSelectorProps {
  models: Model[]
}

export function ModelSelector({ models }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const { isSubscribed } = useSubscription()

  const enabledModels = models.filter(model => model.enabled)

  useEffect(() => {
    if (models.length === 0) return // Wait for models to load

    const savedModel = getCookie('selectedModel')
    if (savedModel) {
      try {
        const model = JSON.parse(savedModel) as Model
        const modelStillExists = enabledModels.find(
          m => createModelId(m) === createModelId(model)
        )
        // Only set if user has access to this model
        if (modelStillExists && (isSubscribed || model.free)) {
          setValue(createModelId(model))
          return
        }
      } catch (e) {
        console.error('Failed to parse saved model:', e)
      }
    }

    // Set default to "Speed" model if no valid saved model
    const speedModel = enabledModels.find(model => model.name === 'Speed')
    if (speedModel) {
      const speedId = createModelId(speedModel)
      setValue(speedId)
      setCookie('selectedModel', JSON.stringify(speedModel))
    }
  }, [models, enabledModels, isSubscribed])

  const handleModelSelect = (id: string, model: Model) => {
    // Check if user can select this model
    if (!isSubscribed && !model.free) {
      toast.error(
        'This model requires a Pro subscription. Upgrade to access all models!'
      )
      return
    }

    const newValue = id === value ? '' : id
    setValue(newValue)

    const selectedModel = enabledModels.find(
      model => createModelId(model) === newValue
    )
    if (selectedModel) {
      setCookie('selectedModel', JSON.stringify(selectedModel))
    } else {
      setCookie('selectedModel', '')
    }

    setOpen(false)
  }

  const selectedModel = enabledModels.find(
    model => createModelId(model) === value
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="text-xs sm:text-sm rounded-full shadow-none focus:ring-0 min-w-0 px-2 py-1 sm:px-3 sm:py-2 h-7 sm:h-auto"
        >
          {selectedModel ? (
            <div className="flex items-center space-x-1">
              {(() => {
                const IconComponent = selectedModel.icon
                  ? (FaIcons as any)[selectedModel.icon]
                  : null
                return (
                  IconComponent && (
                    <IconComponent
                      className="h-3 w-3 sm:h-4 sm:w-4"
                      style={{ color: selectedModel.color || '#6B7280' }}
                    />
                  )
                )
              })()}
              <span className="text-xs font-medium truncate hidden sm:inline">
                {selectedModel.name}
              </span>
              {isReasoningModel(selectedModel.id) && (
                <Lightbulb
                  size={10}
                  className="sm:size-3 text-accent-blue-foreground"
                />
              )}
            </div>
          ) : (
            'Select model'
          )}
          <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {enabledModels.map(model => {
                const modelId = createModelId(model)
                const IconComponent = model.icon
                  ? (FaIcons as any)[model.icon]
                  : null
                const isProModel = !model.free
                const canSelect = isSubscribed || model.free

                return (
                  <CommandItem
                    key={modelId}
                    value={modelId}
                    onSelect={() => handleModelSelect(modelId, model)}
                    className={`flex justify-between items-start py-3 px-2 ${
                      canSelect
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-60'
                    }`}
                    disabled={!canSelect}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center flex-shrink-0">
                        {IconComponent && (
                          <IconComponent
                            className="h-4 w-4 mr-2"
                            style={{ color: model.color || '#6B7280' }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium">
                            {model.name}
                          </span>
                          {isProModel && (
                            <Crown size={12} className="text-amber-500" />
                          )}
                          {isReasoningModel(model.id) && (
                            <Lightbulb
                              size={12}
                              className="text-accent-blue-foreground"
                            />
                          )}
                        </div>
                        {model.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {model.description}
                          </p>
                        )}
                        {isProModel && !isSubscribed && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">
                            Pro subscription required
                          </p>
                        )}
                      </div>
                    </div>
                    <Check
                      className={`h-4 w-4 flex-shrink-0 ml-2 ${
                        value === modelId ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {!isSubscribed && (
              <div className="border-t p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold">
                    Unlock All Models
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Upgrade to Pro for access to all premium AI models including
                  Quality and Reasoning.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/pricing">Upgrade to Pro - $20/month</Link>
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
