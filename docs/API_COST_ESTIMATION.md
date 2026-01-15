# API Cost Estimation for Subject AI Teacher

## Overview

This document estimates the API costs for the Subject AI Teacher feature using OpenAI GPT-4o-mini as the primary LLM provider.

## Current API Usage

### Primary Provider: OpenAI GPT-4o-mini
- **Model**: `gpt-4o-mini`
- **Input Cost**: $0.15 per million tokens
- **Output Cost**: $0.60 per million tokens
- **Max Tokens (Response)**: 2,000 tokens

### Fallback Provider: Ollama Gemma3:1b
- **Model**: `gemma3:1b`
- **Cost**: $0.00 (self-hosted, no API costs)
- **Max Tokens (Response)**: 1,500 tokens

## Token Usage Per Request

### Input Tokens (Sent to API)

1. **System Prompt** (Fixed):
   - Base system instructions: ~400 tokens
   - Chapter name: ~20 tokens
   - Chapter content (variable): 1,000-4,000 tokens
   - **Subtotal**: ~1,500-4,500 tokens

2. **Conversation History** (Variable):
   - Up to 20 messages (10 exchanges)
   - Average per message: ~100 tokens
   - **Subtotal**: 0-2,000 tokens (depending on conversation length)
   - Typically: 500-1,000 tokens for active conversations

3. **User Question** (Variable):
   - Average question: ~50 tokens
   - Range: 20-150 tokens

**Total Input Tokens per Request:**
- **First message** (no history): ~1,550-4,550 tokens
- **Average conversation** (with history): ~2,050-5,550 tokens
- **Long conversation** (max history): ~3,550-6,550 tokens

**Conservative Average**: **~3,500 input tokens per request**

### Output Tokens (Received from API)

- **Short response**: 200-400 tokens
- **Average response**: 400-700 tokens
- **Long response**: 700-1,500 tokens
- **Max (limit)**: 2,000 tokens

**Conservative Average**: **~500 output tokens per response**

## Cost Calculation

### Cost Per Request (Average)

**Input Cost:**
- 3,500 tokens × $0.15 / 1,000,000 = **$0.000525**

**Output Cost:**
- 500 tokens × $0.60 / 1,000,000 = **$0.000300**

**Total per Request**: **~$0.000825** (~$0.00083)

**Per 1,000 Requests**: **~$0.83**
**Per 10,000 Requests**: **~$8.30**

## Monthly Cost Scenarios

### Scenario 1: Light Usage
- **Requests/month**: 100
- **Average input**: 3,500 tokens
- **Average output**: 500 tokens

**Monthly Cost:**
- Input: 350,000 tokens × $0.15 / 1M = **$0.053**
- Output: 50,000 tokens × $0.60 / 1M = **$0.030**
- **Total**: **~$0.08/month** (≈$1.00/year)

### Scenario 2: Medium Usage
- **Requests/month**: 500
- **Average input**: 3,500 tokens
- **Average output**: 500 tokens

**Monthly Cost:**
- Input: 1,750,000 tokens × $0.15 / 1M = **$0.26**
- Output: 250,000 tokens × $0.60 / 1M = **$0.15**
- **Total**: **~$0.41/month** (≈$4.92/year)

### Scenario 3: Heavy Usage
- **Requests/month**: 2,000
- **Average input**: 3,500 tokens
- **Average output**: 500 tokens

**Monthly Cost:**
- Input: 7,000,000 tokens × $0.15 / 1M = **$1.05**
- Output: 1,000,000 tokens × $0.60 / 1M = **$0.60**
- **Total**: **~$1.65/month** (≈$19.80/year)

### Scenario 4: Enterprise Usage
- **Requests/month**: 10,000
- **Average input**: 3,500 tokens
- **Average output**: 500 tokens

**Monthly Cost:**
- Input: 35,000,000 tokens × $0.15 / 1M = **$5.25**
- Output: 5,000,000 tokens × $0.60 / 1M = **$3.00**
- **Total**: **~$8.25/month** (≈$99.00/year)

## Cost Breakdown by Feature

### Regular Questions
- **Usage**: ~80% of requests
- **Input**: ~3,500 tokens
- **Output**: ~500 tokens
- **Cost**: $0.00083 per request

### Summarize Action
- **Usage**: ~10% of requests
- **Input**: ~3,500 tokens
- **Output**: ~800 tokens (longer summaries)
- **Cost**: $0.00102 per request

