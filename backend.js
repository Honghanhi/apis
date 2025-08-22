const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS với danh sách nguồn cho phép từ env (CORS_ORIGINS), phân tách dấu phẩy
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('CORS Origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    console.log('Request from origin:', origin);
    
    // Cho phép requests không có origin (file://, local development)
    if (!origin) {
      console.log('Allowing request without origin (file:// or local dev)');
      return callback(null, true);
    }
    
    // Cho phép tất cả origin tạm thời để debug
    console.log('Allowing origin:', origin);
    return callback(null, true);
  },
  credentials: false
}));
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Cloudinary config (for file storage)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Document schema
const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, default: 'Không rõ tác giả' },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: String, required: true },
  uploadTime: { type: Date, default: Date.now },
  cloudinaryPublicId: { type: String, required: true }
});

const Document = mongoose.model('Document', documentSchema);

// Multer config for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Loại file không được hỗ trợ'), false);
    }
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Upload file to Cloudinary
async function uploadToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const fileExtension = path.extname(originalName).toLowerCase();
    
    // Xác định resource_type dựa trên loại file
    let resourceType = 'raw';
    let uploadOptions = {
      public_id: `documents/${Date.now()}_${originalName}`,
      use_filename: true,
      unique_filename: false,
    };

    // Đặc biệt xử lý cho PDF để đảm bảo Content-Type đúng
    if (fileExtension === '.pdf') {
      resourceType = 'raw';
      uploadOptions = {
        ...uploadOptions,
        resource_type: 'raw',
        format: 'pdf',
        flags: 'attachment',
        content_type: 'application/pdf'
      };
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
      resourceType = 'image';
    } else {
      resourceType = 'raw';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        ...uploadOptions
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          // Đảm bảo URL có format đúng cho PDF
          if (fileExtension === '.pdf') {
            result.secure_url = result.secure_url.replace('/upload/', '/raw/upload/');
          }
          resolve(result);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

// Routes

// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const { search, category, sort = 'uploadTime:desc' } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const [sortField, sortDir] = String(sort).split(':');
    const sortObj = { [sortField || 'uploadTime']: (sortDir === 'asc' ? 1 : -1) };

    const documents = await Document.find(query).sort(sortObj);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document by ID
app.get('/api/documents/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview document
app.get('/api/documents/:id/preview', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    
    const fileExtension = path.extname(document.fileName).toLowerCase();
    
    // Đặc biệt xử lý cho PDF để đảm bảo Content-Type đúng
    if (fileExtension === '.pdf') {
      // Thêm header để browser hiển thị PDF inline
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + document.fileName + '"');
    }
    
    // Redirect to Cloudinary URL for preview
    res.redirect(document.fileUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update document metadata
app.patch('/api/documents/:id', async (req, res) => {
  try {
    const { title, author, category, description } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (author !== undefined) update.author = author;
    if (category !== undefined) update.category = category;
    if (description !== undefined) update.description = description;

    const updated = await Document.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload new document
app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file được tải lên' });
    }

    const { title, author, category, description } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({ error: 'Tiêu đề và thể loại là bắt buộc' });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    
    // Create document in database
    const newDocument = new Document({
      title,
      author: author || 'Không rõ tác giả',
      category,
      description: description || '',
      fileName: req.file.originalname,
      fileUrl: cloudinaryResult.secure_url,
      fileSize: formatFileSize(req.file.size),
      cloudinaryPublicId: cloudinaryResult.public_id
    });

    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(document.cloudinaryPublicId, { resource_type: 'raw' });
    
    // Delete from database
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Tài liệu đã được xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Document.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Không serve frontend tại backend (frontend deploy trên Vercel)

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Lỗi server nội bộ' });
});

// Start server
mongoose.connection.once('open', () => {
  console.log('✅ Kết nối MongoDB thành công');
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Lỗi kết nối MongoDB:', err);
});
