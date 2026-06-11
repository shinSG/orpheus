import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchVoices, generateAudio, fetchCacheStats, clearCache } from '../lib/api'
import { TTSRequest } from '../../../shared/types'

export function useVoices() {
  return useQuery({
    queryKey: ['voices'],
    queryFn: fetchVoices,
  })
}

export function useGenerateAudio() {
  return useMutation({
    mutationFn: (request: TTSRequest) => generateAudio(request),
  })
}

export function useCacheStats() {
  return useQuery({
    queryKey: ['cacheStats'],
    queryFn: fetchCacheStats,
  })
}

export function useClearCache() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cacheStats'] })
    },
  })
}
