'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Mic, MicOff } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from './button'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}

export function VoiceInput({
  onTranscript,
  disabled,
  className
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      (window as Window).SpeechRecognition ||
      (window as Window).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = navigator.language || 'en-US'

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started')
        setIsListening(true)
      }

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended')
        setIsListening(false)
      }

      recognition.onabort = () => {
        console.log('🎤 Speech recognition aborted')
        setIsListening(false)
      }

      recognition.onresult = (event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent
        let finalTranscript = ''
        let interimTranscript = ''

        for (
          let i = speechEvent.resultIndex;
          i < speechEvent.results.length;
          i++
        ) {
          const transcript = speechEvent.results[i][0].transcript
          if (speechEvent.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)

        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied', {
            description: 'Please allow microphone access to use voice input.'
          })
        } else if (event.error === 'network') {
          toast.error('Network error', {
            description: 'Speech recognition requires an internet connection.'
          })
        } else {
          toast.error('Speech recognition failed', {
            description: 'Please try again.'
          })
        }
      }
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript, isListening])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return

    console.log('🎤 Starting speech recognition...')

    try {
      recognitionRef.current.start()
      toast.success('Listening...', {
        description: 'Speak clearly into your microphone.'
      })
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      toast.error('Failed to start listening')
      setIsListening(false) // Reset state on error
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    console.log('🎤 Stopping speech recognition...', { isListening })

    try {
      // Force stop the recognition
      recognitionRef.current.abort() // Use abort instead of stop for immediate stopping
      setIsListening(false) // Immediately update state
      toast.success('Stopped listening')
    } catch (error) {
      console.error('Failed to stop speech recognition:', error)
      setIsListening(false) // Ensure state is reset even on error
    }
  }, [isListening])

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  if (!isSupported) {
    return null // Don't show the button if not supported
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'p-2 h-8 w-8',
        isListening && 'text-red-500 animate-pulse',
        className
      )}
      title={
        isListening
          ? 'Stop dictation (click to stop recording)'
          : 'Start dictation (click to start voice input)'
      }
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isListening ? 'Stop voice input' : 'Start voice input'}
      </span>
    </Button>
  )
}
