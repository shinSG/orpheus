import { useState } from 'react'
import TTSForm from './components/TTSForm'
import VoiceDesignForm from './components/VoiceDesignForm'
import VoiceCloneForm from './components/VoiceCloneForm'
import CacheManager from './components/CacheManager'
import TrainingManager from './components/TrainingManager'

type TabId = 'preset' | 'design' | 'clone' | 'training'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'preset', label: '预置音色', icon: '🎵' },
  { id: 'design', label: '音色设计', icon: '✨' },
  { id: 'clone', label: '音色克隆', icon: '🎙️' },
  { id: 'training', label: '模型训练', icon: '🔧' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('preset')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MiMo TTS</h1>
          <p className="text-gray-600">基于 MiMo-V2.5-TTS 的语音合成服务</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-1.5">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'preset' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">预置音色合成</h2>
                  <TTSForm />
                </div>
              )}

              {activeTab === 'design' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">文本设计音色</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    通过文本描述生成定制化音色，无需提供音频文件。描述越具体、越生动，生成的音色越贴近预期。
                  </p>
                  <VoiceDesignForm />
                </div>
              )}

              {activeTab === 'clone' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">音频克隆音色</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    上传参考音频，精准复刻目标音色并生成语音。支持 WAV 和 MP3 格式，最大 10MB。
                  </p>
                  <VoiceCloneForm />
                </div>
              )}

              {activeTab === 'training' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">模型训练</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    上传音频样本并训练自定义 TTS 模型。支持 WAV、MP3、FLAC、OGG 格式。
                  </p>
                  <TrainingManager />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">缓存管理</h2>
              <CacheManager />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">使用说明</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">1</span>
                  <p><strong>预置音色</strong>：选择内置音色，输入文本即可生成</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-purple-600">2</span>
                  <p><strong>音色设计</strong>：用文字描述想要的音色，如"年轻女性，声音清亮温柔"</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-green-600">3</span>
                  <p><strong>音色克隆</strong>：上传参考音频，复刻任意音色</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-gray-600">4</span>
                  <p>支持风格控制：在文本中添加 <code className="bg-gray-100 px-1 rounded">(温柔)</code> 等标签</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-gray-600">5</span>
                  <p>生成后可预览播放并下载音频文件</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
