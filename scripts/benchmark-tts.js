#!/usr/bin/env node

/**
 * TTS Benchmark Script
 * 
 * Tests the TTS endpoint with different input sizes:
 * - Single sentence
 * - Multiple sentences
 * - Long paragraph
 * 
 * Usage:
 *   node scripts/benchmark-tts.js [baseUrl]
 * 
 * Example:
 *   node scripts/benchmark-tts.js http://localhost:3000
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'

const testCases = [
  {
    name: 'Single Sentence',
    text: 'Hello, how are you today?',
  },
  {
    name: 'Multiple Sentences',
    text: 'Hello, how are you today? I am doing well, thank you. What about you? I hope you are having a great day. Let me know if you need anything.',
  },
  {
    name: 'Long Paragraph',
    text: 'This is a longer paragraph that contains multiple sentences and should trigger the chunking strategy. The system should split this into multiple chunks to maintain quality while staying within the time budget. Each chunk will be processed with appropriate steps based on the adaptive policy. The goal is to keep the total generation time under ten seconds while maintaining high audio quality. This paragraph continues with more content to ensure it exceeds the chunk size threshold and tests the chunking mechanism properly.',
  },
]

async function benchmarkTTS(testCase) {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${BASE_URL}/api/conversation/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testCase.text,
        voiceType: 'female',
      }),
    })

    const endTime = Date.now()
    const totalTime = endTime - startTime

    if (!response.ok) {
      const error = await response.text()
      console.error(`  ❌ Error: ${response.status} - ${error}`)
      return { success: false, time: totalTime }
    }

    const data = await response.json()
    
    return {
      success: true,
      time: totalTime,
      metrics: data.metrics || {},
    }
  } catch (error) {
    const endTime = Date.now()
    const totalTime = endTime - startTime
    console.error(`  ❌ Error: ${error.message}`)
    return { success: false, time: totalTime, error: error.message }
  }
}

async function runBenchmarks() {
  console.log('='.repeat(60))
  console.log('TTS Endpoint Benchmark')
  console.log('='.repeat(60))
  console.log(`Base URL: ${BASE_URL}\n`)

  const results = []

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`)
    console.log(`  Input length: ${testCase.text.length} characters`)
    console.log(`  Text: "${testCase.text.substring(0, 80)}${testCase.text.length > 80 ? '...' : ''}"`)

    const result = await benchmarkTTS(testCase)

    if (result.success) {
      console.log(`  ✅ Success`)
      console.log(`  ⏱️  Total time: ${result.time}ms`)
      if (result.metrics) {
        console.log(`  📊 Chunks: ${result.metrics.numChunks || 'N/A'}`)
        console.log(`  📏 Input length: ${result.metrics.inputLength || 'N/A'} chars`)
        if (result.metrics.fallbackReduced) {
          console.log(`  ⚠️  Fallback reduction: Yes (time budget pressure)`)
        }
      }
    } else {
      console.log(`  ❌ Failed`)
      console.log(`  ⏱️  Time before failure: ${result.time}ms`)
    }

    results.push({
      name: testCase.name,
      ...result,
    })

    console.log('')
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Summary
  console.log('='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  console.log(`Total tests: ${results.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)
  
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.time, 0) / successful.length
    const minTime = Math.min(...successful.map(r => r.time))
    const maxTime = Math.max(...successful.map(r => r.time))
    
    console.log(`\nTiming (successful tests):`)
    console.log(`  Average: ${avgTime.toFixed(0)}ms`)
    console.log(`  Min: ${minTime}ms`)
    console.log(`  Max: ${maxTime}ms`)
    
    const underBudget = successful.filter(r => r.time < 10000).length
    console.log(`\nTime budget (10s): ${underBudget}/${successful.length} under budget`)
  }

  if (failed.length > 0) {
    console.log(`\nFailed tests:`)
    failed.forEach(r => {
      console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`)
    })
  }

  console.log('='.repeat(60))
  
  // Exit with error code if any tests failed
  process.exit(failed.length > 0 ? 1 : 0)
}

// Run benchmarks
runBenchmarks().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
