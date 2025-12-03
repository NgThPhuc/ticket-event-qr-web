import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export const cloudinaryService = {
  /**
   * Upload ảnh lên Cloudinary
   * @param {File} file - File ảnh (từ input type="file")
   * @param {string} folder - Folder trong Cloudinary (optional)
   * @returns {Promise} Upload result với secure_url
   */
  uploadImage: async (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    if (folder) {
      formData.append('folder', folder);
    }

    try {
      const response = await fetch(CLOUDINARY_CONFIG.apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Không thể upload ảnh. Vui lòng thử lại.');
    }
  },

  /**
   * Upload ảnh với progress tracking
   * @param {File} file - File ảnh
   * @param {Function} onProgress - Callback nhận progress (0-100)
   * @returns {Promise} Upload result
   */
  uploadImageWithProgress: async (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

      const xhr = new XMLHttpRequest();

      // Track progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', CLOUDINARY_CONFIG.apiUrl);
      xhr.send(formData);
    });
  },

  /**
   * Validate file trước khi upload
   * @param {File} file - File cần validate
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateImage: (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)',
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Kích thước ảnh không được vượt quá 5MB',
      };
    }

    return { valid: true };
  },
};
