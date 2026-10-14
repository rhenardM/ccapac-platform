// test-api.js - Run with: node test-api.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';

// Test all endpoints
async function testAPI() {
    console.log('🚀 Testing CCAPAC Backend API...\n');

    try {
        // 1. Test root endpoint
        console.log('📡 Testing root endpoint...');
        const root = await axios.get('http://localhost:5000');
        console.log('✅ Root endpoint OK:', root.data.message);
        console.log('---\n');

        // 2. Test public routes (no auth required)
        console.log('📰 Testing public routes...');
        
        // Get all events
        const events = await axios.get(`${BASE_URL}/agenda`);
        console.log(`✅ Events found: ${events.data.count || 0}`);
        
        // Get all actualites
        const actualites = await axios.get(`${BASE_URL}/actualites`);
        console.log(`✅ Actualites found: ${actualites.data.count || 0}`);
        
        // Get all programmes
        const programmes = await axios.get(`${BASE_URL}/programmes`);
        console.log(`✅ Programmes found: ${programmes.data.count || 0}`);
        
        // Get all galleries
        const galleries = await axios.get(`${BASE_URL}/galleries`);
        console.log(`✅ Galleries found: ${galleries.data.count || 0}`);
        console.log('---\n');

        // 3. Test Authentication
        console.log('🔐 Testing authentication...');
        
        // Register a new user
        try {
            const register = await axios.post(`${BASE_URL}/auth/register`, {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                first_name: 'Test',
                last_name: 'User',
                phone: '1234567890'
            });
            console.log('✅ User registered successfully');
        } catch (error) {
            if (error.response?.data?.message === 'Username or email already exists') {
                console.log('ℹ️ User already exists, proceeding to login');
            } else {
                console.log('❌ Registration error:', error.response?.data?.message);
            }
        }

        // Login
        const login = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'testuser',
            password: 'password123'
        });
        
        token = login.data.token;
        console.log('✅ Login successful');
        console.log(`🔑 Token: ${token.substring(0, 30)}...`);
        console.log('---\n');

        // 4. Test protected routes (with auth)
        console.log('🛡️ Testing protected routes...');
        
        // Get profile
        const profile = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile fetched:', profile.data.user.username);
        console.log('---\n');

        console.log('🎉 All tests passed! Backend is working correctly.');
        console.log('📝 Note: Some endpoints may return 0 items if database is empty.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run tests
testAPI();