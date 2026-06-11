import { useState } from 'react'
import { useGenerateAudio, useVoices } from '../hooks/useTTS'
import { TTSRequest, VoicePreset, AudioFormat, VOICES_INFO } from '../../../shared/types'
import AudioPlayer from './AudioPlayer'

export default function TTSForm() {
  const [text, setText] = useState('')
  const [voice, setVoice] = useState<VoicePreset>('mimo_default')
  const [style, setStyle] = useState('')
  const [format, setFormat] = useState<AudioFormat>('wav')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const { data: voicesData } = useVoices()
  const generateMutation = useGenerateAudio()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    const request: TTSRequest = {
      text: text.trim(),
      voice,
      format,
      ...(style.trim() && { style: style.trim() }),
    }

    try {
      const blob = await generateMutation.mutateAsync(request)
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
    } catch (error) {
      console.error('Generation failed:', error)
      alert('生成失败，请检查后端服务是否运行')
    }
  }

  const voiceOptions = Object.entries(VOICES_INFO).map(([key, value]) => ({
    value: key as VoicePreset,
    label: `${value.name} (${value.lang} · ${value.gender})`,
  }))

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">文本内容</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
            rows={6}
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入要转换的文本..."
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {text.length}/5000
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">音色选择</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoicePreset)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {voiceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">音频格式</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as AudioFormat)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
              <option value="pcm16">PCM16</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            风格指令 <span className="text-gray-400">(可选)</span>
          </label>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            maxLength={500}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="例如：(温柔) 或自然语言描述"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || generateMutation.isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {generateMutation.isPending ? '生成中...' : '生成语音'}
        </button>
      </form>

      {audioUrl && <AudioPlayer url={audioUrl} format={format} />}
    </div>
  )
}
