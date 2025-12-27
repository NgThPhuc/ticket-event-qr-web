# Hướng dẫn tích hợp Categories API cho Frontend

## Tổng quan

Backend đã thêm tính năng **Categories (Danh mục sự kiện)** hỗ trợ multi-select. Tài liệu này mô tả các API endpoints mới và cách tích hợp vào Frontend.

---

## 1. Database Schema Changes

### Category Model
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key |
| `name` | String | Tên danh mục (Unique) |
| `slug` | String | URL-safe identifier (Unique) |
| `description` | String? | Mô tả |
| `icon` | String? | Icon name hoặc URL (emoji) |
| `color` | String? | Hex color code |
| `is_active` | Boolean | Trạng thái hoạt động |
| `order` | Int | Thứ tự hiển thị |

### EventCategory (Bảng trung gian)
- Mối quan hệ **Many-to-Many** giữa Event và Category
- Một Event có thể thuộc nhiều Categories
- Một Category có thể chứa nhiều Events

---

## 2. Categories API Endpoints

### 2.1. Lấy danh sách Categories (Public)

```
GET /categories
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Âm nhạc",
      "slug": "am-nhac",
      "description": "Các sự kiện âm nhạc, concert, liveshow",
      "icon": "🎵",
      "color": "#EF4444",
      "is_active": true,
      "order": 1,
      "created_at": "2024-12-27T12:00:00Z",
      "updated_at": "2024-12-27T12:00:00Z"
    }
  ]
}
```

> ⚠️ **Lưu ý:** API này chỉ trả về categories có `is_active = true`

---

### 2.2. Lấy tất cả Categories (Admin)

