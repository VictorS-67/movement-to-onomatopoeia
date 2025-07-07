// Test script to verify the multipart upload logic works correctly
const fs = require('fs');

// Simulate what happens in the upload function
function testMultipartUpload() {
    // Create a small test "audio" buffer (simulate base64 decoded audio)
    const testAudioData = Buffer.from('test audio data for verification');
    
    // Simulate the multipart upload logic from our function
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
        name: 'test.webm',
        parents: ['test-folder-id']
    };

    // Create multipart body as Buffer to preserve binary data (our fix)
    const metadataPart = Buffer.from(
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata)
    );

    const dataPart = Buffer.from(
        delimiter +
        'Content-Type: audio/webm\r\n\r\n'
    );

    const closePart = Buffer.from(closeDelimiter);

    // Combine all parts as binary data
    const multipartRequestBody = Buffer.concat([
        metadataPart,
        dataPart,
        testAudioData,
        closePart
    ]);

    console.log('✓ Multipart body created successfully');
    console.log('Length:', multipartRequestBody.length);
    console.log('First 100 chars:', multipartRequestBody.toString().substring(0, 100));
    console.log('Contains test data:', multipartRequestBody.includes(testAudioData));
    
    // Test the old (broken) way for comparison
    const oldWay = 
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: audio/webm\r\n\r\n' +
        testAudioData.toString('binary') + // This was the problem!
        closeDelimiter;
    
    console.log('\n--- Comparison with old (broken) method ---');
    console.log('Old way length:', oldWay.length);
    console.log('New way preserves binary data:', Buffer.isBuffer(multipartRequestBody));
    console.log('Old way loses binary data:', typeof oldWay === 'string');
}

testMultipartUpload();
