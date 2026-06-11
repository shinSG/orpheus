import { TTSRequest, VoiceListResponse, CacheStats, AudioFormat } from '../../../shared/types'

const BASE_URL = 'http://localhost:8000'

export async function fetchVoices(): Promise<VoiceListResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/tts/voices`)
  if (!response.ok) throw new Error('Failed to fetch voices')
  return response.json()
}

export async function generateAudio(request: TTSRequest): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/v1/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error('Failed to generate audio')
  return response.blob()
}

export async function fetchCacheStats(): Promise<CacheStats> {
  const response = await fetch(`${BASE_URL}/api/v1/tts/cache/stats`)
  if (!response.ok) throw new Error('Failed to fetch cache stats')
  return response.json()
}

export async function clearCache(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/tts/cache`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to clear cache')
}

export function createStreamConnection(
  request: TTSRequest,
  onChunk: (data: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): EventSource {
  const eventSource = new EventSource(
    `${BASE_URL}/api/v1/tts/stream?${new URLSearchParams({
      text: request.text,
      voice: request.voice,
      format: request.format,
      ...(request.style && { style: request.style }),
    })}`
  )

  // Note: SSE GET won't work for this API which expects POST
  // We'll use fetch with streaming instead
  eventSource.close()

  // Use fetch with ReadableStream
  fetch(`${BASE_URL}/api/v1/tts/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Stream failed')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data.trim()) {
              try {
                const parsed = JSON.parse(data)
                if (parsed.done) {
                  onDone()
                } else if (parsed.audio) {
                  onChunk(parsed.audio)
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      onDone()
    })
    .catch(onError)

  // Return a dummy EventSource for compatibility
  return { close: () => {} } as EventSource
}
