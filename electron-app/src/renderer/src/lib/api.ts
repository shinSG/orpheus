import { TTSRequest, VoiceDesignRequest, VoiceCloneRequest, VoiceListResponse, CacheStats, AudioFormat, TrainingSample, TrainingSampleListResponse, TrainingJob, TrainingListResponse, TrainingConfig, TrainingStatsResponse } from '../../../shared/types'

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

export async function generateVoiceDesign(request: VoiceDesignRequest): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/v1/tts/voice_design`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to generate voice design' }))
    throw new Error(error.detail || 'Failed to generate voice design')
  }
  return response.blob()
}

export async function generateVoiceClone(request: VoiceCloneRequest): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/v1/tts/voice_clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to generate voice clone' }))
    throw new Error(error.detail || 'Failed to generate voice clone')
  }
  return response.blob()
}

export async function uploadVoiceAndClone(
  file: File,
  text: string,
  style?: string,
  format: AudioFormat = 'wav'
): Promise<Blob> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('text', text)
  if (style) formData.append('style', style)
  formData.append('format', format)

  const response = await fetch(`${BASE_URL}/api/v1/tts/voice_upload`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to upload and clone voice' }))
    throw new Error(error.detail || 'Failed to upload and clone voice')
  }
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

export async function uploadTrainingSample(file: File, text: string, speakerId?: string): Promise<TrainingSample> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('text', text)
  if (speakerId) formData.append('speaker_id', speakerId)

  const response = await fetch(`${BASE_URL}/api/v1/training/samples`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error('Failed to upload sample')
  return response.json()
}

export async function fetchTrainingSamples(): Promise<TrainingSampleListResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/training/samples`)
  if (!response.ok) throw new Error('Failed to fetch samples')
  return response.json()
}

export async function deleteTrainingSample(sampleId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/training/samples/${sampleId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete sample')
}

export async function createTrainingJob(config: TrainingConfig, sampleIds?: string[]): Promise<TrainingJob> {
  const response = await fetch(`${BASE_URL}/api/v1/training/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, sample_ids: sampleIds }),
  })
  if (!response.ok) throw new Error('Failed to create job')
  return response.json()
}

export async function fetchTrainingJobs(): Promise<TrainingListResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/training/jobs`)
  if (!response.ok) throw new Error('Failed to fetch jobs')
  return response.json()
}

export async function fetchTrainingJob(jobId: string): Promise<TrainingJob> {
  const response = await fetch(`${BASE_URL}/api/v1/training/jobs/${jobId}`)
  if (!response.ok) throw new Error('Failed to fetch job')
  return response.json()
}

export async function startTrainingJob(jobId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/training/jobs/${jobId}/start`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to start job')
}

export async function cancelTrainingJob(jobId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/training/jobs/${jobId}/cancel`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to cancel job')
}

export async function fetchTrainingStats(): Promise<TrainingStatsResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/training/stats`)
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}
