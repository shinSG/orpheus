import { useCacheStats, useClearCache } from '../hooks/useTTS'

export default function CacheManager() {
  const { data: stats, isLoading } = useCacheStats()
  const clearCacheMutation = useClearCache()

  const handleClear = async () => {
    if (confirm('确定要清除所有缓存吗？')) {
      try {
        await clearCacheMutation.mutateAsync()
        alert('缓存已清除')
      } catch {
        alert('清除失败')
      }
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h3 className="font-medium">缓存管理</h3>

      {isLoading ? (
        <p className="text-gray-500">加载中...</p>
      ) : stats ? (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">缓存文件数</span>
            <span className="font-medium">{stats.count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">缓存大小</span>
            <span className="font-medium">{stats.size_mb} MB</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">无法获取缓存统计</p>
      )}

      <button
        onClick={handleClear}
        disabled={clearCacheMutation.isPending || !stats?.count}
        className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {clearCacheMutation.isPending ? '清除中...' : '清除缓存'}
      </button>
    </div>
  )
}
