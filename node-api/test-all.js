// test-all.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
    console.log('🚀 Testing All Endpoints...\n');
    
    const tests = [
        { name: 'Events', url: `${BASE_URL}/agenda` },
        { name: 'Actualites', url: `${BASE_URL}/actualites` },
        { name: 'Programmes', url: `${BASE_URL}/programmes` },
        { name: 'Galleries', url: `${BASE_URL}/galleries` }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            console.log(`📡 Testing ${test.name}...`);
            const response = await axios.get(test.url);
            console.log(`✅ ${test.name}: ${response.data.count || 0} items found`);
            passed++;
        } catch (error) {
            console.log(`❌ ${test.name} failed:`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Message: ${error.response.data?.message || error.message}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
            failed++;
        }
        console.log('---');
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All endpoints are working correctly!');
    } else {
        console.log('⚠️ Some endpoints need attention.');
    }
}

testAll();