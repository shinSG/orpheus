export type AudioFormat = 'wav' | 'mp3' | 'pcm16'

export type VoicePreset =
  | 'mimo_default'
  | '冰糖'
  | '茉莉'
  | '苏打'
  | '白桦'
  | 'Mia'
  | 'Chloe'
  | 'Milo'
  | 'Dean'

export interface TTSRequest {
  text: string
  voice: VoicePreset
  style?: string
  format: AudioFormat
}

export interface VoiceDesignRequest {
  text: string
  voice_description: string
  style?: string
  format: AudioFormat
  optimize_text_preview?: boolean
}

export interface VoiceCloneRequest {
  text: string
  voice_audio_base64: string
  style?: string
  format: AudioFormat
}

export interface VoiceInfo {
  id: string
  name: string
  lang: string
  gender: string
}

export interface VoiceListResponse {
  voices: VoiceInfo[]
}

export interface CacheStats {
  count: number
  size_bytes: number
  size_mb: number
}

export const VOICES_INFO: Record<VoicePreset, { name: string; lang: string; gender: string }> = {
  mimo_default: { name: 'MiMo-默认', lang: '中文', gender: '女性' },
  '冰糖': { name: '冰糖', lang: '中文', gender: '女性' },
  '茉莉': { name: '茉莉', lang: '中文', gender: '女性' },
  '苏打': { name: '苏打', lang: '中文', gender: '男性' },
  '白桦': { name: '白桦', lang: '中文', gender: '男性' },
  'Mia': { name: 'Mia', lang: '英文', gender: '女性' },
  'Chloe': { name: 'Chloe', lang: '英文', gender: '女性' },
  'Milo': { name: 'Milo', lang: '英文', gender: '男性' },
  'Dean': { name: 'Dean', lang: '英文', gender: '男性' },
}

export type TrainingStatus = 'pending' | 'preparing' | 'training' | 'evaluating' | 'completed' | 'failed'

export interface TrainingSample {
  id: string
  text: string
  audio_path: string
  duration: number
  speaker_id?: string
  created_at: string
}

export interface TrainingConfig {
  base_model?: string
  learning_rate?: number
  batch_size?: number
  epochs?: number
  max_duration?: number
  min_duration?: number
  sample_rate?: number
  output_dir?: string
}

export interface TrainingJob {
  id: string
  status: TrainingStatus
  config: TrainingConfig
  samples_count: number
  current_epoch: number
  total_epochs: number
  loss?: number
  progress: number
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
  output_path?: string
}

export interface TrainingSampleListResponse {
  samples: TrainingSample[]
  total: number
}

export interface TrainingListResponse {
  jobs: TrainingJob[]
}

export interface TrainingStatsResponse {
  total_samples: number
  total_duration: number
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  active_jobs: number
}
