# Setup Guide: Self-Hosted LLM with Ollama

This guide explains how to set up and use Ollama as a self-hosted alternative to OpenAI for Madam Ana AI Assistant.

## Overview

Ollama allows you to run large language models locally on your machine, providing:
- **Cost savings**: No API usage costs
- **Data privacy**: Conversations stay on your local machine
- **Offline capability**: Works without internet connection
- **Full control**: Choose any compatible model

## Installation

### Step 1: Install Ollama

**macOS:**
```bash
# Download and install from https://ollama.ai/download
# Or use Homebrew:
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download the installer from https://ollama.ai/download

### Step 2: Start Ollama Service

Ollama runs as a service. After installation, it should start automatically. To verify:

```bash
# Check if Ollama is running
ollama list

# If not running, start it manually:
ollama serve
```

The service runs on `http://localhost:11434` by default.

### Step 3: Pull Recommended Models

For best Swahili and multilingual support, we recommend **Qwen2.5:7b**:

```bash
# Pull the recommended model (recommended for Tanzanian students)
ollama pull qwen2.5:7b

# Alternative models you can try:
ollama pull llama3:8b        # Good general purpose
ollama pull mistral:7b       # Fast and efficient
ollama pull phi3:medium      # Smaller, faster model
```

**Model Size Notes:**
- `qwen2.5:7b` ~4.4GB download
- `llama3:8b` ~4.7GB download
- `mistral:7b` ~4.1GB download
- `phi3:medium` ~2.3GB download

## Configuration

### Step 1: Update Environment Variables

Create or update your `.env` file in the project root:

```bash
# For Ollama (self-hosted)
LLM_API_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:7b

# OPENAI_API_KEY is not required for Ollama
# (Leave it commented out or empty)
```

### Step 2: Restart Development Server

After updating environment variables, restart your Nuxt dev server:

```bash
npm run dev
```

## Testing

### Test Ollama Directly

First, verify Ollama is working:

```bash
# Test with a simple query
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:7b",
    "messages": [
      {
        "role": "user",
        "content": "Jambo! Unasema Kiswahili?"
      }
    ],
    "temperature": 0.7
  }'
```

### Test in Application

1. Navigate to any chapter page in the application
2. Click the "Madam Ana" floating button
3. Ask a question - it should use Ollama instead of OpenAI

## Switching Between Providers

### Use Ollama (self-hosted)
```bash
LLM_API_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:7b
# OPENAI_API_KEY not required
```

### Use OpenAI (cloud)
```bash
OPENAI_API_KEY=your_openai_api_key_here
LLM_API_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### Use LocalAI (alternative self-hosted)
```bash
LLM_API_BASE_URL=http://localhost:8080/v1
LLM_MODEL=llama3
# OPENAI_API_KEY not required
```

## Model Recommendations for Tanzanian Students

### Best Overall: Qwen2.5:7b
- Excellent multilingual support including Swahili
- Good instruction following
- Balanced performance
- ~4.4GB download

### Alternative: Llama3:8b
- Strong general capabilities
- Good at following complex instructions
- ~4.7GB download

### Fast Option: Mistral:7b
- Very fast responses
- Good for real-time interactions
- ~4.1GB download

## Performance Tips

### Hardware Requirements

**Minimum (CPU only):**
- 8GB RAM (for 7B models)
- Modern CPU (2020+)
- Expect slower responses (10-30 seconds)

**Recommended (with GPU):**
- 16GB+ RAM
- NVIDIA GPU with 8GB+ VRAM (or Apple Silicon M1/M2)
- Much faster responses (1-5 seconds)

### Optimize for Speed

```bash
# Use smaller models for faster responses
ollama pull phi3:medium  # Only 2.3GB, faster inference

# Or use quantized models (smaller, faster)
ollama pull qwen2.5:3b   # Smaller version of Qwen2.5
```

### Running on Remote Server

If running Ollama on a different server:

```bash
# On the Ollama server, expose it (be careful with security!)
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# In your .env file:
LLM_API_BASE_URL=http://your-server-ip:11434/v1
```

## Troubleshooting

### Ollama not responding

1. **Check if Ollama is running:**
   ```bash
   ollama list
   ```

2. **Restart Ollama service:**
   ```bash
   # Stop any running instances
   pkill ollama
   
   # Start fresh
   ollama serve
   ```

### Model not found

If you get "model not found" error:

```bash
# List available models
ollama list

# Pull the model again
ollama pull qwen2.5:7b
```

### Slow responses

- Use a smaller model (phi3:medium, qwen2.5:3b)
- Ensure you have enough RAM (8GB+ recommended)
- Consider using a GPU if available
- Close other resource-intensive applications

### Connection refused

If you see connection errors:

1. Verify Ollama is running: `ollama list`
2. Check the port: default is 11434
3. Verify firewall isn't blocking the port
4. Check `LLM_API_BASE_URL` in your `.env` file

### Out of memory

If models fail to load:

- Use a smaller model
- Free up system RAM
- Close other applications
- Consider upgrading your hardware

## Advanced Configuration

### Using Different Models

You can easily switch models by changing `LLM_MODEL`:

```bash
# Try different models
LLM_MODEL=llama3:8b
LLM_MODEL=mistral:7b
LLM_MODEL=qwen2.5:7b
```

### Custom Ollama Configuration

Ollama can be configured via environment variables:

```bash
# Change port
OLLAMA_HOST=localhost:11435 ollama serve

# Update .env accordingly
LLM_API_BASE_URL=http://localhost:11435/v1
```

### Model Fine-tuning (Advanced)

Ollama supports custom model modifications. See [Ollama documentation](https://github.com/ollama/ollama) for details.

## Security Considerations

1. **Local Only**: By default, Ollama only accepts local connections. This is secure for development.

2. **Remote Access**: If exposing Ollama on a network, implement proper authentication/firewall rules.

3. **API Keys**: Unlike OpenAI, Ollama doesn't require API keys by default when running locally.

## Cost Comparison

**OpenAI (gpt-4o-mini):**
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Estimated: $0.01-0.05 per conversation

**Ollama (self-hosted):**
- One-time: Hardware costs
- Ongoing: Electricity (minimal)
- Estimated: < $0.001 per conversation

## Support

For issues with:
- **Ollama installation/usage**: See [Ollama GitHub](https://github.com/ollama/ollama)
- **Madam Ana integration**: Check application logs and verify environment variables
- **Model selection**: Start with qwen2.5:7b for best results

## Next Steps

1. Install Ollama following the steps above
2. Pull the recommended model (qwen2.5:7b)
3. Update your `.env` file
4. Restart your development server
5. Test the AI assistant in the application

Enjoy your self-hosted AI assistant! 🚀




