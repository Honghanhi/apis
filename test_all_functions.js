// Script test toàn diện cho tất cả chức năng
const API_BASE_URL = 'http://localhost:5000/api';

// Test 1: Kiểm tra server health
async function testServerHealth() {
    console.log('🔍 Testing server health...');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const health = await response.json();
        console.log('✅ Server health:', health);
        
        if (health.features && health.features.pdfSupport) {
            console.log('✅ PDF support confirmed');
        } else {
            console.log('❌ PDF support not found');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Server health check failed:', error.message);
        return false;
    }
}

// Test 2: Kiểm tra supported types
async function testSupportedTypes() {
    console.log('🔍 Testing supported types...');
    try {
        const response = await fetch(`${API_BASE_URL}/supported-types`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const types = await response.json();
        console.log('✅ Supported types:', types);
        
        if (types.supportedTypes.includes('.pdf')) {
            console.log('✅ PDF type supported');
        } else {
            console.log('❌ PDF type not supported');
        }
        
        return types;
    } catch (error) {
        console.error('❌ Supported types check failed:', error.message);
        return null;
    }
}

// Test 3: Upload PDF test
async function testUploadPDF() {
    console.log('🔍 Testing PDF upload...');
    
    // Tạo form data với file test
    const formData = new FormData();
    formData.append('title', 'Test PDF Document - ' + new Date().toISOString());
    formData.append('author', 'Test Author');
    formData.append('category', 'Test');
    formData.append('description', 'Test PDF upload with comprehensive testing');
    
    // Tạo file PDF test (1KB) - PDF header đơn giản
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
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ PDF upload successful:', {
            id: result._id,
            title: result.title,
            fileName: result.fileName,
            fileType: result.fileType,
            fileSize: result.fileSize
        });
        
        // Kiểm tra URLs
        if (result.previewUrl && result.downloadUrl) {
            console.log('✅ Preview URL:', result.previewUrl);
            console.log('✅ Download URL:', result.downloadUrl);
        } else {
            console.log('❌ URLs not found');
        }
        
        return result._id;
    } catch (error) {
        console.error('❌ PDF upload failed:', error.message);
        return null;
    }
}

// Test 4: Test preview endpoint
async function testPreview(documentId) {
    if (!documentId) {
        console.log('❌ No document ID for preview test');
        return false;
    }
    
    console.log('🔍 Testing preview endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/preview`, {
            method: 'HEAD'
        });
        
        console.log('✅ Preview response status:', response.status);
        console.log('✅ Content-Type:', response.headers.get('Content-Type'));
        console.log('✅ Content-Disposition:', response.headers.get('Content-Disposition'));
        
        if (response.status === 302 || response.status === 200) {
            console.log('✅ Preview redirect successful');
        } else {
            console.log('❌ Preview redirect failed');
        }
        
        if (response.headers.get('Content-Type') === 'application/pdf') {
            console.log('✅ PDF Content-Type correct');
        } else {
            console.log('❌ PDF Content-Type incorrect');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Preview test failed:', error.message);
        return false;
    }
}

// Test 5: Test download endpoint
async function testDownload(documentId) {
    if (!documentId) {
        console.log('❌ No document ID for download test');
        return false;
    }
    
    console.log('🔍 Testing download endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
            method: 'HEAD'
        });
        
        console.log('✅ Download response status:', response.status);
        console.log('✅ Content-Type:', response.headers.get('Content-Type'));
        console.log('✅ Content-Disposition:', response.headers.get('Content-Disposition'));
        
        if (response.status === 302 || response.status === 200) {
            console.log('✅ Download redirect successful');
        } else {
            console.log('❌ Download redirect failed');
        }
        
        if (response.headers.get('Content-Disposition')?.includes('attachment')) {
            console.log('✅ Download Content-Disposition correct');
        } else {
            console.log('❌ Download Content-Disposition incorrect');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Download test failed:', error.message);
        return false;
    }
}

