/**
 * In-Memory Queue System - Thay thế Redis Queue
 * Sử dụng array và setInterval để xử lý background jobs
 */

class MemoryQueue {
  constructor() {
    this.jobs = []
    this.processing = false
    this.interval = null
  }

  /**
   * Thêm job vào queue
   */
  add(jobName, data, options = {}) {
    const job = {
      id: Date.now() + Math.random(),
      name: jobName,
      data,
      options: {
        delay: 0,
        attempts: 3,
        backoff: 'exponential',
        ...options
      },
      createdAt: new Date(),
      processedAt: null,
      failedAt: null,
      attempts: 0
    }

    this.jobs.push(job)
    
    // Tự động xử lý nếu chưa có interval
    if (!this.interval) {
      this.startProcessing()
    }
  }

  /**
   * Bắt đầu xử lý jobs
   */
  startProcessing() {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.processJobs()
    }, 1000) // Xử lý mỗi giây

    console.log('🚀 Memory queue started processing')
  }

  /**
   * Dừng xử lý jobs
   */
  stopProcessing() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
      console.log('🛑 Memory queue stopped processing')
    }
  }

  /**
   * Xử lý jobs trong queue
   */
  async processJobs() {
    if (this.processing || this.jobs.length === 0) return

    this.processing = true

    try {
      // Lấy job đầu tiên
      const job = this.jobs.shift()
      if (!job) return

      // Kiểm tra delay
      if (job.options.delay > 0) {
        const delayTime = job.createdAt.getTime() + job.options.delay - Date.now()
        if (delayTime > 0) {
          this.jobs.unshift(job) // Đưa lại vào đầu queue
          return
        }
      }

      // Xử lý job
      await this.executeJob(job)
    } catch (error) {
      console.error('❌ Error processing job:', error)
    } finally {
      this.processing = false
    }
  }

  /**
   * Thực thi job
   */
  async executeJob(job) {
    try {
      // Processing job
      
      // Import và gọi handler tương ứng
      const handler = await this.getJobHandler(job.name)
      if (handler) {
        await handler(job.data)
        // Job completed
      } else {
        console.log(`⚠️ No handler found for job: ${job.name}`)
      }
    } catch (error) {
      console.error(`❌ Job failed: ${job.name}`, error.message)
      
      // Retry logic
      job.attempts++
      if (job.attempts < job.options.attempts) {
        // Retrying job
        this.jobs.push(job) // Thêm lại vào queue
      } else {
        // Job permanently failed
      }
    }
  }

  /**
   * Lấy handler cho job
   */
  async getJobHandler(jobName) {
    try {
      switch (jobName) {
        case 'send-email':
          const { emailWorker } = await import('./emailQueue.js')
          return emailWorker.processJob
        case 'send-notification':
          const { notificationWorker } = await import('./notificationQueue.js')
          return notificationWorker.processJob
        default:
          return null
      }
    } catch (error) {
      console.error('Error importing job handler:', error)
      return null
    }
  }

  /**
   * Lấy thống kê queue
   */
  getStats() {
    return {
      totalJobs: this.jobs.length,
      processing: this.processing,
      isRunning: !!this.interval
    }
  }

  /**
   * Xóa tất cả jobs
   */
  clear() {
    this.jobs = []
    console.log('🧹 Queue cleared')
  }
}

// Singleton instance
const memoryQueue = new MemoryQueue()

export default memoryQueue