```
GET /categories/all
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** Trả về tất cả categories, kể cả inactive

---

### 2.3. Lấy chi tiết Category theo ID

```
GET /categories/:id
```

**Response:**
```json
{
  "id": "uuid-1",
  "name": "Âm nhạc",
  "slug": "am-nhac",
  ...
}
```

---

### 2.4. Lấy Category theo Slug

```
GET /categories/slug/:slug
```

**Example:** `GET /categories/slug/am-nhac`

---

### 2.5. Tạo Category mới (Admin)

```
POST /categories
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Tên danh mục",       // required
  "description": "Mô tả",      // optional
  "icon": "🎵",                // optional
  "color": "#EF4444",          // optional, hex color
  "order": 1,                  // optional, default: 0
  "is_active": true            // optional, default: true
}
```

---

### 2.6. Cập nhật Category (Admin)

```
PUT /categories/:id
```

**Request Body:** Tất cả fields đều optional, chỉ gửi những field cần cập nhật

---

### 2.7. Toggle Active Status (Admin)

```
PATCH /categories/:id/toggle-active
```

**Response:**
```json
{
  "id": "uuid-1",
  "is_active": false,
  ...
}
```

---

### 2.8. Xóa Category (Admin)

```
DELETE /categories/:id
```

---

## 3. Events API Updates

### 3.1. Tạo Event với Categories

```
POST /events
```

**Request Body mới:**
```json
{
  "title": "Tech Conference 2024",
  "description": "...",
  "category_ids": [
    "uuid-category-1",
    "uuid-category-2"
  ],
  ...other_event_fields
}
```

| Field | Type | Description |
|-------|------|-------------|
| `category_ids` | String[]? | Array các Category UUIDs (optional) |

---

### 3.2. Cập nhật Categories của Event

```
PUT /events/:id
```

**Request Body:**
```json
{
  "category_ids": ["uuid-new-category-1", "uuid-new-category-2"]
}
```

> ⚠️ **Lưu ý:** Khi cập nhật `category_ids`, tất cả categories cũ sẽ bị XÓA và thay thế bằng danh sách mới

---

### 3.3. Filter Events theo Categories

```
GET /events/public?category_ids=uuid1,uuid2,uuid3
```

hoặc

```
GET /events/public?category_slugs=am-nhac,the-thao
```

| Query Param | Type | Description |
|-------------|------|-------------|
| `category_ids` | String | Comma-separated list Category UUIDs |
| `category_slugs` | String | Comma-separated list Category slugs |

---

### 3.4. Event Response Format

Mọi API lấy Event giờ sẽ bao gồm thông tin categories:

```json
{
  "id": "event-uuid",
  "title": "Event Title",
  "categories": [
    {
      "category": {
        "id": "uuid-1",
        "name": "Âm nhạc",
        "slug": "am-nhac",
        "icon": "🎵",
        "color": "#EF4444"
      }
    },
    {
      "category": {
        "id": "uuid-2",
        "name": "Giải trí",
        "slug": "giai-tri",
        "icon": "🎉",
        "color": "#8B5CF6"
      }
    }
  ],
  ...other_fields
}
```

---

## 4. Seed Categories (14 danh mục mặc định)

| Icon | Name | Slug | Color |
|------|------|------|-------|
| 🎵 | Âm nhạc | `am-nhac` | #EF4444 |
| 🏆 | Thể thao | `the-thao` | #22C55E |
| 🎨 | Nghệ thuật | `nghe-thuat` | #A855F7 |
| 💻 | Công nghệ | `cong-nghe` | #3B82F6 |
| 🎓 | Giáo dục | `giao-duc` | #F59E0B |
| 💼 | Kinh doanh | `kinh-doanh` | #6366F1 |
| 🍴 | Ẩm thực | `am-thuc` | #F43F5E |
| ✈️ | Du lịch | `du-lich` | #0EA5E9 |
| ❤️ | Sức khỏe | `suc-khoe` | #EC4899 |
| 👥 | Cộng đồng | `cong-dong` | #10B981 |
| 🎉 | Giải trí | `giai-tri` | #8B5CF6 |
| 🎬 | Phim ảnh | `phim-anh` | #EF4444 |
| 👔 | Thời trang | `thoi-trang` | #E11D48 |
| ⋯ | Khác | `khac` | #6B7280 |

---

## 5. Frontend Implementation Checklist

### 5.1. Hiển thị Categories
- [ ] Fetch categories từ `GET /categories`
- [ ] Hiển thị danh sách categories trên trang chủ/sidebar
- [ ] Hiển thị icon và color của category

### 5.2. Filter Events
- [ ] Thêm filter dropdown/chips để lọc theo categories
- [ ] Gọi API với query params `category_ids` hoặc `category_slugs`

### 5.3. Tạo/Sửa Event (Admin)
- [ ] Thêm multi-select component cho `category_ids`
- [ ] Gửi mảng `category_ids` khi tạo/cập nhật event

### 5.4. Event Detail Page
- [ ] Hiển thị categories của event
- [ ] Mỗi category tag hiển thị icon + name + color

### 5.5. Admin Panel
- [ ] CRUD Categories (Tạo, Sửa, Xóa, Toggle Active)
- [ ] Hiển thị số events thuộc mỗi category (nếu cần)

---

## 6. Code Examples

### React: Fetch Categories

```jsx
const [categories, setCategories] = useState([]);

useEffect(() => {
  fetch('/api/categories')
    .then(res => res.json())
    .then(data => setCategories(data.data));
}, []);
```

### React: Multi-Select Categories

```jsx
<Select
  mode="multiple"
  placeholder="Chọn danh mục"
  value={selectedCategoryIds}
  onChange={setSelectedCategoryIds}
>
  {categories.map(cat => (
    <Select.Option key={cat.id} value={cat.id}>
      {cat.icon} {cat.name}
    </Select.Option>
  ))}
</Select>
```

### React: Filter Events

```jsx
const filterByCategories = (categoryIds) => {
  const query = categoryIds.join(',');
  fetch(`/api/events/public?category_ids=${query}`)
    .then(res => res.json())
    .then(data => setEvents(data.data));
};
```

### React: Display Category Tags

```jsx
{event.categories.map(({ category }) => (
  <Tag 
    key={category.id} 
    style={{ backgroundColor: category.color, color: 'white' }}
  >
    {category.icon} {category.name}
  </Tag>
))}
```

---

## 7. Ghi chú bổ sung

1. **Backward Compatibility:** Field `category` (string) cũ trong Event vẫn được giữ lại nhưng không còn sử dụng. Frontend nên chuyển sang dùng `categories` array mới.

2. **Authentication:** Các API CRUD categories (POST, PUT, PATCH, DELETE) yêu cầu quyền **Platform Admin**.

3. **Validation:** 
   - `category_ids` phải là mảng UUID hợp lệ
   - Category `name` và `slug` phải unique

---

**Ngày cập nhật:** 27/12/2024
