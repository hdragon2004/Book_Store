import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Upload Controller - Xử lý upload file
 */

class UploadController {
  /**
   * Upload ảnh chung
   * POST /api/upload/image
   */
  uploadImage = asyncHandler(async (req, res) => {
    console.log('📤 Upload request received');
    console.log('📤 Request body:', req.body);
    console.log('📤 Request file:', req.file);
    console.log('📤 Request files:', req.files);
    
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(StatusCodes.BAD_REQUEST).json(
        new ApiResponse(StatusCodes.BAD_REQUEST, null, 'No image file provided', false)
      )
    }

    console.log('✅ File received:', req.file);
    const imageUrl = `/uploads/${req.file.filename}`
    console.log('✅ Image URL:', imageUrl);
    
    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, { imageUrl }, 'Image uploaded successfully')
    )
  })
}

export default new UploadController()
