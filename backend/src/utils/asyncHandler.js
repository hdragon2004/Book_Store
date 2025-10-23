/**
 * Async Handler - Wrapper function để xử lý async errors
 * Tự động catch errors và chuyển đến error handler middleware
 */

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
