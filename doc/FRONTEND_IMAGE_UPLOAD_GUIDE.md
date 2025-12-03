# TÀI LIỆU UPLOAD ẢNH CHO EVENTS - CHO FRONTEND

## 📋 TỔNG QUAN

Hệ thống sử dụng **Cloudinary** để lưu trữ ảnh cover của sự kiện. Frontend upload trực tiếp lên Cloudinary, nhận URL, sau đó gửi URL vào API Backend khi tạo/cập nhật event.

**Lợi ích:**
- ✅ Backend không cần xử lý file upload
- ✅ Ảnh được lưu trên CDN, load nhanh
- ✅ Free tier 10GB/tháng
- ✅ Tự động optimize ảnh
- ✅ Tự động resize, crop, transform

---

## 🔧 SETUP CLOUDINARY

### Bước 1: Đăng ký tài khoản
1. Truy cập: https://cloudinary.com/users/register/free
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

### Bước 2: Lấy thông tin cấu hình
1. Đăng nhập vào Dashboard
2. Lấy **Cloud Name** (hiển thị ở đầu trang)
3. Vào **Settings** → **Upload** → **Upload presets**
4. Click **Add upload preset**
   - **Upload preset name:** `event_covers` (hoặc tên bất kỳ)
   - **Signing Mode:** Chọn **Unsigned**
   - **Folder:** `events` (optional)
   - Click **Save**

### Bước 3: Cấu hình Frontend
```javascript
// src/config/cloudinary.js
export const CLOUDINARY_CONFIG = {
  cloudName: 'dttmpc0',           // ← Cloud name của bạn
  uploadPreset: 'event_covers',   // ← Preset vừa tạo
  apiUrl: 'https://api.cloudinary.com/v1_1/dttmpc0/image/upload'
};
```

---

## 💻 CODE IMPLEMENTATION

### 1. Upload Service (Tái sử dụng)

```javascript
// services/cloudinaryService.js
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export const cloudinaryService = {
  /**
   * Upload ảnh lên Cloudinary
   * @param {File} file - File ảnh (từ input type="file")
   * @param {string} folder - Folder trong Cloudinary (optional)
   * @returns {Promise} URL của ảnh đã upload
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
```

---

## 📝 USAGE EXAMPLES

### 2. Create Event với Upload Ảnh

```jsx
// components/CreateEventForm.jsx
import React, { useState } from 'react';
import { cloudinaryService } from '../services/cloudinaryService';
import { eventService } from '../services/eventService';

const CreateEventForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // ... other fields
  });
  const [coverImage, setCoverImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = cloudinaryService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setCoverImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let coverImageUrl = '';

      // Bước 1: Upload ảnh nếu có
      if (coverImage) {
        const uploadResult = await cloudinaryService.uploadImageWithProgress(
          coverImage,
          (progress) => setUploadProgress(progress)
        );
        coverImageUrl = uploadResult.secure_url;
      }

      // Bước 2: Tạo event với URL ảnh
      const eventData = {
        ...formData,
        cover_image_url: coverImageUrl,
      };

      await eventService.createEvent(eventData, token);
      alert('Tạo sự kiện thành công!');
      // Redirect hoặc reset form
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tiêu đề</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      {/* Image Upload */}
      <div>
        <label>Ảnh bìa sự kiện</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleImageChange}
        />
        
        {/* Preview */}
        {coverImage && (
          <div className="image-preview">
            <img 
              src={URL.createObjectURL(coverImage)} 
              alt="Preview" 
              style={{ maxWidth: '300px', marginTop: '10px' }}
            />
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar">
            <div style={{ width: `${uploadProgress}%` }}>
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Tạo sự kiện'}
      </button>
    </form>
  );
};

export default CreateEventForm;
```

---

### 3. Update Event với Upload Ảnh

