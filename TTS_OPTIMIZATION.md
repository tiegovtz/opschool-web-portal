# TTS Optimization Guide

This document explains the adaptive TTS (Text-to-Speech) optimization strategy implemented for the Supertonic TTS endpoint.

## Overview

The TTS endpoint (`/api/conversation/tts`) uses an **adaptive steps + chunking strategy** to maintain high audio quality while keeping response times under 10 seconds for short inputs.

**Note**: Audio is returned as base64-encoded data URLs (no files saved to disk). Audio is cached in memory and automatically cleared on server restart.

## Features

### 1. Adaptive Steps Strategy

The system automatically adjusts the number of inference steps based on input length:

- **Short sentences** (< 150 chars): Uses higher steps (default: 10) for better quality
- **Longer text** (chunked): Uses moderate steps (default: 6) per chunk for efficiency
- **Time budget pressure**: Automatically reduces steps (minimum: 2) if generation is trending over the 10-second budget

### 2. Intelligent Chunking

Long paragraphs are automatically split into manageable chunks:

- **Chunk size**: Default max 220 characters per chunk
- **Splitting strategy**: Splits at sentence boundaries when possible
- **Audio concatenation**: Chunks are seamlessly concatenated into a single audio file

### 3. Performance Optimizations

- **Model warmup**: TTS model is warmed up on first request (generates a tiny phrase at low steps)
- **Style caching**: Voice/style embeddings are cached per voice type to avoid reloading
- **Model reuse**: TTS model instance is loaded once and reused across all requests

### 4. Time Budget Management

- **Default budget**: 10 seconds (configurable)
- **Adaptive reduction**: If generation is trending over budget, steps are automatically reduced for remaining chunks
- **Fallback logging**: System logs when fallback reduction occurs

### 5. Telemetry

Lightweight production-safe logging includes:
- Input length
- Number of chunks
- Steps per chunk
- Total generation time
- Whether fallback reduction happened

## Environment Variables

Configure the TTS behavior using these environment variables:

### Step Configuration

```bash
# Steps for single short sentences (< 150 chars)
TTS_STEPS_SHORT=10

# Steps for chunks in longer text
TTS_STEPS_DEFAULT=6

# Minimum steps when under time pressure
TTS_STEPS_MIN=2

# Maximum steps cap (safety limit)
TTS_STEPS_MAX=12
```

### Chunking Configuration

```bash
# Maximum characters per chunk
TTS_CHUNK_MAX_CHARS=220
```

### Performance Configuration

```bash
# Maximum latency budget in milliseconds (default: 10000 = 10 seconds)
TTS_MAX_LATENCY_MS=10000

# TTS generation speed (default: 0.85)
TTS_SPEED=0.85
```

### Supertonic Paths

```bash
# Path to Supertonic nodejs directory
SUPERTONIC_NODEJS=/path/to/supertonic/nodejs

# Path to Supertonic assets directory
SUPERTONIC_ASSETS=/path/to/supertonic/assets
```

## API Usage

### Basic Request

```bash
POST /api/conversation/tts
Content-Type: application/json

{
  "text": "Hello, how are you?",
  "voiceType": "female"  // or "male"
}
```

### With Explicit Steps (Backward Compatible)

You can explicitly set the number of steps. The system will respect your value (within the min/max bounds):

```json
{
  "text": "Hello, how are you?",
  "voiceType": "female",
  "steps": 8
}
```

Alternative parameter names are also supported:
- `steps`
- `num_inference_steps`
- `total_step`

### Response

```json
{
  "success": true,
  "audioData": "data:audio/wav;base64,UklGRiQAAABXQVZFZm10...",
  "cached": false,
  "metrics": {
    "inputLength": 19,
    "numChunks": 1,
    "totalTimeMs": 2345,
    "fallbackReduced": false
  }
}
```

**Note**: The `audioData` field contains a base64-encoded WAV file as a data URL. No files are saved to disk. If the same text was recently generated, `cached: true` will be returned.

## Tuning Guidelines

### For Faster Generation

If you need faster responses and can accept slightly lower quality:

```bash
TTS_STEPS_SHORT=8
TTS_STEPS_DEFAULT=4
TTS_STEPS_MIN=2
TTS_MAX_LATENCY_MS=8000
```

### For Higher Quality

If quality is more important than speed:

```bash
TTS_STEPS_SHORT=12
TTS_STEPS_DEFAULT=8
TTS_STEPS_MIN=4
TTS_STEPS_MAX=15
TTS_MAX_LATENCY_MS=15000
```

### For Very Long Texts

If you frequently process very long paragraphs:

```bash
TTS_CHUNK_MAX_CHARS=200  # Smaller chunks = faster per chunk
TTS_STEPS_DEFAULT=5      # Moderate steps for chunks
```

## Benchmarking

A benchmark script is included to test the endpoint with different input sizes:

