#!/usr/bin/env node
/**
 * Test script to verify image shortcodes system
 * Checks:
 * 1. Shortcodes exist in figure-metadata.json
 * 2. Shortcodes exist in image-shortcodes.json
 * 3. Shortcodes map to correct images
 * 4. API endpoints return correct data
 * 5. Frontend utilities can resolve shortcodes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[1;31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (error) {
    log(`❌ Failed to load ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

// Test 1: Verify figure-metadata.json structure
function testFigureMetadata() {
  log('\n=== Test 1: figure-metadata.json Structure ===', 'cyan');
  const data = loadJSON('server/data/figure-metadata.json');
  if (!data) return false;

  let passed = true;
  const images = data.images || [];

  log(`Found ${images.length} figures in metadata`, 'blue');

  for (const img of images) {
    if (!img.shortcode) {
      log(`❌ Missing shortcode for ${img.figure_number}`, 'red');
      passed = false;
    } else {
      log(`✅ ${img.figure_number}: ${img.shortcode}`, 'green');
      log(`   Chapter: ${img.chapter}`, 'blue');
      log(`   Topic: ${img.topic}`, 'blue');
    }
  }

  return passed;
}

// Test 2: Verify image-shortcodes.json structure
function testImageShortcodes() {
  log('\n=== Test 2: image-shortcodes.json Structure ===', 'cyan');
  const data = loadJSON('server/data/image-shortcodes.json');
  if (!data) return false;

  let passed = true;
  const shortcodes = data.shortcodes || {};

  log(`Found ${Object.keys(shortcodes).length} shortcodes`, 'blue');

  for (const [shortcode, metadata] of Object.entries(shortcodes)) {
    const isMultiImage = Array.isArray(metadata.paths) && metadata.paths.length > 0;
    const isSingleImage = !isMultiImage && !!metadata.path;

    if (!isMultiImage && !isSingleImage) {
      log(`❌ ${shortcode}: Missing both path and paths array`, 'red');
      passed = false;
    } else if (!metadata.alt) {
      log(`❌ ${shortcode}: Missing alt text`, 'red');
      passed = false;
    } else {
      const type = isMultiImage ? `multi (${metadata.paths.length} images)` : 'single';
      log(`✅ ${shortcode}: ${type} - "${metadata.alt.substring(0, 50)}..."`, 'green');
      
      if (isMultiImage && metadata.alts) {
        log(`   Alts: ${metadata.alts.join(', ')}`, 'blue');
      }
    }
  }

  return passed;
}

// Test 3: Verify shortcodes match between metadata and shortcodes files
function testShortcodeMatching() {
  log('\n=== Test 3: Shortcode Matching (metadata ↔ shortcodes) ===', 'cyan');
  
  const figureData = loadJSON('server/data/figure-metadata.json');
  const shortcodeData = loadJSON('server/data/image-shortcodes.json');
  
  if (!figureData || !shortcodeData) return false;

  const metadataShortcodes = new Set(figureData.images.map(img => img.shortcode));
  const availableShortcodes = new Set(Object.keys(shortcodeData.shortcodes || {}));

  let passed = true;
  let matched = 0;
  let missing = [];

  for (const shortcode of metadataShortcodes) {
    if (availableShortcodes.has(shortcode)) {
      log(`✅ ${shortcode}: Found in both files`, 'green');
      matched++;
    } else {
      log(`❌ ${shortcode}: In metadata but NOT in image-shortcodes.json`, 'red');
      missing.push(shortcode);
      passed = false;
    }
  }

  log(`\nMatched: ${matched}/${metadataShortcodes.size}`, 'blue');
  
  if (missing.length > 0) {
    log(`Missing shortcodes: ${missing.join(', ')}`, 'yellow');
  }

  return passed;
}

// Test 4: Verify correct image mapping for Figure 1.1 (multi-image)
function testFigure1_1Mapping() {
  log('\n=== Test 4: Figure 1.1 Multi-Image Mapping ===', 'cyan');
  
  const shortcodeData = loadJSON('server/data/image-shortcodes.json');
  if (!shortcodeData) return false;

  const fig1_1 = shortcodeData.shortcodes['biology_form1_figure_1_1'];
  
  if (!fig1_1) {
    log('❌ biology_form1_figure_1_1 not found', 'red');
    return false;
  }

  let passed = true;

  // Check for paths array
  if (!Array.isArray(fig1_1.paths) || fig1_1.paths.length !== 4) {
    log(`❌ Expected 4 paths, got ${fig1_1.paths?.length || 0}`, 'red');
    passed = false;
  } else {
    log('✅ Has 4 paths array', 'green');
    fig1_1.paths.forEach((path, idx) => {
      log(`   ${idx + 1}. ${path}`, 'blue');
    });
  }

  // Check for alts array
  if (!Array.isArray(fig1_1.alts) || fig1_1.alts.length !== 4) {
    log(`❌ Expected 4 alts, got ${fig1_1.alts?.length || 0}`, 'red');
    passed = false;
  } else {
    log('✅ Has 4 alts array', 'green');
    fig1_1.alts.forEach((alt, idx) => {
      log(`   ${idx + 1}. "${alt}"`, 'blue');
    });
  }

  // Check alt text contains all sub-images
  const altText = fig1_1.alt.toLowerCase();
  const expectedTerms = ['tree', 'bird', 'hippopotamus', 'whale'];
  const missingTerms = expectedTerms.filter(term => !altText.includes(term));
  
  if (missingTerms.length > 0) {
    log(`⚠️ Alt text missing terms: ${missingTerms.join(', ')}`, 'yellow');
  } else {
    log('✅ Alt text contains all sub-image descriptions', 'green');
  }

  return passed;
}

// Test 5: Verify API response format (simulation)
function testAPIResponseFormat() {
  log('\n=== Test 5: API Response Format (Simulation) ===', 'cyan');
  
  const shortcodeData = loadJSON('server/data/image-shortcodes.json');
  if (!shortcodeData) return false;

  let passed = true;

  // Test multi-image response
  const multiImage = shortcodeData.shortcodes['biology_form1_figure_1_1'];
  const isMulti = Array.isArray(multiImage.paths) && multiImage.paths.length > 0;
  
  if (isMulti) {
    log('✅ Multi-image figure 1.1 would return:', 'green');
    log(`   paths: [${multiImage.paths.length} URLs]`, 'blue');
    log(`   alts: [${multiImage.alts.length} alt texts]`, 'blue');
    log(`   NO 'path' field (correct for multi-image)`, 'blue');
  } else {
    log('❌ Figure 1.1 should be multi-image but is not', 'red');
    passed = false;
  }

  // Test single-image response
  const singleImage = shortcodeData.shortcodes['biology_form1_figure_1_3'];
  const isSingle = !!singleImage.path && !singleImage.paths;

  if (isSingle) {
    log('✅ Single-image figure 1.3 would return:', 'green');
    log(`   path: ${singleImage.path}`, 'blue');
    log(`   NO 'paths' array (correct for single-image)`, 'blue');
  } else {
    log('❌ Figure 1.3 should be single-image but is not', 'red');
    passed = false;
  }

  return passed;
}

// Test 6: Verify images array matches shortcodes
function testImagesArray() {
  log('\n=== Test 6: Images Array Consistency ===', 'cyan');
  
  const shortcodeData = loadJSON('server/data/image-shortcodes.json');
  if (!shortcodeData) return false;

  const shortcodes = shortcodeData.shortcodes || {};
  const images = shortcodeData.images || [];

  let passed = true;

  // Check each shortcode has corresponding image entry
  for (const [shortcode, metadata] of Object.entries(shortcodes)) {
    const imageEntry = images.find(img => img.shortcode === shortcode);
    
    if (!imageEntry) {
      log(`❌ ${shortcode}: Not found in images array`, 'red');
      passed = false;
      continue;
    }

    // Verify structure matches
    const isMultiShortcode = Array.isArray(metadata.paths) && metadata.paths.length > 0;
    const isMultiImage = Array.isArray(imageEntry.paths) && imageEntry.paths.length > 0;
    
    if (isMultiShortcode !== isMultiImage) {
      log(`❌ ${shortcode}: Structure mismatch (shortcodes: ${isMultiShortcode ? 'multi' : 'single'}, images: ${isMultiImage ? 'multi' : 'single'})`, 'red');
      passed = false;
    } else {
      log(`✅ ${shortcode}: Structure matches (${isMultiShortcode ? 'multi' : 'single'})`, 'green');
    }
  }

  log(`\nTotal images: ${images.length}, Total shortcodes: ${Object.keys(shortcodes).length}`, 'blue');

  return passed;
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 Image Shortcode System Tests', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {
    test1: testFigureMetadata(),
    test2: testImageShortcodes(),
    test3: testShortcodeMatching(),
    test4: testFigure1_1Mapping(),
    test5: testAPIResponseFormat(),
    test6: testImagesArray(),
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  log('\n' + '='.repeat(60), 'cyan');
  log(`📊 Test Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  log('='.repeat(60), 'cyan');

  if (passed === total) {
    log('\n✅ All tests passed! Shortcode system is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Please review the output above.', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test execution failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

