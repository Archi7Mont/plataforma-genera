// Test the password generation API
const testPasswordGeneration = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Password Generation API...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/users/generate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'moviedo@agn.gov.ar' })
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
    
    if (result.success) {
      console.log('✅ Password generation successful!');
      console.log('Generated password:', result.password);
      
      // Test login with the generated password
      console.log('\n🧪 Testing login with generated password...');
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'moviedo@agn.gov.ar',
          password: result.password
        })
      });
      
      const loginResult = await loginResponse.json();
      console.log('Login result:', loginResult.success ? '✅ SUCCESS' : '❌ FAILED');
      if (loginResult.success) {
        console.log('User data:', loginResult.user);
      } else {
        console.log('Login error:', loginResult.error);
      }
    } else {
      console.log('❌ Password generation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
};

// Run the test
testPasswordGeneration().catch(console.error);
