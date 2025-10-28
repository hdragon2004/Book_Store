import React, { useState, useEffect } from 'react'
import { downloadAPI } from '../services/apiService'

const OfflineReader = ({ bookId, onClose }) => {
  const [offlineInfo, setOfflineInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchOfflineInfo()
  }, [bookId])

  const fetchOfflineInfo = async () => {
    try {
      setLoading(true)
      const response = await downloadAPI.getOfflineInfo(bookId)
      setOfflineInfo(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin offline')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const response = await downloadAPI.createDownloadLink(bookId)
      const { downloadUrl } = response.data.data
      
      // Tạo link download và tự động tải
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = offlineInfo.book.title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải xuống')
    } finally {
      setDownloading(false)
    }
  }

  const handleStream = () => {
    if (offlineInfo?.offlineAccess?.streamUrl) {
      window.open(offlineInfo.offlineAccess.streamUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!offlineInfo) return null

  const { book, offlineAccess, downloadStats } = offlineInfo
  const isAudiobook = book.format === 'audiobook'
  const isEbook = book.format === 'ebook'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isAudiobook ? '🎧 Sách nói' : isEbook ? '📚 Sách điện tử' : '📖 Sách digital'}
            </h2>
            <h3 className="text-lg text-gray-700">{book.title}</h3>
            <p className="text-gray-500">Tác giả: {book.author}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Book Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Thông tin file</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Kích thước:</strong> {formatFileSize(book.digitalFile.fileSize)}</p>
                <p><strong>Định dạng:</strong> {book.digitalFile.mimeType}</p>
                {isAudiobook && book.digitalFile.duration && (
                  <p><strong>Thời lượng:</strong> {formatDuration(book.digitalFile.duration)}</p>
                )}
                <p><strong>Hết hạn:</strong> {offlineAccess.expiresIn}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Thống kê tải xuống</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Tổng lần tải: {downloadStats.totalDownloads}</p>
                <p>Lần tải gần nhất: {downloadStats.lastDownloadAt ? formatDate(downloadStats.lastDownloadAt) : 'Chưa có'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang tải xuống...
              </>
            ) : (
              <>
                📥 Tải xuống để đọc offline
              </>
            )}
          </button>
          <button
            onClick={handleStream}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
          >
            🌐 Đọc online
          </button>
        </div>

        {/* Supported Apps */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Ứng dụng được hỗ trợ</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">📱 Mobile</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {offlineAccess.supportedApps.mobile.map((app, index) => (
                  <li key={index}>• {app}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">💻 Desktop</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {offlineAccess.supportedApps.desktop.map((app, index) => (
                  <li key={index}>• {app}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">🌐 Web</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {offlineAccess.supportedApps.web.map((app, index) => (
                  <li key={index}>• {app}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            {offlineAccess.instructions.title}
          </h4>
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Các bước thực hiện:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {offlineAccess.instructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Mẹo hay:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {offlineAccess.instructions.tips.map((tip, index) => (
                  <li key={index}>💡 {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default OfflineReader
