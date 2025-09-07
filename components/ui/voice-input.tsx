'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Mic, MicOff } from 'lucide-react'
import { toast } from 'sonner'

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
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onabort: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
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
  const isListeningRef = useRef(false)
  const canStartRef = useRef(true)
  const isMobileRef = useRef(false)
  const isSafariRef = useRef(false)

  // Sync ref with state
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      (window as Window).SpeechRecognition ||
      (window as Window).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      const recognition = recognitionRef.current
      // Detect Safari mobile
      isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(
        navigator.userAgent
      )
      isSafariRef.current =
        /Safari/i.test(navigator.userAgent) &&
        !/Chrome/i.test(navigator.userAgent)

      // Safari mobile doesn't handle continuous mode well
      recognition.continuous = !(isMobileRef.current && isSafariRef.current)
      recognition.interimResults = true
      recognition.lang = navigator.language || 'en-US'

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started')
        isListeningRef.current = true
        setIsListening(true)
      }

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended')
        const wasListening = isListeningRef.current
        isListeningRef.current = false
        setIsListening(false)

        // Allow restart
        setTimeout(() => {
          canStartRef.current = true
        }, 100)
      }

      recognition.onabort = () => {
        console.log('🎤 Speech recognition aborted')
        isListeningRef.current = false
        setIsListening(false)
        // Allow restart after abort
        setTimeout(() => {
          canStartRef.current = true
        }, 500)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎤 Speech recognition result received', event)

        // Don't process results if we're not supposed to be listening
        if (!isListeningRef.current) {
          console.log('🎤 Ignoring speech result - not listening')
          return
        }

        const speechEvent = event
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

        console.log('🎤 Final transcript:', finalTranscript)
        console.log('🎤 Interim transcript:', interimTranscript)

        // For Safari mobile, also accept interim results if final is empty
        const transcriptToSend =
          finalTranscript ||
          (isMobileRef.current && isSafariRef.current ? interimTranscript : '')

        if (transcriptToSend && isListeningRef.current) {
          console.log('🎤 Sending transcript:', transcriptToSend)
          onTranscript(transcriptToSend)

          // For Safari mobile, stop listening after getting a result
          if (isMobileRef.current && isSafariRef.current) {
            setTimeout(() => {
              if (recognitionRef.current && isListeningRef.current) {
                recognitionRef.current.stop()
              }
            }, 500)
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        isListeningRef.current = false
        setIsListening(false)

        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied', {
            description: 'Please allow microphone access to use voice input.'
          })
        } else if (event.error === 'network') {
          toast.error('Network error', {
            description: 'Speech recognition requires an internet connection.'
          })
        } else if (event.error === 'aborted') {
          // Don't show error for manual abort
          console.log('🎤 Recognition manually aborted')
        } else {
          toast.error('Speech recognition failed', {
            description: 'Please wait a moment and try again.'
          })
        }

        // Allow restart after error with a delay
        setTimeout(() => {
          canStartRef.current = true
        }, 1000)
      }
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop()
          isListeningRef.current = false
        } catch (error) {
          console.error('Error stopping recognition in cleanup:', error)
        }
      }
    }
  }, [onTranscript, isListening])

  const startListening = useCallback(() => {
    if (
      !recognitionRef.current ||
      isListeningRef.current ||
      !canStartRef.current
    ) {
      if (!canStartRef.current) {
        toast.error('Please wait a moment before starting again')
      }
      return
    }

    console.log('🎤 Starting speech recognition...')

    try {
      // Set continuous mode based on browser
      recognitionRef.current.continuous = !(
        isMobileRef.current && isSafariRef.current
      )

      // Update refs first to prevent double calls
      isListeningRef.current = true
      canStartRef.current = false
      setIsListening(true)

      recognitionRef.current.start()
      toast.success('Listening...', {
        description:
          isMobileRef.current && isSafariRef.current
            ? 'Speak clearly and briefly.'
            : 'Speak clearly into your microphone.'
      })
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      toast.error('Please wait a moment and try again')
      isListeningRef.current = false
      setIsListening(false)

      // Reset canStart after a delay
      setTimeout(() => {
        canStartRef.current = true
      }, 1000)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    console.log('🎤 Stopping speech recognition...')

    // Immediately update state to stop processing new results
    isListeningRef.current = false
    setIsListening(false)

    try {
      // Disable continuous mode to prevent automatic restart
      recognitionRef.current.continuous = false

      // Stop the recognition
      recognitionRef.current.stop()

      toast.success('Stopped listening')
    } catch (error) {
      console.error('Failed to stop speech recognition:', error)
      // Force abort as last resort
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort()
        }
      } catch (abortError) {
        console.error('Failed to abort:', abortError)
      }
    }

    // Allow restart after a short delay
    setTimeout(() => {
      canStartRef.current = true
    }, 300)
  }, [])

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
        'p-2 sm:p-2 h-9 w-9 sm:h-8 sm:w-8',
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
        <MicOff className="h-4 w-4 sm:h-4 sm:w-4" />
      ) : (
        <Mic className="h-4 w-4 sm:h-4 sm:w-4" />
      )}
      <span className="sr-only">
        {isListening ? 'Stop voice input' : 'Start voice input'}
      </span>
    </Button>
  )
}
