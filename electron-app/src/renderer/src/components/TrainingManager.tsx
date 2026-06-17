import { useState, useEffect, useCallback } from 'react'
import {
  uploadTrainingSample,
  fetchTrainingSamples,
  deleteTrainingSample,
  createTrainingJob,
  startTrainingJob,
  cancelTrainingJob,
  fetchTrainingJobs,
  fetchTrainingStats,
} from '../lib/api'
import { TrainingSample, TrainingJob, TrainingStatsResponse } from '../../../shared/types'

export default function TrainingManager() {
  const [samples, setSamples] = useState<TrainingSample[]>([])
  const [jobs, setJobs] = useState<TrainingJob[]>([])
  const [stats, setStats] = useState<TrainingStatsResponse | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [speakerId, setSpeakerId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [subTab, setSubTab] = useState<'samples' | 'jobs'>('samples')
  const [creatingJob, setCreatingJob] = useState(false)
  const [jobConfig, setJobConfig] = useState({
    epochs: 10,
    batch_size: 8,
    learning_rate: 0.0001,
  })

  const loadData = useCallback(async () => {
    try {
      const [samplesRes, jobsRes, statsRes] = await Promise.all([
        fetchTrainingSamples(),
        fetchTrainingJobs(),
        fetchTrainingStats(),
      ])
      setSamples(samplesRes.samples)
      setJobs(jobsRes.jobs)
      setStats(statsRes)
    } catch (err) {
      console.error('Failed to load training data:', err)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleUpload = async () => {
    if (!selectedFile || !uploadText.trim()) return
    setUploading(true)
    try {
      await uploadTrainingSample(selectedFile, uploadText.trim(), speakerId || undefined)
      setUploadText('')
      setSpeakerId('')
      setSelectedFile(null)
      await loadData()
    } catch (err) {
      alert('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该样本？')) return
    try {
      await deleteTrainingSample(id)
      await loadData()
    } catch {
      alert('删除失败')
    }
  }

  const handleCreateJob = async () => {
    setCreatingJob(true)
    try {
      const job = await createTrainingJob({
        epochs: jobConfig.epochs,
        batch_size: jobConfig.batch_size,
        learning_rate: jobConfig.learning_rate,
      })
      await startTrainingJob(job.id)
      await loadData()
    } catch {
      alert('创建训练任务失败')
    } finally {
      setCreatingJob(false)
    }
  }

  const handleCancelJob = async (id: string) => {
    try {
      await cancelTrainingJob(id)
      await loadData()
    } catch {
      alert('取消失败')
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'training': return 'text-blue-600 bg-blue-50'
      case 'preparing': return 'text-yellow-600 bg-yellow-50'
      case 'failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total_samples}</div>
            <div className="text-xs text-gray-500">训练样本</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total_jobs}</div>
            <div className="text-xs text-gray-500">训练任务</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total_duration.toFixed(1)}s</div>
            <div className="text-xs text-gray-500">总时长</div>
          </div>
        </div>
      )}

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setSubTab('samples')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            subTab === 'samples' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          训练样本 ({samples.length})
        </button>
        <button
          onClick={() => setSubTab('jobs')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            subTab === 'jobs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          训练任务 ({jobs.length})
        </button>
      </div>

      {subTab === 'samples' && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">上传训练样本</h3>
            <input
              type="file"
              accept=".wav,.mp3,.flac,.ogg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <input
              type="text"
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="对应文本内容"
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              value={speakerId}
              onChange={(e) => setSpeakerId(e.target.value)}
              placeholder="说话人ID（可选）"
              className="w-full p-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !uploadText.trim() || uploading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? '上传中...' : '上传样本'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {samples.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">暂无训练样本</p>
            ) : (
              samples.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.text}</p>
                    <p className="text-xs text-gray-500">
                      {s.duration.toFixed(1)}s {s.speaker_id && `· ${s.speaker_id}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="ml-3 text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {subTab === 'jobs' && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">新建训练任务</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Epochs</label>
                <input
                  type="number"
                  value={jobConfig.epochs}
                  onChange={(e) => setJobConfig({ ...jobConfig, epochs: +e.target.value })}
                  min={1}
                  max={100}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Batch Size</label>
                <input
                  type="number"
                  value={jobConfig.batch_size}
                  onChange={(e) => setJobConfig({ ...jobConfig, batch_size: +e.target.value })}
                  min={1}
                  max={64}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Learning Rate</label>
                <input
                  type="text"
                  value={jobConfig.learning_rate}
                  onChange={(e) => setJobConfig({ ...jobConfig, learning_rate: +e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleCreateJob}
              disabled={creatingJob || samples.length === 0}
              className="w-full py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {creatingJob ? '创建中...' : '开始训练'}
            </button>
            {samples.length === 0 && (
              <p className="text-xs text-gray-400 text-center">请先上传训练样本</p>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jobs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">暂无训练任务</p>
            ) : (
              jobs.map((j) => (
                <div key={j.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(j.status)}`}>
                      {j.status}
                    </span>
                    {j.status === 'training' && (
                      <button
                        onClick={() => handleCancelJob(j.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        取消
                      </button>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${j.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Epoch {j.current_epoch}/{j.total_epochs}</span>
                    <span>{j.progress.toFixed(0)}%</span>
                    {j.loss !== undefined && j.loss !== null && <span>Loss: {j.loss.toFixed(4)}</span>}
                  </div>
                  {j.error_message && (
                    <p className="text-xs text-red-500">{j.error_message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
