'use client'

import { useEffect, useState } from 'react'
import * as FaIcons from 'react-icons/fa'

import { Check, ChevronsUpDown, Lightbulb } from 'lucide-react'

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

  useEffect(() => {
    if (models.length === 0) return // Wait for models to load

    const savedModel = getCookie('selectedModel')
    if (savedModel) {
      try {
        const model = JSON.parse(savedModel) as Model
        const modelStillExists = models.find(
          m => createModelId(m) === createModelId(model)
        )
        if (modelStillExists) {
          setValue(createModelId(model))
          return
        }
      } catch (e) {
        console.error('Failed to parse saved model:', e)
      }
    }

    // Set default to "Speed" model if no valid saved model
    const speedModel = models.find(
      model => model.name === 'Speed' && model.enabled
    )
    if (speedModel) {
      const speedId = createModelId(speedModel)
      setValue(speedId)
      setCookie('selectedModel', JSON.stringify(speedModel))
    }
  }, [models])

  const handleModelSelect = (id: string) => {
    const newValue = id === value ? '' : id
    setValue(newValue)

    const selectedModel = models.find(
      model => createModelId(model) === newValue
    )
    if (selectedModel) {
      setCookie('selectedModel', JSON.stringify(selectedModel))
    } else {
      setCookie('selectedModel', '')
    }

    setOpen(false)
  }

  const selectedModel = models.find(model => createModelId(model) === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="text-sm rounded-full shadow-none focus:ring-0"
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
                      className="h-4 w-4"
                      style={{ color: selectedModel.color || '#6B7280' }}
                    />
                  )
                )
              })()}
              <span className="text-xs font-medium">{selectedModel.name}</span>
              {isReasoningModel(selectedModel.id) && (
                <Lightbulb size={12} className="text-accent-blue-foreground" />
              )}
            </div>
          ) : (
            'Select model'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models
                .filter(model => model.enabled)
                .map(model => {
                  const modelId = createModelId(model)
                  const IconComponent = model.icon
                    ? (FaIcons as any)[model.icon]
                    : null
                  return (
                    <CommandItem
                      key={modelId}
                      value={modelId}
                      onSelect={handleModelSelect}
                      className="flex justify-between items-start py-3 px-2 cursor-pointer"
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
