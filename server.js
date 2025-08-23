import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS (hỗ trợ cấu hình động qua env CORS_ORIGINS, phân tách bằng dấu phẩy)
const allowedOriginsFromEnv = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const isLocal = /^(http|https):\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    const isAllowedByEnv = allowedOriginsFromEnv.includes(origin);
    if (isLocal || isAllowedByEnv) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: false
};

app.use(cors(corsOptions));

app.use(express.json());

// MongoDB
const mongoUri = process.env.MONGODB_URI;
let isMongoReady = false;
if (mongoUri && /^mongodb(\+srv)?:\/\//.test(mongoUri)) {
  mongoose.connect(mongoUri)
    .then(() => { isMongoReady = true; console.log('MongoDB connected'); })
    .catch((err) => { console.log('MongoDB connect failed:', err.message); });
} else {
  console.log('No valid MONGODB_URI provided; fallback to in-memory store');
}

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, default: '' },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  uploadTime: { type: Date, default: Date.now },
  fileName: { type: String, required: true },
  fileSize: { type: String, required: true },
  fileUrl: { type: String, required: true },
}, { timestamps: true });

const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

// Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
} else {
  console.log('Cloudinary credentials missing. Upload will be rejected.');
}

// Multer
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Helpers
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const num = bytes / Math.pow(1024, i);
  return `${num.toFixed(1)} ${sizes[i]}`;
}

function toResponse(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    _id: d._id?.toString?.() || d.id,
    title: d.title,
    author: d.author || '',
    category: d.category,
    description: d.description || '',
    uploadTime: d.uploadTime,
    fileName: d.fileName,
    fileSize: d.fileSize,
    fileUrl: d.fileUrl,
  };
}

// In-memory fallback
const memStore = [];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/documents', async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const q = (search || '').toString().toLowerCase();
    const cat = (category || '').toString();

    if (isMongoReady) {
      const filter = {
        ...(cat ? { category: cat } : {}),
        ...(q ? {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { author: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
          ]
        } : {})
      };
      const docs = await DocumentModel.find(filter).sort({ createdAt: -1 }).limit(200);
      res.json(docs.map(toResponse));
    } else {
      const docs = memStore.filter(d => (!cat || d.category === cat) && (!q || `${d.title} ${d.author} ${d.description}`.toLowerCase().includes(q)));
      res.json(docs.map(toResponse));
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    const { title, author = '', category, description = '' } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Thiếu file' });
    if (!title) return res.status(400).json({ error: 'Thiếu title' });
    if (!category) return res.status(400).json({ error: 'Thiếu category' });

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Cloudinary chưa cấu hình' });
    }

    const uploadResult = await cloudinary.uploader.upload_stream({
      folder: 'documents',
      resource_type: 'raw',
      filename_override: file.originalname,
      use_filename: true,
      unique_filename: true,
    }, async (error, result) => {
      if (error) {
        res.status(500).json({ error: error.message });
      } else {
        const doc = {
          title,
          author,
          category,
          description,
          uploadTime: new Date(),
          fileName: file.originalname,
          fileSize: formatBytes(file.size),
          fileUrl: result.secure_url,
        };

        if (isMongoReady) {
          const saved = await DocumentModel.create(doc);
          res.json(toResponse(saved));
        } else {
          const withId = { id: String(Date.now()), ...doc };
          memStore.unshift(withId);
          res.json(toResponse(withId));
        }
      }
    });

    // Pipe buffer to stream
    const stream = uploadResult;
    stream.end(file.buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});