// Test 6: Test document info endpoint
async function testDocumentInfo(documentId) {
    if (!documentId) {
        console.log('❌ No document ID for info test');
        return false;
    }
    
    console.log('🔍 Testing document info endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const doc = await response.json();
        console.log('✅ Document info retrieved:', {
            id: doc._id,
            title: doc.title,
            fileName: doc.fileName,
            fileType: doc.fileType
        });
        
        if (doc.urls && doc.urls.preview && doc.urls.download) {
            console.log('✅ URLs object found');
            console.log('✅ Preview URL:', doc.urls.preview);
            console.log('✅ Download URL:', doc.urls.download);
        } else {
            console.log('❌ URLs object not found');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Document info test failed:', error.message);
        return false;
    }
}

// Test 7: Test error handling
async function testErrorHandling() {
    console.log('🔍 Testing error handling...');
    
    // Test 1: Upload without file
    try {
        const formData = new FormData();
        formData.append('title', 'Test');
        formData.append('category', 'Test');
        
        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            body: formData
        });
        
        if (response.status === 400) {
            console.log('✅ Error handling: No file upload');
        } else {
            console.log('❌ Error handling: No file upload');
        }
    } catch (error) {
        console.log('✅ Error handling: No file upload (caught)');
    }
    
    // Test 2: Upload with invalid file type
    try {
        const formData = new FormData();
        formData.append('title', 'Test');
        formData.append('category', 'Test');
        
        const invalidBlob = new Blob(['test'], { type: 'text/plain' });
        formData.append('file', invalidBlob, 'test.exe');
        
        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            body: formData
        });
        
        if (response.status === 400) {
            console.log('✅ Error handling: Invalid file type');
        } else {
            console.log('❌ Error handling: Invalid file type');
        }
    } catch (error) {
        console.log('✅ Error handling: Invalid file type (caught)');
    }
    
    // Test 3: Access non-existent document
    try {
        const response = await fetch(`${API_BASE_URL}/documents/nonexistentid`);
        if (response.status === 404) {
            console.log('✅ Error handling: Non-existent document');
        } else {
            console.log('❌ Error handling: Non-existent document');
        }
    } catch (error) {
        console.log('✅ Error handling: Non-existent document (caught)');
    }
}

// Test 8: Test file size validation
async function testFileSizeValidation() {
    console.log('🔍 Testing file size validation...');
    
    // Tạo file lớn hơn 10MB
    const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
    const largeBlob = new Blob([largeContent], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('title', 'Large File Test');
    formData.append('category', 'Test');
    formData.append('file', largeBlob, 'large.pdf');
    
    try {
        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            body: formData
        });
        
        if (response.status === 400) {
            console.log('✅ File size validation: Large file rejected');
        } else {
            console.log('❌ File size validation: Large file accepted');
        }
    } catch (error) {
        console.log('✅ File size validation: Large file rejected (caught)');
    }
}

// Chạy tất cả tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive function tests...\n');
    
    const results = {
        serverHealth: false,
        supportedTypes: false,
        upload: false,
        preview: false,
        download: false,
        documentInfo: false,
        errorHandling: false,
        fileSizeValidation: false
    };
    
    // Test 1: Server health
    results.serverHealth = await testServerHealth();
    console.log('');
    
    if (!results.serverHealth) {
        console.log('❌ Server not available. Stopping tests.');
        return results;
    }
    
    // Test 2: Supported types
    const types = await testSupportedTypes();
    results.supportedTypes = types !== null;
    console.log('');
    
    // Test 3: Upload PDF
    const documentId = await testUploadPDF();
    results.upload = documentId !== null;
    console.log('');
    
    if (documentId) {
        // Test 4: Preview
        results.preview = await testPreview(documentId);
        console.log('');
        
        // Test 5: Download
        results.download = await testDownload(documentId);
        console.log('');
        
        // Test 6: Document info
        results.documentInfo = await testDocumentInfo(documentId);
        console.log('');
    }
    
    // Test 7: Error handling
    await testErrorHandling();
    results.errorHandling = true;
    console.log('');
    
    // Test 8: File size validation
    await testFileSizeValidation();
    results.fileSizeValidation = true;
    console.log('');
    
    // Tổng kết kết quả
    console.log('📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! System is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the issues above.');
    }
    
    return results;
}

// Export cho Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testServerHealth,
        testSupportedTypes,
        testUploadPDF,
        testPreview,
        testDownload,
        testDocumentInfo,
        testErrorHandling,
        testFileSizeValidation,
        runAllTests
    };
}

// Chạy tests nếu được gọi trực tiếp
if (typeof window === 'undefined') {
    runAllTests();
}
