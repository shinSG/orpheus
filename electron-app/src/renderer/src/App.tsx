import TTSForm from './components/TTSForm'
import CacheManager from './components/CacheManager'

export default function App() {
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
              <h2 className="text-xl font-semibold mb-4">语音合成</h2>
              <TTSForm />
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
                <p>1. 输入要转换的文本（最多5000字符）</p>
                <p>2. 选择音色和音频格式</p>
                <p>3. 可选：输入风格指令控制语音风格</p>
                <p>4. 点击"生成语音"按钮</p>
                <p>5. 在播放器中预览并下载音频</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
