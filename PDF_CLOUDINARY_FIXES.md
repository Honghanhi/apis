# Cải tiến xử lý PDF với Cloudinary

## 🎯 Vấn đề đã giải quyết

### 1. **Cloudinary PDF Upload**
- ✅ Sử dụng `resource_type: 'raw'` cho PDF
- ✅ Thêm flags đặc biệt: `attachment` và `transformation`
- ✅ Đảm bảo `content_type: 'application/pdf'`

### 2. **URL Format cho Download vs Preview**
- ✅ **Preview URL**: Hiển thị PDF inline trong browser
- ✅ **Download URL**: Tự động download với `?flags=attachment`
- ✅ **Raw URL**: Sử dụng `/raw/upload/` cho PDF

### 3. **MIME Type và Content-Type**
- ✅ Validation MIME type cho PDF upload
- ✅ Header `Content-Type: application/pdf` cho preview
- ✅ Header `Content-Disposition: attachment` cho download

## 🚀 Các endpoint mới

### Upload PDF
```javascript
POST /api/documents
Content-Type: multipart/form-data

// File sẽ được upload với:
// - resource_type: 'raw'
// - flags: 'attachment'
// - content_type: 'application/pdf'
```

### Preview PDF
```javascript
GET /api/documents/:id/preview
// Trả về PDF với Content-Type đúng để hiển thị inline
```

### Download PDF
```javascript
GET /api/documents/:id/download
// Trả về PDF với Content-Disposition: attachment để download
```

### Thông tin file
```javascript
GET /api/documents/:id
// Trả về object với URLs:
{
  urls: {
    preview: "https://res.cloudinary.com/.../upload/...",
    download: "https://res.cloudinary.com/.../raw/upload/...?flags=attachment",
    original: "https://res.cloudinary.com/.../upload/..."
  }
}
```

## 📊 Schema Database cập nhật

```javascript
const documentSchema = {
  // ... existing fields
  previewUrl: { type: String, required: true },    // URL cho preview
  downloadUrl: { type: String, required: true },   // URL cho download
  fileType: { type: String, required: true }       // Loại file (.pdf, .doc, etc.)
}
```

## 🔧 Helper Functions

### `createCloudinaryUrls(secureUrl, fileType)`
Tạo URLs đúng format cho từng loại file:
- **PDF**: Preview URL + Download URL với flags
- **Khác**: Cùng URL cho cả preview và download

### `uploadToCloudinary(buffer, originalName)`
Upload với cấu hình đặc biệt cho PDF:
- Resource type: `raw`
- Flags: `attachment`
- Transformation: `{ flags: 'attachment' }`

## 🎨 Frontend Integration

### Sử dụng URLs
```javascript
// Preview PDF
window.open(`/api/documents/${id}/preview`, '_blank');

// Download PDF
window.open(`/api/documents/${id}/download`, '_blank');

// Hoặc sử dụng URLs trực tiếp
const doc = await fetch(`/api/documents/${id}`);
const { urls } = await doc.json();
window.open(urls.preview, '_blank');  // Preview
window.open(urls.download, '_blank'); // Download
```

## ✅ Validation cải tiến

### File Upload
- Kiểm tra MIME type cho PDF: `application/pdf`
- Kiểm tra extension: `.pdf`
- Giới hạn kích thước: 10MB

### Error Handling
- File PDF không hợp lệ
- Loại file không được hỗ trợ
- Lỗi upload Cloudinary

## 🔍 Testing

### Kiểm tra upload PDF
```bash
curl -X POST http://localhost:5000/api/documents \
  -F "file=@test.pdf" \
  -F "title=Test PDF" \
  -F "category=Test"
```

### Kiểm tra preview
```bash
curl -I http://localhost:5000/api/documents/:id/preview
# Phải có: Content-Type: application/pdf
```

### Kiểm tra download
```bash
curl -I http://localhost:5000/api/documents/:id/download
# Phải có: Content-Disposition: attachment
```

## 🎯 Ưu tiên đã hoàn thành

1. ✅ **Quan trọng nhất**: Upload được PDF với Cloudinary
2. ✅ **Thứ hai**: Download hoạt động với URL riêng
3. ✅ **Cuối cùng**: Preview đẹp hơn với Content-Type đúng

## 🚀 Next Steps

1. **Frontend**: Cập nhật UI để sử dụng endpoints mới
2. **Testing**: Test với nhiều loại PDF khác nhau
3. **Performance**: Tối ưu cache cho PDF preview
4. **Security**: Thêm authentication cho download
