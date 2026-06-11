# MiMo TTS Desktop

基于 Electron + React 的 MiMo TTS 桌面客户端。

## 功能特性

- ✅ 文本转语音合成（最大5000字符）
- ✅ 9种音色选择（5中文，4英文）
- ✅ 风格指令控制
- ✅ 多格式输出（WAV, MP3, PCM16）
- ✅ 流式播放支持
- ✅ 音频播放器（播放/暂停/进度/音量）
- ✅ 音频下载
- ✅ 缓存管理

## 快速开始

### 1. 启动后端服务

```bash
# 在项目根目录
cd ..
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 填入 MIMO_API_KEY
uvicorn app.main:app --reload
```

### 2. 启动桌面客户端

```bash
cd electron-app
npm install
npm run dev
```

这将同时启动 Vite 开发服务器和 Electron 应用。

## 项目结构

```
electron-app/
├── src/
│   ├── main/           # Electron 主进程
│   │   └── index.ts
│   ├── renderer/       # React 渲染进程
│   │   ├── index.html
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/           # UI 组件
│   │       │   ├── TTSForm.tsx   # 文本输入表单
│   │       │   ├── AudioPlayer.tsx  # 音频播放器
│   │       │   └── CacheManager.tsx # 缓存管理
│   │       ├── hooks/
│   │       │   └── useTTS.ts     # TTS API hooks
│   │       ├── lib/
│   │       │   ├── api.ts        # API 客户端
│   │       │   └── utils.ts      # 工具函数
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       └── index.css
│   └── shared/         # 共享类型
│       └── types.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 构建打包

```bash
npm run build
```

打包后的文件在 `release/` 目录。

## 技术栈

- **Electron** - 跨平台桌面框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **Tailwind CSS** - 样式框架
- **React Query** - 数据获取和缓存
- **Web Audio API** - 音频播放

## API 端点

桌面客户端使用以下后端 API：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/tts/voices` | GET | 获取音色列表 |
| `/api/v1/tts/stream` | POST | 流式语音合成 |
| `/api/v1/tts/generate` | POST | 生成完整音频 |
| `/api/v1/tts/cache/stats` | GET | 缓存统计 |
| `/api/v1/tts/cache` | DELETE | 清除缓存 |
| `/health` | GET | 健康检查 |
