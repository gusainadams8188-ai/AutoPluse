// Simple test script for AI diagnostics functionality
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAIEndpoints() {
  try {
    console.log('Testing AI endpoints...');

    // Test AI status
    console.log('\n1. Testing AI status endpoint...');
    const statusResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/ai/status',
      method: 'GET'
    });
    console.log('AI Status:', JSON.stringify(statusResponse, null, 2));

    // Test anomaly detection training
    console.log('\n2. Testing anomaly detection training...');
    const trainResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/ai/train',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      modelType: 'anomaly-detection',
      options: { epochs: 5 }
    });
    console.log('Training result:', JSON.stringify(trainResponse, null, 2));

    // Test real-time diagnostics
    console.log('\n3. Testing real-time diagnostics...');
    const diagnosticsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/ai/diagnostics/realtime',
      method: 'GET'
    });
    console.log('Real-time diagnostics:', JSON.stringify(diagnosticsResponse, null, 2));

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAIEndpoints();