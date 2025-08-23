# Hướng dẫn Troubleshooting - Hệ thống Quản lý Tài liệu

## 🚨 Lỗi thường gặp và cách khắc phục

### 1. **Lỗi Upload File**

#### ❌ Lỗi: "Không có file được tải lên"
**Nguyên nhân**: Chưa chọn file hoặc form data không đúng
**Giải pháp**:
```javascript
// Kiểm tra form data
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'Document Title');
formData.append('category', 'Category');
```

#### ❌ Lỗi: "File PDF không hợp lệ"
**Nguyên nhân**: File không phải PDF thật hoặc bị hỏng
**Giải pháp**:
- Kiểm tra file có extension `.pdf` không
- Kiểm tra MIME type có phải `application/pdf` không
- Thử mở file trong PDF reader để đảm bảo file không bị hỏng

#### ❌ Lỗi: "File quá lớn. Giới hạn 10MB"
**Nguyên nhân**: File vượt quá giới hạn kích thước
**Giải pháp**:
- Nén file PDF trước khi upload
- Chia nhỏ file thành nhiều phần
- Sử dụng công cụ nén PDF online

#### ❌ Lỗi: "Loại file không được hỗ trợ"
**Nguyên nhân**: File không thuộc danh sách được phép
**Giải pháp**:
- Chỉ upload các loại file: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.txt`
- Đổi tên file nếu cần thiết

### 2. **Lỗi Preview File**

#### ❌ Lỗi: "Không tìm thấy tài liệu"
**Nguyên nhân**: ID tài liệu không tồn tại hoặc bị xóa
**Giải pháp**:
- Kiểm tra lại ID tài liệu
- Refresh trang để load lại danh sách
- Kiểm tra database có tài liệu không

#### ❌ Lỗi: "Không tìm thấy URL preview"
**Nguyên nhân**: URL preview bị thiếu hoặc lỗi
**Giải pháp**:
- Kiểm tra Cloudinary credentials
- Kiểm tra file có tồn tại trên Cloudinary không
- Upload lại file nếu cần

#### ❌ Lỗi: "Trình duyệt chặn popup"
**Nguyên nhân**: Popup blocker của trình duyệt
**Giải pháp**:
- Cho phép popup cho website này
- Sử dụng Ctrl+Click để mở trong tab mới
- Tắt popup blocker tạm thời

### 3. **Lỗi Download File**

#### ❌ Lỗi: "Không tìm thấy link tải xuống"
**Nguyên nhân**: URL download bị thiếu hoặc lỗi
**Giải pháp**:
- Kiểm tra Cloudinary configuration
- Kiểm tra file có tồn tại trên Cloudinary không
- Upload lại file nếu cần

#### ❌ Lỗi: "Content-Disposition không đúng"
**Nguyên nhân**: Header response không đúng
**Giải pháp**:
- Kiểm tra endpoint `/download` có hoạt động không
- Kiểm tra Cloudinary flags có đúng không
- Restart server nếu cần

### 4. **Lỗi Server**

#### ❌ Lỗi: "Lỗi kết nối MongoDB"
**Nguyên nhân**: Database không khả dụng
**Giải pháp**:
```bash
# Kiểm tra MongoDB connection
mongo --host your-mongodb-host --port 27017

# Kiểm tra environment variables
echo $MONGODB_URI
```

#### ❌ Lỗi: "Lỗi Cloudinary upload"
**Nguyên nhân**: Cloudinary credentials sai hoặc hết quota
**Giải pháp**:
```bash
# Kiểm tra environment variables
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET

# Kiểm tra Cloudinary dashboard
# Xem quota và usage
```

#### ❌ Lỗi: "CORS error"
**Nguyên nhân**: CORS configuration không đúng
**Giải pháp**:
```javascript
// Kiểm tra CORS_ORIGINS trong .env
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