### English Crash Course
- **Usage**: ~10% of requests
- **Input**: ~3,800 tokens (slightly longer prompt)
- **Output**: ~1,000 tokens (detailed explanations)
- **Cost**: $0.00117 per request

## Optimization Opportunities

### 1. Content Truncation
- Currently: Full chapter content included (~1,000-4,000 tokens)
- Optimization: Truncate to first 2,000 characters (~1,500 tokens)
- **Savings**: ~20-30% reduction in input tokens

### 2. Conversation History Management
- Currently: Keeps last 20 messages
- Optimization: Summarize older messages or reduce to 10 messages
- **Savings**: ~15-25% reduction in input tokens for long conversations

### 3. Response Length Limits
- Currently: Max 2,000 tokens
- Optimization: Reduce to 1,000 tokens for average responses
- **Savings**: ~20% reduction in output tokens

### 4. Caching System Prompts
- Currently: System prompt rebuilt every request
- Optimization: Cache system prompt per chapter
- **Savings**: Minimal token savings, but reduces computation

### 5. Fallback to Ollama
- Currently: Ollama used only when OpenAI fails
- Optimization: Use Ollama for simple queries, OpenAI for complex ones
- **Savings**: Can reduce OpenAI costs by 30-50% if Ollama handles simple requests

## Cost Comparison: OpenAI vs Ollama

| Metric | OpenAI GPT-4o-mini | Ollama Gemma3:1b |
|--------|-------------------|------------------|
| **Cost per Request** | ~$0.00083 | $0.00 |
| **Quality** | High | Moderate |
| **Speed** | Fast (~2-5s) | Slower (~10-20s) |
| **Reliability** | High | Depends on local setup |
| **Setup** | API key only | Requires local server |

**Recommendation**: Use Ollama for development/testing, OpenAI for production with Ollama as fallback.

## Monitoring and Alerts

### Recommended Monitoring
1. **Daily Token Usage**: Track input/output tokens per day
2. **Cost Thresholds**: Set alerts at $1, $5, $10/month
3. **Request Volume**: Monitor requests per user/chapter
4. **Fallback Rate**: Track how often Ollama is used

### Cost Alerts
- **Warning**: >$5/month
- **Critical**: >$20/month
- **Emergency**: >$50/month

## Projected Annual Costs

Based on different user adoption scenarios:

| Monthly Requests | Monthly Cost | Annual Cost |
|-----------------|--------------|-------------|
| 100 | $0.08 | $0.96 |
| 500 | $0.41 | $4.92 |
| 1,000 | $0.83 | $9.96 |
| 2,000 | $1.65 | $19.80 |
| 5,000 | $4.13 | $49.56 |
| 10,000 | $8.25 | $99.00 |
| 20,000 | $16.50 | $198.00 |
| 50,000 | $41.25 | $495.00 |

## Future Cost Considerations

### If Implementing TTS (Text-to-Speech)
- **OpenAI TTS API**: $0.015 per 1,000 characters
- **Average chapter**: ~5,000 characters
- **Cost per read**: ~$0.075
- **Monthly (100 reads)**: ~$7.50

### If Implementing Whisper (Speech-to-Text)
- **OpenAI Whisper API**: $0.006 per minute
- **Average query**: ~30 seconds
- **Cost per transcription**: ~$0.003
- **Monthly (1,000 transcriptions)**: ~$3.00

## Recommendations

1. **Start with Current Setup**: GPT-4o-mini is cost-effective for initial deployment
2. **Monitor Usage**: Track costs in first month to validate estimates
3. **Implement Optimizations**: Apply content truncation and history management
4. **Consider Ollama for Simple Queries**: Route basic questions to Ollama to save costs
5. **Set Budget Limits**: Configure spending limits in OpenAI dashboard
6. **Cache Responses**: Cache common questions/answers to reduce API calls

## Cost Control Strategies

1. **Rate Limiting**: Limit requests per user per day
2. **Smart Routing**: Route simple queries to Ollama, complex to OpenAI
3. **Response Caching**: Cache responses for common questions
4. **User Limits**: Implement free tier with limited requests, paid for unlimited
5. **Batch Processing**: Queue requests and batch process during low-traffic periods

---

**Last Updated**: 2024
**Pricing Source**: OpenAI API Pricing (https://platform.openai.com/pricing)

