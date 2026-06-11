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
