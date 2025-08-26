// Test script to verify LLM test result persistence
// Run this in the browser console at http://localhost:3092

console.log('🧪 Testing LLM Test Result Persistence')
console.log('=====================================')

// Check if LLM system is available
if (typeof window.llmManager === 'undefined') {
    console.log('❌ LLM Manager not available. Make sure the page is loaded.')
    console.log('💡 Try refreshing the page and running this script again.')
} else {
    console.log('✅ LLM Manager is available!')
    
    // Test 1: Check if test results are loaded from localStorage
    console.log('\n📋 Test 1: Checking for existing test results...')
    const settings = localStorage.getItem('uno-game-settings')
    if (settings) {
        const parsed = JSON.parse(settings)
        const llmProviders = parsed.llmProviders || []
        console.log(`Found ${llmProviders.length} LLM providers in settings`)
        
        llmProviders.forEach(provider => {
            if (provider.lastTested) {
                console.log(`✅ ${provider.name}: Tested at ${new Date(provider.lastTested).toLocaleString()}`)
                console.log(`   Success: ${provider.testSuccess}`)
                console.log(`   Response Time: ${provider.responseTime}ms`)
                if (provider.testError) {
                    console.log(`   Error: ${provider.testError}`)
                }
            } else {
                console.log(`❌ ${provider.name}: Not tested yet`)
            }
        })
    } else {
        console.log('No saved settings found')
    }
    
    // Test 2: Simulate a test result
    console.log('\n🧪 Test 2: Simulating a test result...')
    const testProvider = {
        id: 'test-provider',
        name: 'Test Provider',
        apiKey: '',
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        isActive: false
    }
    
    // Add provider to manager
    window.llmManager.addProvider(testProvider)
    
    // Simulate a successful test result
    const testResult = {
        provider: testProvider,
        success: true,
        responseTime: 1500,
        error: undefined,
        sampleResponse: 'Connection test successful!'
    }
    
    // Trigger the test result callback
    window.llmManager.setTestResultCallback((providerId, result) => {
        console.log(`🎯 Test result callback triggered for ${providerId}:`, result)
        
        // Check if the result was saved to localStorage
        setTimeout(() => {
            const updatedSettings = localStorage.getItem('uno-game-settings')
            if (updatedSettings) {
                const parsed = JSON.parse(updatedSettings)
                const provider = parsed.llmProviders?.find(p => p.id === providerId)
                if (provider && provider.lastTested) {
                    console.log(`✅ Test result saved to localStorage for ${providerId}`)
                    console.log(`   Last tested: ${new Date(provider.lastTested).toLocaleString()}`)
                    console.log(`   Success: ${provider.testSuccess}`)
                    console.log(`   Response time: ${provider.responseTime}ms`)
                } else {
                    console.log(`❌ Test result not found in localStorage for ${providerId}`)
                }
            }
        }, 100)
    })
    
    // Simulate the test result
    window.llmManager.connectionCache.set(testProvider.id, testResult)
    window.llmManager.onTestResultUpdate?.(testProvider.id, testResult)
    
    console.log('✅ Test simulation complete!')
    console.log('💡 Now refresh the page and check if the test result persists.')
}

console.log('\n🏁 Persistence test script complete!')
