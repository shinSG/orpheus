# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiMo TTS — a text-to-speech service powered by MiMo-V2.5-TTS (Xiaomi's model, accessed via OpenAI-compatible API). Two components:

- **`app/`** — Python FastAPI backend. Serves TTS endpoints on port 8000.
- **`electron-app/`** — Electron + React + TypeScript desktop client (Vite, Tailwind CSS, React Query). Dev server on port 5173.

## Commands

### Backend (Python)

```bash
# Install dependencies
pip install -r requirements.txt

# Run dev server (from project root)
uvicorn app.main:app --reload

# Verify env
cp .env.example .env  # then edit with real API key
```

### Frontend (Electron)

```bash
cd electron-app
npm install

# Dev (starts both Vite + Electron concurrently)
npm run dev

# Build desktop app (packages for current platform)
npm run build
```

## Architecture

### Backend API

All TTS endpoints live under `/api/v1/tts/`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/voices` | GET | List available voice presets |
| `/voices/{voice_id}` | GET | Get single voice info |
| `/generate` | POST | Generate audio (returns WAV/MP3/PCM16). Supports file-based caching. |
| `/stream` | POST | SSE streaming of PCM16 chunks (base64-encoded) |
| `/cache/stats` | GET | Cache statistics |
| `/cache` | DELETE | Clear all cached audio |

### Service Layer (`app/services/`)

- **`mimo_tts.py`** — Wraps `AsyncOpenAI` client to call MiMo TTS model. Two functions: `tts_stream` (async generator yielding PCM bytes) and `tts_sync` (single completion).
- **`audio.py`** — PCM16→WAV conversion via Python `wave` module; PCM16→MP3 via `ffmpeg` subprocess (falls back to raw PCM if ffmpeg missing).
- **`cache.py`** — File-based cache in `tmp/` directory. Key = SHA256 of `text|voice|style|format`.

### Voice Presets

9 presets defined in `app/schemas/tts.py` (enum `VoicePreset`). Chinese voices use Chinese characters as voice_id; English voices use English names. The same preset list is duplicated in `electron-app/src/shared/types.ts` — keep both in sync when adding voices.

### Electron App

- **`src/main/index.ts`** — Electron main process. Loads `localhost:5173` in dev, static `dist/renderer/` in production.
- **`src/renderer/src/`** — React app. Key components: `TTSForm` (input + voice selection), `AudioPlayer` (playback + download), `CacheManager` (view/clear cache).
- **`src/renderer/src/lib/api.ts`** — HTTP client for backend API. Hardcoded to `http://localhost:8000`.
- **`src/shared/types.ts`** — TypeScript types shared between main/renderer processes. Must stay in sync with Python schemas in `app/schemas/tts.py`.

### Key Dependencies

- Backend: FastAPI, OpenAI Python SDK (for MiMo API), pydantic-settings, numpy, soundfile
- Frontend: React 18, Electron 28, Vite 5, Tanstack React Query, Tailwind CSS, Lucide icons
- MP3 output requires `ffmpeg` installed on the system

## Configuration

Environment variables (via `.env` file or env vars):

| Variable | Default | Description |
|---|---|---|
| `MIMO_API_KEY` | (required) | API key for MiMo TTS service |
| `MIMO_BASE_URL` | `https://api.xiaomimimo.com/v1` | MiMo API base URL |
| `TTS_MODEL` | `mimo-v2.5-tts` | Model name |
| `SAMPLE_RATE` | `24000` | Audio sample rate for format conversion |
| `HOST` | `0.0.0.0` | Backend bind host |
| `PORT` | `8000` | Backend bind port |