```bash
# Run benchmark (assumes server is running on localhost:3000)
node scripts/benchmark-tts.js

# Or specify a different base URL
node scripts/benchmark-tts.js http://localhost:8080
```

The benchmark tests:
1. **Single sentence**: Short input (< 150 chars)
2. **Multiple sentences**: Medium input (150-500 chars)
3. **Long paragraph**: Long input (> 500 chars, triggers chunking)

Example output:
```
============================================================
TTS Endpoint Benchmark
============================================================
Base URL: http://localhost:3000

Testing: Single Sentence
  Input length: 25 characters
  Text: "Hello, how are you today?"
  ✅ Success
  ⏱️  Total time: 2345ms
  📊 Chunks: 1
  📏 Input length: 25 chars

Testing: Multiple Sentences
  Input length: 123 characters
  Text: "Hello, how are you today? I am doing well, thank you..."
  ✅ Success
  ⏱️  Total time: 4567ms
  📊 Chunks: 1
  📏 Input length: 123 chars

Testing: Long Paragraph
  Input length: 567 characters
  Text: "This is a longer paragraph that contains multiple sentences..."
  ✅ Success
  ⏱️  Total time: 8923ms
  📊 Chunks: 3
  📏 Input length: 567 chars
  ⚠️  Fallback reduction: Yes (time budget pressure)

============================================================
Summary
============================================================
Total tests: 3
Successful: 3
Failed: 0

Timing (successful tests):
  Average: 5278ms
  Min: 2345ms
  Max: 8923ms

Time budget (10s): 3/3 under budget
============================================================
```

## Monitoring

### Log Format

The system logs metrics in a compact format:

```
[TTS] len=123 chunks=1 steps=[10] time=2345ms fallback=false voice=female
```

Fields:
- `len`: Input text length in characters
- `chunks`: Number of chunks generated
- `steps`: Array of steps used per chunk
- `time`: Total generation time in milliseconds
- `fallback`: Whether step reduction occurred due to time budget
- `voice`: Voice type used

### Production Monitoring

In production, you can:
1. Parse these logs to track average generation times
2. Monitor `fallback=true` occurrences to identify when time budget is too tight
3. Track chunk counts to understand typical input patterns

## Troubleshooting

### Generation Times Exceeding Budget

If you see frequent `fallback=true` in logs:

1. **Reduce step counts**:
   ```bash
   TTS_STEPS_SHORT=8
   TTS_STEPS_DEFAULT=5
   ```

2. **Reduce chunk size**:
   ```bash
   TTS_CHUNK_MAX_CHARS=180
   ```

3. **Increase time budget** (if acceptable):
   ```bash
   TTS_MAX_LATENCY_MS=12000
   ```

### Audio Quality Issues

If audio quality is lower than expected:

1. **Increase step counts**:
   ```bash
   TTS_STEPS_SHORT=12
   TTS_STEPS_DEFAULT=8
   TTS_STEPS_MIN=4
   ```

2. **Increase time budget**:
   ```bash
   TTS_MAX_LATENCY_MS=15000
   ```

### Model Loading Errors

If you see errors about Supertonic not being found:

1. Verify environment variables are set:
   ```bash
   echo $SUPERTONIC_NODEJS
   echo $SUPERTONIC_ASSETS
   ```

2. Ensure paths are absolute or relative to project root

3. Check that Supertonic is properly installed in the specified directories

## Implementation Details

### Chunking Algorithm

1. Splits text at sentence boundaries (`.`, `!`, `?`)
2. Groups sentences into chunks up to `TTS_CHUNK_MAX_CHARS`
3. If a single sentence exceeds the limit, splits by commas
4. Ensures no chunk exceeds the maximum character limit

### Time Budget Management

1. Tracks elapsed time after each chunk
2. Calculates average time per chunk
3. Estimates remaining time based on remaining chunks
4. If estimated total exceeds budget, reduces steps for remaining chunks
5. Steps are reduced to 60% of current value (minimum: `TTS_STEPS_MIN`)

### Audio Concatenation

1. Extracts PCM data from each chunk's WAV buffer
2. Concatenates PCM data sequentially
3. Creates a new WAV header with combined data
4. Writes single output file with correct sample rate

## Backward Compatibility

The endpoint maintains full backward compatibility:

- Existing requests without `steps` parameter work as before (now use adaptive policy)
- Requests with explicit `steps` parameter are respected (within min/max bounds)
- Multiple parameter name variants supported (`steps`, `num_inference_steps`, `total_step`)
- Response format unchanged (adds optional `metrics` field)

## Future Improvements

Potential enhancements:

1. **Streaming support**: Stream chunks as they're generated
2. **Parallel chunk generation**: Generate multiple chunks in parallel (if Supertonic supports it)
3. **Dynamic chunk sizing**: Adjust chunk size based on estimated generation time
4. **Quality prediction**: Predict quality vs. time tradeoff before generation
5. **Caching**: Cache generated audio for identical text inputs
