'use client'

import { useState } from 'react'
import { setupStorageBucket, testStorageUpload } from '@/lib/supabase/setup-storage'
import { Button } from '@/components/ui/button'

export default function TestStoragePage() {
  const [setupResult, setSetupResult] = useState<string>('')
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSetupBucket = async () => {
    setLoading(true)
    setSetupResult('Setting up bucket...')
    
    try {
      const response = await fetch('/api/storage/setup', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        setSetupResult(`✅ ${result.message}`)
      } else {
        setSetupResult(`❌ Setup failed: ${result.error}`)
      }
    } catch (error) {
      setSetupResult(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTestUpload = async () => {
    setLoading(true)
    setTestResult('Testing upload...')
    
    try {
      const response = await fetch('/api/storage/test', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        setTestResult(`✅ ${result.message}${result.url ? `\nURL: ${result.url}` : ''}`)
      } else {
        setTestResult(`❌ Test failed: ${result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Storage Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">1. Setup Storage Bucket</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This will create the "files" bucket if it doesn't exist and configure permissions.
          </p>
          <Button onClick={handleSetupBucket} disabled={loading}>
            Setup Bucket
          </Button>
          {setupResult && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              {setupResult}
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">2. Test File Upload</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This will test if file uploads work correctly to the Supabase Storage.
          </p>
          <Button onClick={handleTestUpload} disabled={loading}>
            Test Upload
          </Button>
          {testResult && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              {testResult}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Setup Bucket" first to create the storage bucket</li>
          <li>Then click "Test Upload" to verify everything works</li>
          <li>Check the browser console for detailed logs</li>
          <li>Once both tests pass, file uploads in your chat should work</li>
        </ol>
      </div>
    </div>
  )
}