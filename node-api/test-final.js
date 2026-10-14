// test-final.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
    console.log('🚀 Testing Final API...\n');
    
    try {
        // Test events
        console.log('📰 Testing events endpoint...');
        const response = await axios.get(`${BASE_URL}/agenda`);
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Events found: ${response.data.count || 0}`);
        
        if (response.data.data && response.data.data.length > 0) {
            const event = response.data.data[0];
            console.log('\n📊 First event:');
            console.log(`  Title: ${event.title}`);
            console.log(`  Category: ${event.category || 'N/A'}`);
            console.log(`  Image URL: ${event.imageUrl || 'No image'}`);
            console.log(`  Has image object: ${!!event.image}`);
            
            // Check if image is properly formatted
            if (event.image && typeof event.image === 'object') {
                console.log(`  Image keys: ${Object.keys(event.image).join(', ')}`);
            }
        }
        console.log('\n---');
        
        // Test actualites
        console.log('📰 Testing actualites endpoint...');
        const actualites = await axios.get(`${BASE_URL}/actualites`);
        console.log(`✅ Actualites found: ${actualites.data.count || 0}`);
        console.log('---\n');
        
        // Test programmes
        console.log('📰 Testing programmes endpoint...');
        const programmes = await axios.get(`${BASE_URL}/programmes`);
        console.log(`✅ Programmes found: ${programmes.data.count || 0}`);
        console.log('---\n');
        
        console.log('🎉 All tests passed!');
        console.log('💡 The API is now working with Strapi data format.');
        
    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

testAPI();