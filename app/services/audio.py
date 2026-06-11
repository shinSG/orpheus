import io
import struct
import wave


def pcm16_to_wav(pcm_chunks: list[bytes], sample_rate: int = 24000, channels: int = 1, sample_width: int = 2) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        for chunk in pcm_chunks:
            wf.writeframes(chunk)
    return buf.getvalue()


def pcm16_to_mp3(pcm_chunks: list[bytes], sample_rate: int = 24000) -> bytes:
    pcm_data = b"".join(pcm_chunks)
    try:
        import subprocess
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".pcm", delete=False) as f:
            f.write(pcm_data)
            pcm_path = f.name

        mp3_path = pcm_path.replace(".pcm", ".mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-f", "s16le", "-ar", str(sample_rate), "-ac", "1", "-i", pcm_path, mp3_path],
            check=True,
            capture_output=True,
        )

        with open(mp3_path, "rb") as f:
            mp3_data = f.read()

        import os
        os.unlink(pcm_path)
        os.unlink(mp3_path)
        return mp3_data
    except (ImportError, FileNotFoundError):
        return pcm_data
