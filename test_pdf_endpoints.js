// Test script cho các endpoint PDF mới
const API_BASE_URL = 'http://localhost:5000/api';

// Test 1: Kiểm tra health endpoint
async function testHealth() {
    console.log('🔍 Testing health endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const health = await response.json();
        console.log('✅ Health check:', health);
        
        if (health.features && health.features.pdfSupport) {
            console.log('✅ PDF support confirmed');
        } else {
            console.log('❌ PDF support not found');
        }
    } catch (error) {
        console.error('❌ Health check failed:', error);
    }
}

// Test 2: Kiểm tra supported types
async function testSupportedTypes() {
    console.log('🔍 Testing supported types...');
    try {
        const response = await fetch(`${API_BASE_URL}/supported-types`);
        const types = await response.json();
        console.log('✅ Supported types:', types);
        
        if (types.supportedTypes.includes('.pdf')) {
            console.log('✅ PDF type supported');
        } else {
            console.log('❌ PDF type not supported');
        }
    } catch (error) {
        console.error('❌ Supported types check failed:', error);
    }
}

// Test 3: Upload PDF (cần file test.pdf)
async function testUploadPDF() {
    console.log('🔍 Testing PDF upload...');
    
    // Tạo form data với file test
    const formData = new FormData();
    formData.append('title', 'Test PDF Document');
    formData.append('author', 'Test Author');
    formData.append('category', 'Test');
    formData.append('description', 'Test PDF upload with new endpoints');
    
    // Tạo file PDF test (1KB)
    const pdfContent = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xC7, 0xEC, 0x8F, 0xA2, 0x0A, 0x31,
        0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x43,
        0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30,
        0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x32, 0x20, 0x30, 0x20,
        0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61, 0x67, 0x65,
        0x73, 0x2F, 0x4B, 0x69, 0x64, 0x73, 0x5B, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5D, 0x3E, 0x3E, 0x0A,
        0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x33, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C,
        0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x2F, 0x4D, 0x65, 0x64, 0x69,
        0x61, 0x42, 0x6F, 0x78, 0x5B, 0x30, 0x20, 0x30, 0x20, 0x36, 0x31, 0x32, 0x20, 0x37, 0x39, 0x32,
        0x5D, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x78, 0x72, 0x65, 0x66, 0x0A,
        0x30, 0x20, 0x34, 0x0A, 0x25, 0x25, 0x45, 0x4F, 0x46, 0x0A
    ]);
    
    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
    formData.append('file', pdfBlob, 'test.pdf');
    
    try {
        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ PDF upload successful:', result);
            
            // Kiểm tra URLs
            if (result.previewUrl && result.downloadUrl) {
                console.log('✅ Preview URL:', result.previewUrl);
                console.log('✅ Download URL:', result.downloadUrl);
                return result._id;
            } else {
                console.log('❌ URLs not found');
            }
        } else {
            const error = await response.text();
            console.error('❌ PDF upload failed:', error);
        }
    } catch (error) {
        console.error('❌ PDF upload error:', error);
    }
    return null;
}

// Test 4: Test preview endpoint
async function testPreview(documentId) {
    if (!documentId) {
        console.log('❌ No document ID for preview test');
        return;
    }
    
    console.log('🔍 Testing preview endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/preview`, {
            method: 'HEAD'
        });
        
        console.log('✅ Preview response status:', response.status);
        console.log('✅ Content-Type:', response.headers.get('Content-Type'));
        console.log('✅ Content-Disposition:', response.headers.get('Content-Disposition'));
        
        if (response.headers.get('Content-Type') === 'application/pdf') {
            console.log('✅ PDF Content-Type correct');
        } else {
            console.log('❌ PDF Content-Type incorrect');
        }
    } catch (error) {
        console.error('❌ Preview test failed:', error);
    }
}

// Test 5: Test download endpoint
async function testDownload(documentId) {
    if (!documentId) {
        console.log('❌ No document ID for download test');
        return;
    }
    
    console.log('🔍 Testing download endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
            method: 'HEAD'
        });
        
        console.log('✅ Download response status:', response.status);
        console.log('✅ Content-Type:', response.headers.get('Content-Type'));
        console.log('✅ Content-Disposition:', response.headers.get('Content-Disposition'));
        
        if (response.headers.get('Content-Disposition')?.includes('attachment')) {
            console.log('✅ Download Content-Disposition correct');
        } else {
            console.log('❌ Download Content-Disposition incorrect');
        }
    } catch (error) {
        console.error('❌ Download test failed:', error);
    }
}

// Test 6: Test document info endpoint
async function testDocumentInfo(documentId) {
    if (!documentId) {
        console.log('❌ No document ID for info test');
        return;
    }
    
    console.log('🔍 Testing document info endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
        const doc = await response.json();
        
        console.log('✅ Document info:', doc);
        
        if (doc.urls && doc.urls.preview && doc.urls.download) {
            console.log('✅ URLs object found');
            console.log('✅ Preview URL:', doc.urls.preview);
            console.log('✅ Download URL:', doc.urls.download);
        } else {
            console.log('❌ URLs object not found');
        }
    } catch (error) {
        console.error('❌ Document info test failed:', error);
    }
}

// Chạy tất cả tests
async function runAllTests() {
    console.log('🚀 Starting PDF endpoint tests...\n');
    
    await testHealth();
    console.log('');
    
    await testSupportedTypes();
    console.log('');
    
    const documentId = await testUploadPDF();
    console.log('');
    
    if (documentId) {
        await testPreview(documentId);
        console.log('');
        
        await testDownload(documentId);
        console.log('');
        
        await testDocumentInfo(documentId);
        console.log('');
    }
    
    console.log('✅ All tests completed!');
}

// Export cho Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testHealth,
        testSupportedTypes,
        testUploadPDF,
        testPreview,
        testDownload,
        testDocumentInfo,
        runAllTests
    };
}

// Chạy tests nếu được gọi trực tiếp
if (typeof window === 'undefined') {
    runAllTests();
}
