'use client'

import { useEffect, useRef } from 'react'
import SpeechRecognition, {
  useSpeechRecognition
} from 'react-speech-recognition'

import { Mic, MicOff } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Button } from './button'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

export function VoiceInput({
  onTranscript,
  disabled,
  className
}: VoiceInputProps) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Send transcript after a delay to allow user to continue speaking
  useEffect(() => {
    if (transcript && transcript.trim()) {
      console.log('🎤 Transcript received:', transcript)

      // Clear any existing transcript timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }

      // Wait 2 seconds after last speech before sending transcript
      transcriptTimeoutRef.current = setTimeout(() => {
        if (transcript && transcript.trim()) {
          console.log('🎤 Sending transcript after delay:', transcript.trim())
          onTranscript(transcript.trim())
          resetTranscript()
        }
      }, 2000)
    }
  }, [transcript, onTranscript, resetTranscript])

  // Auto-stop listening after timeout on Safari mobile
  useEffect(() => {
    if (listening) {
      const isSafariMobile =
        /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
        /Safari/i.test(navigator.userAgent) &&
        !/Chrome|CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent)

      if (isSafariMobile) {
        timeoutRef.current = setTimeout(() => {
          console.log('🎤 Auto-stopping Safari mobile after timeout')
          SpeechRecognition.stopListening()
        }, 10000) // 10 seconds timeout for Safari mobile
      }
    } else {
      // Clear timeouts when not listening
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
        transcriptTimeoutRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
    }
  }, [listening])

  const startListening = () => {
    if (!isMicrophoneAvailable) {
      toast.error('Microphone access denied', {
        description: 'Please allow microphone access to use voice input.'
      })
      return
    }

    resetTranscript()

    // Detect Safari mobile for optimized settings
    const isSafariMobile =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
      /Safari/i.test(navigator.userAgent) &&
      !/Chrome|CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent)

    SpeechRecognition.startListening({
      continuous: true, // Enable continuous mode for better user experience
      language: navigator.language || 'en-US',
      interimResults: true // Enable interim results to get real-time feedback
    })

    toast.success('Listening...', {
      description: isSafariMobile
        ? 'Speak clearly and briefly.'
        : 'Speak clearly into your microphone.'
    })
  }

  const stopListening = () => {
    // Send any pending transcript immediately
    if (transcript && transcript.trim()) {
      console.log('🎤 Sending transcript on stop:', transcript.trim())
      onTranscript(transcript.trim())
      resetTranscript()
    }

    // Clear transcript timeout
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current)
      transcriptTimeoutRef.current = null
    }

    SpeechRecognition.stopListening()
    toast.success('Stopped listening')
  }

  const handleClick = () => {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!browserSupportsSpeechRecognition) {
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
        listening && 'text-red-500 animate-pulse',
        className
      )}
      title={
        listening
          ? 'Stop dictation (click to stop recording)'
          : 'Start dictation (click to start voice input)'
      }
    >
      {listening ? (
        <MicOff className="h-4 w-4 sm:h-4 sm:w-4" />
      ) : (
        <Mic className="h-4 w-4 sm:h-4 sm:w-4" />
      )}
      <span className="sr-only">
        {listening ? 'Stop voice input' : 'Start voice input'}
      </span>
    </Button>
  )
}