// Hoặc tạm thời cho phép tất cả origins
app.use(cors({
  origin: true
}));
```

### 5. **Lỗi Frontend**

#### ❌ Lỗi: "API_BASE_URL không đúng"
**Nguyên nhân**: URL API không khớp với server
**Giải pháp**:
```javascript
// Kiểm tra trong index.html
const API_BASE_URL = 'http://localhost:5000/api';

// Đảm bảo server đang chạy trên port 5000
```

#### ❌ Lỗi: "Network error"
**Nguyên nhân**: Server không chạy hoặc network issue
**Giải pháp**:
```bash
# Kiểm tra server có chạy không
curl http://localhost:5000/api/health

# Restart server nếu cần
npm start
```

## 🔧 Debug Commands

### Kiểm tra Server Status
```bash
# Health check
curl http://localhost:5000/api/health

# Supported types
curl http://localhost:5000/api/supported-types

# List documents
curl http://localhost:5000/api/documents
```

### Kiểm tra Upload
```bash
# Upload test file
curl -X POST http://localhost:5000/api/documents \
  -F "file=@test.pdf" \
  -F "title=Test" \
  -F "category=Test"
```

### Kiểm tra Preview/Download
```bash
# Preview (HEAD request)
curl -I http://localhost:5000/api/documents/DOCUMENT_ID/preview

# Download (HEAD request)
curl -I http://localhost:5000/api/documents/DOCUMENT_ID/download
```

## 🧪 Test Scripts

### Chạy test toàn diện
```bash
node test_all_functions.js
```

### Chạy test cơ bản
```bash
node test_pdf_endpoints.js
```

## 📊 Monitoring

### Server Logs
```bash
# Xem logs real-time
npm start 2>&1 | tee server.log

# Tìm lỗi trong logs
grep -i error server.log
grep -i "upload\|preview\|download" server.log
```

### Database Check
```bash
# Kiểm tra documents trong MongoDB
mongo your-database --eval "db.documents.find().pretty()"

# Kiểm tra document cụ thể
mongo your-database --eval "db.documents.findOne({_id: ObjectId('DOCUMENT_ID')})"
```

### Cloudinary Check
```bash
# Kiểm tra file trên Cloudinary
curl "https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/YOUR_PUBLIC_ID"
```

## 🚀 Performance Issues

### Upload chậm
**Nguyên nhân**: File lớn hoặc network chậm
**Giải pháp**:
- Nén file trước khi upload
- Sử dụng progress bar để hiển thị tiến trình
- Tăng timeout cho upload

### Preview không load
**Nguyên nhân**: Cloudinary CDN chậm
**Giải pháp**:
- Kiểm tra network connection
- Sử dụng cache cho preview
- Thêm loading indicator

### Download bị gián đoạn
**Nguyên nhân**: Network không ổn định
**Giải pháp**:
- Sử dụng resume download
- Thêm retry mechanism
- Hiển thị download progress

## 🔒 Security Issues

### File validation bypass
**Nguyên nhân**: Validation không đủ mạnh
**Giải pháp**:
```javascript
// Thêm validation chặt chẽ hơn
const allowedMimeTypes = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

// Kiểm tra cả extension và MIME type
if (allowedMimeTypes[fileExtension] !== file.mimetype) {
  throw new Error('File type mismatch');
}
```

### CORS security
**Nguyên nhân**: CORS configuration quá mở
**Giải pháp**:
```javascript
// Chỉ cho phép origins cụ thể
const allowedOrigins = ['https://yourdomain.com', 'http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

## 📞 Support

### Khi nào cần liên hệ support
- Lỗi không thể khắc phục bằng các bước trên
- Performance issues nghiêm trọng
- Security vulnerabilities
- Feature requests

### Thông tin cần cung cấp
- Error message đầy đủ
- Steps to reproduce
- Environment details (OS, browser, Node.js version)
- Server logs
- Network tab trong browser dev tools

### Contact
- Email: support@yourdomain.com
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://yourdomain.com/docs