```jsx
// components/EditEventForm.jsx
import React, { useState, useEffect } from 'react';
import { cloudinaryService } from '../services/cloudinaryService';
import { eventService } from '../services/eventService';

const EditEventForm = ({ eventId, token }) => {
  const [event, setEvent] = useState(null);
  const [newCoverImage, setNewCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load event data
    const fetchEvent = async () => {
      const data = await eventService.getEventById(eventId, token);
      setEvent(data);
    };
    fetchEvent();
  }, [eventId, token]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = cloudinaryService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setNewCoverImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let coverImageUrl = event.cover_image_url; // Giữ URL cũ

      // Nếu có ảnh mới, upload và thay thế
      if (newCoverImage) {
        const uploadResult = await cloudinaryService.uploadImage(newCoverImage);
        coverImageUrl = uploadResult.secure_url;
      }

      // Update event
      await eventService.updateEvent(
        eventId,
        {
          title: event.title,
          description: event.description,
          cover_image_url: coverImageUrl, // URL mới hoặc cũ
          // ... other fields
        },
        token
      );

      alert('Cập nhật sự kiện thành công!');
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tiêu đề</label>
        <input
          type="text"
          value={event.title}
          onChange={(e) => setEvent({ ...event, title: e.target.value })}
        />
      </div>

      {/* Current Image */}
      <div>
        <label>Ảnh bìa hiện tại</label>
        {event.cover_image_url && (
          <img 
            src={event.cover_image_url} 
            alt="Current cover" 
            style={{ maxWidth: '300px' }}
          />
        )}
      </div>

      {/* Upload New Image */}
      <div>
        <label>Thay đổi ảnh bìa (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        
        {newCoverImage && (
          <div>
            <p>Ảnh mới:</p>
            <img 
              src={URL.createObjectURL(newCoverImage)} 
              alt="New preview" 
              style={{ maxWidth: '300px' }}
            />
          </div>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Đang cập nhật...' : 'Cập nhật sự kiện'}
      </button>
    </form>
  );
};

export default EditEventForm;
```

---

## 🎨 UI COMPONENT - Image Upload

```jsx
// components/ImageUploader.jsx
import React, { useState } from 'react';
import { cloudinaryService } from '../services/cloudinaryService';

const ImageUploader = ({
  currentImageUrl,
  onImageUploaded,
  label = 'Ảnh bìa',
}) => {
  const [preview, setPreview] = useState(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = cloudinaryService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Show preview
    setPreview(URL.createObjectURL(file));

    // Upload
    setUploading(true);
    try {
      const result = await cloudinaryService.uploadImageWithProgress(
        file,
        setProgress
      );
      onImageUploaded(result.secure_url);
      setPreview(result.secure_url);
    } catch (error) {
      alert(error.message);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="image-uploader">
      <label>{label}</label>
      
      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" style={{ maxWidth: '100%' }} />
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }}>{progress}%</div>
          </div>
          <p>Đang upload...</p>
        </div>
      )}

      <p className="help-text">
        Chấp nhận: JPG, PNG, WEBP. Tối đa 5MB.
      </p>
    </div>
  );
};

export default ImageUploader;
```

### Sử dụng ImageUploader:

```tsx
// Trong CreateEventForm hoặc EditEventForm
<ImageUploader
  currentImageUrl={event?.cover_image_url}
  onImageUploaded={(url) => setFormData({ ...formData, cover_image_url: url })}
  label="Ảnh bìa sự kiện"
/>
```

---

## 🔒 BẢO MẬT & BEST PRACTICES

### 1. Validate File
```javascript
// Luôn validate trước khi upload
const validation = cloudinaryService.validateImage(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

### 2. Handle Errors
```javascript
try {
  const result = await cloudinaryService.uploadImage(file);
  // Success
} catch (error) {
  // Show user-friendly error
  alert('Upload thất bại. Vui lòng thử lại.');
}
```

### 3. Optimize Image (Cloudinary)
```javascript
// Cloudinary tự động optimize, nhưng có thể customize URL
const optimizedUrl = result.secure_url.replace(
  '/upload/',
  '/upload/q_auto,f_auto,w_1200/' // Quality auto, format auto, width 1200px
);
```

### 4. Clean up Preview URLs
```javascript
useEffect(() => {
  return () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
  };
}, [preview]);
```

---

## 📌 NOTES

1. **Không cần backend code** - Frontend upload trực tiếp lên Cloudinary
2. **Free tier:** 10GB storage, 25GB bandwidth/tháng
3. **URL format:** `https://res.cloudinary.com/your_cloud_name/image/upload/v123456/events/abc.jpg`
4. **Tự động optimize:** Cloudinary tự động compress và convert format tối ưu
5. **CDN global:** Ảnh load nhanh từ CDN gần nhất

---

## 🚀 NEXT STEPS

Sau khi hoàn thành upload ảnh:
1. Test với file ảnh thật
2. Implement cho các fields khác nếu cần (gallery, logo, etc.)
3. Tích hợp vào form Create/Update Event
